// Agoraya — modules/rbac audit
// Audit port shared by the policy decision point, the policy service, and the
// grants service. Every authorization decision and every grant change is
// recorded so access decisions remain reviewable.
//
// The port keeps the module independent from the persistence layer; the Drizzle
// adapter writes to the append-only `audit_events` table.

import { randomUUID } from "node:crypto";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as dbSchema from "@/lib/db/schema";
import { auditEvents } from "@/lib/db/schema";

/** An audit record produced by the RBAC module. */
export interface AuditEvent {
  /** Actor that caused the event; `null` for system-generated events. */
  readonly actorId: string | null;
  /** Stable event name, for example `rbac.access.denied`. */
  readonly action: string;
  /** Table the event refers to, for example `tickets` or `rbac_policies`. */
  readonly targetTable: string;
  /** Primary key of the affected record, when applicable. */
  readonly targetId: string | null;
  /** Redacted event metadata. Never contains secrets or raw PII. */
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export { AuditHashChain } from "../audit/hash-chain";
export { verifyAuditTrail } from "../audit/verify";
export { exportAuditTrail } from "../audit/anchor-export";
export type { AuditEntry, AuditEntryInput, AuditVerificationResult } from "../audit/types";

/** Persistence port for audit records. */
export interface AuditSink {
  record(event: AuditEvent): Promise<void>;
}

/** In-memory audit sink. Intended for tests and local development. */
export class InMemoryAuditSink implements AuditSink {
  readonly events: AuditEvent[] = [];

  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }

  /** Events recorded for a given action name. */
  byAction(action: string): AuditEvent[] {
    return this.events.filter((event) => event.action === action);
  }

  clear(): void {
    this.events.length = 0;
  }
}

/** Audit sink that appends to the global `audit_events` table. */
export function createAuditEventSink(
  db: PostgresJsDatabase<typeof dbSchema>,
): AuditSink {
  return {
    async record(event: AuditEvent): Promise<void> {
      await db.insert(auditEvents).values({
        id: randomUUID(),
        actorId: uuidOrNull(event.actorId),
        action: event.action,
        targetTable: event.targetTable,
        targetId: uuidOrNull(event.targetId),
        metadata: { ...event.metadata },
        createdAt: event.occurredAt,
        updatedAt: event.occurredAt,
      });
    },
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `audit_events.target_id` is a UUID column. Values that are not UUIDs (for
 * example a policy key) are kept in the event metadata instead of being
 * written to the column.
 */
export function uuidOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  return UUID_PATTERN.test(value) ? value : null;
}
