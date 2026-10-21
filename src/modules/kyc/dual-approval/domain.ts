// Agoraya — modules/kyc/dual-approval domain
// Pure rules for the two-person approval workflow.
//
// This file is intentionally free of I/O and framework imports.
// The only job of this domain layer is to enforce:
//
//   1. The same person cannot fill both approval slots (self-approval prevention).
//   2. Only one decision is allowed per slot.
//   3. The first free slot is always assigned; slot-2 is only available after
//      slot-1 is filled with an `approved` decision.

import type { KycApproval, KycApprovalDecision, KycStatus } from "../types";

// ---------------------------------------------------------------------------
// Domain errors
// ---------------------------------------------------------------------------

export class SelfApprovalError extends Error {
  constructor(public readonly approverId: string) {
    super(
      `Approver "${approverId}" already submitted a decision for this entry and cannot fill the second slot`,
    );
    this.name = "SelfApprovalError";
  }
}

export class ApprovalSlotConflictError extends Error {
  constructor(public readonly slot: number) {
    super(`Approval slot ${slot} has already been filled`);
    this.name = "ApprovalSlotConflictError";
  }
}

export class ApprovalNotAllowedError extends Error {
  constructor(public readonly status: KycStatus) {
    super(
      `Approval is not allowed for a KYC entry in status "${status}"`,
    );
    this.name = "ApprovalNotAllowedError";
  }
}

// ---------------------------------------------------------------------------
// Pure domain functions
// ---------------------------------------------------------------------------

/** Statuses that accept new approvals. */
const APPROVABLE_STATUSES: ReadonlySet<KycStatus> = new Set([
  "pending",
  "partially_approved",
]);

/**
 * Returns `true` when the roster entry can still receive approvals in its
 * current status.
 */
export function canReceiveApproval(status: KycStatus): boolean {
  return APPROVABLE_STATUSES.has(status);
}

/**
 * Compute which approval slot the new approval should occupy.
 *
 * - If no approvals exist, the next slot is 1.
 * - If slot 1 is filled with `approved`, the next slot is 2.
 * - Otherwise the workflow cannot accept a new approval.
 *
 * Returns `null` when no slot is available (workflow completed or rejected).
 */
export function nextApprovalSlot(
  existingApprovals: readonly KycApproval[],
): 1 | 2 | null {
  if (existingApprovals.length === 0) return 1;

  const slot1 = existingApprovals.find((a) => a.approvalSlot === 1);
  if (!slot1) return 1;

  // Slot 1 is rejected: the workflow is over, no more slots.
  if (slot1.decision === "rejected") return null;

  // Slot 1 is approved: slot 2 is available if not yet filled.
  const slot2 = existingApprovals.find((a) => a.approvalSlot === 2);
  if (slot2) return null; // both slots are filled

  return 2;
}

/**
 * Check that the submitting approver has not already voted.
 *
 * Throws {@link SelfApprovalError} when the approver already occupies a slot.
 */
export function assertNoSelfApproval(
  existingApprovals: readonly KycApproval[],
  approverId: string,
): void {
  const alreadyVoted = existingApprovals.some(
    (a) => a.approverId === approverId,
  );
  if (alreadyVoted) {
    throw new SelfApprovalError(approverId);
  }
}

/**
 * Validate the full pre-submission invariants and return the slot to use.
 *
 * Throws one of:
 *   - {@link ApprovalNotAllowedError} when the status is terminal.
 *   - {@link ApprovalSlotConflictError} when all slots are already taken.
 *   - {@link SelfApprovalError} when the approver already holds a slot.
 */
export function validateAndGetSlot(
  currentStatus: KycStatus,
  existingApprovals: readonly KycApproval[],
  approverId: string,
): 1 | 2 {
  if (!canReceiveApproval(currentStatus)) {
    throw new ApprovalNotAllowedError(currentStatus);
  }

  assertNoSelfApproval(existingApprovals, approverId);

  const slot = nextApprovalSlot(existingApprovals);
  if (slot === null) {
    throw new ApprovalSlotConflictError(existingApprovals.length + 1);
  }

  return slot;
}

/**
 * Summarise approval outcomes from a list of approval records.
 *
 * Returns the count of approvals, whether all are approved, and whether any
 * are rejected. These values feed directly into
 * `deriveStatusFromApprovals` in the lifecycle domain.
 */
export function summariseApprovals(approvals: readonly KycApproval[]): {
  readonly approvalCount: number;
  readonly allApproved: boolean;
  readonly anyRejected: boolean;
} {
  const approvalCount = approvals.length;
  const anyRejected = approvals.some((a) => a.decision === "rejected");
  const allApproved =
    approvalCount > 0 && approvals.every((a) => a.decision === "approved");
  return { approvalCount, allApproved, anyRejected };
}
