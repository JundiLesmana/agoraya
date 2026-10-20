// Agoraya — lib/idempotency
// Idempotency key generation, validation, and duplicate-request handling.

import { ValidationError } from '../errors';
import type { IdempotencyKey, IdempotencyRecord, IdempotencyStore } from './store';

export type { IdempotencyKey, IdempotencyRecord, IdempotencyStore };

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Generate a new idempotency key (UUID v4). */
export function generateIdempotencyKey(): IdempotencyKey {
  return crypto.randomUUID() as IdempotencyKey;
}

/** Validate an idempotency key format. Throws ValidationError when invalid. */
export function validateIdempotencyKey(key: unknown): IdempotencyKey {
  if (typeof key !== 'string' || !UUID_V4_REGEX.test(key)) {
    throw new ValidationError('Invalid idempotency key: expected a UUID v4 string', {
      context: { providedKey: typeof key === 'string' ? key.slice(0, 8) : undefined },
    });
  }
  return key as IdempotencyKey;
}

export class InMemoryIdempotencyStore implements IdempotencyStore {
  #store = new Map<string, { record: IdempotencyRecord; timer: ReturnType<typeof setTimeout> }>();

  async get(key: IdempotencyKey): Promise<IdempotencyRecord | undefined> {
    const entry = this.#store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.record.expiresAt) {
      this.#deleteUnsafe(key);
      return undefined;
    }
    return { ...entry.record };
  }

  async set(key: IdempotencyKey, value: Omit<IdempotencyRecord, 'key'>, ttlMs: number): Promise<void> {
    const expiresAt = Date.now() + ttlMs;
    const record: IdempotencyRecord = { key, ...value, createdAt: Date.now(), expiresAt };
    this.#deleteUnsafe(key);
    const timer = setTimeout(() => {
      this.#deleteUnsafe(key);
    }, ttlMs);
    if (timer.unref) timer.unref();
    this.#store.set(key, { record, timer });
  }

  async delete(key: IdempotencyKey): Promise<void> {
    this.#deleteUnsafe(key);
  }

  #deleteUnsafe(key: string): void {
    const entry = this.#store.get(key);
    if (entry) clearTimeout(entry.timer);
    this.#store.delete(key);
  }
}

/**
 * Execute an operation at most once per idempotency key.
 * Duplicate requests with the same key return the cached result without re-executing.
 * Failed operations are not cached so callers may retry.
 */
export async function withIdempotency<T>(
  key: IdempotencyKey,
  operation: () => Promise<T>,
  options: {
    readonly store?: IdempotencyStore;
    readonly ttlMs?: number;
    readonly statusCode?: number;
  } = {},
): Promise<{ readonly data: T; readonly statusCode: number; readonly isDuplicate: boolean }> {
  validateIdempotencyKey(key);
  const store = options.store ?? new InMemoryIdempotencyStore();
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const statusCode = options.statusCode ?? 200;

  const existing = await store.get(key);
  if (existing) {
    return { data: existing.body as T, statusCode: existing.statusCode, isDuplicate: true };
  }

  const data = await operation();
  const now = Date.now();
  await store.set(key, { statusCode, body: data, createdAt: now, expiresAt: now + ttlMs }, ttlMs);
  return { data, statusCode, isDuplicate: false };
}
