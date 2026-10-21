// Agoraya — lib/db client
// Pooled PostgreSQL client built on the `postgres` driver (Neon-compatible).
// Connection pooling is provided by the driver (default max 10 connections).
// All queries are parameterized; `text` must be a static SQL string.

import postgres from 'postgres';
import type { Database, Row } from './types';
import { AppError, ErrorCode, DatabaseError } from '../errors';

type SqlClient = ReturnType<typeof postgres>;
type PgParam = NonNullable<Parameters<SqlClient['unsafe']>[1]> extends (infer P)[] ? P : never;

export class PooledDatabase implements Database {
  #client: SqlClient;
  #ownsPool: boolean;
  #ended = false;

  constructor(sql: SqlClient, ownsPool: boolean) {
    this.#client = sql;
    this.#ownsPool = ownsPool;
  }

  async query<T extends Row = Row>(text: string, params: readonly unknown[] = []): Promise<T[]> {
    this.#ensureOpen();
    const safeParams = params.map((p) => p as PgParam);
    const rows = await this.#client.unsafe<T[]>(text, safeParams);
    return rows;
  }

  async queryOne<T extends Row = Row>(text: string, params?: readonly unknown[]): Promise<T | null> {
    const rows = await this.query<T>(text, params ?? []);
    return rows.length > 0 ? (rows[0] as T) : null;
  }

  async transaction<T>(fn: (tx: Database) => Promise<T>): Promise<T> {
    this.#ensureOpen();
    // Transaction-scoped SQL surface is compatible with our read/query API.
    return (this.#client.begin(async (txSql) => {
      const tx = new PooledDatabase(txSql as unknown as SqlClient, false);
      return fn(tx);
    }) as unknown) as Promise<T>;
  }

  async end(): Promise<void> {
    if (!this.#ownsPool) return;
    this.#ended = true;
    await this.#client.end();
  }

  #ensureOpen(): void {
    if (this.#ended) {
      throw new AppError(ErrorCode.DATABASE_ERROR, 'Database connection is closed', {
        statusCode: 500,
        isOperational: false,
      });
    }
  }
}

/** Create a new pooled database connection for the given connection string. */
export function createDatabase(connectionString?: string): Database {
  const url = connectionString ?? process.env.DATABASE_URL;
  if (!url) {
    throw new DatabaseError('DATABASE_URL environment variable is required', {
      statusCode: 500,
      isOperational: true,
    });
  }
  const sql = postgres(url);
  return new PooledDatabase(sql, true);
}

let defaultDatabase: Database | null = null;

/** Get the default pooled database, lazily created from DATABASE_URL. */
export function getDefaultDatabase(): Database {
  if (!defaultDatabase) {
    defaultDatabase = createDatabase();
  }
  return defaultDatabase;
}

/** Close the default database pool (tests / shutdown). */
export async function closeDefaultDatabase(): Promise<void> {
  if (defaultDatabase) {
    await defaultDatabase.end();
    defaultDatabase = null;
  }
}

export type { Database, Row };

