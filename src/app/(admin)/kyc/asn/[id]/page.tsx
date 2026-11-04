import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireAuth } from "@/lib/auth/guards";
import { NotFoundError } from "@/lib/errors";
import { getKycReviewDetail } from "@/modules/kyc/review-detail-service";
import { isKycReviewer } from "@/modules/kyc/reviewer-access";

import { KycReviewDetailClient } from "./_components/kyc-review-detail-client";

export const metadata: Metadata = {
  title: "Detail review KYC ASN | Agoraya",
  description: "Halaman detail review KYC ASN untuk petugas verifikasi dan admin.",
};

export default async function AdminKycAsnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth({ roles: ["admin", "kyc_verifikator"] });
  if (!isKycReviewer(session.roles)) {
    notFound();
  }

  const { id } = await params;

  try {
    const detail = await getKycReviewDetail(id, session.tenantId, session.userId);
    return <KycReviewDetailClient initialDetail={detail} />;
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}
