
export { PooledDatabase, createDatabase, getDefaultDatabase, closeDefaultDatabase } from './client';
export type { Database, Row } from './types';

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";

import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined. Copy .env.example to .env.local and set DATABASE_URL.",
  );
}

export const client = postgres(connectionString, {
  max: 10,
  connect_timeout: 10,
  idle_timeout: 20,
  max_lifetime: 60 * 30,
});

export const db: PostgresJsDatabase<typeof schema> = drizzle(client, {
  schema,
  logger: process.env.NODE_ENV === "development",
});

export async function withTransaction<T>(
  fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  return db.transaction(fn);
}

export async function closeDb(): Promise<void> {
  await client.end();
}

export { sql };
export type { PostgresJsDatabase };