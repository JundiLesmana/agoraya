export type KycStatus =
  | "pending"
  | "partially_approved"
  | "verified"
  | "rejected"
  | "expired";

export type KycApprovalDecision = "approved" | "rejected";

export interface KycRosterEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly nikHash: string;
  readonly name: string;
  readonly status: KycStatus;
  readonly expiresAt: Date | null;
  readonly submittedBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface KycApproval {
  readonly id: string;
  readonly rosterId: string;
  readonly tenantId: string;
  readonly approverId: string | null;
  readonly approvalSlot: 1 | 2;
  readonly decision: KycApprovalDecision;
  readonly reason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface KycRosterPage {
  readonly items: readonly KycRosterEntry[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface KycApprovalSummary {
  readonly rosterId: string;
  readonly approvals: readonly KycApproval[];
  readonly isComplete: boolean;
}
