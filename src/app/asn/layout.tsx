import { requireAuth } from "@/lib/auth/guards";

export default async function AsnRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth({ roles: ["asn", "staff"] });
  return children;
}
