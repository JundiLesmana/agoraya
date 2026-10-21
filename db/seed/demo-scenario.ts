/**
 * Agoraya — Demo scenario seed data.
 *
 * Deterministic demo data for the Kota Contoh (Demo City) tenant. All IDs are
 * fixed UUIDs so re-running the seed is idempotent (existing rows are updated,
 * tickets are replaced). Identity numbers are clearly simulated (padded zeros)
 * and must never be mistaken for real NIK/Dukcapil data.
 *
 * Seed is idempotent:
 * - tenants / users / roles / permissions: upserted on their unique keys
 * - role_permissions / user_roles: inserted with ON CONFLICT DO NOTHING
 *   tickets: deleted for the demo tenant, then re-inserted
 * - audit_events: inserted as append-only seed records
 */

import { randomUUID } from "crypto";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import type * as schema from "../../src/lib/db/schema.js";
import {
  auditEvents,
  permissions,
  rbacPolicies,
  rolePermissions,
  roles,
  tickets,
  tenants,
  userRoles,
  users,
} from "../../src/lib/db/schema.js";
import type {
  userStatusEnum,
  ticketStatusEnum,
} from "../../src/lib/db/schema.js";
import { builtinPolicyDefinitions } from "../../src/modules/rbac/policies/definitions.js";

type UserStatus = (typeof userStatusEnum.enumValues)[number];
type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];

// ---------------------------------------------------------------------------
// Fixed (deterministic) UUIDs so the seed is idempotent across runs.
// ---------------------------------------------------------------------------

const TENANT_ID = "00000000-0000-0000-0000-000000000001";

const ROLE_SUPERADMIN = "00000000-0000-0000-0000-000000000010";
const ROLE_MAKER = "00000000-0000-0000-0000-000000000020";
const ROLE_CHECKER = "00000000-0000-0000-0000-000000000030";
const ROLE_CITIZEN = "00000000-0000-0000-0000-000000000040";

const PERM_TICKETS_CREATE = "00000000-0000-0000-0000-000000000050";
const PERM_TICKETS_READ = "00000000-0000-0000-0000-000000000051";
const PERM_TICKETS_UPDATE = "00000000-0000-0000-0000-000000000052";
const PERM_TICKETS_VERIFY = "00000000-0000-0000-0000-000000000053";
const PERM_CMS_READ = "00000000-0000-0000-0000-000000000060";
const PERM_AUDIT_READ = "00000000-0000-0000-0000-000000000061";

const USER_ADMIN = "00000000-0000-0000-0000-000000000100";
const USER_MAKER = "00000000-0000-0000-0000-000000000200";
const USER_CHECKER = "00000000-0000-0000-0000-000000000300";
const USER_CITIZEN = "00000000-0000-0000-0000-000000000400";

const TICKET_1 = "00000000-0000-0000-0000-000000001001";
const TICKET_2 = "00000000-0000-0000-0000-000000001002";
const TICKET_3 = "00000000-0000-0000-0000-000000001003";

const now = new Date();

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

export const TENANT_SEED = {
  id: TENANT_ID,
  name: "Pemerintah Kota Contoh",
  slug: "kota-contoh",
  status: "active",
};

const ROLE_SEEDS = [
  {
    id: ROLE_SUPERADMIN,
    tenantId: TENANT_ID,
    name: "Superadmin",
    key: "superadmin",
  },
  { id: ROLE_MAKER, tenantId: TENANT_ID, name: "Maker", key: "maker" },
  { id: ROLE_CHECKER, tenantId: TENANT_ID, name: "Checker", key: "checker" },
  { id: ROLE_CITIZEN, tenantId: TENANT_ID, name: "Warga", key: "citizen" },
];

const PERMISSION_SEEDS = [
  {
    id: PERM_TICKETS_CREATE,
    key: "tickets:create",
    description: "Buat laporan baru",
  },
  { id: PERM_TICKETS_READ, key: "tickets:read", description: "Baca laporan" },
  {
    id: PERM_TICKETS_UPDATE,
    key: "tickets:update",
    description: "Ubah status laporan",
  },
  {
    id: PERM_TICKETS_VERIFY,
    key: "tickets:verify",
    description: "Verifikasi laporan",
  },
  { id: PERM_CMS_READ, key: "cms:read", description: "Baca data CMS" },
  { id: PERM_AUDIT_READ, key: "audit:read", description: "Baca log audit" },
];
// role -> permission keys
const ROLE_PERMISSION_SEEDS: Array<{ roleId: string; permissionKey: string }> =
  [
    { roleId: ROLE_SUPERADMIN, permissionKey: "tickets:create" },
    { roleId: ROLE_SUPERADMIN, permissionKey: "tickets:read" },
    { roleId: ROLE_SUPERADMIN, permissionKey: "tickets:update" },
    { roleId: ROLE_SUPERADMIN, permissionKey: "tickets:verify" },
    { roleId: ROLE_SUPERADMIN, permissionKey: "cms:read" },
    { roleId: ROLE_SUPERADMIN, permissionKey: "audit:read" },
    { roleId: ROLE_MAKER, permissionKey: "tickets:create" },
    { roleId: ROLE_MAKER, permissionKey: "tickets:read" },
    { roleId: ROLE_MAKER, permissionKey: "cms:read" },
    { roleId: ROLE_CHECKER, permissionKey: "tickets:read" },
    { roleId: ROLE_CHECKER, permissionKey: "tickets:update" },
    { roleId: ROLE_CHECKER, permissionKey: "tickets:verify" },
    { roleId: ROLE_CHECKER, permissionKey: "cms:read" },
    { roleId: ROLE_CITIZEN, permissionKey: "tickets:read" },
  ];

export const USER_SEEDS: Array<{
  id: string;
  tenantId: string;
  email: string;
  name: string;
  nik: string;
  roleKey: string;
  status: UserStatus;
}> = [
  {
    id: USER_ADMIN,
    tenantId: TENANT_ID,
    email: "admin@kota-contoh.demo",
    name: "Admin Kota Contoh",
    nik: "3171000000000001", // SIMULATED — never a real NIK
    roleKey: "superadmin",
    status: "active",
  },
  {
    id: USER_MAKER,
    tenantId: TENANT_ID,
    email: "maker@kota-contoh.demo",
    name: "Maker Contoh",
    nik: "3171000000000002", // SIMULATED
    roleKey: "maker",
    status: "active",
  },
  {
    id: USER_CHECKER,
    tenantId: TENANT_ID,
    email: "checker@kota-contoh.demo",
    name: "Checker Contoh",
    nik: "3171000000000003", // SIMULATED
    roleKey: "checker",
    status: "active",
  },
  {
    id: USER_CITIZEN,
    tenantId: TENANT_ID,
    email: "warga@kota-contoh.demo",
    name: "Warga Contoh",
    nik: "3171000000000004", // SIMULATED
    roleKey: "citizen",
    status: "active",
  },
];
export const TICKET_SEEDS: Array<{
  id: string;
  tenantId: string;
  citizenId: string;
  category: string;
  title: string;
  description: string;
  status: TicketStatus;
  urgency: string;
  location: { latitude: number; longitude: number; address: string };
}> = [
  {
    id: TICKET_1,
    tenantId: TENANT_ID,
    citizenId: USER_CITIZEN,
    category: "infrastruktur",
    title: "Jalan rusak di Jalan Sudirman",
    description:
      "Ada lobang besar di depan warung sembako yang membahayakan pengemudi sepeda motor.",
    status: "submitted",
    urgency: "high",
    location: {
      latitude: -6.2088,
      longitude: 106.8456,
      address: "Jalan Sudirman, Jakarta Pusat",
    },
  },
  {
    id: TICKET_2,
    tenantId: TENANT_ID,
    citizenId: USER_CITIZEN,
    category: "lingkungan",
    title: "Pemampatan sampah di RT 05",
    description:
      "Sampah tidak diangkir selama seminggu, menyebabkan bau busuk dan nyamuk.",
    status: "in_progress",
    urgency: "medium",
    location: {
      latitude: -6.212,
      longitude: 106.81,
      address: "RT 05, Kebayoran Baru",
    },
  },
  {
    id: TICKET_3,
    tenantId: TENANT_ID,
    citizenId: USER_CITIZEN,
    category: "ilumniasi",
    title: "Lampu jalan mati di Taman Kota",
    description:
      "Beberapa lampu jalan di taman mati total sejak tiga hari lalu.",
    status: "resolved",
    urgency: "low",
    location: {
      latitude: -6.195,
      longitude: 106.82,
      address: "Taman Kota, Menteng",
    },
  },
];

const roleByKey = new Map(ROLE_SEEDS.map((r) => [r.key, r.id]));

const permissionByKey = new Map(PERMISSION_SEEDS.map((p) => [p.key, p.id]));

/**
 * Seed the full demo scenario. Idempotent.
 */
export async function seedDemoScenario(
  dbx: PostgresJsDatabase<typeof schema>,
): Promise<{
  tenants: number;
  users: number;
  roles: number;
  permissions: number;
  tickets: number;
  auditEvents: number;
  policies: number;
}> {
  // 1. Tenant (upsert on slug)
  await dbx
    .insert(tenants)
    .values(TENANT_SEED)
    .onConflictDoUpdate({ target: tenants.slug, set: TENANT_SEED });

  // 2. Roles (upsert on tenant_id + key)
  for (const r of ROLE_SEEDS) {
    await dbx
      .insert(roles)
      .values(r)
      .onConflictDoUpdate({
        target: [roles.tenantId, roles.key],
        set: { name: r.name, updatedAt: now },
      });
  }

  // 3. Permissions (upsert on key)
  for (const p of PERMISSION_SEEDS) {
    await dbx
      .insert(permissions)
      .values(p)
      .onConflictDoUpdate({ target: permissions.key, set: p });
  }

  // 4. Users (upsert on email)
  for (const u of USER_SEEDS) {
    await dbx
      .insert(users)
      .values({
        id: u.id,
        tenantId: u.tenantId,
        email: u.email,
        name: u.name,
        nik: u.nik,
        status: u.status,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: u.name,
          nik: u.nik,
          status: u.status,
          tenantId: u.tenantId,
          updatedAt: now,
        },
      });
  }

  // 5. User-role assignments (idempotent via composite PK)
  for (const u of USER_SEEDS) {
    const roleId = roleByKey.get(u.roleKey);
    if (!roleId) continue;
    await dbx
      .insert(userRoles)
      .values({ userId: u.id, roleId })
      .onConflictDoNothing();
  }

  // 6. Role-permission grants (idempotent via composite PK)
  for (const g of ROLE_PERMISSION_SEEDS) {
    const permissionId = permissionByKey.get(g.permissionKey);
    if (!permissionId) continue;
    await dbx
      .insert(rolePermissions)
      .values({ roleId: g.roleId, permissionId })
      .onConflictDoNothing();
  }

  // 7. Tickets: replace demo tickets (delete then insert) — idempotent
  await dbx.delete(tickets).where(eq(tickets.tenantId, TENANT_ID));
  for (const t of TICKET_SEEDS) {
    await dbx.insert(tickets).values(t);
  }

  // 8. Audit seed events (append-only)
  await dbx.insert(auditEvents).values([
    {
      id: randomUUID(),
      actorId: USER_ADMIN,
      action: "seed.demo_loaded",
      targetTable: "tenants",
      targetId: TENANT_ID,
      metadata: { tenant: "kota-contoh", scenario: "demo" },
    },
    {
      id: randomUUID(),
      actorId: USER_MAKER,
      action: "ticket.created",
      targetTable: "tickets",
      targetId: TICKET_1,
      metadata: { category: "infrastruktur", urgency: "high" },
    },
    {
      id: randomUUID(),
      actorId: USER_CHECKER,
      action: "ticket.verified",
      targetTable: "tickets",
      targetId: TICKET_3,
      metadata: { previousState: "submitted", newState: "resolved" },
    },
  ]);

  // 9. Built-in RBAC policies (global). Idempotent upsert on the policy key.
  //    `status` and `version` are preserved so a locally edited policy is not
  //    reset by re-running the seed.
  const policyDefinitions = builtinPolicyDefinitions();
  for (const definition of policyDefinitions) {
    await dbx
      .insert(rbacPolicies)
      .values({
        id: randomUUID(),
        key: definition.key,
        name: definition.name,
        description: definition.description ?? null,
        effect: definition.effect,
        priority: definition.priority,
        status: definition.status,
        version: 1,
        tenantId: definition.tenantId,
        roles: [...definition.roles],
        permissions: [...definition.permissions],
        resources: [...definition.resources],
        actions: [...definition.actions],
        conditions: definition.conditions.map((condition) => ({ ...condition })),
      })
      .onConflictDoUpdate({
        target: rbacPolicies.key,
        set: {
          name: definition.name,
          description: definition.description ?? null,
          effect: definition.effect,
          priority: definition.priority,
          roles: [...definition.roles],
          permissions: [...definition.permissions],
          resources: [...definition.resources],
          actions: [...definition.actions],
          conditions: definition.conditions.map((condition) => ({ ...condition })),
          updatedAt: now,
        },
      });
  }

  return {
    tenants: 1,
    users: USER_SEEDS.length,
    roles: ROLE_SEEDS.length,
    permissions: PERMISSION_SEEDS.length,
    tickets: TICKET_SEEDS.length,
    auditEvents: 3,
    policies: policyDefinitions.length,
  };
}
