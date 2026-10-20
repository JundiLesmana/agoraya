import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateIdempotencyKey,
  validateIdempotencyKey,
  withIdempotency,
  InMemoryIdempotencyStore,
  type IdempotencyStore,
} from '@/lib/idempotency';
import { ValidationError } from '@/lib/errors';

describe('lib/idempotency', () => {
  describe('generateIdempotencyKey', () => {
    it('generates a UUID v4 string', () => {
      const key = generateIdempotencyKey();
      expect(typeof key).toBe('string');
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
      expect(uuidRegex.test(key)).toBe(true);
    });

    it('generates unique keys', () => {
      const keys = new Set([generateIdempotencyKey(), generateIdempotencyKey(), generateIdempotencyKey()]);
      expect(keys.size).toBe(3);
    });
  });

  describe('validateIdempotencyKey', () => {
    it('accepts a valid UUID v4', () => {
      const key = generateIdempotencyKey();
      expect(validateIdempotencyKey(key)).toBe(key);
    });

    it('rejects non-strings', () => {
      expect(() => validateIdempotencyKey(123)).toThrow(ValidationError);
      expect(() => validateIdempotencyKey(null)).toThrow(ValidationError);
      expect(() => validateIdempotencyKey(undefined)).toThrow(ValidationError);
      expect(() => validateIdempotencyKey({})).toThrow(ValidationError);
    });

    it('rejects malformed UUIDs', () => {
      expect(() => validateIdempotencyKey('not-a-uuid')).toThrow(ValidationError);
      expect(() => validateIdempotencyKey('00000000-0000-0000-0000-000000000000')).toThrow(ValidationError); // nil UUID, version 0
      expect(() => validateIdempotencyKey('00000000-0000-9000-0000-000000000000')).toThrow(ValidationError); // version 9
    });
  });

  describe('InMemoryIdempotencyStore', () => {
    let store: InMemoryIdempotencyStore;

    beforeEach(() => {
      store = new InMemoryIdempotencyStore();
    });

    it('get returns undefined for missing key', async () => {
      expect(await store.get('abc-123' as any)).toBeUndefined();
    });

    it('set then get round-trips', async () => {
      const key = generateIdempotencyKey();
      const now = Date.now();
      await store.set(key, { statusCode: 200, body: { ok: true }, createdAt: now, expiresAt: now + 1000 }, 1000);
      const record = await store.get(key);
      expect(record).toBeDefined();
      expect(record?.statusCode).toBe(200);
      expect(record?.body).toEqual({ ok: true });
      expect(record?.key).toBe(key);
    });

    it('expires entries after ttl', async () => {
      const key = generateIdempotencyKey();
      const now = Date.now();
      await store.set(key, { statusCode: 200, body: {}, createdAt: now, expiresAt: now + 1 }, 1); // 1 ms ttl
      expect(await store.get(key)).toBeDefined();
      await new Promise((r) => setTimeout(r, 10));
      expect(await store.get(key)).toBeUndefined();
    });

    it('delete removes entry', async () => {
      const key = generateIdempotencyKey();
      const now = Date.now();
      await store.set(key, { statusCode: 200, body: {}, createdAt: now, expiresAt: now + 1000 }, 1000);
      await store.delete(key);
      expect(await store.get(key)).toBeUndefined();
    });
  });

  describe('withIdempotency', () => {
    it('executes operation once and caches result', async () => {
      const key = generateIdempotencyKey();
      const store = new InMemoryIdempotencyStore();
      const calls: number[] = [];
      const result = await withIdempotency(key, async () => {
        calls.push(1);
        return { value: 42 };
      }, { store });
      expect(result.isDuplicate).toBe(false);
      expect(result.data).toEqual({ value: 42 });
      expect(calls).toEqual([1]);

      // Duplicate request returns cached result without re-executing
      const result2 = await withIdempotency(key, async () => {
        calls.push(2);
        return { value: 99 };
      }, { store });
      expect(result2.isDuplicate).toBe(true);
      expect(result2.data).toEqual({ value: 42 });
      expect(calls).toEqual([1]);
    });

    it('propagates errors and does not cache failures', async () => {
      const key = generateIdempotencyKey();
      let attempts = 0;
      await expect(
        withIdempotency(key, async () => {
          attempts += 1;
          throw new Error('transient');
        }),
      ).rejects.toThrow('transient');
      expect(attempts).toBe(1);

      // Retry after failure should attempt again (failure not cached)
      await expect(
        withIdempotency(key, async () => {
          attempts += 1;
          return { ok: true };
        }),
      ).resolves.toMatchObject({ isDuplicate: false, data: { ok: true } });
      expect(attempts).toBe(2);
    });

    it('uses custom store and ttl', async () => {
      const key = generateIdempotencyKey();
      const store: IdempotencyStore = {
        get: vi.fn().mockResolvedValue(undefined),
        set: vi.fn().mockResolvedValue(undefined),
        delete: vi.fn().mockResolvedValue(undefined),
      };
      await withIdempotency(key, async () => ({ x: 1 }), { store, ttlMs: 5000 });
      expect(store.set).toHaveBeenCalledTimes(1);
    });
  });
});
