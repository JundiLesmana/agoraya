import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://agoraya:localdev@localhost:5432/agoraya_local",
  },
  migrations: {
    table: "_journal",
  },
  verbose: true,
  strict: false,
});
