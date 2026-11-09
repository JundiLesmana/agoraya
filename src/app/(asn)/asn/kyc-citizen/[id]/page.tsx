import { redirect } from "next/navigation";

export default async function LegacyKycCitizenDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/kyc/citizen/${encodeURIComponent(id)}`);
}