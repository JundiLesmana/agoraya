import { createHash, createHmac, randomUUID } from 'node:crypto';

import type { AuditEntry, AuditEntryInput } from './types';

export interface HashChainOptions {
  readonly secret: string;
  readonly initialPreviousHash?: string | null;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(',')}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${canonicalize((value as Record<string, unknown>)[key])}`).join(',')}}`;
}

function deriveHash(payload: string): string {
  return createHash('sha256').update(payload).digest('hex');
}

function deriveSignature(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export class AuditHashChain {
  #entries: AuditEntry[] = [];
  #previousHash: string | null;
  #sequence = 0;

  constructor(private readonly options: HashChainOptions) {
    this.#previousHash = options.initialPreviousHash ?? null;
  }

  append(entry: AuditEntryInput): AuditEntry {
    this.#sequence += 1;
    const base = {
      ...entry,
      metadata: canonicalize(entry.metadata),
      previousHash: this.#previousHash,
      sequence: this.#sequence,
    };
    const hash = deriveHash(canonicalize(base));
    const signature = deriveSignature(this.options.secret, hash);
    const audited: AuditEntry = {
      ...entry,
      id: randomUUID(),
      sequence: this.#sequence,
      hash,
      previousHash: this.#previousHash,
      signature,
    };
    this.#entries.push(audited);
    this.#previousHash = hash;
    return audited;
  }

  static computeHash(entry: Omit<AuditEntry, 'hash' | 'signature'> & { readonly hash?: string; readonly signature?: string }): string {
    const base = {
      action: entry.action,
      actorId: entry.actorId,
      id: entry.id,
      metadata: canonicalize(entry.metadata),
      occurredAt: entry.occurredAt.toISOString(),
      previousHash: entry.previousHash,
      sequence: entry.sequence,
      targetId: entry.targetId,
      targetTable: entry.targetTable,
    };
    return deriveHash(canonicalize(base));
  }

  getEntries(): readonly AuditEntry[] {
    return [...this.#entries];
  }
}
