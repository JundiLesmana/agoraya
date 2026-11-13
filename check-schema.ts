import postgres from "postgres";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

async function main() {
  const sql = postgres("postgresql://agoraya:localdev@127.0.0.1:5432/agoraya_local");

  // Drop all tables
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  for (const t of tables) {
    await sql`DROP TABLE IF EXISTS ${sql(t.tablename)} CASCADE`;
  }
  await sql`DROP TABLE IF EXISTS drizzle._journal CASCADE`;
  await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
  console.log("All tables dropped");

  // Read and apply each migration in order
  const migrationsDir = "/home/jundi-lesmana/agoraya/db/migrations";
  const journalPath = join(migrationsDir, "meta/_journal.json");
  const journal = JSON.parse(readFileSync(journalPath, "utf-8"));

  // Sort entries by idx
  const sortedEntries = [...journal.entries].sort((a: any, b: any) => a.idx - b.idx);

  for (const entry of sortedEntries) {
    const tag = entry.tag;
    const upPath = join(migrationsDir, `${tag}.sql`);
    const downPath = join(migrationsDir, `${tag}.down.sql`);

    try {
      const upSql = readFileSync(upPath, "utf-8").trim();
      if (upSql) {
        await sql.unsafe(upSql);
        console.log(`Applied: ${tag}`);
      }
    } catch (e: any) {
      console.error(`Failed ${tag}: ${e.message?.substring(0, 100)}`);
    }
  }

  await sql.end();
  console.log("All migrations applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});