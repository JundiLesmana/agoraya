import { describe, expect, it } from 'vitest';
import { AuditHashChain, exportAuditTrail } from '@/modules/audit';

describe('audit export', () => {
  it('exports json and csv', () => {
    const chain = new AuditHashChain({ secret: 'test-secret' });
    const entry = chain.append({ action: 'created', actorId: 'u1', targetTable: 'tickets', targetId: 't1', metadata: {}, occurredAt: new Date('2026-01-01T00:00:00Z') });
    expect(exportAuditTrail([entry], 'json')).toContain('exportedAt');
    expect(exportAuditTrail([entry], 'csv')).toContain('action');
  });
});

