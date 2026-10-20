// Agoraya — lib/db
// Database connection, query builder, and transaction support built on the
// pooled `postgres` driver (Neon-compatible).

export { PooledDatabase, createDatabase, getDefaultDatabase, closeDefaultDatabase } from './client';
export type { Database, Row } from './types';

