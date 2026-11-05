import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  permissions,
  rolePermissions,
  roles,
  tenants,
  userRoles,
  users,
} from "../src/lib/db/schema/index.js";
import { hashPassword } from "../src/modules/identity/password/service.js";
import { getLocalDatabaseTarget } from "./local-database-target.js";

const ENV_FILE = ".env.local";
const LOCAL_TENANT_SLUG = "agoraya-local-testing";

const LocalSeedEnvSchema = z.object({
  DATABASE_URL_UNPOOLED: z.string().url(),
  LOCAL_SEED_TENANT_NAME: z.string().trim().min(1).max(255),
  LOCAL_SEED_EXECUTIVE_PASSWORD: z
    .string()
    .min(12, "harus minimal 12 karakter")
    .max(256, "maksimal 256 karakter"),
  LOCAL_SEED_ADMIN_PASSWORD: z
    .string()
    .min(12, "harus minimal 12 karakter")
    .max(256, "maksimal 256 karakter"),
  LOCAL_SEED_CITIZEN_PASSWORD: z
    .string()
    .min(12, "harus minimal 12 karakter")
    .max(256, "maksimal 256 karakter"),
});

const ROLE_DEFINITIONS = [
  { key: "superadmin", name: "Superadmin" },
  { key: "admin", name: "Admin" },
  { key: "executive", name: "Executive" },
  { key: "citizen", name: "Warga" },
] as const;

const PERMISSION_DEFINITIONS = [
  { key: "tickets:create", description: "Buat laporan baru" },
  { key: "tickets:read", description: "Baca laporan" },
  { key: "tickets:update", description: "Ubah status laporan" },
  { key: "tickets:verify", description: "Verifikasi laporan" },
  { key: "cms:read", description: "Baca data CMS" },
  { key: "audit:read", description: "Baca log audit" },
] as const;

const ACCOUNT_DEFINITIONS = [
  {
    email: "testing@executive.com",
    name: "Testing Executive",
    passwordKey: "LOCAL_SEED_EXECUTIVE_PASSWORD",
    roleKeys: ["superadmin", "executive"],
  },
  {
    email: "testing@admin.com",
    name: "Testing Admin",
    passwordKey: "LOCAL_SEED_ADMIN_PASSWORD",
    roleKeys: ["admin"],
  },
  {
    email: "testing@citizen.com",
    name: "Testing Citizen",
    passwordKey: "LOCAL_SEED_CITIZEN_PASSWORD",
    roleKeys: ["citizen"],
  },
] as const;

function getEnv() {
  if (!existsSync(ENV_FILE)) {
    throw new Error(
      `${ENV_FILE} tidak ditemukan. Buat file tersebut dari .env.example, isi konfigurasi database lokal dan password seed, lalu jalankan ulang.`,
    );
  }

  process.loadEnvFile(ENV_FILE);
  const parsed = LocalSeedEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const invalid = parsed.error.issues
      .map((issue) => `${issue.path.join(".")} (${issue.message})`)
      .join(", ");
    throw new Error(`Konfigurasi seed lokal tidak valid: ${invalid}`);
  }

  const target = getLocalDatabaseTarget(parsed.data.DATABASE_URL_UNPOOLED);
  return { env: parsed.data, ...target };
}

function describeError(error: unknown): string {
  const details: string[] = [];
  const seen = new Set<object>();
  let current: unknown = error;

  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const record = current as Record<string, unknown>;
    const name =
      current instanceof Error
        ? current.name
        : typeof record.name === "string"
          ? record.name
          : "Error";
    const code = typeof record.code === "string" ? record.code : undefined;
    const message =
      typeof record.message === "string" ? record.message.trim() : "";
    const parts = [
      code ? `kode ${code}` : "",
      name !== "DrizzleQueryError" && message ? message.split("\n", 1)[0] : "",
    ].filter(Boolean);

    if (parts.length > 0) details.push(parts.join(": "));
    current = record.cause;
  }

  return details.length > 0
    ? details.join(" — penyebab: ")
    : "Detail error tidak tersedia; database lokal tidak boleh diganti dengan URL production.";
}

async function main(): Promise<void> {
  const { env, databaseName, host } = getEnv();
  console.log(
    `Target seed lokal: ${host}/${databaseName}. Akun testing lokal akan dibuat atau diperbarui; tidak ada password yang dicetak.`,
  );

  const client = postgres(env.DATABASE_URL_UNPOOLED, {
    max: 1,
    connect_timeout: 10,
  });

  try {
    const database = drizzle(client);
    const accountInputs = await Promise.all(
      ACCOUNT_DEFINITIONS.map(async (account) => ({
        ...account,
        passwordHash: await hashPassword(env[account.passwordKey]),
      })),
    );

    await database.transaction(async (tx) => {
      await tx
        .insert(tenants)
        .values({
          id: randomUUID(),
          name: env.LOCAL_SEED_TENANT_NAME,
          slug: LOCAL_TENANT_SLUG,
          status: "active",
        })
        .onConflictDoNothing({ target: tenants.slug });

      const [tenant] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, LOCAL_TENANT_SLUG))
        .limit(1);
      if (!tenant) throw new Error("Tenant seed lokal tidak berhasil dibuat.");

      const roleIds = new Map<string, string>();
      for (const role of ROLE_DEFINITIONS) {
        await tx
          .insert(roles)
          .values({
            id: randomUUID(),
            tenantId: tenant.id,
            name: role.name,
            key: role.key,
          })
          .onConflictDoNothing();
        const [storedRole] = await tx
          .select({ id: roles.id })
          .from(roles)
          .where(and(eq(roles.tenantId, tenant.id), eq(roles.key, role.key)))
          .limit(1);
        if (!storedRole) {
          throw new Error(`Role ${role.key} tidak berhasil disiapkan.`);
        }
        roleIds.set(role.key, storedRole.id);
      }

      for (const account of accountInputs) {
        const email = account.email.toLowerCase();
        const [existing] = await tx
          .select({ id: users.id, tenantId: users.tenantId })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        let userId: string;
        if (existing) {
          if (existing.tenantId !== tenant.id) {
            throw new Error(
              `Akun ${email} sudah terdaftar pada tenant lain; transaksi dibatalkan.`,
            );
          }
          userId = existing.id;
          await tx
            .update(users)
            .set({
              name: account.name,
              passwordHash: account.passwordHash,
              status: "active",
            })
            .where(eq(users.id, userId));
        } else {
          userId = randomUUID();
          await tx.insert(users).values({
            id: userId,
            tenantId: tenant.id,
            email,
            name: account.name,
            passwordHash: account.passwordHash,
            status: "active",
          });
        }

        for (const roleKey of account.roleKeys) {
          const roleId = roleIds.get(roleKey);
          if (!roleId) throw new Error(`Role ${roleKey} tidak ditemukan.`);
          await tx
            .insert(userRoles)
            .values({ userId, roleId })
            .onConflictDoUpdate({
              target: [userRoles.userId, userRoles.roleId],
              set: { revokedAt: null, expiresAt: null },
            });
        }
      }

      const superadminRoleId = roleIds.get("superadmin");
      if (!superadminRoleId) {
        throw new Error("Role superadmin tidak ditemukan.");
      }

      for (const permission of PERMISSION_DEFINITIONS) {
        await tx
          .insert(permissions)
          .values({
            id: randomUUID(),
            key: permission.key,
            description: permission.description,
          })
          .onConflictDoNothing();
        const [storedPermission] = await tx
          .select({ id: permissions.id })
          .from(permissions)
          .where(eq(permissions.key, permission.key))
          .limit(1);
        if (!storedPermission) {
          throw new Error(
            `Permission ${permission.key} tidak berhasil disiapkan.`,
          );
        }
        await tx
          .insert(rolePermissions)
          .values({
            roleId: superadminRoleId,
            permissionId: storedPermission.id,
          })
          .onConflictDoUpdate({
            target: [rolePermissions.roleId, rolePermissions.permissionId],
            set: { revokedAt: null },
          });
      }
    });

    console.log(
      `Akun testing@executive.com, testing@admin.com, dan testing@citizen.com siap. Password disinkronkan dari .env.local.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Seed akun lokal gagal:", describeError(error));
  process.exitCode = 1;
});
