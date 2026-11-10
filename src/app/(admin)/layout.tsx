import { requireAuth } from "@/lib/auth/guards";

import { AdminNavigation } from "./admin-navigation";

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

  return (
    <div className="min-h-screen">
      <AdminNavigation isAdministrator={isAdministrator} />
      <main className="container mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}