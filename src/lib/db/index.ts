export { PooledDatabase, createDatabase, getDefaultDatabase, closeDefaultDatabase } from './client';
export type { Database, Row } from './types';

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';

import * as schema from './schema/index';

let client: ReturnType<typeof postgres> | null = null;
let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined. Copy .env.example to .env.local and set DATABASE_URL.');
  }

  return connectionString;
}

export function getDb(): PostgresJsDatabase<typeof schema> {
  if (!dbInstance) {
    client = client ?? postgres(getConnectionString(), {
      max: 10,
      connect_timeout: 10,
      idle_timeout: 20,
      max_lifetime: 60 * 30,
    });

    dbInstance = drizzle(client, {
      schema,
      logger: process.env.NODE_ENV === 'development',
    });
  }

  return dbInstance;
}

export { getDb as db };

export async function withTransaction<T>(
  fn: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>,
): Promise<T> {
  return getDb().transaction(fn);
}

export async function closeDb(): Promise<void> {
  await client?.end();
  client = null;
  dbInstance = null;
}

export { sql };
export type { PostgresJsDatabase };
