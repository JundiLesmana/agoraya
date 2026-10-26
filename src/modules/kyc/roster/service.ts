import { createHash } from "node:crypto";
import { randomUUID } from "node:crypto";

import { logger } from "@/lib/logger";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";

import type { AuditSink } from "@/modules/rbac/audit";
import { uuidOrNull } from "@/modules/rbac/audit";

import {
  addToRosterCommandSchema,
  getRosterEntryCommandSchema,
  listRosterCommandSchema,
} from "../schema";
import type {
  AddToRosterCommand,
  GetRosterEntryCommand,
  ListRosterCommand,
} from "../schema";
import type { KycRosterEntry, KycRosterPage } from "../types";
import type { KycRepository } from "./repository";

export interface RosterServiceOptions {
  readonly repository: KycRepository;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
}

function hashNik(nik: string): string {
  return createHash("sha256").update(nik).digest("hex");
}

export class RosterService {
  readonly #repository: KycRepository;
  readonly #audit: AuditSink | undefined;
  readonly #clock: () => Date;

  constructor(options: RosterServiceOptions) {
    this.#repository = options.repository;
    this.#audit = options.audit;
    this.#clock = options.clock ?? (() => new Date());
  }

  async addToRoster(command: AddToRosterCommand): Promise<KycRosterEntry> {
    const parsed = addToRosterCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid add-to-roster command", {
        details: {
          issues: parsed.error.issues.map((i) => i.path.join(".")),
        },
      });
    }

    const { tenantId, userId, nik, name, submittedBy } = parsed.data;

    const existing = await this.#repository.findByUserId(userId, tenantId);
    if (existing) {
      throw new ConflictError(
        "A KYC roster entry already exists for this user in this tenant",
      );
    }

    const now = this.#clock();
    const entry = await this.#repository.insert({
      id: randomUUID(),
      tenantId,
      userId,
      nikHash: hashNik(nik),
      name,
      submittedBy,
      createdAt: now,
      updatedAt: now,
    });

    await this.#recordAudit({
      action: "kyc.roster.added",
      targetTable: "kyc_roster",
      targetId: entry.id,
      metadata: { tenantId, userId, name },
      actorId: submittedBy,
    });

    logger.info("kyc.roster.added", { rosterId: entry.id, tenantId, userId });

    return entry;
  }

  async getRosterEntry(command: GetRosterEntryCommand): Promise<KycRosterEntry> {
    const parsed = getRosterEntryCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid get-roster-entry command", {
        details: {
          issues: parsed.error.issues.map((i) => i.path.join(".")),
        },
      });
    }

    const { tenantId, rosterId } = parsed.data;
    const entry = await this.#repository.findById(rosterId, tenantId);
    if (!entry) {
      throw new NotFoundError(
        `KYC roster entry "${rosterId}" not found in tenant "${tenantId}"`,
      );
    }

    return entry;
  }

  /** List roster entries for a tenant with optional status filter, paginated. */
  async listRoster(command: ListRosterCommand): Promise<KycRosterPage> {
    const parsed = listRosterCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid list-roster command", {
        details: {
          issues: parsed.error.issues.map((i) => i.path.join(".")),
        },
      });
    }

    return this.#repository.list({
      tenantId: parsed.data.tenantId,
      status: parsed.data.status,
      limit: parsed.data.limit,
      offset: parsed.data.offset,
    });
  }

  async #recordAudit(event: {
    action: string;
    targetTable: string;
    targetId: string | null;
    metadata: Readonly<Record<string, unknown>>;
    actorId: string | null;
  }): Promise<void> {
    if (!this.#audit) return;
    try {
      await this.#audit.record({
        actorId: event.actorId,
        action: event.action,
        targetTable: event.targetTable,
        targetId: uuidOrNull(event.targetId),
        metadata: event.metadata,
        occurredAt: this.#clock(),
      });
    } catch (error) {
      logger.error("kyc.audit.failed", {
        action: event.action,
        error: error instanceof Error ? error.message : "unknown error",
      });
      throw error;
    }
  }
}
