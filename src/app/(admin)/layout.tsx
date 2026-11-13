import { requireAuth } from "@/lib/auth/guards";

import { AdminShell } from "./admin-navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth({
    roles: ["admin", "superadmin", "kyc_verifikator"],
  });
  const isAdministrator = session.roles.some((role) =>
    ["admin", "superadmin"].includes(role),
  );
  const roleLabel = isAdministrator ? "Administrator" : "Verifikator KYC";

  return (
    <AdminShell isAdministrator={isAdministrator} roleLabel={roleLabel}>
      {children}
    </AdminShell>
  );
}