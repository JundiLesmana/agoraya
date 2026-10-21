import { describe, expect, it } from 'vitest';
import { AuditHashChain, verifyAuditTrail } from '@/modules/audit';

describe('audit verify', () => {
  it('confirms intact trail and detects tampering', () => {
    const chain = new AuditHashChain({ secret: 'test-secret' });
    const entry = chain.append({ action: 'created', actorId: 'u1', targetTable: 'tickets', targetId: 't1', metadata: { a: 1 }, occurredAt: new Date('2026-01-01T00:00:00Z') });
    expect(verifyAuditTrail([entry], 'test-secret').valid).toBe(true);
    expect(verifyAuditTrail([{ ...entry, signature: 'tampered' }], 'test-secret').tampered).toBe(true);
  });
});
