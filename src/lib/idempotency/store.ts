// Agoraya — lib/idempotency store interfaces

export interface IdempotencyRecord {
  readonly key: string;
  readonly statusCode: number;
  readonly body: unknown;
  readonly createdAt: number;
  readonly expiresAt: number;
}

export interface IdempotencyStore {
  get(key: IdempotencyKey): Promise<IdempotencyRecord | undefined>;
  set(key: IdempotencyKey, value: Omit<IdempotencyRecord, 'key'>, ttlMs: number): Promise<void>;
  delete(key: IdempotencyKey): Promise<void>;
}

export type IdempotencyKey = string & { readonly __brand: unique symbol };
