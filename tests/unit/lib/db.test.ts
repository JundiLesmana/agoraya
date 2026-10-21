import { describe, it, expect, afterEach, vi } from 'vitest';
import type { Mock } from 'vitest';
import { type Sql } from 'postgres';
import {
  PooledDatabase,
  createDatabase,
  getDefaultDatabase,
  closeDefaultDatabase,
  type Database,
} from '@/lib/db/client';
import { DatabaseError } from '@/lib/errors';

type MockedSqlClient = Sql & { unsafe: Mock; begin: Mock; end: Mock };

function mockSqlClient(): MockedSqlClient {
  const unsafe = vi.fn().mockResolvedValue([]);
  return {
    unsafe,
    begin: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  } as unknown as MockedSqlClient;
}

describe('lib/db', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    // Reset default database singleton so tests are isolated
    void closeDefaultDatabase();
  });

  describe('PooledDatabase', () => {
    it('executes parameterized queries and returns rows', async () => {
      const sql = mockSqlClient();
      const rows = [{ id: 1, name: 'a' }];
      sql.unsafe.mockResolvedValue(rows);
      const db = new PooledDatabase(sql, true);

      const result = await db.query<{ id: number; name: string }>('SELECT * FROM users WHERE id = $1', [1]);
      expect(sql.unsafe).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result).toEqual(rows);
    });

    it('queryOne returns null when no rows', async () => {
      const sql = mockSqlClient();
      sql.unsafe.mockResolvedValue([]);
      const db = new PooledDatabase(sql, true);

      const result = await db.queryOne<{ id: number }>('SELECT * FROM users WHERE id = $1', [999]);
      expect(result).toBeNull();
    });

    it('queryOne returns first row when present', async () => {
      const sql = mockSqlClient();
      sql.unsafe.mockResolvedValue([{ id: 5 }]);
      const db = new PooledDatabase(sql, true);

      const result = await db.queryOne<{ id: number }>('SELECT * FROM users WHERE id = $1', [5]);
      expect(result).toEqual({ id: 5 });
    });

    it('runs a transaction with a transaction-scoped client', async () => {
      const sql = mockSqlClient();
      const txSql = mockSqlClient();
      txSql.unsafe.mockResolvedValue([{ id: 1 }]);
      const beginMock = vi.fn().mockImplementation(async (cb: (sql: unknown) => unknown) => cb(txSql));
      sql.begin = beginMock;

      const db = new PooledDatabase(sql, true);

      let txUsed = false;
      await db.transaction(async (tx: Database) => {
        const row = await tx.queryOne<{ id: number }>('SELECT 1');
        txUsed = row?.id === 1;
      });
      expect(beginMock).toHaveBeenCalledTimes(1);
      expect(txUsed).toBe(true);
    });

    it('end closes pool only when owner', async () => {
      const sql = mockSqlClient();
      const endSpy = vi.fn().mockResolvedValue(undefined);
      sql.end = endSpy;
      const db = new PooledDatabase(sql, true);

      await db.end();
      expect(endSpy).toHaveBeenCalledTimes(1);

      // Non-owner: end is a no-op
      const nonOwner = new PooledDatabase(sql, false);
      await nonOwner.end();
      expect(endSpy).toHaveBeenCalledTimes(1); // unchanged
    });

    it('throws when used after close', async () => {
      const sql = mockSqlClient();
      const db = new PooledDatabase(sql, true);
      await db.end();
      await expect(db.query('SELECT 1')).rejects.toThrow(/Database connection is closed/);
    });
  });

  describe('createDatabase / getDefaultDatabase', () => {
    const origUrl = process.env.DATABASE_URL;

    afterEach(() => {
      process.env.DATABASE_URL = origUrl;
      void closeDefaultDatabase();
    });

    it('createDatabase throws when DATABASE_URL is missing', () => {
      delete process.env.DATABASE_URL;
      expect(() => createDatabase()).toThrow(DatabaseError);
    });

    it('createDatabase creates a Database from a url', () => {
      const db = createDatabase('postgresql://user:pass@localhost:5432/db');
      expect(db).toBeDefined();
      expect(typeof db.query).toBe('function');
      db.end().catch(() => {});
    });

    it('getDefaultDatabase lazily creates from DATABASE_URL and caches', () => {
      process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
      const db = getDefaultDatabase();
      expect(db).toBeDefined();
      expect(getDefaultDatabase()).toBe(db); // cached
    });

    it('Database type is satisfied by PooledDatabase', () => {
      const sql = mockSqlClient();
      const db: Database = new PooledDatabase(sql, true);
      expect(db).toBeDefined();
    });
  });
});
