import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";

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
  const session = await requireAuth({
    roles: ["admin", "superadmin", "kyc_verifikator"],
  });
  if (!isKycReviewer(session.roles)) {
    notFound();
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  try {
    const detail = await getKycReviewDetail(id, session.tenantId, session.userId);
    if (detail.subject.registrationType !== "asn") {
      notFound();
    }
    return (
      <KycReviewDetailClient
        initialDetail={detail}
        backHref="/admin/kyc/asn"
      />
    );
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }

    throw error;
  }
}