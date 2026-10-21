import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/db/schema.js";
import { seedAll } from "../db/seed/index.js";
import { logger } from "../src/lib/logger/logger.js";

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
    logger.info("[reset-demo] truncated all data tables — clean state");

    const result = await seedAll(adminDb);
    logger.info("[reset-demo] seeded demo data", { result });
  } finally {
    await admin.end();
  }
}

main().catch((err: unknown) => {
  console.error("[reset-demo] failed:", err);
  process.exit(1);
});
