/**
 * Agoraya — Database client (Drizzle ORM + postgres).
 *
 * Provides a single, pooled Drizzle client for server-side use plus a
 * transaction helper. The `postgres` driver manages its own connection pool,
 * which is tuned here via the `max` / `idle_timeout` / `max_lifetime` options.
 *
 * Connections:
 * - App runtime (this file): `DATABASE_URL` (pooled, Neon).
 * - Migrations / DDL: `DATABASE_URL_UNPOOLED` (direct connection) — run via
 *   `pnpm db:migrate` with `DATABASE_URL` set to the unpooled string, or via
 *   `scripts/reset-demo.ts` which uses `DATABASE_URL_UNPOOLED` explicitly.
 *
 * Never import this module from client components; it is server-only.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Copy .env.example to .env.local and set DATABASE_URL.",
  );
}

/**
 * Pooled postgres client. The `postgres` driver keeps an internal connection
 * pool; `max` bounds concurrent connections, `idle_timeout` and
 * `max_lifetime` recycle stale connections (important on serverless/Neon).
 */
export const client = postgres(connectionString, {
  max: 10,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

/**
 * Drizzle database instance bound to the foundation schema.
 * Use this for all app data access. Prefer repository modules over direct
 * usage from route handlers / server actions.
 */
export const db: PostgresJsDatabase<typeof schema> = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

/**
 * Run a callback inside a single database transaction. All writes commit
 * atomically or roll back together, which keeps audit/state transitions
 * consistent (docs/ai/ARCHITECTURE.md § State and transaction rules).
 */
export async function withTransaction<T>(
  fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}

/**
 * Close the connection pool. Mostly useful in tests and short-lived scripts.
 */
export async function closeDb(): Promise<void> {
  await client.end();
}

export { sql };
export type { PostgresJsDatabase };
