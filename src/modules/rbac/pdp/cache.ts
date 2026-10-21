// Agoraya — modules/rbac pdp cache
// Decision cache used by the policy decision point.
//
// The cache is bucketed per user so a grant change can drop every decision of
// one user without touching the others. Entries expire after their TTL.
//
// Correctness does not depend on eviction: the PDP includes a policy epoch and
// a per-user grant epoch in the cache key, so a decision made under an older
// policy or grant set can never be served again.

import type { AccessDecision } from "../types";

export interface DecisionCache {
  /** Cached decision for a user, or `undefined` when absent or expired. */
  get(userId: string, key: string): AccessDecision | undefined;
  /** Store a decision for a user. */
  set(
    userId: string,
    key: string,
    decision: AccessDecision,
    ttlMs: number,
  ): void;
  /** Drop every cached decision of a user. Returns the number of removed entries. */
  invalidateUser(userId: string): number;
  /** Drop every cached decision. Returns the number of removed entries. */
  invalidateAll(): number;
  /** Number of cached decisions currently held. */
  readonly size: number;
}

export interface InMemoryDecisionCacheOptions {
  /** Maximum number of decisions kept before the oldest entries are evicted. */
  readonly maxEntries?: number;
}

interface CacheEntry {
  readonly decision: AccessDecision;
  readonly expiresAt: number;
  readonly insertedAt: number;
}

const DEFAULT_MAX_ENTRIES = 10_000;

/** In-memory decision cache with per-user buckets and TTL expiry. */
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
