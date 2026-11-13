import { existsSync } from "node:fs";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { tenants, users } from "../src/lib/db/schema/index.js";
import { seedTenantAsnProjects } from "../db/seed/asn-projects.js";

const ENV_FILE = ".env";

const EnvSchema = z.object({
  DATABASE_URL_UNPOOLED: z.string().url(),
  PROD_PROJECTS_SEED_CONFIRM: z.enum(["yes"]).optional(),
  PROD_PROJECTS_SEED_TENANT_SLUG: z.string().trim().min(1).max(255).optional(),
  PROD_PROJECTS_SEED_ACTOR_EMAIL: z.string().trim().email().optional(),
});

type DbClient = PostgresJsDatabase;

interface QuarterSeed {
  month: number;
  physical: number;
  financial: number;
  note: string;
}

function getEnv() {
  if (existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
  }
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const invalid = parsed.error.issues
      .map((issue) => `${issue.path.join(".")} (${issue.message})`)
      .join(", ");
    throw new Error(
      `Konfigurasi seed proyek production tidak valid: ${invalid}`,
    );
  }
  return parsed.data;
}

function redactDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (url.password) url.password = "***";
    if (url.username) url.username = "***";
    url.search = "";
    return url.toString();
  } catch {
    return "<invalid DATABASE_URL_UNPOOLED>";
  }
}

async function resolveTenant(
  tx: DbClient,
  tenantSlug?: string,
) {
  const preferredSlugs = [
    tenantSlug,
    process.env.BOOTSTRAP_TENANT_SLUG,
  ].filter((v): v is string => Boolean(v));

  for (const slug of preferredSlugs) {
    const [tenant] = await tx
      .select({ id: tenants.id, slug: tenants.slug, name: tenants.name })
      .from(tenants)
      .where(eq(tenants.slug, slug))
      .limit(1);
    if (tenant) return tenant;
  }

  const [tenant] = await tx
    .select({ id: tenants.id, slug: tenants.slug, name: tenants.name })
    .from(tenants)
    .limit(1);
  return tenant ?? null;
}

async function resolveActor(
  tx: DbClient,
  tenantId: string,
  preferredEmail?: string,
) {
  const candidates = [
    preferredEmail?.toLowerCase(),
    process.env.BOOTSTRAP_ASN_OPERATOR_EMAIL?.toLowerCase(),
    process.env.BOOTSTRAP_APBD_EMAIL?.toLowerCase(),
    process.env.BOOTSTRAP_ADMIN_EMAIL?.toLowerCase(),
  ].filter((v): v is string => Boolean(v));

  for (const email of candidates) {
    const [actor] = await tx
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
      .limit(1);
    if (actor) return actor;
  }

  const [fallback] = await tx
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.status, "active")))
    .limit(1);
  return fallback ?? null;
}

function buildProductionSeed(actorEmail: string, regionName: string) {
  const quarters: QuarterSeed[] = [
    { month: 3, physical: 30, financial: 26, note: "Perencanaan dan pekerjaan awal selesai sesuai jadwal triwulan I." },
    { month: 6, physical: 55, financial: 50, note: "Pelaksanaan utama berjalan; capaian fisik dan keuangan triwulan II tercatat." },
    { month: 9, physical: 75, financial: 70, note: "Sebagian besar pekerjaan selesai; evaluasi progres triwulan III oleh ASN." },
  ];
  const completedQuarters: QuarterSeed[] = [
    { month: 3, physical: 45, financial: 42, note: "Mobilisasi dan pekerjaan struktur awal selesai." },
    { month: 6, physical: 80, financial: 78, note: "Pekerjaan utama mendekati selesai pada triwulan II." },
    { month: 9, physical: 100, financial: 98, note: "Pekerjaan fisik selesai dan dilaporkan oleh ASN pada triwulan III." },
  ];
  const delayedQuarters: QuarterSeed[] = [
    { month: 3, physical: 10, financial: 8, note: "Persiapan dan penyesuaian teknis tahap awal." },
    { month: 6, physical: 22, financial: 18, note: "Kendala pelaksanaan memengaruhi capaian triwulan II." },
    { month: 9, physical: 35, financial: 30, note: "Pekerjaan berlanjut dengan penyesuaian jadwal pada triwulan III." },
  ];

  const year = new Date().getUTCFullYear() - 1;
  const projects = [
    {
      externalProjectId: `PRD-PROJ-${year}-001`,
      packageName: `Peningkatan Jalan dan Konektivitas ${regionName}`,
      location: regionName,
      sector: "infrastruktur",
      contractValue: 120_000_000_000,
      providerName: "Penyedia Pekerjaan Konstruksi",
      startDate: `${year}-01-15`,
      endDate: `${year}-10-31`,
      fiscalYear: year,
      initialPhysicalProgress: 5,
      initialFinancialProgress: 4,
      status: "completed",
      assignedUserEmail: actorEmail,
    },
    {
      externalProjectId: `PRD-PROJ-${year}-002`,
      packageName: `Rehabilitasi Sarana Pendidikan ${regionName}`,
      location: regionName,
      sector: "pendidikan",
      contractValue: 80_000_000_000,
      providerName: "Penyedia Sarana Pendidikan",
      startDate: `${year}-02-01`,
      endDate: `${year}-12-20`,
      fiscalYear: year,
      initialPhysicalProgress: 0,
      initialFinancialProgress: 0,
      status: "ongoing",
      assignedUserEmail: actorEmail,
    },
    {
      externalProjectId: `PRD-PROJ-${year}-003`,
      packageName: `Peningkatan Layanan Kesehatan ${regionName}`,
      location: regionName,
      sector: "kesehatan",
      contractValue: 60_000_000_000,
      providerName: "Penyedia Fasilitas Kesehatan",
      startDate: `${year}-03-01`,
      endDate: `${year}-11-30`,
      fiscalYear: year,
      initialPhysicalProgress: 0,
      initialFinancialProgress: 0,
      status: "ongoing",
      assignedUserEmail: actorEmail,
    },
    {
      externalProjectId: `PRD-PROJ-${year}-004`,
      packageName: `Pengembangan Fasilitas Pendukung Layanan ${regionName}`,
      location: regionName,
      sector: "lainnya",
      contractValue: 45_000_000_000,
      providerName: "Penyedia Pengembangan Layanan",
      startDate: `${year}-04-01`,
      endDate: `${year}-12-31`,
      fiscalYear: year,
      initialPhysicalProgress: 0,
      initialFinancialProgress: 0,
      status: "delayed",
      assignedUserEmail: actorEmail,
    },
  ];

  const reports = [
    ...completedQuarters.map((q) => ({
      projectExternalId: `PRD-PROJ-${year}-001`,
      periodMonth: q.month,
      periodYear: year,
      physicalProgress: q.physical,
      financialProgress: q.financial,
      evaluationNotes: q.note,
      status: "submitted" as const,
      reportedByEmail: actorEmail,
    })),
    ...quarters.map((q) => ({
      projectExternalId: `PRD-PROJ-${year}-002`,
      periodMonth: q.month,
      periodYear: year,
      physicalProgress: q.physical,
      financialProgress: q.financial,
      evaluationNotes: q.note,
      status: "submitted" as const,
      reportedByEmail: actorEmail,
    })),
    ...quarters.map((q, i) => ({
      projectExternalId: `PRD-PROJ-${year}-003`,
      periodMonth: q.month,
      periodYear: year,
      physicalProgress: Math.max(0, q.physical - 10 + i * 2),
      financialProgress: Math.max(0, q.financial - 10 + i * 2),
      evaluationNotes: q.note,
      status: "submitted" as const,
      reportedByEmail: actorEmail,
    })),
    ...delayedQuarters.map((q) => ({
      projectExternalId: `PRD-PROJ-${year}-004`,
      periodMonth: q.month,
      periodYear: year,
      physicalProgress: q.physical,
      financialProgress: q.financial,
      evaluationNotes: q.note,
      status: "submitted" as const,
      reportedByEmail: actorEmail,
    })),
  ];

  return { projects, reports };
}

async function main() {
  const env = getEnv();
  const targetDb = redactDatabaseUrl(env.DATABASE_URL_UNPOOLED);
  const isLikelyLocal = /localhost|127\.0\.0\.1|\[::1\]|agoraya_local/i.test(
    env.DATABASE_URL_UNPOOLED,
  );

  if (!isLikelyLocal && env.PROD_PROJECTS_SEED_CONFIRM !== "yes") {
    throw new Error(
      `Target database tampak non-lokal (${targetDb}). Set PROD_PROJECTS_SEED_CONFIRM=yes untuk melanjutkan seed proyek production secara eksplisit.`,
    );
  }

  console.log(`[seed-projects:prod] target=${targetDb}`);

  const client = postgres(env.DATABASE_URL_UNPOOLED, {
    max: 1,
    connect_timeout: 30,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    ssl: isLikelyLocal ? false : "require",
    prepare: false,
  });

  try {
    await client`SELECT 1`;
    const db = drizzle(client);
    const result = await db.transaction(async (tx) => {
      const tenant = await resolveTenant(tx, env.PROD_PROJECTS_SEED_TENANT_SLUG);
      if (!tenant) {
        throw new Error(
          "Tenant tidak ditemukan. Jalankan bootstrap/migrasi akun terlebih dahulu atau set PROD_PROJECTS_SEED_TENANT_SLUG.",
        );
      }

      const actor = await resolveActor(
        tx,
        tenant.id,
        env.PROD_PROJECTS_SEED_ACTOR_EMAIL,
      );
      if (!actor) {
        throw new Error(
          `Tidak ada user aktif pada tenant ${tenant.slug}. Jalankan bootstrap akun terlebih dahulu.`,
        );
      }

      const regionName = tenant.name || "Wilayah";
      const seed = buildProductionSeed(actor.email, regionName);
      const seeded = await seedTenantAsnProjects(
        tx as unknown as Parameters<typeof seedTenantAsnProjects>[0],
        tenant.slug,
        seed.projects,
        seed.reports,
        [actor.email],
      );

      if (!seeded.seeded) {
        throw new Error(
          `Seed proyek gagal untuk tenant ${tenant.slug}: ${seeded.skippedReason ?? "alasan tidak diketahui"}.`,
        );
      }

      return {
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        actorEmail: actor.email,
        projects: seeded.projects,
        progressReports: seeded.progressReports,
      };
    });

    console.log(
      `[seed-projects:prod] complete — tenant=${result.tenantSlug} (${result.tenantName}), actor=${result.actorEmail}, projects=${result.projects}, progressReports=${result.progressReports}`,
    );
    console.log(
      "[seed-projects:prod] verifikasi: GET /api/v1/projects/published dan buka /data/project pada environment target.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("[seed-projects:prod] failed:", message);
  process.exitCode = 1;
});
