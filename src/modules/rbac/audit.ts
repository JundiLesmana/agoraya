import { randomUUID } from "node:crypto";

import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as dbSchema from "@/lib/db/schema";
import { auditEvents } from "../audit/db";

export interface AuditEvent {
  readonly actorId: string | null;
  readonly action: string;
  readonly targetTable: string;
  readonly targetId: string | null;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly occurredAt: Date;
}

export { AuditHashChain } from "../audit/hash-chain";
export { verifyAuditTrail } from "../audit/verify";
export { exportAuditTrail } from "../audit/anchor-export";
export type { AuditEntry, AuditEntryInput, AuditVerificationResult } from "../audit/types";

export interface AuditSink {
  record(event: AuditEvent): Promise<void>;
}

export class InMemoryAuditSink implements AuditSink {
  readonly events: AuditEvent[] = [];

  async record(event: AuditEvent): Promise<void> {
    this.events.push(event);
  }

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

export function uuidOrNull(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  return UUID_PATTERN.test(value) ? value : null;
}
