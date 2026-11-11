import { randomUUID } from "crypto";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import type * as schema from "../../src/lib/db/schema/index.js";
import {
  infrastructureProjects,
  projectProgressReports,
  tenants,
  users,
} from "../../src/lib/db/schema/index.js";
import type { projectProgressStatusEnum } from "../../src/lib/db/schema/enums.ts";

const now = new Date();

// Get the local testing tenant
const LOCAL_TENANT_SLUG = "agoraya-local-testing";

// Project seeds assigned to ASN operator and APBD
const PROJECT_SEEDS: Array<{
  id: string;
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
}> = [
  // Projects for ASN Operator
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-001",
    packageName: "Pembangunan Jalan Raya Desa Sukamaju",
    location: "Desa Sukamaju, Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Pekerjaan Umum",
    contractValue: 2500000000,
    providerName: "CV Jaya Konstruksi",
    startDate: "2024-01-15",
    endDate: "2024-12-31",
    fiscalYear: 2024,
    initialPhysicalProgress: 15,
    initialFinancialProgress: 10,
    status: "ongoing",
    assignedUserEmail: "asn-operator@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-002",
    packageName: "Renovasi SDN 01 Cibitung",
    location: "SDN 01 Cibitung, Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Pendidikan",
    contractValue: 1800000000,
    providerName: "PT Bangun Sejahtera",
    startDate: "2024-02-01",
    endDate: "2024-11-30",
    fiscalYear: 2024,
    initialPhysicalProgress: 5,
    initialFinancialProgress: 5,
    status: "ongoing",
    assignedUserEmail: "asn-operator@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-003",
    packageName: "Pembangunan Posyandu Desa Mekar Jaya",
    location: "Desa Mekar Jaya, Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Kesehatan",
    contractValue: 950000000,
    providerName: "CV Mitra Bangun",
    startDate: "2024-03-01",
    endDate: "2024-10-31",
    fiscalYear: 2024,
    initialPhysicalProgress: 0,
    initialFinancialProgress: 0,
    status: "ongoing",
    assignedUserEmail: "asn-operator@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-004",
    packageName: "Normalisasi Saluran Drainase Kecamatan Cibitung",
    location: "Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Pekerjaan Umum",
    contractValue: 3200000000,
    providerName: "PT Hydro Nusantara",
    startDate: "2024-04-01",
    endDate: "2024-12-31",
    fiscalYear: 2024,
    initialPhysicalProgress: 20,
    initialFinancialProgress: 15,
    status: "ongoing",
    assignedUserEmail: "asn-operator@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-005",
    packageName: "Pembangunan Jembatan Desa Cibuntu",
    location: "Desa Cibuntu, Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Pekerjaan Umum",
    contractValue: 1200000000,
    providerName: "CV Jembatan Nusantara",
    startDate: "2024-05-01",
    endDate: "2024-12-15",
    fiscalYear: 2024,
    initialPhysicalProgress: 10,
    initialFinancialProgress: 8,
    status: "ongoing",
    assignedUserEmail: "asn-operator@agoraya.test",
  },
  // Projects for APBD (assigned to APBD user)
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-006",
    packageName: "Pembangunan Gedung Kantor Kecamatan Cibitung",
    location: "Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Pemerintahan",
    contractValue: 4500000000,
    providerName: "PT Bangunan Negara",
    startDate: "2024-01-10",
    endDate: "2024-12-31",
    fiscalYear: 2024,
    initialPhysicalProgress: 25,
    initialFinancialProgress: 20,
    status: "ongoing",
    assignedUserEmail: "apbd@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-007",
    packageName: "Revitalisasi Pasar Tradisional Cibitung",
    location: "Pasar Cibitung, Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Ekonomi",
    contractValue: 2800000000,
    providerName: "PT Pasar Modern",
    startDate: "2024-03-01",
    endDate: "2024-11-30",
    fiscalYear: 2024,
    initialPhysicalProgress: 10,
    initialFinancialProgress: 8,
    status: "ongoing",
    assignedUserEmail: "apbd@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-008",
    packageName: "Pembangunan Taman Kota Cibitung",
    location: "Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Lingkungan Hidup",
    contractValue: 1500000000,
    providerName: "CV Green City",
    startDate: "2024-04-01",
    endDate: "2024-10-31",
    fiscalYear: 2024,
    initialPhysicalProgress: 5,
    initialFinancialProgress: 5,
    status: "ongoing",
    assignedUserEmail: "apbd@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-009",
    packageName: "Peningkatan Jalan Akses Desa Cibuntu",
    location: "Desa Cibuntu, Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Pekerjaan Umum",
    contractValue: 2100000000,
    providerName: "CV Jalan Raya",
    startDate: "2024-02-15",
    endDate: "2024-12-20",
    fiscalYear: 2024,
    initialPhysicalProgress: 30,
    initialFinancialProgress: 25,
    status: "ongoing",
    assignedUserEmail: "apbd@agoraya.test",
  },
  {
    id: randomUUID(),
    externalProjectId: "PROJ-2024-010",
    packageName: "Pembangunan Perlengkapan Puskesmas Cibitung",
    location: "Puskesmas Cibitung, Kecamatan Cibitung, Bekasi, Jawa Barat",
    sector: "Kesehatan",
    contractValue: 1800000000,
    providerName: "PT Medika Sejahtera",
    startDate: "2024-05-01",
    endDate: "2024-12-31",
    fiscalYear: 2024,
    initialPhysicalProgress: 0,
    initialFinancialProgress: 0,
    status: "ongoing",
    assignedUserEmail: "apbd@agoraya.test",
  },
];

// Progress report seeds (submitted reports for some projects)
const PROGRESS_REPORT_SEEDS: Array<{
  id: string;
  projectExternalId: string;
  periodMonth: number;
  periodYear: number;
  physicalProgress: number;
  financialProgress: number;
  evaluationNotes: string;
  status: "draft" | "submitted";
  reportedByEmail: string;
}> = [
  // Reports for ASN Operator projects
  {
    id: randomUUID(),
    projectExternalId: "PROJ-2024-001",
    periodMonth: 1,
    periodYear: 2024,
    physicalProgress: 25,
    financialProgress: 18,
    evaluationNotes: "Pekerjaan persiapan lahan dan pondasi selesai. Pengecoran kolom dimulai minggu depan.",
    status: "submitted",
    reportedByEmail: "asn-operator@agoraya.test",
  },
  {
    id: randomUUID(),
    projectExternalId: "PROJ-2024-001",
    periodMonth: 2,
    periodYear: 2024,
    physicalProgress: 35,
    financialProgress: 28,
    evaluationNotes: "Pengecoran kolom lantai 1 selesai 80%. Pemasangan besi tulangan lantai 2 dimulai.",
    status: "submitted",
    reportedByEmail: "asn-operator@agoraya.test",
  },
  {
    id: randomUUID(),
    projectExternalId: "PROJ-2024-002",
    periodMonth: 1,
    periodYear: 2024,
    physicalProgress: 15,
    financialProgress: 12,
    evaluationNotes: "Survey lokasi dan pengukuran selesai. Persiapan material dimulai.",
    status: "submitted",
    reportedByEmail: "asn-operator@agoraya.test",
  },
  {
    id: randomUUID(),
    projectExternalId: "PROJ-2024-004",
    periodMonth: 1,
    periodYear: 2024,
    physicalProgress: 30,
    financialProgress: 22,
    evaluationNotes: "Normalisasi saluran utama selesai 60%. Pembersihan lumpur dan sedimen berlanjut.",
    status: "submitted",
    reportedByEmail: "asn-operator@agoraya.test",
  },
  // Reports for APBD projects
  {
    id: randomUUID(),
    projectExternalId: "PROJ-2024-006",
    periodMonth: 1,
    periodYear: 2024,
    physicalProgress: 35,
    financialProgress: 28,
    evaluationNotes: "Pekerjaan pondasi dan struktur bawah selesai. Pengecoran kolom lantai 1 dimulai.",
    status: "submitted",
    reportedByEmail: "apbd@agoraya.test",
  },
  {
    id: randomUUID(),
    projectExternalId: "PROJ-2024-007",
    periodMonth: 1,
    periodYear: 2024,
    physicalProgress: 20,
    financialProgress: 15,
    evaluationNotes: "Demolisi bangunan lama selesai. Persiapan pondasi baru dimulai.",
    status: "submitted",
    reportedByEmail: "apbd@agoraya.test",
  },
  {
    id: randomUUID(),
    projectExternalId: "PROJ-2024-009",
    periodMonth: 1,
    periodYear: 2024,
    physicalProgress: 40,
    financialProgress: 35,
    evaluationNotes: "Pengerasan badan jalan selesai 70%. Pemasangan saluran samping jalan dimulai.",
    status: "submitted",
    reportedByEmail: "apbd@agoraya.test",
  },
];

/**
 * Seed ASN infrastructure projects and progress reports.
 * Assigns projects to the ASN operator and APBD users for testing prioritization flow.
 */
export async function seedAsnProjects(
  dbx: PostgresJsDatabase<typeof schema>,
): Promise<{
  projects: number;
  progressReports: number;
}> {
  // Get the local testing tenant
  const [tenant] = await dbx
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.slug, LOCAL_TENANT_SLUG))
    .limit(1);

  if (!tenant) {
    throw new Error(`Tenant ${LOCAL_TENANT_SLUG} tidak ditemukan. Jalankan seed lokal terlebih dahulu.`);
  }

  // Get the ASN operator user
  const [asnOperator] = await dbx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "asn-operator@agoraya.test"))
    .limit(1);

  if (!asnOperator) {
    throw new Error("User asn-operator@agoraya.test tidak ditemukan. Jalankan seed akun lokal terlebih dahulu.");
  }

  // Get the APBD user
  const [apbdUser] = await dbx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, "apbd@agoraya.test"))
    .limit(1);

  if (!apbdUser) {
    throw new Error("User apbd@agoraya.test tidak ditemukan. Jalankan seed akun lokal terlebih dahulu.");
  }

  // Map email to user ID
  const userByEmail = new Map([
    ["asn-operator@agoraya.test", asnOperator.id],
    ["apbd@agoraya.test", apbdUser.id],
  ]);

  // Seed infrastructure projects
  for (const project of PROJECT_SEEDS) {
    const assignedUserId = userByEmail.get(project.assignedUserEmail);
    if (!assignedUserId) {
      throw new Error(`User ${project.assignedUserEmail} tidak ditemukan untuk proyek ${project.packageName}`);
    }

    await dbx
      .insert(infrastructureProjects)
      .values({
        id: project.id,
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
        target: [infrastructureProjects.tenantId, infrastructureProjects.externalProjectId],
        set: {
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
  }

  // Map externalProjectId to project id for progress reports
  const projectMap = new Map<string, string>();
  for (const project of PROJECT_SEEDS) {
    const [dbProject] = await dbx
      .select({ id: infrastructureProjects.id })
      .from(infrastructureProjects)
      .where(
        eq(infrastructureProjects.externalProjectId, project.externalProjectId)
      )
      .limit(1);
    if (dbProject) {
      projectMap.set(project.externalProjectId, dbProject.id);
    }
  }

  // Seed progress reports
  for (const report of PROGRESS_REPORT_SEEDS) {
    const projectId = projectMap.get(report.projectExternalId);
    if (!projectId) continue;

    const [reporter] = await dbx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, report.reportedByEmail))
      .limit(1);

    if (!reporter) continue;

    await dbx
      .insert(projectProgressReports)
      .values({
        id: report.id,
        tenantId: tenant.id,
        projectId,
        reportedBy: reporter.id,
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
        target: [projectProgressReports.projectId, projectProgressReports.periodYear, projectProgressReports.periodMonth],
        set: {
          physicalProgress: report.physicalProgress,
          financialProgress: report.financialProgress,
          evaluationNotes: report.evaluationNotes,
          status: report.status,
          submittedAt: report.status === "submitted" ? now : null,
          updatedAt: now,
        },
      });
  }

  return {
    projects: PROJECT_SEEDS.length,
    progressReports: PROGRESS_REPORT_SEEDS.length,
  };
}

async function main(): Promise<void> {
  const { getDb } = await import("../../src/lib/db/index.js");
  const dbx = getDb();
  const result = await seedAsnProjects(dbx);
  console.log(`[seed:asn-projects] complete — projects: ${result.projects}, progressReports: ${result.progressReports}`);
}

main().catch((err: unknown) => {
  console.error("[seed:asn-projects] failed:", err);
  process.exit(1);
});