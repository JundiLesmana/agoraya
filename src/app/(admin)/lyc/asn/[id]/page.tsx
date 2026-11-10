import { redirect } from "next/navigation";

export default async function LegacyKycAsnDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/kyc/asn/${encodeURIComponent(id)}`);
}