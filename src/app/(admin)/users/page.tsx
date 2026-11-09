import { requireAuth } from "@/lib/auth/guards";

export default async function AdminUsersPage() {
  await requireAuth({ roles: ["admin", "superadmin"] });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
    </div>
  );
}