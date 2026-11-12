import { requireAuth } from "@/lib/auth/guards";
import { ApbdReviewQueue } from "./_components/ApbdReviewQueue";

export const dynamic = "force-dynamic";

export default async function ApbdReviewPage() {
  await requireAuth({ roles: ["admin", "superadmin"] });
  return <ApbdReviewQueue />;
}