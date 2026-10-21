export const reportStatuses = [
  "submitted",
  "verified",
  "in_progress",
  "resolved",
  "closed",
] as const;
export type ReportStatus = (typeof reportStatuses)[number];
export type VoteValue = -1 | 1;

export interface Report {
  readonly id: string;
  readonly tenantId: string;
  readonly reporterId: string;
  readonly category: string;
  readonly title: string;
  readonly description: string;
  readonly location: Readonly<Record<string, unknown>> | null;
  readonly status: ReportStatus;
  readonly assigneeId: string | null;
  readonly duplicateOfId: string | null;
  readonly submittedAt: Date;
  readonly responseDueAt: Date;
  readonly firstRespondedAt: Date | null;
  readonly resolvedAt: Date | null;
  readonly closedAt: Date | null;
  readonly slaEscalatedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface QcEvidence {
  readonly id: string;
  readonly reportId: string;
  readonly tenantId: string;
  readonly uploadedBy: string;
  readonly storageKey: string;
  readonly mediaType: string;
  readonly note: string | null;
  readonly createdAt: Date;
}

export interface ReportVote {
  readonly reportId: string;
  readonly tenantId: string;
  readonly voterId: string;
  readonly value: VoteValue;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface VoteCount {
  readonly up: number;
  readonly down: number;
  readonly total: number;
}
