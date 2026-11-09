import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/foundation";
import { citizenProfiles } from "@/modules/citizen/db";
import { NotFoundError } from "@/lib/errors";
import { getKycReviewDetail } from "@/modules/kyc/review-detail-service";

import { KycReviewDetailClient } from "@/app/(admin)/admin/kyc/asn/[id]/_components/kyc-review-detail-client";

export const dynamic = "force-dynamic";

export default async function KycCitizenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth({ roles: ["admin", "superadmin"] });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  try {
    const detail = await getKycReviewDetail(
      id,
      session.tenantId,
      session.userId,
    );
    if (detail.subject.registrationType !== "citizen") notFound();

    const [profile] = await db()
      .select({
        phone: citizenProfiles.phone,
        address: citizenProfiles.address,
        ktpAttachmentUrl: citizenProfiles.ktpAttachmentUrl,
        selfieAttachmentUrl: citizenProfiles.selfieAttachmentUrl,
      })
      .from(citizenProfiles)
      .innerJoin(
        users,
        and(
          eq(users.id, citizenProfiles.userId),
          eq(users.tenantId, citizenProfiles.tenantId),
        ),
      )
      .where(eq(citizenProfiles.userId, detail.subject.userId))
      .limit(1);

    return (
      <KycReviewDetailClient
        initialDetail={detail}
        backHref="/admin/kyc/citizen"
        title="Detail verifikasi akun warga"
        decisionSubject="KYC warga"
        citizenProfile={{
          phone: profile?.phone ?? null,
          address: profile?.address ?? null,
          ktpAttachmentUrl: profile?.ktpAttachmentUrl ?? null,
          selfieAttachmentUrl: profile?.selfieAttachmentUrl ?? null,
        }}
      />
    );
  } catch (error) {
    if (error instanceof NotFoundError) notFound();
    throw error;
  }
}