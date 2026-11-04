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

const ENV_FILE = ".env";

const BootstrapEnvSchema = z.object({
  DATABASE_URL_UNPOOLED: z.string().url(),
  BOOTSTRAP_TENANT_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_EXECUTIVE_EMAIL: z.string().email(),
  BOOTSTRAP_EXECUTIVE_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_EXECUTIVE_PASSWORD: z
    .string()
    .min(12, "harus minimal 12 karakter")
    .max(256, "maksimal 256 karakter"),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email(),
  BOOTSTRAP_ADMIN_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_ADMIN_PASSWORD: z
    .string()
    .min(12, "harus minimal 12 karakter")
    .max(256, "maksimal 256 karakter"),
  BOOTSTRAP_CITIZEN_EMAIL: z.string().email(),
  BOOTSTRAP_CITIZEN_NAME: z.string().trim().min(1).max(255),
  BOOTSTRAP_CITIZEN_PASSWORD: z
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

function getEnv() {
  if (!existsSync(ENV_FILE)) {
    throw new Error(
      `${ENV_FILE} tidak ditemukan. Salin .env.example ke file tersebut, isi nilainya, lalu jalankan ulang.`,
    );
  }

  process.loadEnvFile(ENV_FILE);
  const parsed = BootstrapEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const invalid = parsed.error.issues
      .map((issue) => `${issue.path.join(".")} (${issue.message})`)
      .join(", ");
    throw new Error(`Konfigurasi bootstrap tidak valid: ${invalid}`);
  }

  const url = new URL(parsed.data.DATABASE_URL_UNPOOLED);
  const databaseName = decodeURIComponent(url.pathname.slice(1));
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".neon.tech") ||
    url.hostname.includes("-pooler")
  ) {
    throw new Error(
      "DATABASE_URL_UNPOOLED harus merupakan direct connection string Neon, bukan URL pooler.",
    );
  }
  if (!databaseName) {
    throw new Error("DATABASE_URL_UNPOOLED tidak memuat nama database.");
  }
  if (
    new Set([
      parsed.data.BOOTSTRAP_EXECUTIVE_EMAIL.toLowerCase(),
      parsed.data.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
      parsed.data.BOOTSTRAP_CITIZEN_EMAIL.toLowerCase(),
    ]).size !== 3
  ) {
    throw new Error("Setiap akun bootstrap harus menggunakan email berbeda.");
  }

  return { env: parsed.data, databaseName, host: url.hostname };
}

function tenantSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug) throw new Error("Nama tenant tidak menghasilkan slug yang valid.");
  return slug;
}

async function main(): Promise<void> {
  const { env, databaseName, host } = getEnv();
  console.log(
    `Target bootstrap: Neon ${host}/${databaseName}. Tidak ada password yang akan dicetak.`,
  );
  const confirmation = await new Promise<string>((resolve) => {
    process.stdout.write(
      `Ketik persis "${databaseName}" untuk membuat tiga akun production: `,
    );
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (value) => resolve(value.toString().trim()));
  });
  if (confirmation !== databaseName) {
    throw new Error("Konfirmasi database tidak cocok; bootstrap dibatalkan.");
  }

  const client = postgres(env.DATABASE_URL_UNPOOLED, {
    max: 1,
    connect_timeout: 10,
  });

  try {
    const database = drizzle(client);
    const passwords = {
      executive: await hashPassword(env.BOOTSTRAP_EXECUTIVE_PASSWORD),
      admin: await hashPassword(env.BOOTSTRAP_ADMIN_PASSWORD),
      citizen: await hashPassword(env.BOOTSTRAP_CITIZEN_PASSWORD),
    };

    await database.transaction(async (tx) => {
      const slug = tenantSlug(env.BOOTSTRAP_TENANT_NAME);
      await tx
        .insert(tenants)
        .values({
          id: randomUUID(),
          name: env.BOOTSTRAP_TENANT_NAME,
          slug,
          status: "active",
        })
        .onConflictDoNothing({ target: tenants.slug });

      const [tenant] = await tx
        .select({ id: tenants.id })
        .from(tenants)
        .where(eq(tenants.slug, slug))
        .limit(1);
      if (!tenant) throw new Error("Tenant bootstrap tidak berhasil dibuat.");

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

      const ensureUser = async (input: {
        email: string;
        name: string;
        passwordHash: string;
        roleKeys: readonly string[];
      }): Promise<string> => {
        const email = input.email.toLowerCase();
        const [existing] = await tx
          .select({
            id: users.id,
            tenantId: users.tenantId,
            status: users.status,
            passwordHash: users.passwordHash,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        let userId: string;
        if (existing) {
          if (existing.tenantId !== tenant.id) {
            throw new Error(
              `Akun ${email} sudah terdaftar pada tenant lain; tidak ada perubahan dilakukan.`,
            );
          }
          if (existing.status !== "active") {
            throw new Error(
              `Akun ${email} tidak aktif; aktifkan melalui alur administrasi sebelum bootstrap.`,
            );
          }
          userId = existing.id;
          if (!existing.passwordHash) {
            await tx
              .update(users)
              .set({ passwordHash: input.passwordHash })
              .where(eq(users.id, userId));
          }
        } else {
          userId = randomUUID();
          await tx.insert(users).values({
            id: userId,
            tenantId: tenant.id,
            email,
            name: input.name,
            passwordHash: input.passwordHash,
            status: "active",
          });
        }

        for (const roleKey of input.roleKeys) {
          const roleId = roleIds.get(roleKey);
          if (!roleId) throw new Error(`Role ${roleKey} tidak ditemukan.`);

          const [grant] = await tx
            .select({
              revokedAt: userRoles.revokedAt,
              expiresAt: userRoles.expiresAt,
            })
            .from(userRoles)
            .where(
              and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)),
            )
            .limit(1);
          if (grant) {
            if (
              grant.revokedAt ||
              (grant.expiresAt && grant.expiresAt <= new Date())
            ) {
              throw new Error(
                `Role ${roleKey} untuk ${email} sudah dicabut atau kedaluwarsa; bootstrap tidak akan mengaktifkannya kembali.`,
              );
            }
          } else {
            await tx.insert(userRoles).values({ userId, roleId });
          }
        }

        return userId;
      };

      await ensureUser({
        email: env.BOOTSTRAP_EXECUTIVE_EMAIL,
        name: env.BOOTSTRAP_EXECUTIVE_NAME,
        passwordHash: passwords.executive,
        roleKeys: ["superadmin", "executive"],
      });
      await ensureUser({
        email: env.BOOTSTRAP_ADMIN_EMAIL,
        name: env.BOOTSTRAP_ADMIN_NAME,
        passwordHash: passwords.admin,
        roleKeys: ["admin"],
      });
      await ensureUser({
        email: env.BOOTSTRAP_CITIZEN_EMAIL,
        name: env.BOOTSTRAP_CITIZEN_NAME,
        passwordHash: passwords.citizen,
        roleKeys: ["citizen"],
      });

      const superadminRoleId = roleIds.get("superadmin");
      if (!superadminRoleId)
        throw new Error("Role superadmin tidak ditemukan.");
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
        const [grant] = await tx
          .select({ revokedAt: rolePermissions.revokedAt })
          .from(rolePermissions)
          .where(
            and(
              eq(rolePermissions.roleId, superadminRoleId),
              eq(rolePermissions.permissionId, storedPermission.id),
            ),
          )
          .limit(1);
        if (grant?.revokedAt) {
          throw new Error(
            `Permission ${permission.key} untuk superadmin telah dicabut; bootstrap tidak akan mengaktifkannya kembali.`,
          );
        }
        if (!grant) {
          await tx.insert(rolePermissions).values({
            roleId: superadminRoleId,
            permissionId: storedPermission.id,
          });
        }
      }
    });
    console.log(
      `Akun executive, admin, dan citizen siap untuk tenant ${env.BOOTSTRAP_TENANT_NAME}. Password akun yang sudah memiliki password tidak diubah.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  let detail = "Kesalahan tidak diketahui.";
  if (error instanceof Error) {
    const cause = error.cause;
    if (
      cause &&
      typeof cause === "object" &&
      "message" in cause &&
      typeof cause.message === "string"
    ) {
      const code =
        "code" in cause && typeof cause.code === "string"
          ? `PostgreSQL ${cause.code}: `
          : "";
      detail = `${code}${cause.message}`;
    } else {
      detail = error.message.split("\n", 1)[0] ?? error.message;
    }
  }
  console.error("Bootstrap akun production gagal:", detail);
  process.exitCode = 1;
});
