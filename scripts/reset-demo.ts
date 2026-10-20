/**
 * Agoraya — Reset demo database to a clean, seeded state.
 *
 * Run with: `pnpm script:reset-demo` or `pnpm db:reset`.
 *
 * 1. Truncates all data tables (clean state, schema preserved).
 * 2. Re-seeds BPS snapshots and the demo scenario.
 *
 * Uses `DATABASE_URL_UNPOOLED` (direct connection) because TRUNCATE is DDL
 * and must not run through the pooled Neon connection.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema.js";
import { seedAll } from "../db/seed/index.js";

// All data tables. TRUNCATE ... CASCADE handles FK dependencies, so order here
// does not matter; the result is an empty (clean) schema.
const DATA_TABLES = [
  "audit_events",
  "ticket_audit_logs",
  "tickets",
  "user_roles",
  "role_permissions",
  "user_sessions",
  "otp_codes",
  "users",
  "roles",
  "permissions",
  "bps_snapshots",
  "tenants",
] as const;

async function main(): Promise<void> {
  const unpooled = process.env.DATABASE_URL_UNPOOLED;
  if (!unpooled) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is not defined. Set it in .env.local (direct connection) before resetting.",
    );
  }

  const admin = postgres(unpooled, { max: 5 });
  const adminDb = drizzle(admin, { schema });

  try {
    await adminDb.execute(
      sql`TRUNCATE TABLE ${sql.join(
        DATA_TABLES.map((t) => sql.identifier(t)),
        sql`, `,
      )} CASCADE`,
    );
    console.log("[reset-demo] truncated all data tables — clean state");

    const result = await seedAll(adminDb);
    console.log("[reset-demo] seeded demo data:", JSON.stringify(result));
  } finally {
    await admin.end();
  }
}

main().catch((err: unknown) => {
  console.error("[reset-demo] failed:", err);
  process.exit(1);
});
