import { and, eq } from "drizzle-orm";

import { db, type PostgresJsDatabase } from "@/lib/db";
import type * as schema from "@/lib/db/schema";
import { NotFoundError } from "@/lib/errors";
import {
  asnProfiles,
  asnRegistrationAttachments,
  asnRegistrationDetails,
  jobPositions,
  users,
} from "@/modules/identity/db";

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
    readonly registrationType: "asn" | "citizen";
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
  readonly asnRegistration: {
    readonly birthPlace: string;
    readonly birthDate: string;
    readonly phone: string;
    readonly employmentStatus: string;
    readonly employeeNumber: string;
    readonly rankGrade: string;
    readonly appointmentDate: string | null;
    readonly agencyType: string;
    readonly provinceTask: string | null;
    readonly regencyTask: string | null;
    readonly field: string;
    readonly officeAddress: string;
    readonly officialEmail: string | null;
    readonly officePhone: string | null;
    readonly ktpAddress: string;
    readonly ktpRt: string;
    readonly ktpRw: string;
    readonly ktpPostalCode: string;
    readonly ktpProvince: string;
    readonly ktpRegency: string;
    readonly ktpDistrict: string;
    readonly ktpVillage: string;
    readonly domicileSameAsKtp: boolean;
    readonly domicileAddress: string;
    readonly domicileRt: string;
    readonly domicileRw: string;
    readonly domicilePostalCode: string;
    readonly domicileProvince: string;
    readonly domicileRegency: string;
    readonly domicileDistrict: string;
    readonly domicileVillage: string;
    readonly attachments: readonly {
      readonly type: string;
      readonly fileName: string;
      readonly url: string;
      readonly mimeType: string | null;
      readonly size: number | null;
    }[];
  } | null;
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
      profileTenantId: users.tenantId,
      asnProfileUserId: asnProfiles.userId,
      name: users.name,
      email: users.email,
      nik: users.nik,
      userStatus: users.status,
      nip: asnProfiles.nip,
      opdName: asnProfiles.opdName,
      unitName: asnProfiles.unitName,
      positionName: jobPositions.name,
      positionType: jobPositions.type,
      registrationId: asnRegistrationDetails.id,
      birthPlace: asnRegistrationDetails.birthPlace,
      birthDate: asnRegistrationDetails.birthDate,
      phone: asnRegistrationDetails.phone,
      employmentStatus: asnRegistrationDetails.employmentStatus,
      employeeNumber: asnRegistrationDetails.employeeNumber,
      rankGrade: asnRegistrationDetails.rankGrade,
      appointmentDate: asnRegistrationDetails.appointmentDate,
      agencyType: asnRegistrationDetails.agencyType,
      provinceTask: asnRegistrationDetails.provinceTask,
      regencyTask: asnRegistrationDetails.regencyTask,
      field: asnRegistrationDetails.field,
      officeAddress: asnRegistrationDetails.officeAddress,
      officialEmail: asnRegistrationDetails.officialEmail,
      officePhone: asnRegistrationDetails.officePhone,
      ktpAddress: asnRegistrationDetails.ktpAddress,
      ktpRt: asnRegistrationDetails.ktpRt,
      ktpRw: asnRegistrationDetails.ktpRw,
      ktpPostalCode: asnRegistrationDetails.ktpPostalCode,
      ktpProvince: asnRegistrationDetails.ktpProvince,
      ktpRegency: asnRegistrationDetails.ktpRegency,
      ktpDistrict: asnRegistrationDetails.ktpDistrict,
      ktpVillage: asnRegistrationDetails.ktpVillage,
      domicileSameAsKtp: asnRegistrationDetails.domicileSameAsKtp,
      domicileAddress: asnRegistrationDetails.domicileAddress,
      domicileRt: asnRegistrationDetails.domicileRt,
      domicileRw: asnRegistrationDetails.domicileRw,
      domicilePostalCode: asnRegistrationDetails.domicilePostalCode,
      domicileProvince: asnRegistrationDetails.domicileProvince,
      domicileRegency: asnRegistrationDetails.domicileRegency,
      domicileDistrict: asnRegistrationDetails.domicileDistrict,
      domicileVillage: asnRegistrationDetails.domicileVillage,
    })
    .from(kycRoster)
    .innerJoin(users, eq(users.id, kycRoster.userId))
    .leftJoin(
      asnProfiles,
      and(eq(asnProfiles.userId, users.id), eq(asnProfiles.tenantId, users.tenantId)),
    )
    .leftJoin(jobPositions, eq(jobPositions.id, asnProfiles.positionId))
    .leftJoin(
      asnRegistrationDetails,
      and(
        eq(asnRegistrationDetails.userId, users.id),
        eq(asnRegistrationDetails.tenantId, users.tenantId),
      ),
    )
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
    .leftJoin(
      users,
      and(
        eq(users.id, kycApprovals.approverId),
        eq(users.tenantId, tenantId),
      ),
    )
    .where(and(eq(kycApprovals.rosterId, rosterId), eq(kycApprovals.tenantId, tenantId)))
    .orderBy(kycApprovals.approvalSlot);

  const registrationAttachments = roster.registrationId
    ? await database
        .select({
          type: asnRegistrationAttachments.attachmentType,
          fileName: asnRegistrationAttachments.fileName,
          url: asnRegistrationAttachments.cloudinarySecureUrl,
          mimeType: asnRegistrationAttachments.mimeType,
          size: asnRegistrationAttachments.size,
        })
        .from(asnRegistrationAttachments)
        .where(
          and(
            eq(asnRegistrationAttachments.registrationId, roster.registrationId),
            eq(asnRegistrationAttachments.tenantId, roster.profileTenantId),
          ),
        )
    : [];

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
      registrationType: roster.asnProfileUserId ? "asn" : "citizen",
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
    asnRegistration: roster.registrationId
      ? {
          birthPlace: roster.birthPlace ?? "",
          birthDate: roster.birthDate ?? "",
          phone: roster.phone ?? "",
          employmentStatus: roster.employmentStatus ?? "",
          employeeNumber: roster.employeeNumber ?? "",
          rankGrade: roster.rankGrade ?? "",
          appointmentDate: roster.appointmentDate ?? null,
          agencyType: roster.agencyType ?? "",
          provinceTask: roster.provinceTask ?? null,
          regencyTask: roster.regencyTask ?? null,
          field: roster.field ?? "",
          officeAddress: roster.officeAddress ?? "",
          officialEmail: roster.officialEmail ?? null,
          officePhone: roster.officePhone ?? null,
          ktpAddress: roster.ktpAddress ?? "",
          ktpRt: roster.ktpRt ?? "",
          ktpRw: roster.ktpRw ?? "",
          ktpPostalCode: roster.ktpPostalCode ?? "",
          ktpProvince: roster.ktpProvince ?? "",
          ktpRegency: roster.ktpRegency ?? "",
          ktpDistrict: roster.ktpDistrict ?? "",
          ktpVillage: roster.ktpVillage ?? "",
          domicileSameAsKtp: roster.domicileSameAsKtp ?? false,
          domicileAddress: roster.domicileAddress ?? "",
          domicileRt: roster.domicileRt ?? "",
          domicileRw: roster.domicileRw ?? "",
          domicilePostalCode: roster.domicilePostalCode ?? "",
          domicileProvince: roster.domicileProvince ?? "",
          domicileRegency: roster.domicileRegency ?? "",
          domicileDistrict: roster.domicileDistrict ?? "",
          domicileVillage: roster.domicileVillage ?? "",
          attachments: registrationAttachments.map((attachment) => ({
            ...attachment,
            mimeType: attachment.mimeType ?? null,
            size: attachment.size ?? null,
          })),
        }
      : null,
    approvals,
    canReview,
    nextAction: isCompleted ? "completed" : approvals.length === 0 ? "first_approval" : "second_approval",
  };
}
