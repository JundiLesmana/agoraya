import type { KycApproval, KycApprovalDecision, KycStatus } from "../types";

// Domain errors
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

// Pure domain functions
const APPROVABLE_STATUSES: ReadonlySet<KycStatus> = new Set([
  "pending",
  "partially_approved",
]);

export function canReceiveApproval(status: KycStatus): boolean {
  return APPROVABLE_STATUSES.has(status);
}

export function nextApprovalSlot(
  existingApprovals: readonly KycApproval[],
): 1 | 2 | null {
  if (existingApprovals.length === 0) return 1;

  const slot1 = existingApprovals.find((a) => a.approvalSlot === 1);
  if (!slot1) return 1;

  if (slot1.decision === "rejected") return null;

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
