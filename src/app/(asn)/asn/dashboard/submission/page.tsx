import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function LegacySubmissionPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string | string[] }>;
}) {
  const params = await searchParams;
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!id) {
    redirect("/asn/queue");
  }

  redirect(`/asn/submission/${id}`);
}
