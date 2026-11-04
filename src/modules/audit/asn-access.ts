import { asc, desc, isNotNull, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as dbSchema from "@/lib/db/schema";
import { auditEvents } from "@/lib/db/schema/analytics";
import { AuditHashChain } from "./hash-chain";
import { verifyAuditTrail } from "./verify";
import type { AuditEntryInput } from "./types";
import type { AuditEntry, AuditVerificationResult } from "./types";

type AuditDatabase = Pick<
  PostgresJsDatabase<typeof dbSchema>,
  "execute" | "select" | "insert"
>;

function getAuditSecret(): string {
  const secret = process.env.AUDIT_HMAC_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUDIT_HMAC_SECRET must contain at least 32 characters");
  }
  return secret;
}

function isMetadataRecord(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export async function appendAsnAccessAuditEvent(
  database: AuditDatabase,
  event: AuditEntryInput,
): Promise<void> {
  await database.execute(sql`LOCK TABLE audit_events IN EXCLUSIVE MODE`);

  const [head] = await database
    .select({
      sequence: auditEvents.chainSequence,
      hash: auditEvents.hash,
    })
    .from(auditEvents)
    .where(isNotNull(auditEvents.chainSequence))
    .orderBy(desc(auditEvents.chainSequence))
    .limit(1);

  const chain = new AuditHashChain({
    secret: getAuditSecret(),
    initialPreviousHash: head?.hash ?? null,
    initialSequence: head?.sequence ?? 0,
  });
  const entry = chain.append({
    action: event.action,
    actorId: event.actorId,
    targetTable: event.targetTable,
    targetId: event.targetId,
    metadata: event.metadata,
    occurredAt: event.occurredAt,
  });

  await database.insert(auditEvents).values({
    id: entry.id,
    actorId: entry.actorId,
    action: entry.action,
    targetTable: entry.targetTable,
    targetId: entry.targetId,
    metadata: { ...entry.metadata },
    chainSequence: entry.sequence,
    previousHash: entry.previousHash,
    hash: entry.hash,
    signature: entry.signature,
    createdAt: entry.occurredAt,
    updatedAt: entry.occurredAt,
  });
}

export async function verifyAsnAccessAuditTrail(
  database: AuditDatabase,
): Promise<AuditVerificationResult> {
  const rows = await database
    .select({
      id: auditEvents.id,
      actorId: auditEvents.actorId,
      action: auditEvents.action,
      targetTable: auditEvents.targetTable,
      targetId: auditEvents.targetId,
      metadata: auditEvents.metadata,
      occurredAt: auditEvents.createdAt,
      sequence: auditEvents.chainSequence,
      previousHash: auditEvents.previousHash,
      hash: auditEvents.hash,
      signature: auditEvents.signature,
    })
    .from(auditEvents)
    .where(isNotNull(auditEvents.chainSequence))
    .orderBy(asc(auditEvents.chainSequence));

  const entries: AuditEntry[] = [];
  for (const [index, row] of rows.entries()) {
    if (
      row.sequence === null ||
      row.previousHash === undefined ||
      row.hash === null ||
      row.signature === null ||
      !isMetadataRecord(row.metadata)
    ) {
      return {
        valid: false,
        tampered: true,
        entriesChecked: index + 1,
        reason: "incomplete_entry",
      };
    }
    entries.push({
      id: row.id,
      actorId: row.actorId,
      action: row.action,
      targetTable: row.targetTable,
      targetId: row.targetId,
      metadata: row.metadata,
      occurredAt: row.occurredAt,
      sequence: row.sequence,
      previousHash: row.previousHash,
      hash: row.hash,
      signature: row.signature,
    });
  }
  return verifyAuditTrail(entries, getAuditSecret());
}
