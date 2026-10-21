import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { asc } from 'drizzle-orm';

import { db } from '../src/lib/db/index.js';
import { auditEvents, bpsSnapshots, permissions, rolePermissions, roles, tickets, tenants, userRoles, users } from '../src/lib/db/schema.js';

const outputArg = process.argv[2] ?? 'snapshots/agoraya-snapshot.json';

async function main(): Promise<void> {
  const payload = {
    exportedAt: new Date().toISOString(),
    tenantCount: await db.$count(tenants),
    users: await db.select().from(users).orderBy(asc(users.email)),
    roles: await db.select().from(roles).orderBy(asc(roles.key)),
    permissions: await db.select().from(permissions).orderBy(asc(permissions.key)),
    rolePermissions: await db.select().from(rolePermissions),
    userRoles: await db.select().from(userRoles),
    tickets: await db.select().from(tickets).orderBy(asc(tickets.createdAt)),
    auditEvents: await db.select().from(auditEvents).orderBy(asc(auditEvents.createdAt)),
    bpsSnapshots: await db.select().from(bpsSnapshots).orderBy(asc(bpsSnapshots.dataset)),
  };

  const outputPath = path.resolve(process.cwd(), outputArg);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('[script:export-snapshot] complete —', outputPath);
}

main().catch((err: unknown) => {
  console.error('[script:export-snapshot] failed:', err);
  process.exit(1);
});
