import { requireAuth } from "@/lib/auth/guards";
import { getDefaultDatabase } from "@/lib/db/client";
import { ApbdAssignmentsClient } from "./_components/ApbdAssignmentsClient";

export default async function ApbdAssignmentsPage() {
  const session = await requireAuth({ roles: ["admin", "superadmin"] });

  const database = getDefaultDatabase();
  const users = await database.query<{ id: string; email: string; name: string }>(
    `SELECT id::text AS id, email, name
     FROM users
     WHERE tenant_id = $1 AND user_status = 'active'
     ORDER BY email`,
    [session.tenantId],
  );

  return (
    <ApbdAssignmentsClient initialUsers={users} initialAssignments={[]} />
  );
}
