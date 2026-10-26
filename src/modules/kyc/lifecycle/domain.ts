import type { KycStatus } from "../types";

// Transition table (source → set of allowed targets)
const ALLOWED_TRANSITIONS: Readonly<Record<KycStatus, readonly KycStatus[]>> = {
  pending: ["partially_approved", "rejected"],
  partially_approved: ["verified", "rejected"],
  verified: ["expired"],
  rejected: [],
  expired: [],
};

// Domain errors
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

export function deriveStatusFromApprovals(
  current: KycStatus,
  approvalCount: number,
  allApproved: boolean,
  anyRejected: boolean,
): KycStatus | null {
  if (approvalCount === 0) return null;

  if (anyRejected) {
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

export function isExpired(entry: {
  status: KycStatus;
  expiresAt: Date | null;
}, now: Date): boolean {
  if (entry.status !== "verified") return false;
  if (entry.expiresAt === null) return false;
  return entry.expiresAt <= now;
}
