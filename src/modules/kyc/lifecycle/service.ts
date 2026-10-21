// Agoraya — modules/kyc/lifecycle service
// Use-case orchestration for KYC status lifecycle operations.
//
// Responsibilities:
//   - Enforce lifecycle transition rules from the domain layer.
//   - Mark verified entries as expired when their TTL has elapsed.
//   - Record audit events for all lifecycle mutations.

import { logger } from "@/lib/logger";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { AuditSink } from "@/modules/rbac/audit";
import { uuidOrNull } from "@/modules/rbac/audit";

import { expireKycCommandSchema } from "../schema";
import type { ExpireKycCommand } from "../schema";
import type { KycRosterEntry } from "../types";
import type { KycRepository } from "../roster/repository";
import { assertTransitionAllowed, isExpired, InvalidKycTransitionError } from "./domain";

export interface LifecycleServiceOptions {
  readonly repository: KycRepository;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
}

export class LifecycleService {
  readonly #repository: KycRepository;
  readonly #audit: AuditSink | undefined;
  readonly #clock: () => Date;

  constructor(options: LifecycleServiceOptions) {
    this.#repository = options.repository;
    this.#audit = options.audit;
    this.#clock = options.clock ?? (() => new Date());
  }

  /**
   * Mark a verified KYC entry as expired.
   *
   * Only `verified` entries can be expired. The domain layer enforces
   * the valid transition (`verified → expired`).
   */
  async expireKyc(command: ExpireKycCommand): Promise<KycRosterEntry> {
    const parsed = expireKycCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid expire-kyc command", {
        details: {
          issues: parsed.error.issues.map((i) => i.path.join(".")),
        },
      });
    }

    const { tenantId, rosterId, triggeredBy } = parsed.data;

    const entry = await this.#repository.findById(rosterId, tenantId);
    if (!entry) {
      throw new NotFoundError(
        `KYC roster entry "${rosterId}" not found in tenant "${tenantId}"`,
      );
    }

    try {
      assertTransitionAllowed(entry.status, "expired");
    } catch (err) {
      if (err instanceof InvalidKycTransitionError) {
        throw new ValidationError(err.message);
      }
      throw err;
    }

    const now = this.#clock();
    const result = await this.#repository.updateStatus({
      id: entry.id,
      status: "expired",
      updatedAt: now,
    });

    if (!result) {
      throw new NotFoundError(`KYC roster entry "${rosterId}" could not be updated`);
    }

    await this.#recordAudit({
      action: "kyc.lifecycle.expired",
      targetTable: "kyc_roster",
      targetId: entry.id,
      metadata: { rosterId, tenantId, triggeredBy },
      actorId: triggeredBy,
    });

    logger.info("kyc.lifecycle.expired", { rosterId, tenantId });

    return result;
  }

  /**
   * Check and expire all verified entries whose `expiresAt` has passed.
   *
   * Intended to be called periodically by a background job. Operates on
   * entries scoped to a single tenant to bound the query size.
   *
   * Returns the list of entries that were transitioned to `expired`.
   */
  async checkAndExpireStale(tenantId: string): Promise<KycRosterEntry[]> {
    const now = this.#clock();
    const page = await this.#repository.list({
      tenantId,
      status: "verified",
      limit: 100,
      offset: 0,
    });

    const expired: KycRosterEntry[] = [];

    for (const entry of page.items) {
      if (!isExpired(entry, now)) continue;

      const result = await this.#repository.updateStatus({
        id: entry.id,
        status: "expired",
        updatedAt: now,
      });

      if (result) {
        expired.push(result);
        await this.#recordAudit({
          action: "kyc.lifecycle.expired",
          targetTable: "kyc_roster",
          targetId: entry.id,
          metadata: {
            rosterId: entry.id,
            tenantId,
            triggeredBy: "system",
            expiresAt: entry.expiresAt?.toISOString() ?? null,
          },
          actorId: null,
        });
        logger.info("kyc.lifecycle.expired", {
          rosterId: entry.id,
          tenantId,
          trigger: "ttl",
        });
      }
    }

    return expired;
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
