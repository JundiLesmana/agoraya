import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../../src/lib/db/schema/index.js";
import {
  infrastructureProjects,
  projectProgressReports,
  tenants,
  users,
} from "../../src/lib/db/schema/index.js";

type Db = PostgresJsDatabase<typeof schema>;

const LOCAL_TENANT_SLUG = "agoraya-local-testing";
const DEMO_TENANT_SLUG = "kota-contoh";

type ProjectSeed = {
  externalProjectId: string;
  packageName: string;
  location: string;
  sector: string;
  contractValue: number;
  providerName: string;
  startDate: string;
  endDate: string;
  fiscalYear: number;
  initialPhysicalProgress: number;
  initialFinancialProgress: number;
  status: string;
  assignedUserEmail: string;
};

type ReportSeed = {
  projectExternalId: string;
  periodMonth: number;
  periodYear: number;
  physicalProgress: number;
  financialProgress: number;
  evaluationNotes: string;
  status: "draft" | "submitted";
  reportedByEmail: string;
};

type TenantProjectSeed = {
  tenantSlug: string;
  actorCandidates?: readonly string[];
  projects: readonly ProjectSeed[];
  reports: readonly ReportSeed[];
};

function localProjects(): readonly ProjectSeed[] {
  return [
    // ASN operator projects (2024, Bekasi/Jawa Barat context)
    {
      externalProjectId: "PROJ-2024-001",
      packageName: "Peningkatan Jalan Provinsi Ruas Cibitung",
      location: "Kabupaten Bekasi",
      sector: "infrastruktur",
      contractValue: 120_000_000_000,
      providerName: "CV Jaya Konstruksi",
      startDate: "2024-01-15",
      endDate: "2024-08-30",
      fiscalYear: 2024,
      initialPhysicalProgress: 10,
      initialFinancialProgress: 8,
      status: "completed",
      assignedUserEmail: "asn-operator@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2024-002",
      packageName: "Rehabilitasi 12 Sekolah Dasar",
      location: "Kabupaten Bogor",
      sector: "pendidikan",
      contractValue: 80_000_000_000,
      providerName: "PT Bangun Sejahtera",
      startDate: "2024-02-01",
      endDate: "2024-12-20",
      fiscalYear: 2024,
      initialPhysicalProgress: 5,
      initialFinancialProgress: 5,
      status: "ongoing",
      assignedUserEmail: "asn-operator@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2024-003",
      packageName: "Pembangunan Puskesmas Kecamatan Cibitung",
      location: "Kabupaten Bekasi",
      sector: "kesehatan",
      contractValue: 60_000_000_000,
      providerName: "PT Medika Sejahtera",
      startDate: "2024-03-01",
      endDate: "2024-11-30",
      fiscalYear: 2024,
      initialPhysicalProgress: 0,
      initialFinancialProgress: 0,
      status: "ongoing",
      assignedUserEmail: "asn-operator@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2024-004",
      packageName: "Sistem Air Bersih Permukiman",
      location: "Kabupaten Cianjur",
      sector: "infrastruktur",
      contractValue: 40_000_000_000,
      providerName: "PT Hydro Nusantara",
      startDate: "2024-04-01",
      endDate: "2024-12-31",
      fiscalYear: 2024,
      initialPhysicalProgress: 5,
      initialFinancialProgress: 4,
      status: "delayed",
      assignedUserEmail: "asn-operator@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2024-005",
      packageName: "Penguatan Kapasitas Guru dan Literasi",
      location: "Kota Bandung",
      sector: "pendidikan",
      contractValue: 25_000_000_000,
      providerName: "CV Cendekia Nusantara",
      startDate: "2024-05-01",
      endDate: "2024-12-15",
      fiscalYear: 2024,
      initialPhysicalProgress: 10,
      initialFinancialProgress: 8,
      status: "ongoing",
      assignedUserEmail: "asn-operator@agoraya.test",
    },
    // APBD projects (2025)
    {
      externalProjectId: "PROJ-2025-006",
      packageName: "Pembangunan Gedung Pelayanan Terpadu",
      location: "Kabupaten Bogor",
      sector: "infrastruktur",
      contractValue: 95_000_000_000,
      providerName: "PT Bangunan Negara",
      startDate: "2025-01-10",
      endDate: "2025-12-31",
      fiscalYear: 2025,
      initialPhysicalProgress: 10,
      initialFinancialProgress: 8,
      status: "ongoing",
      assignedUserEmail: "apbd@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2025-007",
      packageName: "Revitalisasi Pasar Rakyat dan UMKM",
      location: "Kota Bandung",
      sector: "lainnya",
      contractValue: 54_000_000_000,
      providerName: "PT Pasar Modern",
      startDate: "2025-03-01",
      endDate: "2025-11-30",
      fiscalYear: 2025,
      initialPhysicalProgress: 5,
      initialFinancialProgress: 4,
      status: "ongoing",
      assignedUserEmail: "apbd@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2025-008",
      packageName: "Peningkatan Fasilitas Layanan Kesehatan",
      location: "Kabupaten Garut",
      sector: "kesehatan",
      contractValue: 48_000_000_000,
      providerName: "PT Sarana Medika",
      startDate: "2025-02-01",
      endDate: "2025-12-20",
      fiscalYear: 2025,
      initialPhysicalProgress: 0,
      initialFinancialProgress: 0,
      status: "ongoing",
      assignedUserEmail: "apbd@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2025-009",
      packageName: "Perbaikan Drainase Perkotaan",
      location: "Kota Bandung",
      sector: "infrastruktur",
      contractValue: 35_000_000_000,
      providerName: "CV Tirta Mandiri",
      startDate: "2025-02-15",
      endDate: "2025-10-31",
      fiscalYear: 2025,
      initialPhysicalProgress: 20,
      initialFinancialProgress: 18,
      status: "completed",
      assignedUserEmail: "apbd@agoraya.test",
    },
    {
      externalProjectId: "PROJ-2025-010",
      packageName: "Pembangunan Ruang Kelas Baru",
      location: "Kabupaten Bogor",
      sector: "pendidikan",
      contractValue: 72_000_000_000,
      providerName: "PT Karya Edukasi",
      startDate: "2025-04-01",
      endDate: "2025-12-31",
      fiscalYear: 2025,
      initialPhysicalProgress: 0,
      initialFinancialProgress: 0,
      status: "delayed",
      assignedUserEmail: "apbd@agoraya.test",
    },
  ];
}

function localReports(): readonly ReportSeed[] {
  return [
    // 2024 - completed infrastructure (100%)
    {
      projectExternalId: "PROJ-2024-001",
      periodMonth: 3,
      periodYear: 2024,
      physicalProgress: 45,
      financialProgress: 40,
      evaluationNotes: "Pekerjaan struktur dan perkerasan berjalan sesuai rencana.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-001",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 80,
      financialProgress: 78,
      evaluationNotes: "Tahap pengaspalan dan marka jalan hampir selesai.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-001",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 100,
      financialProgress: 100,
      evaluationNotes: "Pekerjaan selesai dan telah serah terima pertama.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    // 2024 - ongoing education
    {
      projectExternalId: "PROJ-2024-002",
      periodMonth: 3,
      periodYear: 2024,
      physicalProgress: 25,
      financialProgress: 20,
      evaluationNotes: "Perbaikan ruang kelas tahap awal selesai pada 3 sekolah.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-002",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 50,
      financialProgress: 45,
      evaluationNotes: "Rehabilitasi berjalan pada 6 dari 12 sekolah.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-002",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 75,
      financialProgress: 70,
      evaluationNotes: "9 sekolah selesai, 3 sekolah dalam tahap akhir.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    // 2024 - ongoing health
    {
      projectExternalId: "PROJ-2024-003",
      periodMonth: 3,
      periodYear: 2024,
      physicalProgress: 20,
      financialProgress: 15,
      evaluationNotes: "Pekerjaan pondasi dan struktur bawah dimulai.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-003",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 40,
      financialProgress: 35,
      evaluationNotes: "Struktur lantai dan dinding utama selesai 40%.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-003",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 60,
      financialProgress: 55,
      evaluationNotes: "Pekerjaan arsitektur dan instalasi berjalan.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    // 2024 - delayed infrastructure
    {
      projectExternalId: "PROJ-2024-004",
      periodMonth: 3,
      periodYear: 2024,
      physicalProgress: 12,
      financialProgress: 10,
      evaluationNotes: "Penyesuaian desain akibat kondisi medan.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-004",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 22,
      financialProgress: 18,
      evaluationNotes: "Pengadaan pipa terlambat dari jadwal awal.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-004",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 35,
      financialProgress: 30,
      evaluationNotes: "Pekerjaan jaringan dilanjutkan dengan percepatan terbatas.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    // 2024 - ongoing education (other location)
    {
      projectExternalId: "PROJ-2024-005",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 40,
      financialProgress: 38,
      evaluationNotes: "Pelatihan tahap 1 dan 2 selesai dilaksanakan.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2024-005",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 70,
      financialProgress: 66,
      evaluationNotes: "Capaian peserta dan distribusi materi mencapai target triwulan III.",
      status: "submitted",
      reportedByEmail: "asn-operator@agoraya.test",
    },
    // 2025 - ongoing infrastructure
    {
      projectExternalId: "PROJ-2025-006",
      periodMonth: 3,
      periodYear: 2025,
      physicalProgress: 25,
      financialProgress: 22,
      evaluationNotes: "Pekerjaan pondasi dan struktur awal selesai.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-006",
      periodMonth: 6,
      periodYear: 2025,
      physicalProgress: 50,
      financialProgress: 46,
      evaluationNotes: "Struktur bangunan utama mencapai 50%.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-006",
      periodMonth: 9,
      periodYear: 2025,
      physicalProgress: 70,
      financialProgress: 66,
      evaluationNotes: "Pekerjaan arsitektur dan MEP berjalan paralel.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    // 2025 - ongoing lainnya
    {
      projectExternalId: "PROJ-2025-007",
      periodMonth: 3,
      periodYear: 2025,
      physicalProgress: 20,
      financialProgress: 18,
      evaluationNotes: "Penataan zona pedagang dan renovasi awal dimulai.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-007",
      periodMonth: 6,
      periodYear: 2025,
      physicalProgress: 45,
      financialProgress: 42,
      evaluationNotes: "Revitalisasi kios dan utilitas dasar mencapai 45%.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-007",
      periodMonth: 9,
      periodYear: 2025,
      physicalProgress: 65,
      financialProgress: 60,
      evaluationNotes: "Penataan area parkir dan fasilitas pendukung berjalan.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    // 2025 - ongoing health
    {
      projectExternalId: "PROJ-2025-008",
      periodMonth: 3,
      periodYear: 2025,
      physicalProgress: 15,
      financialProgress: 12,
      evaluationNotes: "Pengadaan peralatan medis tahap awal.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-008",
      periodMonth: 6,
      periodYear: 2025,
      physicalProgress: 38,
      financialProgress: 34,
      evaluationNotes: "Peningkatan ruang layanan dan instalasi alat kesehatan.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-008",
      periodMonth: 9,
      periodYear: 2025,
      physicalProgress: 58,
      financialProgress: 54,
      evaluationNotes: "Sebagian fasilitas mulai beroperasi bertahap.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    // 2025 - completed infrastructure
    {
      projectExternalId: "PROJ-2025-009",
      periodMonth: 3,
      periodYear: 2025,
      physicalProgress: 45,
      financialProgress: 42,
      evaluationNotes: "Pekerjaan saluran utama pada kawasan prioritas selesai.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-009",
      periodMonth: 6,
      periodYear: 2025,
      physicalProgress: 80,
      financialProgress: 76,
      evaluationNotes: "Perbaikan drainase sebagian besar ruas selesai.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-009",
      periodMonth: 9,
      periodYear: 2025,
      physicalProgress: 100,
      financialProgress: 95,
      evaluationNotes: "Pekerjaan fisik selesai, administrasi akhir berjalan.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    // 2025 - delayed education
    {
      projectExternalId: "PROJ-2025-010",
      periodMonth: 6,
      periodYear: 2025,
      physicalProgress: 15,
      financialProgress: 12,
      evaluationNotes: "Keterlambatan proses lelang memengaruhi mobilisasi.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
    {
      projectExternalId: "PROJ-2025-010",
      periodMonth: 9,
      periodYear: 2025,
      physicalProgress: 30,
      financialProgress: 26,
      evaluationNotes: "Pekerjaan pondasi dimulai dengan jadwal penyesuaian.",
      status: "submitted",
      reportedByEmail: "apbd@agoraya.test",
    },
  ];
}

function demoProjects(actorEmail: string): readonly ProjectSeed[] {
  return [
    {
      externalProjectId: "DEMO-PROJ-2024-001",
      packageName: "Peningkatan Jalan Lingkungan Kota Contoh",
      location: "Kota Contoh",
      sector: "infrastruktur",
      contractValue: 42_000_000_000,
      providerName: "CV Karya Infrastruktur",
      startDate: "2024-02-01",
      endDate: "2024-10-31",
      fiscalYear: 2024,
      initialPhysicalProgress: 10,
      initialFinancialProgress: 8,
      status: "completed",
      assignedUserEmail: actorEmail,
    },
    {
      externalProjectId: "DEMO-PROJ-2024-002",
      packageName: "Rehabilitasi Puskesmas Pembantu",
      location: "Kota Contoh",
      sector: "kesehatan",
      contractValue: 28_000_000_000,
      providerName: "PT Sehat Mandiri",
      startDate: "2024-03-01",
      endDate: "2024-12-15",
      fiscalYear: 2024,
      initialPhysicalProgress: 5,
      initialFinancialProgress: 5,
      status: "ongoing",
      assignedUserEmail: actorEmail,
    },
    {
      externalProjectId: "DEMO-PROJ-2024-003",
      packageName: "Revitalisasi Perpustakaan Sekolah",
      location: "Kota Contoh",
      sector: "pendidikan",
      contractValue: 18_000_000_000,
      providerName: "CV Edukasi Prima",
      startDate: "2024-04-01",
      endDate: "2024-12-31",
      fiscalYear: 2024,
      initialPhysicalProgress: 0,
      initialFinancialProgress: 0,
      status: "delayed",
      assignedUserEmail: actorEmail,
    },
  ];
}

function demoReports(actorEmail: string): readonly ReportSeed[] {
  return [
    {
      projectExternalId: "DEMO-PROJ-2024-001",
      periodMonth: 3,
      periodYear: 2024,
      physicalProgress: 40,
      financialProgress: 38,
      evaluationNotes: "Pekerjaan pengaspalan tahap awal selesai.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
    {
      projectExternalId: "DEMO-PROJ-2024-001",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 75,
      financialProgress: 72,
      evaluationNotes: "Mayoritas ruas telah selesai dikerjakan.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
    {
      projectExternalId: "DEMO-PROJ-2024-001",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 100,
      financialProgress: 98,
      evaluationNotes: "Pekerjaan fisik selesai dan siap digunakan.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
    {
      projectExternalId: "DEMO-PROJ-2024-002",
      periodMonth: 3,
      periodYear: 2024,
      physicalProgress: 20,
      financialProgress: 18,
      evaluationNotes: "Perbaikan ruang tunggu dan administrasi dimulai.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
    {
      projectExternalId: "DEMO-PROJ-2024-002",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 45,
      financialProgress: 42,
      evaluationNotes: "Peningkatan fasilitas layanan berjalan sesuai rencana.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
    {
      projectExternalId: "DEMO-PROJ-2024-002",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 65,
      financialProgress: 60,
      evaluationNotes: "Instalasi peralatan dan perbaikan ruang tindakan berlanjut.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
    {
      projectExternalId: "DEMO-PROJ-2024-003",
      periodMonth: 6,
      periodYear: 2024,
      physicalProgress: 15,
      financialProgress: 12,
      evaluationNotes: "Pengadaan bahan mengalami keterlambatan.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
    {
      projectExternalId: "DEMO-PROJ-2024-003",
      periodMonth: 9,
      periodYear: 2024,
      physicalProgress: 30,
      financialProgress: 25,
      evaluationNotes: "Pekerjaan renovasi dilanjutkan dengan penyesuaian jadwal.",
      status: "submitted",
      reportedByEmail: actorEmail,
    },
  ];
}

const TENANT_PROJECT_SEEDS: readonly TenantProjectSeed[] = [
  {
    tenantSlug: LOCAL_TENANT_SLUG,
    actorCandidates: ["asn-operator@agoraya.test", "apbd@agoraya.test"],
    projects: localProjects(),
    reports: localReports(),
  },
  {
    tenantSlug: DEMO_TENANT_SLUG,
    actorCandidates: ["admin@kota-contoh.demo"],
    projects: demoProjects("admin@kota-contoh.demo"),
    reports: demoReports("admin@kota-contoh.demo"),
  },
];

async function resolveUserInTenant(
  dbx: Db,
  tenantId: string,
  email: string,
): Promise<{ id: string } | null> {
  const [user] = await dbx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.email, email), eq(users.tenantId, tenantId)))
    .limit(1);
  return user ?? null;
}

async function resolveFallbackUser(
  dbx: Db,
  tenantId: string,
): Promise<{ id: string } | null> {
  const [user] = await dbx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.tenantId, tenantId), eq(users.status, "active")))
    .limit(1);
  return user ?? null;
}

export async function seedTenantAsnProjects(
  dbx: Db,
  tenantSlug: string,
  projects: readonly ProjectSeed[],
  reports: readonly ReportSeed[],
  actorCandidates: readonly string[] = [],
): Promise<{
  tenantSlug: string;
  seeded: boolean;
  projects: number;
  progressReports: number;
  skippedReason?: string;
}> {
  const [tenant] = await dbx
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, tenantSlug))
    .limit(1);

  if (!tenant) {
    return {
      tenantSlug,
      seeded: false,
      projects: 0,
      progressReports: 0,
      skippedReason: "tenant tidak ditemukan",
    };
  }

  const userByEmail = new Map<string, string>();
  const neededEmails = new Set<string>([
    ...projects.map((project) => project.assignedUserEmail),
    ...reports.map((report) => report.reportedByEmail),
    ...actorCandidates,
  ]);
  for (const email of neededEmails) {
    const user = await resolveUserInTenant(dbx, tenant.id, email);
    if (user) userByEmail.set(email, user.id);
  }

  const fallback = await resolveFallbackUser(dbx, tenant.id);
  const resolveActor = (email: string): string | null =>
    userByEmail.get(email) ?? fallback?.id ?? null;

  if (!fallback && userByEmail.size === 0) {
    return {
      tenantSlug,
      seeded: false,
      projects: 0,
      progressReports: 0,
      skippedReason: "tidak ada user aktif pada tenant",
    };
  }

  const now = new Date();
  let seededProjects = 0;

  for (const project of projects) {
    const assignedUserId = resolveActor(project.assignedUserEmail);
    if (!assignedUserId) continue;

    await dbx
      .insert(infrastructureProjects)
      .values({
        id: randomUUID(),
        tenantId: tenant.id,
        assignedUserId,
        externalProjectId: project.externalProjectId,
        packageName: project.packageName,
        location: project.location,
        sector: project.sector,
        contractValue: project.contractValue,
        providerName: project.providerName,
        startDate: project.startDate,
        endDate: project.endDate,
        fiscalYear: project.fiscalYear,
        initialPhysicalProgress: project.initialPhysicalProgress,
        initialFinancialProgress: project.initialFinancialProgress,
        status: project.status,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          infrastructureProjects.tenantId,
          infrastructureProjects.externalProjectId,
        ],
        set: {
          assignedUserId,
          packageName: project.packageName,
          location: project.location,
          sector: project.sector,
          contractValue: project.contractValue,
          providerName: project.providerName,
          startDate: project.startDate,
          endDate: project.endDate,
          fiscalYear: project.fiscalYear,
          initialPhysicalProgress: project.initialPhysicalProgress,
          initialFinancialProgress: project.initialFinancialProgress,
          status: project.status,
          updatedAt: now,
        },
      });
    seededProjects += 1;
  }

  const projectIdByExternal = new Map<string, string>();
  for (const project of projects) {
    const [dbProject] = await dbx
      .select({ id: infrastructureProjects.id })
      .from(infrastructureProjects)
      .where(
        and(
          eq(infrastructureProjects.tenantId, tenant.id),
          eq(infrastructureProjects.externalProjectId, project.externalProjectId),
        ),
      )
      .limit(1);
    if (dbProject) projectIdByExternal.set(project.externalProjectId, dbProject.id);
  }

  let seededReports = 0;
  for (const report of reports) {
    const projectId = projectIdByExternal.get(report.projectExternalId);
    const reportedBy = resolveActor(report.reportedByEmail);
    if (!projectId || !reportedBy) continue;

    await dbx
      .insert(projectProgressReports)
      .values({
        id: randomUUID(),
        tenantId: tenant.id,
        projectId,
        reportedBy,
        periodMonth: report.periodMonth,
        periodYear: report.periodYear,
        physicalProgress: report.physicalProgress,
        financialProgress: report.financialProgress,
        evaluationNotes: report.evaluationNotes,
        status: report.status,
        submittedAt: report.status === "submitted" ? now : null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [
          projectProgressReports.projectId,
          projectProgressReports.periodYear,
          projectProgressReports.periodMonth,
        ],
        set: {
          reportedBy,
          physicalProgress: report.physicalProgress,
          financialProgress: report.financialProgress,
          evaluationNotes: report.evaluationNotes,
          status: report.status,
          submittedAt: report.status === "submitted" ? now : null,
          updatedAt: now,
        },
      });
    seededReports += 1;
  }

  return {
    tenantSlug,
    seeded: true,
    projects: seededProjects,
    progressReports: seededReports,
  };
}

/**
 * Seed ASN infrastructure projects and progress reports for local/demo tenants.
 * Idempotent and safe to re-run (upserts by tenant+externalProjectId and project+period).
 */
export async function seedAsnProjects(
  dbx: Db,
): Promise<{
  projects: number;
  progressReports: number;
  tenants: number;
}> {
  let projects = 0;
  let progressReports = 0;
  let seededTenants = 0;

  for (const seed of TENANT_PROJECT_SEEDS) {
    const result = await seedTenantAsnProjects(
      dbx,
      seed.tenantSlug,
      seed.projects,
      seed.reports,
      seed.actorCandidates,
    );
    projects += result.projects;
    progressReports += result.progressReports;
    if (result.seeded) seededTenants += 1;
  }

  return { projects, progressReports, tenants: seededTenants };
}

export function getDefaultProjectSeeds(): readonly TenantProjectSeed[] {
  return TENANT_PROJECT_SEEDS;
}

async function main(): Promise<void> {
  const { getDb } = await import("../../src/lib/db/index.js");
  const dbx = getDb();
  const result = await seedAsnProjects(dbx);
  console.log(
    `[seed:asn-projects] complete — tenants: ${result.tenants}, projects: ${result.projects}, progressReports: ${result.progressReports}`,
  );
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error("[seed:asn-projects] failed:", err);
    process.exit(1);
  });
}