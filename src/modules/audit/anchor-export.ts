import type { AuditAnchorExport, AuditEntry } from './types';

export function exportAuditTrail(entries: readonly AuditEntry[], format: 'json' | 'csv'): string {
  if (format === 'csv') {
    const header = ['id', 'sequence', 'action', 'actorId', 'targetTable', 'targetId', 'occurredAt', 'previousHash', 'hash', 'signature'];
    const rows = entries.map((entry) => [entry.id, entry.sequence, entry.action, entry.actorId ?? '', entry.targetTable, entry.targetId ?? '', entry.occurredAt.toISOString(), entry.previousHash ?? '', entry.hash, entry.signature].map((value) => JSON.stringify(String(value))).join(','));
    return [header.join(','), ...rows].join('\n');
  }
  const payload: AuditAnchorExport = { format, exportedAt: new Date().toISOString(), hashAlgorithm: 'sha256', signatureAlgorithm: 'hmac-sha256', entries };
  return JSON.stringify(payload, null, 2);
}

