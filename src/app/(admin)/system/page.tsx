import { requireAuth } from "@/lib/auth/guards";

export default async function AdminSystemPage() {
  await requireAuth({ roles: ["admin", "superadmin"] });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">System Config</h1>
    </div>
  );
}