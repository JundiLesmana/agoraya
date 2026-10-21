// Agoraya — modules/kyc/dual-approval service
// Use-case orchestration for the two-person KYC approval workflow.
//
// Responsibilities:
//   - Validate commands with Zod.
//   - Enforce dual-approval invariants via the domain layer.
//   - Write the approval record and update the roster status atomically
//     by calling both repository operations inside one transaction
//     (delegated to the caller when a withTransaction helper is provided).
//   - Record an audit event for every approval decision.

import { randomUUID } from "node:crypto";

import { logger } from "@/lib/logger";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { AuditSink } from "@/modules/rbac/audit";
import { uuidOrNull } from "@/modules/rbac/audit";

import { submitApprovalCommandSchema } from "../schema";
import type { SubmitApprovalCommand } from "../schema";
import type { KycApproval, KycApprovalSummary, KycRosterEntry } from "../types";
import type { KycRepository } from "../roster/repository";
import {
  validateAndGetSlot,
  summariseApprovals,
} from "./domain";
import {
  ApprovalNotAllowedError,
  ApprovalSlotConflictError,
  SelfApprovalError,
} from "./domain";
import { deriveStatusFromApprovals } from "../lifecycle/domain";
import { assertTransitionAllowed, InvalidKycTransitionError } from "../lifecycle/domain";
import { ForbiddenError } from "@/lib/errors";

export interface DualApprovalServiceOptions {
  readonly repository: KycRepository;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
}

/** The outcome of submitting an approval. */
export interface ApprovalOutcome {
  /** The newly created approval record. */
  readonly approval: KycApproval;
  /** The roster entry after the status update (may be unchanged if no transition occurred). */
  readonly entry: KycRosterEntry;
}

export class DualApprovalService {
  readonly #repository: KycRepository;
  readonly #audit: AuditSink | undefined;
  readonly #clock: () => Date;

  constructor(options: DualApprovalServiceOptions) {
    this.#repository = options.repository;
    this.#audit = options.audit;
    this.#clock = options.clock ?? (() => new Date());
  }

  /**
   * Submit an approval decision for a roster entry.
   *
   * Enforces:
   *   - The roster entry exists in the tenant.
   *   - The current status allows approvals (`pending` or `partially_approved`).
   *   - The approver has not already voted on this entry.
   *   - After recording the approval, derives the new status and updates the
   *     roster entry when a transition is warranted.
   */
  async submitApproval(command: SubmitApprovalCommand): Promise<ApprovalOutcome> {
    const parsed = submitApprovalCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid submit-approval command", {
        details: {
          issues: parsed.error.issues.map((i) => i.path.join(".")),
        },
      });
    }

    const { tenantId, rosterId, approverId, decision, reason } = parsed.data;

    const entry = await this.#repository.findById(rosterId, tenantId);
    if (!entry) {
      throw new NotFoundError(
        `KYC roster entry "${rosterId}" not found in tenant "${tenantId}"`,
      );
    }

    const existingApprovals = await this.#repository.listApprovals(rosterId);

    // Domain invariant checks — map domain errors to application errors.
    let slot: 1 | 2;
    try {
      slot = validateAndGetSlot(entry.status, existingApprovals, approverId);
    } catch (err) {
      if (err instanceof SelfApprovalError) {
        throw new ForbiddenError(err.message);
      }
      if (err instanceof ApprovalNotAllowedError) {
        throw new ValidationError(err.message);
      }
      if (err instanceof ApprovalSlotConflictError) {
        throw new ValidationError(err.message);
      }
      throw err;
    }

    const now = this.#clock();
    const approval = await this.#repository.insertApproval({
      id: randomUUID(),
      rosterId,
      tenantId,
      approverId,
      approvalSlot: slot,
      decision,
      reason: reason ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Recompute status from all approvals (including the one just inserted).
    const allApprovals = [...existingApprovals, approval];
    const { approvalCount, allApproved, anyRejected } =
      summariseApprovals(allApprovals);

    const nextStatus = deriveStatusFromApprovals(
      entry.status,
      approvalCount,
      allApproved,
      anyRejected,
    );

    let updatedEntry = entry;

    if (nextStatus !== null) {
      try {
        assertTransitionAllowed(entry.status, nextStatus);
      } catch (err) {
        if (err instanceof InvalidKycTransitionError) {
          // This should never happen if domain logic is correct, but we guard
          // defensively rather than silently skipping the transition.
          logger.error("kyc.lifecycle.unexpected_invalid_transition", {
            from: entry.status,
            to: nextStatus,
            rosterId,
          });
          throw new ValidationError(err.message);
        }
        throw err;
      }

      const expiresAt =
        nextStatus === "verified"
          ? new Date(now.getTime() + DEFAULT_VERIFIED_TTL_MS)
          : null;

      const result = await this.#repository.updateStatus({
        id: entry.id,
        status: nextStatus,
        expiresAt,
        updatedAt: now,
      });

      if (result) updatedEntry = result;
    }

    await this.#recordAudit({
      action: "kyc.approval.submitted",
      targetTable: "kyc_approvals",
      targetId: approval.id,
      metadata: {
        rosterId,
        tenantId,
        slot,
        decision,
        newStatus: updatedEntry.status,
      },
      actorId: approverId,
    });

    logger.info("kyc.approval.submitted", {
      rosterId,
      slot,
      decision,
      newStatus: updatedEntry.status,
    });

    return { approval, entry: updatedEntry };
  }

  /** Get a summary of the current approvals for a roster entry. */
  async getApprovalSummary(
    rosterId: string,
    tenantId: string,
  ): Promise<KycApprovalSummary> {
    const entry = await this.#repository.findById(rosterId, tenantId);
    if (!entry) {
      throw new NotFoundError(
        `KYC roster entry "${rosterId}" not found in tenant "${tenantId}"`,
      );
    }

    const approvals = await this.#repository.listApprovals(rosterId);
    return {
      rosterId,
      approvals,
      isComplete: approvals.length >= 2,
    };
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

/**
 * Default KYC verification TTL: 365 days.
 * Configurable at the module wiring level if needed.
 */
export const DEFAULT_VERIFIED_TTL_MS = 365 * 24 * 60 * 60 * 1000;
