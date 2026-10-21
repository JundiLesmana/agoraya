// Agoraya — modules/kyc types
// Shared domain types for the KYC module: roster entries, approval records,
// and KYC status transitions.
//
// This file is intentionally free of I/O, framework, and persistence imports
// so the domain types can be used by services, repositories, and tests without
// pulling in a database client.
//
// Identity data in this module is SIMULATED — no real Dukcapil/SIASN access.

/** The lifecycle states of a KYC roster entry. */
export type KycStatus =
  | "pending"
  | "partially_approved"
  | "verified"
  | "rejected"
  | "expired";

/** Decision recorded by one approver in the dual-approval workflow. */
export type KycApprovalDecision = "approved" | "rejected";

/**
 * A KYC roster entry.
 *
 * `nikHash` is a one-way hash of the simulated NIK — the raw value is never
 * stored or logged.
 */
export interface KycRosterEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  /** One-way hash of the SIMULATED NIK; never the raw value. */
  readonly nikHash: string;
  readonly name: string;
  readonly status: KycStatus;
  /** ISO 8601; present only for verified entries. */
  readonly expiresAt: Date | null;
  readonly submittedBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * A single approval record.
 *
 * `approvalSlot` is 1 (first approver) or 2 (second approver). The table has a
 * unique constraint on `(rosterId, approvalSlot)` so the constraint is
 * enforced at the database level.
 */
export interface KycApproval {
  readonly id: string;
  readonly rosterId: string;
  readonly tenantId: string;
  readonly approverId: string | null;
  /** 1 = first approver, 2 = second approver. */
  readonly approvalSlot: 1 | 2;
  readonly decision: KycApprovalDecision;
  readonly reason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Page of roster entries returned by list operations. */
export interface KycRosterPage {
  readonly items: readonly KycRosterEntry[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

/** Snapshot of the current approvals for a roster entry. */
export interface KycApprovalSummary {
  readonly rosterId: string;
  readonly approvals: readonly KycApproval[];
  /** True when both slots are filled. */
  readonly isComplete: boolean;
}
