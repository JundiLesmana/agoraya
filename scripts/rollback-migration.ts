/**
 * Agoraya — Rollback the most recent (or a named) migration.
 *
 * Run with: `pnpm db:rollback [<migration-name>]`
 *
 * Examples:
 *   pnpm db:rollback                    # rollback the last applied migration
 *   pnpm db:rollback 0001_initial_schema
 *
 * Executes `<name>.down.sql` from `db/migrations/` against
 * `DATABASE_URL_UNPOOLED`, then removes the entry from drizzle-kit's
 * `_journal` table so `pnpm db:migrate` treats it as pending again.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

import * as schema from "../src/lib/db/schema.js";

const MIGRATIONS_DIR = path.resolve(process.cwd(), "db/migrations");

async function main(): Promise<void> {
  const [migrationName] = process.argv.slice(2);
  const unpooled = process.env.DATABASE_URL_UNPOOLED;
  if (!unpooled) {
    throw new Error(
      "DATABASE_URL_UNPOOLED is not defined. Set it in .env.local (direct connection) before rolling back.",
    );
  }

  const client = postgres(unpooled, { max: 1 });
  const adminDb = drizzle(client, { schema });

  try {
    let name = migrationName;
    if (!name) {
      // Auto-detect the most recent applied migration from drizzle-kit's journal.
      // drizzle-orm's execute() returns the rows directly (array-like).
      const journal = await adminDb.execute(
        sql`SELECT name FROM _journal ORDER BY id DESC LIMIT 1`,
      );
      const rows = journal as unknown as Array<{ name: string }>;
      if (rows.length === 0) {
        console.log("[rollback] no migrations applied — nothing to roll back");
        return;
      }
      name = rows[0].name;
    }

    const downFile = path.join(MIGRATIONS_DIR, `${name}.down.sql`);
    // trusted source: CLI argument or the internal _journal table
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(downFile)) {
      throw new Error(`Down migration not found: ${downFile}`);
    }

    // trusted source: CLI argument or the internal _journal table
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const downSql = fs.readFileSync(downFile, "utf8");
    if (!downSql.trim()) {
      throw new Error(`Down migration is empty: ${downFile}`);
    }

    // Execute the down SQL (multiple statements are supported in one call).
    await adminDb.execute(sql.raw(downSql));

    // Remove from the journal so `pnpm db:migrate` re-applies it next time.
    await adminDb.execute(sql`DELETE FROM _journal WHERE name = ${name}`);

    console.log(`[rollback] rolled back ${name}`);
  } finally {
    await client.end();
  }
}

main().catch((err: unknown) => {
  console.error("[rollback] failed:", err);
  process.exit(1);
});
