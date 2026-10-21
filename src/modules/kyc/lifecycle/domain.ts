// Agoraya — modules/kyc/lifecycle domain
// Pure state-machine rules for KYC status transitions.
//
// This file has no I/O, no side effects, and no framework imports — the
// lifecycle rules are deterministic functions that can be composed and tested
// in isolation.
//
// Allowed transitions:
//
//   pending          → partially_approved   (first approval received)
//   pending          → rejected             (first approver rejects)
//   partially_approved → verified           (second approval received)
//   partially_approved → rejected           (second approver rejects)
//   verified         → expired              (TTL elapsed or forced expiry)
//
// Any transition not listed above is illegal.

import type { KycStatus } from "../types";

// ---------------------------------------------------------------------------
// Transition table (source → set of allowed targets)
// ---------------------------------------------------------------------------

const ALLOWED_TRANSITIONS: Readonly<Record<KycStatus, readonly KycStatus[]>> = {
  pending: ["partially_approved", "rejected"],
  partially_approved: ["verified", "rejected"],
  verified: ["expired"],
  rejected: [],
  expired: [],
};

// ---------------------------------------------------------------------------
// Domain errors
// ---------------------------------------------------------------------------

export class InvalidKycTransitionError extends Error {
  constructor(
    public readonly from: KycStatus,
    public readonly to: KycStatus,
  ) {
    super(
      `Invalid KYC lifecycle transition: "${from}" → "${to}" is not allowed`,
    );
    this.name = "InvalidKycTransitionError";
  }
}

// ---------------------------------------------------------------------------
// Pure domain functions
// ---------------------------------------------------------------------------

/**
 * Returns `true` when the transition `from → to` is a legal step in the
 * KYC lifecycle, `false` otherwise.
 */
export function isAllowedTransition(from: KycStatus, to: KycStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/**
 * Asserts that the transition `from → to` is legal.
 * Throws {@link InvalidKycTransitionError} if it is not.
 */
export function assertTransitionAllowed(
  from: KycStatus,
  to: KycStatus,
): void {
  if (!isAllowedTransition(from, to)) {
    throw new InvalidKycTransitionError(from, to);
  }
}

/**
 * Derive the next KYC status for a roster entry based on the dual-approval
 * outcome.
 *
 * Rules:
 * - If any approval is `rejected`, the next status is `rejected`.
 * - If exactly one slot is `approved`, the next status is `partially_approved`.
 * - If both slots are `approved`, the next status is `verified`.
 *
 * Returns `null` when no approvals have been submitted yet (no-op).
 */
export function deriveStatusFromApprovals(
  current: KycStatus,
  approvalCount: number,
  allApproved: boolean,
  anyRejected: boolean,
): KycStatus | null {
  if (approvalCount === 0) return null;

  if (anyRejected) {
    // Only transition if the current state allows rejection.
    if (!isAllowedTransition(current, "rejected")) return null;
    return "rejected";
  }

  if (approvalCount === 1 && allApproved) {
    if (!isAllowedTransition(current, "partially_approved")) return null;
    return "partially_approved";
  }

  if (approvalCount >= 2 && allApproved) {
    if (!isAllowedTransition(current, "verified")) return null;
    return "verified";
  }

  return null;
}

/** Returns `true` when the roster entry's KYC has passed its expiry time. */
export function isExpired(entry: {
  status: KycStatus;
  expiresAt: Date | null;
}, now: Date): boolean {
  if (entry.status !== "verified") return false;
  if (entry.expiresAt === null) return false;
  return entry.expiresAt <= now;
}
