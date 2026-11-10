import { requireAuth } from "@/lib/auth/guards";
import { AsnShell } from "./asn-shell";

export default async function AsnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });
  const roleLabel = session.roles.includes("asn")
    ? "Operator ASN"
    : session.roles.includes("staff")
      ? "Petugas ASN"
      : "Administrator";
  return <AsnShell roleLabel={roleLabel}>{children}</AsnShell>;
}
