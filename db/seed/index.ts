import { getDb } from "../../src/lib/db/index.js";
import { seedApbdBudget } from "./apbd-budget.js";
import { seedAsnProjects } from "./asn-projects.js";
import { seedBpsSnapshots, seedBpsStatisticsSimulated } from "./bps-snapshot.js";
import { seedDatasetCatalog } from "./dataset-catalog.js";
import { seedDemoScenario } from "./demo-scenario.js";

type DbClient = ReturnType<typeof getDb>;

export async function seedAll(dbx: DbClient = getDb()): Promise<{
  bpsSnapshots: number;
  bpsStatistics: number;
  datasetCatalog: number;
  apbdEntries: number;
  apbdItems: number;
  apbdPeriodValues: number;
  apbdAssignments: number;
  projectTenants: number;
  projects: number;
  projectProgressReports: number;
  tenants: number;
  users: number;
  roles: number;
  permissions: number;
  tickets: number;
  auditEvents: number;
  policies: number;
}> {
  const bpsCount = await seedBpsSnapshots(dbx);
  const bpsStatistics = await seedBpsStatisticsSimulated(dbx);
  const datasetCatalog = await seedDatasetCatalog(dbx);
  const scenario = await seedDemoScenario(dbx);
  const apbd = await seedApbdBudget(dbx);
  const asnProjects = await seedAsnProjects(dbx);
  return {
    bpsSnapshots: bpsCount,
    bpsStatistics,
    datasetCatalog,
    apbdEntries: apbd.entries,
    apbdItems: apbd.items,
    apbdPeriodValues: apbd.periodValues,
    apbdAssignments: apbd.assignments,
    projectTenants: asnProjects.tenants,
    projects: asnProjects.projects,
    projectProgressReports: asnProjects.progressReports,
    ...scenario,
  };
}

async function main(): Promise<void> {
  const result = await seedAll();
  console.log(
    `[db:seed] complete — BPS snapshots: ${result.bpsSnapshots}, BPS statistics: ${result.bpsStatistics}, ` +
      `tenants: ${result.tenants}, users: ${result.users}, roles: ${result.roles}, ` +
      `permissions: ${result.permissions}, tickets: ${result.tickets}, ` +
      `policies: ${result.policies}, audit_events: ${result.auditEvents}, ` +
      `dataset_catalog: ${result.datasetCatalog}, apbd entries: ${result.apbdEntries}, ` +
      `apbd items: ${result.apbdItems}, apbd period values: ${result.apbdPeriodValues}, ` +
      `projects: ${result.projects}, project reports: ${result.projectProgressReports}`,
  );
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error("[db:seed] failed:", err);
    process.exit(1);
  });
}
