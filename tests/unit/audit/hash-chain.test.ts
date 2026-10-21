import { describe, expect, it } from 'vitest';
import { AuditHashChain } from '@/modules/audit';

describe('audit hash-chain', () => {
  it('creates chained entries', () => {
    const chain = new AuditHashChain({ secret: 'test-secret' });
    const first = chain.append({ action: 'created', actorId: 'u1', targetTable: 'tickets', targetId: 't1', metadata: { a: 1 }, occurredAt: new Date('2026-01-01T00:00:00Z') });
    const second = chain.append({ action: 'updated', actorId: 'u1', targetTable: 'tickets', targetId: 't1', metadata: { a: 2 }, occurredAt: new Date('2026-01-01T00:01:00Z') });
    expect(first.previousHash).toBeNull();
    expect(second.previousHash).toBe(first.hash);
  });
});

