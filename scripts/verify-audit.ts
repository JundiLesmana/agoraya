import { asc } from 'drizzle-orm';

import { db } from '../src/lib/db/index.js';
import { auditEvents } from '../src/lib/db/schema.js';
import { verifyAuditTrail } from '../src/modules/audit/verify.js';
import type { AuditEntry } from '../src/modules/audit/types.js';

function requireAuditSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET ?? process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUDIT_HMAC_SECRET or AUTH_SECRET must be defined to verify the audit trail.');
  }
  return secret;
}

function toAuditEntry(row: typeof auditEvents.$inferSelect): AuditEntry {
  return {
    id: row.id,
    sequence: row.sequence,
    action: row.action,
    actorId: row.actorId,
    targetTable: row.targetTable,
    targetId: row.targetId,
    metadata: row.metadata as Readonly<Record<string, unknown>>,
    occurredAt: row.occurredAt,
    previousHash: row.previousHash,
    hash: row.hash,
    signature: row.signature,
  };
}

async function main(): Promise<void> {
  const secret = requireAuditSecret();
  const rows = await db.select().from(auditEvents).orderBy(asc(auditEvents.sequence));
  const entries = rows.map(toAuditEntry);
  const result = verifyAuditTrail(entries, secret);

  console.log('[script:verify-audit] checked', JSON.stringify({
    entries: result.entriesChecked,
    valid: result.valid,
    tampered: result.tampered,
    reason: result.reason ?? null,
  }));

  if (!result.valid) {
    throw new Error(`Audit trail verification failed${result.reason ? `: ${result.reason}` : ''}`);
  }
}

main().catch((err: unknown) => {
  console.error('[script:verify-audit] failed:', err);
  process.exit(1);
});
