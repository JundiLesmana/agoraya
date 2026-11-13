import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../../src/lib/db/schema/index.js";
import {
  apbdBudgetItems,
  apbdBudgetPeriodValues,
  apbdEntries,
  apbdOperatorAssignments,
  tenants,
  users,
} from "../../src/lib/db/schema/index.js";

type Db = PostgresJsDatabase<typeof schema>;

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

interface SeedEntry {
  key: string;
  tenantSlug: string;
  actorEmail: string;
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: string;
  referenceYear: number;
  revisionReason?: string;
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

const SEED_ENTRIES: readonly SeedEntry[] = [
  {
    key: "apbd-kota-contoh-education-2024",
    tenantSlug: "agoraya-local-testing",
    actorEmail: "apbd@agoraya.test",
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
        affairCode: "1.01",
        programCode: "1.01.02",
        activityCode: "2.01",
        activityName: "Pengelolaan Pendidikan Sekolah Dasar",
        fundingSource: "DAU",
        supportingDocument: "DPA-SD-2024",
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
        affairCode: "1.01",
        programCode: "1.01.02",
        activityCode: "2.01",
        activityName: "Pengelolaan Pendidikan Sekolah Dasar",
        fundingSource: "DAK Fisik",
        supportingDocument: "Kontrak Rehab SD 2024",
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
        affairCode: "1.01",
        programCode: "1.01.02",
        activityCode: "2.01",
        activityName: "Pengelolaan Pendidikan Sekolah Dasar",
        fundingSource: "PAD",
        supportingDocument: "BA Serah Terima Buku 2024",
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
        affairCode: "1.01",
        programCode: "1.01.02",
        activityCode: "2.01",
        activityName: "Pengelolaan Pendidikan Sekolah Dasar",
        fundingSource: "DAU",
        supportingDocument: "Laporan Pelatihan Guru 2024",
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
        affairCode: "1.01",
        programCode: "1.01.02",
        activityCode: "2.01",
        activityName: "Pengelolaan Pendidikan Sekolah Dasar",
        fundingSource: "DAK Nonfisik",
        supportingDocument: "Pengadaan Chromebook 2024",
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
    key: "apbd-kota-contoh-education-2025",
    tenantSlug: "agoraya-local-testing",
    actorEmail: "apbd@agoraya.test",
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
    key: "apbd-kota-contoh-health-2025",
    tenantSlug: "agoraya-local-testing",
    actorEmail: "apbd@agoraya.test",
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
  {
    key: "apbd-demo-infrastructure-2024",
    tenantSlug: "kota-contoh",
    actorEmail: "admin@kota-contoh.demo",
    agencyId: "dinas-pupr-kota-contoh",
    regionId: "kota-contoh",
    regionName: "Kota Contoh",
    sectorId: "infrastructure",
    referenceYear: 2024,
    metadata: {
      budgetId: "APBD-KC-INFRA-2024",
      datasetId: "DS-APBD-KC-INFRA-2024",
      opdName: "Dinas Pekerjaan Umum dan Penataan Ruang",
      unitName: "Bidang Bina Marga",
      province: "Jawa Barat",
      provinceCode: "32",
      city: "Kota Contoh",
      cityCode: "3279",
      budgetType: "APBD",
      initialBudget: "156000000000",
      revisedBudget: null,
      currency: "IDR",
      unit: "rupiah penuh",
      basis: "kumulatif",
      publicSummary:
        "Data contoh publikasi APBD urusan infrastruktur yang merepresentasikan input ASN pada skenario demo.",
      varianceReason:
        "Cuaca dan penyesuaian metode kerja memengaruhi capaian fisik beberapa paket jalan.",
      correctiveAction:
        "Penjadwalan ulang pekerjaan dan penguatan pengawasan lapangan.",
      responsiblePerson: "Kepala Dinas PUPR Kota Contoh",
      sourceUrl: "",
      verificationPic: "Verifikator Infrastruktur",
      financialApprover: "PPK Bina Marga",
      publicationAccess: "public",
      datasetVersion: "v1",
      validatedAt: "2024-12-22T05:00:00.000Z",
      validationNotes: "Dataset demo untuk menampilkan data anggaran publik.",
    },
    items: [
      {
        code: "3.01.01.2.01.0301",
        programName: "Program Penyelenggaraan Jalan",
        subactivityName: "Pemeliharaan Berkala Jalan Kota",
        fundingSource: "DAU",
        periods: {
          Q1: { pagu: "6000000000", realisasi: "4800000000" },
          Q2: { pagu: "15000000000", realisasi: "12100000000" },
          Q3: { pagu: "24000000000", realisasi: "19800000000" },
          Q4: { pagu: "32000000000", realisasi: "28900000000" },
        },
      },
      {
        code: "3.01.01.2.01.0302",
        programName: "Program Penyelenggaraan Jalan",
        subactivityName: "Peningkatan Jalan Lingkungan Permukiman",
        fundingSource: "DAK Fisik",
        periods: {
          Q1: { pagu: "7000000000", realisasi: "2500000000" },
          Q2: { pagu: "18000000000", realisasi: "10900000000" },
          Q3: { pagu: "30000000000", realisasi: "22300000000" },
          Q4: { pagu: "42000000000", realisasi: "37400000000" },
        },
      },
      {
        code: "3.01.01.2.01.0303",
        programName: "Program Penyelenggaraan Drainase",
        subactivityName: "Normalisasi Saluran Drainase Perkotaan",
        fundingSource: "PAD",
        periods: {
          Q1: { pagu: "3000000000", realisasi: "2100000000" },
          Q2: { pagu: "8000000000", realisasi: "6400000000" },
          Q3: { pagu: "13000000000", realisasi: "10800000000" },
          Q4: { pagu: "18000000000", realisasi: "16100000000" },
        },
      },
      {
        code: "3.01.01.2.01.0304",
        programName: "Program Penyelenggaraan Jembatan",
        subactivityName: "Rehabilitasi Jembatan Penghubung Wilayah",
        fundingSource: "DAU",
        periods: {
          Q1: { pagu: "4000000000", realisasi: "1600000000" },
          Q2: { pagu: "11000000000", realisasi: "6900000000" },
          Q3: { pagu: "19000000000", realisasi: "14200000000" },
          Q4: { pagu: "26000000000", realisasi: "22800000000" },
        },
      },
      {
        code: "3.01.01.2.01.0305",
        programName: "Program Penataan Bangunan Gedung",
        subactivityName: "Perbaikan Fasilitas Umum dan Trotoar",
        fundingSource: "DAU",
        periods: {
          Q1: { pagu: "3500000000", realisasi: "2900000000" },
          Q2: { pagu: "9000000000", realisasi: "7800000000" },
          Q3: { pagu: "15000000000", realisasi: "13100000000" },
          Q4: { pagu: "20000000000", realisasi: "18200000000" },
        },
      },
    ],
  },
];

const QUARTERS: readonly Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

function totalPagu(items: readonly SeedItem[]): string {
  let total = 0n;
  for (const item of items) total += BigInt(item.periods.Q4.pagu);
  return total.toString();
}

export async function seedApbdBudget(dbx: Db): Promise<{
  entries: number;
  items: number;
  periodValues: number;
  assignments: number;
}> {
  const now = new Date();
  let seededEntries = 0;
  let seededItems = 0;
  let seededPeriods = 0;
  let seededAssignments = 0;

  for (const seed of SEED_ENTRIES) {
    const [tenant] = await dbx
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, seed.tenantSlug))
      .limit(1);
    if (!tenant) continue;

    const [actor] = await dbx
      .select({ id: users.id, tenantId: users.tenantId })
      .from(users)
      .where(and(eq(users.email, seed.actorEmail), eq(users.tenantId, tenant.id)))
      .limit(1);
    if (!actor) continue;

    const [assignment] = await dbx
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

    const existing = await dbx
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
      await dbx
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
      await dbx
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
      await dbx.delete(apbdEntries).where(
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

    await dbx.insert(apbdEntries).values({
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
      revisionReason: seed.revisionReason ?? "",
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
      await dbx.insert(apbdBudgetItems).values({
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
        await dbx.insert(apbdBudgetPeriodValues).values({
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
    entries: seededEntries,
    items: seededItems,
    periodValues: seededPeriods,
    assignments: seededAssignments,
  };
}
