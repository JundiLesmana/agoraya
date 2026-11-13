import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  apbdBudgetItems,
  apbdBudgetPeriodValues,
  apbdEntries,
  apbdOperatorAssignments,
  tenants,
  users,
} from "../src/lib/db/schema/index.js";

type DbClient = PostgresJsDatabase<Record<string, never>>;

const ENV_FILE = ".env";

type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

interface SeedItem {
  code: string;
  programName: string;
  subactivityName: string;
  affairCode?: string;
  programCode?: string;
  activityCode?: string;
  activityName?: string;
  fundingSource?: string;
  supportingDocument?: string;
  periods: Record<Quarter, { pagu: string; realisasi: string }>;
}

interface SeedEntryInput {
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: string;
  referenceYear: number;
  metadata: {
    budgetId: string;
    datasetId: string;
    opdName: string;
    unitName: string;
    province: string;
    provinceCode: string;
    city: string;
    cityCode: string;
    budgetType: "APBD" | "APBD-P" | "Perubahan" | "Lainnya";
    initialBudget: string | null;
    revisedBudget: string | null;
    currency: "IDR";
    unit: "rupiah penuh";
    basis: "kumulatif";
    publicSummary: string;
    varianceReason: string;
    correctiveAction: string;
    responsiblePerson: string;
    sourceUrl: string;
    verificationPic: string;
    financialApprover: string;
    publicationAccess: "public" | "internal";
    datasetVersion: string;
    validatedAt: string | null;
    validationNotes: string;
  };
  items: SeedItem[];
}

const EnvSchema = z.object({
  DATABASE_URL_UNPOOLED: z.string().url(),
  PROD_APBD_SEED_CONFIRM: z.enum(["yes"]).optional(),
  PROD_APBD_SEED_TENANT_SLUG: z.string().trim().min(1).max(255).optional(),
  PROD_APBD_SEED_ACTOR_EMAIL: z.string().trim().email().optional(),
});

function getEnv() {
  if (existsSync(ENV_FILE)) {
    process.loadEnvFile(ENV_FILE);
  }
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const invalid = parsed.error.issues
      .map((issue) => `${issue.path.join(".")} (${issue.message})`)
      .join(", ");
    throw new Error(`Konfigurasi seed APBD production tidak valid: ${invalid}`);
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

function totalPagu(items: readonly SeedItem[]): string {
  let total = 0n;
  for (const item of items) total += BigInt(item.periods.Q4.pagu);
  return total.toString();
}

const QUARTERS: readonly Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

function buildSeedEntries(): SeedEntryInput[] {
  return [
    {
      agencyId: "dinas-pendidikan-kota-contoh",
      regionId: "kota-contoh",
      regionName: "Kota Contoh",
      sectorId: "education",
      referenceYear: 2024,
      metadata: {
        budgetId: "APBD-KC-EDU-2024",
        datasetId: "DS-APBD-KC-EDU-2024",
        opdName: "Dinas Pendidikan Kota Contoh",
        unitName: "Bidang Pembinaan Sekolah Dasar",
        province: "Jawa Barat",
        provinceCode: "32",
        city: "Kota Contoh",
        cityCode: "3279",
        budgetType: "APBD",
        initialBudget: "185000000000",
        revisedBudget: null,
        currency: "IDR",
        unit: "rupiah penuh",
        basis: "kumulatif",
        publicSummary:
          "Ringkasan pagu dan realisasi belanja pendidikan tahun 2024 berdasarkan input awal operator ASN pada sistem APBD.",
        varianceReason:
          "Sebagian kegiatan rehabilitasi ruang kelas mengalami pergeseran jadwal lelang pada awal tahun anggaran.",
        correctiveAction:
          "Percepatan proses kontrak dan pemantauan realisasi fisik bulanan pada triwulan berikutnya.",
        responsiblePerson: "Kepala Dinas Pendidikan Kota Contoh",
        sourceUrl: "",
        verificationPic: "Verifikator Perencanaan Pendidikan",
        financialApprover: "Pejabat Penatausahaan Keuangan",
        publicationAccess: "public",
        datasetVersion: "v1",
        validatedAt: "2024-12-20T03:00:00.000Z",
        validationNotes:
          "Data tervalidasi sesuai dokumen DPA dan laporan realisasi triwulan IV.",
      },
      items: [
        {
          code: "1.01.02.2.01.0001",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Penyediaan Gaji Pendidik dan Tenaga Kependidikan",
          fundingSource: "DAU",
          periods: {
            Q1: { pagu: "18000000000", realisasi: "17500000000" },
            Q2: { pagu: "36000000000", realisasi: "35200000000" },
            Q3: { pagu: "54000000000", realisasi: "52800000000" },
            Q4: { pagu: "72000000000", realisasi: "70100000000" },
          },
        },
        {
          code: "1.01.02.2.01.0002",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Rehabilitasi Ruang Kelas Sekolah Dasar",
          fundingSource: "DAK Fisik",
          periods: {
            Q1: { pagu: "8000000000", realisasi: "3200000000" },
            Q2: { pagu: "20000000000", realisasi: "12500000000" },
            Q3: { pagu: "34000000000", realisasi: "24800000000" },
            Q4: { pagu: "45000000000", realisasi: "41200000000" },
          },
        },
        {
          code: "1.01.02.2.01.0003",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Pengadaan Buku dan Alat Tulis Pembelajaran",
          fundingSource: "PAD",
          periods: {
            Q1: { pagu: "2500000000", realisasi: "2100000000" },
            Q2: { pagu: "6000000000", realisasi: "5400000000" },
            Q3: { pagu: "9000000000", realisasi: "8200000000" },
            Q4: { pagu: "12000000000", realisasi: "11400000000" },
          },
        },
        {
          code: "1.01.02.2.01.0004",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Peningkatan Kompetensi Guru dan Kepala Sekolah",
          fundingSource: "DAU",
          periods: {
            Q1: { pagu: "1500000000", realisasi: "1200000000" },
            Q2: { pagu: "3500000000", realisasi: "3100000000" },
            Q3: { pagu: "5500000000", realisasi: "5000000000" },
            Q4: { pagu: "8000000000", realisasi: "7400000000" },
          },
        },
        {
          code: "1.01.02.2.01.0005",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Penyediaan Sarana TIK Pembelajaran",
          fundingSource: "DAK Nonfisik",
          periods: {
            Q1: { pagu: "5000000000", realisasi: "1800000000" },
            Q2: { pagu: "14000000000", realisasi: "9600000000" },
            Q3: { pagu: "22000000000", realisasi: "17100000000" },
            Q4: { pagu: "30000000000", realisasi: "26800000000" },
          },
        },
      ],
    },
    {
      agencyId: "dinas-pendidikan-kota-contoh",
      regionId: "kota-contoh",
      regionName: "Kota Contoh",
      sectorId: "education",
      referenceYear: 2025,
      metadata: {
        budgetId: "APBD-KC-EDU-2025",
        datasetId: "DS-APBD-KC-EDU-2025",
        opdName: "Dinas Pendidikan Kota Contoh",
        unitName: "Bidang Sarana dan Prasarana Pendidikan",
        province: "Jawa Barat",
        provinceCode: "32",
        city: "Kota Contoh",
        cityCode: "3279",
        budgetType: "APBD",
        initialBudget: "198000000000",
        revisedBudget: "203500000000",
        currency: "IDR",
        unit: "rupiah penuh",
        basis: "kumulatif",
        publicSummary:
          "Publikasi pagu dan realisasi APBD urusan pendidikan 2025 yang bersumber dari input awal ASN dan telah melalui tinjauan.",
        varianceReason:
          "Penambahan pagu perubahan untuk percepatan rehabilitasi sekolah prioritas.",
        correctiveAction:
          "Pemantauan capaian fisik dan keuangan dilakukan setiap bulan bersama tim verifikasi internal.",
        responsiblePerson: "Kepala Dinas Pendidikan Kota Contoh",
        sourceUrl: "",
        verificationPic: "Tim Verifikasi APBD Pendidikan",
        financialApprover: "PPK Dinas Pendidikan",
        publicationAccess: "public",
        datasetVersion: "v2",
        validatedAt: "2025-12-18T04:00:00.000Z",
        validationNotes:
          "Nilai kumulatif Q1-Q4 sesuai rekapitulasi realisasi dan berita acara verifikasi.",
      },
      items: [
        {
          code: "1.01.02.2.01.0101",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Penyediaan Gaji dan Tunjangan Tenaga Pendidikan",
          fundingSource: "DAU",
          periods: {
            Q1: { pagu: "19500000000", realisasi: "19000000000" },
            Q2: { pagu: "39000000000", realisasi: "38100000000" },
            Q3: { pagu: "58500000000", realisasi: "57200000000" },
            Q4: { pagu: "78000000000", realisasi: "76300000000" },
          },
        },
        {
          code: "1.01.02.2.01.0102",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Pembangunan dan Rehabilitasi Ruang Belajar",
          fundingSource: "DAK Fisik",
          periods: {
            Q1: { pagu: "9000000000", realisasi: "4100000000" },
            Q2: { pagu: "22000000000", realisasi: "14600000000" },
            Q3: { pagu: "38000000000", realisasi: "28900000000" },
            Q4: { pagu: "52000000000", realisasi: "47100000000" },
          },
        },
        {
          code: "1.01.02.2.01.0103",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Penguatan Literasi dan Numerasi Peserta Didik",
          fundingSource: "PAD",
          periods: {
            Q1: { pagu: "3000000000", realisasi: "2600000000" },
            Q2: { pagu: "7000000000", realisasi: "6300000000" },
            Q3: { pagu: "11000000000", realisasi: "10100000000" },
            Q4: { pagu: "15000000000", realisasi: "14200000000" },
          },
        },
        {
          code: "1.01.02.2.01.0104",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Bantuan Operasional dan Sarana Pembelajaran",
          fundingSource: "DAU",
          periods: {
            Q1: { pagu: "4500000000", realisasi: "4200000000" },
            Q2: { pagu: "10000000000", realisasi: "9400000000" },
            Q3: { pagu: "15000000000", realisasi: "14100000000" },
            Q4: { pagu: "21000000000", realisasi: "19900000000" },
          },
        },
        {
          code: "1.01.02.2.01.0105",
          programName: "Program Pengelolaan Pendidikan",
          subactivityName: "Transformasi Digital Sekolah",
          fundingSource: "DAK Nonfisik",
          periods: {
            Q1: { pagu: "6000000000", realisasi: "2500000000" },
            Q2: { pagu: "16000000000", realisasi: "11200000000" },
            Q3: { pagu: "26000000000", realisasi: "20400000000" },
            Q4: { pagu: "37500000000", realisasi: "33800000000" },
          },
        },
      ],
    },
    {
      agencyId: "dinas-kesehatan-kota-contoh",
      regionId: "kota-contoh",
      regionName: "Kota Contoh",
      sectorId: "health",
      referenceYear: 2025,
      metadata: {
        budgetId: "APBD-KC-KES-2025",
        datasetId: "DS-APBD-KC-KES-2025",
        opdName: "Dinas Kesehatan Kota Contoh",
        unitName: "Bidang Pelayanan Kesehatan",
        province: "Jawa Barat",
        provinceCode: "32",
        city: "Kota Contoh",
        cityCode: "3279",
        budgetType: "APBD",
        initialBudget: "142000000000",
        revisedBudget: null,
        currency: "IDR",
        unit: "rupiah penuh",
        basis: "kumulatif",
        publicSummary:
          "Data pagu dan realisasi belanja kesehatan yang diinput ASN sebagai data awal publikasi APBD 2025.",
        varianceReason:
          "Realisasi alat kesehatan meningkat pada triwulan III setelah proses pengadaan selesai.",
        correctiveAction:
          "Optimalisasi distribusi obat dan alat kesehatan ke fasilitas pelayanan primer.",
        responsiblePerson: "Kepala Dinas Kesehatan Kota Contoh",
        sourceUrl: "",
        verificationPic: "Verifikator Program Kesehatan",
        financialApprover: "Bendahara Pengeluaran Dinkes",
        publicationAccess: "public",
        datasetVersion: "v1",
        validatedAt: "2025-12-19T02:30:00.000Z",
        validationNotes: "Validasi akhir dilakukan sebelum publikasi data.",
      },
      items: [
        {
          code: "1.02.01.2.01.0201",
          programName: "Program Pemenuhan Upaya Kesehatan",
          subactivityName: "Penyediaan Obat dan Perbekalan Kesehatan Puskesmas",
          fundingSource: "DAU",
          periods: {
            Q1: { pagu: "8000000000", realisasi: "7200000000" },
            Q2: { pagu: "17000000000", realisasi: "15400000000" },
            Q3: { pagu: "26000000000", realisasi: "24100000000" },
            Q4: { pagu: "36000000000", realisasi: "33400000000" },
          },
        },
        {
          code: "1.02.01.2.01.0202",
          programName: "Program Pemenuhan Upaya Kesehatan",
          subactivityName: "Pengadaan Alat Kesehatan Fasilitas Pelayanan",
          fundingSource: "DAK Fisik",
          periods: {
            Q1: { pagu: "5000000000", realisasi: "1800000000" },
            Q2: { pagu: "14000000000", realisasi: "8300000000" },
            Q3: { pagu: "24000000000", realisasi: "18600000000" },
            Q4: { pagu: "34000000000", realisasi: "30100000000" },
          },
        },
        {
          code: "1.02.01.2.01.0203",
          programName: "Program Pemenuhan Upaya Kesehatan",
          subactivityName: "Peningkatan Layanan Kesehatan Ibu dan Anak",
          fundingSource: "DAU",
          periods: {
            Q1: { pagu: "4000000000", realisasi: "3500000000" },
            Q2: { pagu: "9000000000", realisasi: "8100000000" },
            Q3: { pagu: "14000000000", realisasi: "12800000000" },
            Q4: { pagu: "20000000000", realisasi: "18600000000" },
          },
        },
        {
          code: "1.02.01.2.01.0204",
          programName: "Program Pemenuhan Upaya Kesehatan",
          subactivityName: "Pencegahan dan Pengendalian Penyakit",
          fundingSource: "PAD",
          periods: {
            Q1: { pagu: "3500000000", realisasi: "3100000000" },
            Q2: { pagu: "8000000000", realisasi: "7300000000" },
            Q3: { pagu: "12500000000", realisasi: "11600000000" },
            Q4: { pagu: "18000000000", realisasi: "16800000000" },
          },
        },
        {
          code: "1.02.01.2.01.0205",
          programName: "Program Pemenuhan Upaya Kesehatan",
          subactivityName: "Operasional dan Pemeliharaan Puskesmas",
          fundingSource: "DAU",
          periods: {
            Q1: { pagu: "5500000000", realisasi: "5200000000" },
            Q2: { pagu: "12000000000", realisasi: "11400000000" },
            Q3: { pagu: "18500000000", realisasi: "17600000000" },
            Q4: { pagu: "24000000000", realisasi: "22900000000" },
          },
        },
      ],
    },
  ];
}

async function resolveActor(
  tx: DbClient,
  tenantId: string,
  preferredEmail?: string,
) {
  const candidates = [
    preferredEmail?.toLowerCase(),
    process.env.BOOTSTRAP_APBD_EMAIL?.toLowerCase(),
    process.env.BOOTSTRAP_ASN_OPERATOR_EMAIL?.toLowerCase(),
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

async function resolveTenant(tx: DbClient, tenantSlug?: string) {
  const preferredSlugs = [
    tenantSlug,
    process.env.BOOTSTRAP_TENANT_SLUG,
    "agoraya-local-testing",
    "kota-contoh",
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

async function main() {
  const env = getEnv();
  const targetDb = redactDatabaseUrl(env.DATABASE_URL_UNPOOLED);
  const isLikelyLocal = /localhost|127\.0\.0\.1|\[::1\]|agoraya_local/i.test(
    env.DATABASE_URL_UNPOOLED,
  );

  if (!isLikelyLocal && env.PROD_APBD_SEED_CONFIRM !== "yes") {
    throw new Error(
      `Target database tampak non-lokal (${targetDb}). Set PROD_APBD_SEED_CONFIRM=yes untuk melanjutkan seed APBD production secara eksplisit.`,
    );
  }

  console.log(`[seed-apbd:prod] target=${targetDb}`);

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
    const seedEntries = buildSeedEntries();

    const result = await db.transaction(async (tx) => {
      const dbtx = tx as unknown as DbClient;
      const tenant = await resolveTenant(dbtx, env.PROD_APBD_SEED_TENANT_SLUG);
      if (!tenant) {
        throw new Error(
          "Tenant tidak ditemukan. Jalankan bootstrap/migrasi akun terlebih dahulu atau set PROD_APBD_SEED_TENANT_SLUG.",
        );
      }

      const actor = await resolveActor(
        dbtx,
        tenant.id,
        env.PROD_APBD_SEED_ACTOR_EMAIL,
      );
      if (!actor) {
        throw new Error(
          `Tidak ada user aktif pada tenant ${tenant.slug}. Jalankan bootstrap akun terlebih dahulu.`,
        );
      }

      const now = new Date();
      let seededEntries = 0;
      let seededItems = 0;
      let seededPeriods = 0;
      let seededAssignments = 0;

      for (const seed of seedEntries) {
        const [assignment] = await tx
          .insert(apbdOperatorAssignments)
          .values({
            tenantId: tenant.id,
            userId: actor.id,
            agencyId: seed.agencyId,
            regionId: seed.regionId,
            regionName: seed.regionName,
            sectorId: seed.sectorId,
          })
          .onConflictDoNothing({
            target: [
              apbdOperatorAssignments.userId,
              apbdOperatorAssignments.tenantId,
              apbdOperatorAssignments.agencyId,
              apbdOperatorAssignments.regionId,
              apbdOperatorAssignments.sectorId,
            ],
          })
          .returning({ id: apbdOperatorAssignments.id });
        if (assignment) seededAssignments += 1;

        const existing = await tx
          .select({ id: apbdEntries.id })
          .from(apbdEntries)
          .where(
            and(
              eq(apbdEntries.tenantId, tenant.id),
              eq(apbdEntries.agencyId, seed.agencyId),
              eq(apbdEntries.regionId, seed.regionId),
              eq(apbdEntries.sectorId, seed.sectorId),
              eq(apbdEntries.referenceYear, seed.referenceYear),
              eq(apbdEntries.status, "published"),
            ),
          );

        if (existing.length > 0) {
          await tx
            .delete(apbdBudgetPeriodValues)
            .where(
              and(
                eq(apbdBudgetPeriodValues.tenantId, tenant.id),
                inArray(
                  apbdBudgetPeriodValues.entryId,
                  existing.map((row) => row.id),
                ),
              ),
            );
          await tx
            .delete(apbdBudgetItems)
            .where(
              and(
                eq(apbdBudgetItems.tenantId, tenant.id),
                inArray(
                  apbdBudgetItems.entryId,
                  existing.map((row) => row.id),
                ),
              ),
            );
          await tx.delete(apbdEntries).where(
            and(
              eq(apbdEntries.tenantId, tenant.id),
              inArray(
                apbdEntries.id,
                existing.map((row) => row.id),
              ),
            ),
          );
        }

        const entryId = randomUUID();
        const publishedAt = new Date(Date.UTC(seed.referenceYear, 11, 28, 8, 0, 0));
        const recordMetadata = {
          ...seed.metadata,
          initialBudget: seed.metadata.initialBudget ?? totalPagu(seed.items),
        };

        await tx.insert(apbdEntries).values({
          id: entryId,
          tenantId: tenant.id,
          agencyId: seed.agencyId,
          regionId: seed.regionId,
          regionName: seed.regionName,
          sectorId: seed.sectorId,
          referenceYear: seed.referenceYear,
          status: "published",
          revisionOfId: null,
          sourceDatasetSubmissionId: null,
          revisionReason: "",
          recordMetadata,
          createdBy: actor.id,
          updatedBy: actor.id,
          submittedBy: actor.id,
          submittedAt: publishedAt,
          reviewedBy: actor.id,
          reviewedAt: publishedAt,
          publishedAt,
          createdAt: now,
          updatedAt: now,
        });
        seededEntries += 1;

        for (const item of seed.items) {
          const itemId = randomUUID();
          await tx.insert(apbdBudgetItems).values({
            id: itemId,
            tenantId: tenant.id,
            entryId,
            code: item.code,
            programName: item.programName,
            subactivityName: item.subactivityName,
            affairCode: item.affairCode ?? "",
            programCode: item.programCode ?? "",
            activityCode: item.activityCode ?? "",
            activityName: item.activityName ?? "",
            fundingSource: item.fundingSource ?? "",
            supportingDocument: item.supportingDocument ?? "",
            createdAt: now,
            updatedAt: now,
          });
          seededItems += 1;

          for (const quarter of QUARTERS) {
            await tx.insert(apbdBudgetPeriodValues).values({
              tenantId: tenant.id,
              entryId,
              itemId,
              periodType: "quarterly",
              periodValue: quarter,
              pagu: item.periods[quarter].pagu,
              realisasi: item.periods[quarter].realisasi,
              targetValue: null,
              targetDate: null,
              documentReference: "",
              updatedBy: actor.id,
              createdAt: now,
              updatedAt: now,
            });
            seededPeriods += 1;
          }
        }
      }

      return {
        tenantSlug: tenant.slug,
        tenantName: tenant.name,
        actorEmail: actor.email,
        entries: seededEntries,
        items: seededItems,
        periodValues: seededPeriods,
        assignments: seededAssignments,
      };
    });

    console.log(
      `[seed-apbd:prod] complete — tenant=${result.tenantSlug} (${result.tenantName}), actor=${result.actorEmail}, entries=${result.entries}, items=${result.items}, periodValues=${result.periodValues}, assignments=${result.assignments}`,
    );
    console.log(
      "[seed-apbd:prod] verifikasi: GET /api/v1/apbd/published dan buka /anggaran atau /data/anggaran pada environment target.",
    );
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error("[seed-apbd:prod] failed:", message);
  process.exitCode = 1;
});
