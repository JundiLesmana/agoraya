import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq } from "drizzle-orm";
import { tenants } from "../src/lib/db/schema/foundation.js";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL_UNPOOLED atau DATABASE_URL harus diatur. Salin .env.example ke .env.local.",
    );
  }

  const client = postgres(connectionString, { max: 1, connect_timeout: 10 });
  try {
    const database = drizzle(client);
    const rows = await database
      .select({ id: tenants.id, name: tenants.name, slug: tenants.slug, status: tenants.status })
      .from(tenants)
      .orderBy(tenants.slug);

    if (!rows.length) {
      console.log("Tidak ada tenant ditemukan di database.");
      return;
    }

    console.log("Daftar tenant (pilih UUID untuk REPORTING_TENANT_ID):");
    for (const row of rows) {
      console.log(
        `  ${row.id}  slug=${row.slug}  name=${row.name}  status=${row.status}`,
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((error: unknown) => {
  console.error("Gagal memuat daftar tenant:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});