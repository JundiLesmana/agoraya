import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import {
  applicationRoles,
  apbdOperatorAssignments,
  moduleAccess,
  permissions,
  rolePermissions,
  roles,
  tenants,
  userApplicationRoles,
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
  LOCAL_SEED_SUPERADMIN_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_ADMIN_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_MAKER_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_CHECKER_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_CITIZEN_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_KYC_CITIZEN_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_KYC_ASN_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_APBD_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_OPERATOR_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_VERIFIKATOR_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_CMS_OPERATOR_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_ASN_OPERATOR_PASSWORD: z.string().min(12).max(256),
  LOCAL_SEED_EXECUTIVE_PASSWORD: z.string().min(12).max(256),
});

const ROLE_DEFINITIONS = [
  { key: "superadmin", name: "Superadmin" },
  { key: "admin", name: "Admin" },
  { key: "maker", name: "Maker" },
  { key: "checker", name: "Checker" },
  { key: "citizen", name: "Warga" },
  { key: "asn", name: "ASN" },
  { key: "staff", name: "Staff" },
  { key: "executive", name: "Executive" },
] as const;

const APPLICATION_ROLE_DEFINITIONS = [
  { key: "operator", name: "Operator" },
  { key: "verifikator", name: "Verifikator" },
  { key: "kyc_verifikator", name: "Verifikator KYC" },
  { key: "cms_operator", name: "Operator CMS" },
  { key: "service_permit", name: "Petugas Layanan Perizinan" },
  { key: "service_education", name: "Petugas Layanan Pendidikan" },
  { key: "service_social", name: "Petugas Layanan Sosial" },
  { key: "service_health", name: "Petugas Layanan Kesehatan" },
] as const;

const MODULE_ACCESS_DEFINITIONS = [
  "ogd",
  "insight",
  "kyc",
  "pst",
  "civic_reporting",
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
    email: "superadmin@agoraya.test",
    name: "Superadmin Local",
    passwordKey: "LOCAL_SEED_SUPERADMIN_PASSWORD",
    roleKeys: ["superadmin"],
    applicationRoleKeys: ["operator", "verifikator", "kyc_verifikator", "cms_operator"],
    moduleAccessKeys: ["ogd", "insight", "kyc", "pst", "civic_reporting"],
  },
  {
    email: "admin@agoraya.test",
    name: "Admin Local",
    passwordKey: "LOCAL_SEED_ADMIN_PASSWORD",
    roleKeys: ["admin"],
    applicationRoleKeys: ["operator", "verifikator", "kyc_verifikator"],
    moduleAccessKeys: ["ogd", "insight", "kyc", "pst", "civic_reporting"],
  },
  {
    email: "maker@agoraya.test",
    name: "Maker Local",
    passwordKey: "LOCAL_SEED_MAKER_PASSWORD",
    roleKeys: ["maker"],
    applicationRoleKeys: ["operator"],
    moduleAccessKeys: ["civic_reporting"],
  },
  {
    email: "checker@agoraya.test",
    name: "Checker Local",
    passwordKey: "LOCAL_SEED_CHECKER_PASSWORD",
    roleKeys: ["checker"],
    applicationRoleKeys: ["verifikator", "kyc_verifikator"],
    moduleAccessKeys: ["civic_reporting", "kyc"],
  },
  {
    email: "citizen@agoraya.test",
    name: "Citizen Local",
    passwordKey: "LOCAL_SEED_CITIZEN_PASSWORD",
    roleKeys: ["citizen"],
    applicationRoleKeys: [],
    moduleAccessKeys: [],
  },
  {
    email: "kyc-citizen@agoraya.test",
    name: "KYC Citizen Verifikator",
    passwordKey: "LOCAL_SEED_KYC_CITIZEN_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["kyc_verifikator"],
    moduleAccessKeys: ["kyc"],
  },
  {
    email: "kyc-asn@agoraya.test",
    name: "KYC ASN Verifikator",
    passwordKey: "LOCAL_SEED_KYC_ASN_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["kyc_verifikator"],
    moduleAccessKeys: ["kyc"],
  },
  {
    email: "apbd@agoraya.test",
    name: "APBD Operator",
    passwordKey: "LOCAL_SEED_APBD_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["operator"],
    moduleAccessKeys: ["insight"],
  },
  {
    email: "operator@agoraya.test",
    name: "General Operator",
    passwordKey: "LOCAL_SEED_OPERATOR_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["operator"],
    moduleAccessKeys: ["civic_reporting", "pst"],
  },
  {
    email: "verifikator@agoraya.test",
    name: "Verifikator General",
    passwordKey: "LOCAL_SEED_VERIFIKATOR_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["verifikator"],
    moduleAccessKeys: ["civic_reporting"],
  },
  {
    email: "cms-operator@agoraya.test",
    name: "CMS Operator",
    passwordKey: "LOCAL_SEED_CMS_OPERATOR_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["cms_operator"],
    moduleAccessKeys: ["ogd"],
  },
  {
    email: "asn-operator@agoraya.test",
    name: "ASN Statistics Operator",
    passwordKey: "LOCAL_SEED_ASN_OPERATOR_PASSWORD",
    roleKeys: ["asn"],
    applicationRoleKeys: ["operator"],
    moduleAccessKeys: ["insight"],
  },
  {
    email: "executive@agoraya.test",
    name: "Executive Local",
    passwordKey: "LOCAL_SEED_EXECUTIVE_PASSWORD",
    roleKeys: ["executive", "superadmin"],
    applicationRoleKeys: [],
    moduleAccessKeys: ["ogd", "insight"],
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

      await tx.execute(sql.raw(`SET LOCAL app.tenant_id = '${tenant.id}'`));

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

      const appRoleIds = new Map<string, string>();
      for (const appRole of APPLICATION_ROLE_DEFINITIONS) {
        await tx
          .insert(applicationRoles)
          .values({
            id: randomUUID(),
            key: appRole.key,
            name: appRole.name,
          })
          .onConflictDoNothing({ target: applicationRoles.key });
        const [storedAppRole] = await tx
          .select({ id: applicationRoles.id })
          .from(applicationRoles)
          .where(eq(applicationRoles.key, appRole.key))
          .limit(1);
        if (!storedAppRole) {
          throw new Error(`Application role ${appRole.key} tidak berhasil disiapkan.`);
        }
        appRoleIds.set(appRole.key, storedAppRole.id);
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

        for (const appRoleKey of account.applicationRoleKeys) {
          const appRoleId = appRoleIds.get(appRoleKey);
          if (!appRoleId) throw new Error(`Application role ${appRoleKey} tidak ditemukan.`);
          await tx
            .insert(userApplicationRoles)
            .values({
              id: randomUUID(),
              tenantId: tenant.id,
              userId,
              applicationRoleId: appRoleId,
              grantedAt: new Date(),
            })
            .onConflictDoNothing();
          await tx
            .update(userApplicationRoles)
            .set({ revokedAt: null })
            .where(
              and(
                eq(userApplicationRoles.userId, userId),
                eq(userApplicationRoles.applicationRoleId, appRoleId),
              ),
            );
        }

        for (const moduleKey of account.moduleAccessKeys) {
          await tx
            .insert(moduleAccess)
            .values({
              id: randomUUID(),
              tenantId: tenant.id,
              userId,
              moduleKey,
              grantedAt: new Date(),
            })
            .onConflictDoNothing();
          await tx
            .update(moduleAccess)
            .set({ revokedAt: null })
            .where(
              and(
                eq(moduleAccess.userId, userId),
                eq(moduleAccess.moduleKey, moduleKey),
              ),
            );
        }

        if (email === "apbd@agoraya.test") {
          await tx
            .insert(apbdOperatorAssignments)
            .values({
              tenantId: tenant.id,
              userId,
              agencyId: "dinas-pendidikan-kota-contoh",
              regionId: "kota-contoh",
              regionName: "Kota Contoh",
              sectorId: "education",
            })
            .onConflictDoNothing({
              target: [
                apbdOperatorAssignments.userId,
                apbdOperatorAssignments.tenantId,
                apbdOperatorAssignments.agencyId,
                apbdOperatorAssignments.regionId,
                apbdOperatorAssignments.sectorId,
              ],
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
      `Akun testing lokal siap (${ACCOUNT_DEFINITIONS.length} akun): superadmin, admin, maker, checker, citizen, kyc-citizen, kyc-asn, apbd, operator, verifikator, cms-operator, asn-operator, executive. Password disinkronkan dari .env.local.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Seed akun lokal gagal:", describeError(error));
  process.exitCode = 1;
});
