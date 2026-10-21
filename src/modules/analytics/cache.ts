export interface AggregateCache<T> {
  get(key: string): T | undefined;
  set(key: string, value: T): void;
  invalidateAll(): void;
  readonly size: number;
}

interface CacheEntry<T> {
  readonly value: T;
  readonly expiresAt: number;
}

export interface InMemoryAggregateCacheOptions {
  readonly ttlMs?: number;
  readonly maxEntries?: number;
  readonly clock?: () => number;
}

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_MAX_ENTRIES = 1_000;

export class InMemoryAggregateCache<T> implements AggregateCache<T> {
  readonly #entries = new Map<string, CacheEntry<T>>();
  readonly #ttlMs: number;
  readonly #maxEntries: number;
  readonly #clock: () => number;

  constructor(options: InMemoryAggregateCacheOptions = {}) {
    this.#ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
    this.#maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.#clock = options.clock ?? Date.now;
    if (!Number.isSafeInteger(this.#ttlMs) || this.#ttlMs <= 0) {
      throw new RangeError("Cache TTL must be a positive safe integer");
    }
    if (!Number.isSafeInteger(this.#maxEntries) || this.#maxEntries <= 0) {
      throw new RangeError("Cache capacity must be a positive safe integer");
    }
  }

  get size(): number {
    return this.#entries.size;
  }

  get(key: string): T | undefined {
    const entry = this.#entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.#clock()) {
      this.#entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.#entries.delete(key);
    this.#entries.set(key, { value, expiresAt: this.#clock() + this.#ttlMs });
    while (this.#entries.size > this.#maxEntries) {
      const oldestKey = this.#entries.keys().next().value;
      if (oldestKey === undefined) break;
      this.#entries.delete(oldestKey);
    }
  }

  invalidateAll(): void {
    this.#entries.clear();
  }
}
