import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
  // drizzle-kit tracks applied migrations in the `_journal` table.
  // Migration files are versioned by filename (timestamp + description).
  migrations: {
    table: "_journal",
  },
  verbose: true,
  strict: true,
});
