import type { AccessDecision } from "../types";

export interface DecisionCache {
  get(userId: string, key: string): AccessDecision | undefined;
  set(
    userId: string,
    key: string,
    decision: AccessDecision,
    ttlMs: number,
  ): void;
  invalidateUser(userId: string): number;
  invalidateAll(): number;
  readonly size: number;
}

export interface InMemoryDecisionCacheOptions {
  readonly maxEntries?: number;
}

interface CacheEntry {
  readonly decision: AccessDecision;
  readonly expiresAt: number;
  readonly insertedAt: number;
}

const DEFAULT_MAX_ENTRIES = 10_000;

export class InMemoryDecisionCache implements DecisionCache {
  readonly #buckets = new Map<string, Map<string, CacheEntry>>();
  readonly #maxEntries: number;
  #entries = 0;

  constructor(options: InMemoryDecisionCacheOptions = {}) {
    this.#maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
  }

  get size(): number {
    return this.#entries;
  }

  get(userId: string, key: string): AccessDecision | undefined {
    const bucket = this.#buckets.get(userId);
    if (!bucket) return undefined;

    const entry = bucket.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt <= Date.now()) {
      bucket.delete(key);
      this.#entries -= 1;
      if (bucket.size === 0) this.#buckets.delete(userId);
      return undefined;
    }

    return entry.decision;
  }

  set(
    userId: string,
    key: string,
    decision: AccessDecision,
    ttlMs: number,
  ): void {
    const bucket = this.#buckets.get(userId) ?? new Map<string, CacheEntry>();
    if (!bucket.has(key)) {
      this.#entries += 1;
    }
    bucket.set(key, {
      decision,
      expiresAt: Date.now() + ttlMs,
      insertedAt: Date.now(),
    });
    this.#buckets.set(userId, bucket);

    if (this.#entries > this.#maxEntries) {
      this.#evictOldest();
    }
  }

  invalidateUser(userId: string): number {
    const bucket = this.#buckets.get(userId);
    if (!bucket) return 0;
    const removed = bucket.size;
    this.#entries -= removed;
    this.#buckets.delete(userId);
    return removed;
  }

  invalidateAll(): number {
    const removed = this.#entries;
    this.#buckets.clear();
    this.#entries = 0;
    return removed;
  }

  #evictOldest(): void {
    while (this.#entries > this.#maxEntries) {
      let oldestUserId: string | undefined;
      let oldestKey: string | undefined;
      let oldestInsertedAt = Number.POSITIVE_INFINITY;

      for (const [userId, bucket] of this.#buckets) {
        for (const [key, entry] of bucket) {
          if (entry.insertedAt < oldestInsertedAt) {
            oldestInsertedAt = entry.insertedAt;
            oldestUserId = userId;
            oldestKey = key;
          }
        }
      }

      if (oldestUserId === undefined || oldestKey === undefined) return;

      const bucket = this.#buckets.get(oldestUserId);
      bucket?.delete(oldestKey);
      this.#entries -= 1;
      if (bucket && bucket.size === 0) {
        this.#buckets.delete(oldestUserId);
      }
    }
  }
}
