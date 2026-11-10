import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import {
  applicationRoles,
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

const ENV_FILE = ".env";
const PRODUCTION_TENANT_SLUG = "jakbar";

const BootstrapEnvSchema = z.object({
  DATABASE_URL_UNPOOLED: z.string().url(),
  BOOTSTRAP_TENANT_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_TENANT_SLUG: z.string().trim().min(1).max(255),
  BOOTSTRAP_EXECUTIVE_EMAIL: z.string().email(),
  BOOTSTRAP_EXECUTIVE_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_EXECUTIVE_PASSWORD: z.string().min(12).max(256),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email(),
  BOOTSTRAP_ADMIN_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(12).max(256),
  BOOTSTRAP_CITIZEN_EMAIL: z.string().email(),
  BOOTSTRAP_CITIZEN_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_CITIZEN_PASSWORD: z.string().min(12).max(256),
  BOOTSTRAP_KYC_CITIZEN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_KYC_CITIZEN_NAME: z.string().trim().min(1).max(255).optional(),
  BOOTSTRAP_KYC_CITIZEN_PASSWORD: z.string().min(12).max(256).optional(),
  BOOTSTRAP_KYC_ASN_EMAIL: z.string().email().optional(),
  BOOTSTRAP_KYC_ASN_NAME: z.string().trim().min(1).max(255).optional(),
  BOOTSTRAP_KYC_ASN_PASSWORD: z.string().min(12).max(256).optional(),
  BOOTSTRAP_APBD_EMAIL: z.string().email().optional(),
  BOOTSTRAP_APBD_NAME: z.string().trim().min(1).max(255).optional(),
  BOOTSTRAP_APBD_PASSWORD: z.string().min(12).max(256).optional(),
  BOOTSTRAP_OPERATOR_EMAIL: z.string().email().optional(),
  BOOTSTRAP_OPERATOR_NAME: z.string().trim().min(1).max(255).optional(),
  BOOTSTRAP_OPERATOR_PASSWORD: z.string().min(12).max(256).optional(),
  BOOTSTRAP_VERIFIKATOR_EMAIL: z.string().email().optional(),
  BOOTSTRAP_VERIFIKATOR_NAME: z.string().trim().min(1).max(255).optional(),
  BOOTSTRAP_VERIFIKATOR_PASSWORD: z.string().min(12).max(256).optional(),
  BOOTSTRAP_CMS_OPERATOR_EMAIL: z.string().email().optional(),
  BOOTSTRAP_CMS_OPERATOR_NAME: z.string().trim().min(1).max(255).optional(),
  BOOTSTRAP_CMS_OPERATOR_PASSWORD: z.string().min(12).max(256).optional(),
  BOOTSTRAP_ASN_OPERATOR_EMAIL: z.string().email().optional(),
  BOOTSTRAP_ASN_OPERATOR_NAME: z.string().trim().min(1).max(255).optional(),
  BOOTSTRAP_ASN_OPERATOR_PASSWORD: z.string().min(12).max(256).optional(),
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
    emailKey: "BOOTSTRAP_EXECUTIVE_EMAIL",
    nameKey: "BOOTSTRAP_EXECUTIVE_NAME",
    passwordKey: "BOOTSTRAP_EXECUTIVE_PASSWORD",
    roleKeys: ["executive", "superadmin"],
    applicationRoleKeys: [],
    moduleAccessKeys: ["ogd", "insight"],
    optional: false,
  },
  {
    emailKey: "BOOTSTRAP_ADMIN_EMAIL",
    nameKey: "BOOTSTRAP_ADMIN_NAME",
    passwordKey: "BOOTSTRAP_ADMIN_PASSWORD",
    roleKeys: ["admin"],
    applicationRoleKeys: ["operator", "verifikator", "kyc_verifikator"],
    moduleAccessKeys: ["ogd", "insight", "kyc", "pst", "civic_reporting"],
    optional: false,
  },
  {
    emailKey: "BOOTSTRAP_CITIZEN_EMAIL",
    nameKey: "BOOTSTRAP_CITIZEN_NAME",
    passwordKey: "BOOTSTRAP_CITIZEN_PASSWORD",
    roleKeys: ["citizen"],
    applicationRoleKeys: [],
    moduleAccessKeys: [],
    optional: false,
  },
  {
    emailKey: "BOOTSTRAP_KYC_CITIZEN_EMAIL",
    nameKey: "BOOTSTRAP_KYC_CITIZEN_NAME",
    passwordKey: "BOOTSTRAP_KYC_CITIZEN_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["kyc_verifikator"],
    moduleAccessKeys: ["kyc"],
    optional: true,
  },
  {
    emailKey: "BOOTSTRAP_KYC_ASN_EMAIL",
    nameKey: "BOOTSTRAP_KYC_ASN_NAME",
    passwordKey: "BOOTSTRAP_KYC_ASN_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["kyc_verifikator"],
    moduleAccessKeys: ["kyc"],
    optional: true,
  },
  {
    emailKey: "BOOTSTRAP_APBD_EMAIL",
    nameKey: "BOOTSTRAP_APBD_NAME",
    passwordKey: "BOOTSTRAP_APBD_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["operator"],
    moduleAccessKeys: ["insight"],
    optional: true,
  },
  {
    emailKey: "BOOTSTRAP_OPERATOR_EMAIL",
    nameKey: "BOOTSTRAP_OPERATOR_NAME",
    passwordKey: "BOOTSTRAP_OPERATOR_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["operator"],
    moduleAccessKeys: ["civic_reporting", "pst"],
    optional: true,
  },
  {
    emailKey: "BOOTSTRAP_VERIFIKATOR_EMAIL",
    nameKey: "BOOTSTRAP_VERIFIKATOR_NAME",
    passwordKey: "BOOTSTRAP_VERIFIKATOR_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["verifikator"],
    moduleAccessKeys: ["civic_reporting"],
    optional: true,
  },
  {
    emailKey: "BOOTSTRAP_CMS_OPERATOR_EMAIL",
    nameKey: "BOOTSTRAP_CMS_OPERATOR_NAME",
    passwordKey: "BOOTSTRAP_CMS_OPERATOR_PASSWORD",
    roleKeys: ["staff"],
    applicationRoleKeys: ["cms_operator"],
    moduleAccessKeys: ["ogd"],
    optional: true,
  },
  {
    emailKey: "BOOTSTRAP_ASN_OPERATOR_EMAIL",
    nameKey: "BOOTSTRAP_ASN_OPERATOR_NAME",
    passwordKey: "BOOTSTRAP_ASN_OPERATOR_PASSWORD",
    roleKeys: ["asn"],
    applicationRoleKeys: ["operator"],
    moduleAccessKeys: ["insight"],
    optional: true,
  },
] as const;

function getEnv() {
  if (!existsSync(ENV_FILE)) {
    throw new Error(
      `${ENV_FILE} tidak ditemukan. Buat file tersebut dari .env.example, isi konfigurasi database production dan password bootstrap, lalu jalankan ulang.`,
    );
  }

  process.loadEnvFile(ENV_FILE);
  const parsed = BootstrapEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const invalid = parsed.error.issues
      .map((issue) => `${issue.path.join(".")} (${issue.message})`)
      .join(", ");
    throw new Error(`Konfigurasi bootstrap production tidak valid: ${invalid}`);
  }

  return parsed.data;
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
    : "Detail error tidak tersedia; database production tidak boleh diganti dengan URL local.";
}

async function main(): Promise<void> {
  const env = getEnv();
  console.log(
    `Target bootstrap production: ${env.DATABASE_URL_UNPOOLED}. Akun production akan dibuat sekali; tidak ada password yang dicetak.`,
  );

  const client = postgres(env.DATABASE_URL_UNPOOLED, {
    max: 1,
    connect_timeout: 120,
    idle_timeout: 120,
    max_lifetime: 60 * 60 * 1000,
    ssl: "require",
    prepare: false,
    onnotice: (notice) => console.log("[pg notice]", notice.message),
  });

  // Test connection first
  try {
    await client`SELECT 1`;
    console.log("Database connection established successfully");
  } catch (err) {
    console.error("Failed to connect to database:", err);
    throw err;
  }

  try {
    const database = drizzle(client);

    const accountInputs = await Promise.all(
      ACCOUNT_DEFINITIONS
        .filter((acc) => !acc.optional || (env[acc.emailKey] && env[acc.passwordKey] && env[acc.nameKey]))
        .map(async (account) => {
          const email = env[account.emailKey];
          const name = env[account.nameKey];
          const password = env[account.passwordKey];
          if (!email || !name || !password) {
            throw new Error(`Missing required env for ${account.emailKey}`);
          }
          return {
            ...account,
            email,
            name,
            passwordHash: await hashPassword(password),
          };
        }),
    );

    if (accountInputs.length < 3) {
      throw new Error("Minimal 3 akun wajib (executive, admin, citizen) harus dikonfigurasi.");
    }

    await database.transaction(async (tx) => {
      await tx
        .insert(tenants)
        .values({
          id: randomUUID(),
          name: env.BOOTSTRAP_TENANT_NAME,
          slug: PRODUCTION_TENANT_SLUG,
          status: "active",
        })
        .onConflictDoNothing({ target: tenants.slug });

      const [tenant] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, PRODUCTION_TENANT_SLUG))
        .limit(1);
      if (!tenant) throw new Error("Tenant production tidak berhasil dibuat.");

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
            .onConflictDoNothing();
          await tx
            .update(userRoles)
            .set({ revokedAt: null, expiresAt: null })
            .where(
              and(
                eq(userRoles.userId, userId),
                eq(userRoles.roleId, roleId),
              ),
            );
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

    const emails = accountInputs.map((a) => a.email).join(", ");
    console.log(`Bootstrap production selesai. Akun dibuat: ${emails}`);
    console.log("Simpan password dengan aman. Script ini hanya dijalankan sekali.");
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Bootstrap production gagal:", describeError(error));
  process.exitCode = 1;
});