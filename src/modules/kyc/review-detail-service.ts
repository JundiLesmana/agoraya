import { and, eq } from "drizzle-orm";

import { db, type PostgresJsDatabase } from "@/lib/db";
import type * as schema from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";
import { asnProfiles, jobPositions, users } from "@/modules/identity/db";

import { kycApprovals, kycRoster } from "./db";
import type { KycApprovalDecision, KycStatus } from "./types";

export interface KycReviewerApprovalDetail {
  readonly id: string;
  readonly approvalSlot: 1 | 2;
  readonly decision: KycApprovalDecision;
  readonly reason: string | null;
  readonly approverId: string | null;
  readonly approverName: string | null;
  readonly createdAt: string;
}

export interface KycReviewDetail {
  readonly rosterId: string;
  readonly tenantId: string;
  readonly submittedBy: string | null;
  readonly submittedAt: string;
  readonly updatedAt: string;
  readonly status: KycStatus;
  readonly expiresAt: string | null;
  readonly subject: {
    readonly userId: string;
    readonly name: string;
    readonly email: string;
    readonly nik: string | null;
    readonly userStatus: string;
    readonly nip: string | null;
    readonly opdName: string | null;
    readonly unitName: string | null;
    readonly positionName: string | null;
    readonly positionType: string | null;
  };
  readonly approvals: readonly KycReviewerApprovalDetail[];
  readonly canReview: boolean;
  readonly nextAction: "first_approval" | "second_approval" | "completed";
}

type KycDatabase = PostgresJsDatabase<typeof schema>;

interface KycReviewDetailDependencies {
  readonly database?: KycDatabase;
}

export async function getKycReviewDetail(
  rosterId: string,
  tenantId: string,
  approverId?: string,
  dependencies: KycReviewDetailDependencies = {},
): Promise<KycReviewDetail> {
  const database = dependencies.database ?? db();

  const rosterRows = await database
    .select({
      rosterId: kycRoster.id,
      tenantId: kycRoster.tenantId,
      submittedBy: kycRoster.submittedBy,
      submittedAt: kycRoster.createdAt,
      updatedAt: kycRoster.updatedAt,
      status: kycRoster.status,
      expiresAt: kycRoster.expiresAt,
      userId: users.id,
      name: users.name,
      email: users.email,
      nik: users.nik,
      userStatus: users.status,
      nip: asnProfiles.nip,
      opdName: asnProfiles.opdName,
      unitName: asnProfiles.unitName,
      positionName: jobPositions.name,
      positionType: jobPositions.type,
    })
    .from(kycRoster)
    .innerJoin(users, eq(users.id, kycRoster.userId))
    .leftJoin(
      asnProfiles,
      and(eq(asnProfiles.userId, users.id), eq(asnProfiles.tenantId, kycRoster.tenantId)),
    )
    .leftJoin(jobPositions, eq(jobPositions.id, asnProfiles.positionId))
    .where(and(eq(kycRoster.id, rosterId), eq(kycRoster.tenantId, tenantId)))
    .limit(1);

  const roster = rosterRows[0];
  if (!roster) {
    throw new NotFoundError(`KYC roster entry "${rosterId}" not found in tenant "${tenantId}"`);
  }

  const approvalRows = await database
    .select({
      id: kycApprovals.id,
      approvalSlot: kycApprovals.approvalSlot,
      decision: kycApprovals.decision,
      reason: kycApprovals.reason,
      approverId: kycApprovals.approverId,
      approverName: users.name,
      createdAt: kycApprovals.createdAt,
    })
    .from(kycApprovals)
    .leftJoin(users, eq(users.id, kycApprovals.approverId))
    .where(and(eq(kycApprovals.rosterId, rosterId), eq(kycApprovals.tenantId, tenantId)))
    .orderBy(kycApprovals.approvalSlot);

  const approvals = approvalRows.map((approval: (typeof approvalRows)[number]) => ({
    id: approval.id,
    approvalSlot: approval.approvalSlot as 1 | 2,
    decision: approval.decision,
    reason: approval.reason ?? null,
    approverId: approval.approverId ?? null,
    approverName: approval.approverName ?? null,
    createdAt: approval.createdAt.toISOString(),
  }));

  const hasReviewed = approverId
    ? approvals.some((approval: (typeof approvals)[number]) => approval.approverId === approverId)
    : false;
  const isCompleted = roster.status === "verified" || roster.status === "rejected" || roster.status === "expired";
  const canReview = !isCompleted && !hasReviewed;

  return {
    rosterId: roster.rosterId,
    tenantId: roster.tenantId,
    submittedBy: roster.submittedBy,
    submittedAt: roster.submittedAt.toISOString(),
    updatedAt: roster.updatedAt.toISOString(),
    status: roster.status,
    expiresAt: roster.expiresAt ? roster.expiresAt.toISOString() : null,
    subject: {
      userId: roster.userId,
      name: roster.name,
      email: roster.email,
      nik: roster.nik ?? null,
      userStatus: roster.userStatus,
      nip: roster.nip ?? null,
      opdName: roster.opdName ?? null,
      unitName: roster.unitName ?? null,
      positionName: roster.positionName ?? null,
      positionType: roster.positionType ?? null,
    },
    approvals,
    canReview,
    nextAction: isCompleted ? "completed" : approvals.length === 0 ? "first_approval" : "second_approval",
  };
}
