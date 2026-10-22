/**
 * Agoraya — Database seed entry point.
 *
 * Run with: `pnpm db:seed` (runs `tsx db/seed/index.ts`).
 *
 * Seeds BPS snapshots and the demo scenario. Idempotent: safe to run
 * repeatedly. Accepts an optional Drizzle instance so the reset script can
 * reuse a direct (unpooled) connection.
 */

import { db } from "../../src/lib/db/index.js";
import { seedBpsSnapshots } from "./bps-snapshot.js";
import { seedDemoScenario } from "./demo-scenario.js";

type DbClient = ReturnType<typeof db>;

export async function seedAll(dbx: DbClient = db()): Promise<{
  bpsSnapshots: number;
  tenants: number;
  users: number;
  roles: number;
  permissions: number;
  tickets: number;
  auditEvents: number;
  policies: number;
}> {
  const bpsCount = await seedBpsSnapshots(dbx);
  const scenario = await seedDemoScenario(dbx);
  return { bpsSnapshots: bpsCount, ...scenario };
}

async function main(): Promise<void> {
  const result = await seedAll();
  console.log(
    `[db:seed] complete — BPS snapshots: ${result.bpsSnapshots}, ` +
      `tenants: ${result.tenants}, users: ${result.users}, roles: ${result.roles}, ` +
      `permissions: ${result.permissions}, tickets: ${result.tickets}, ` +
      `policies: ${result.policies}, audit_events: ${result.auditEvents}`,
  );
}

if (import.meta.main) {
  main().catch((err: unknown) => {
    console.error("[db:seed] failed:", err);
    process.exit(1);
  });
}
