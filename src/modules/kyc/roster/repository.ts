// Agoraya — modules/kyc/roster repository
// Persistence port for KYC roster entries and approvals.
// The port keeps the module independent from the persistence layer.
// Two implementations are provided:
//   - InMemoryKycRepository: for unit tests and local development
//   - createDrizzleKycRepository: the production Drizzle/Postgres implementation

import { randomUUID } from "node:crypto";
import { eq, and, count } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as dbSchema from "@/lib/db/schema";
import { kycRoster, kycApprovals } from "@/lib/db/schema";
import type {
  KycApproval,
  KycApprovalDecision,
  KycRosterEntry,
  KycRosterPage,
  KycStatus,
} from "../types";

// ---------------------------------------------------------------------------
// Port interface
// ---------------------------------------------------------------------------

export interface UpsertRosterEntryInput {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly nikHash: string;
  readonly name: string;
  readonly submittedBy: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface UpdateRosterStatusInput {
  readonly id: string;
  readonly status: KycStatus;
  readonly expiresAt?: Date | null;
  readonly updatedAt: Date;
}

export interface InsertApprovalInput {
  readonly id: string;
  readonly rosterId: string;
  readonly tenantId: string;
  readonly approverId: string | null;
  readonly approvalSlot: 1 | 2;
  readonly decision: KycApprovalDecision;
  readonly reason: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ListRosterFilter {
  readonly tenantId: string;
  readonly status?: KycStatus;
  readonly limit: number;
  readonly offset: number;
}

export interface KycRepository {
  /** Find a roster entry by its primary key, scoped to the tenant. */
  findById(id: string, tenantId: string): Promise<KycRosterEntry | null>;
  /** Find a roster entry by userId within the tenant. */
  findByUserId(userId: string, tenantId: string): Promise<KycRosterEntry | null>;
  /** Insert a new roster entry. */
  insert(input: UpsertRosterEntryInput): Promise<KycRosterEntry>;
  /** Update the status (and optionally expiresAt) of a roster entry. */
  updateStatus(input: UpdateRosterStatusInput): Promise<KycRosterEntry | null>;
  /** List roster entries for a tenant with optional status filter, paginated. */
  list(filter: ListRosterFilter): Promise<KycRosterPage>;
  /** Insert an approval record. */
  insertApproval(input: InsertApprovalInput): Promise<KycApproval>;
  /** List all approvals for a roster entry. */
  listApprovals(rosterId: string): Promise<KycApproval[]>;
}

// ---------------------------------------------------------------------------
// In-memory implementation (tests / local development)
// ---------------------------------------------------------------------------

export class InMemoryKycRepository implements KycRepository {
  readonly #entries = new Map<string, KycRosterEntry>();
  readonly #approvals = new Map<string, KycApproval>();

  async findById(id: string, tenantId: string): Promise<KycRosterEntry | null> {
    const entry = this.#entries.get(id);
    if (!entry || entry.tenantId !== tenantId) return null;
    return entry;
  }

  async findByUserId(
    userId: string,
    tenantId: string,
  ): Promise<KycRosterEntry | null> {
    for (const entry of this.#entries.values()) {
      if (entry.userId === userId && entry.tenantId === tenantId) return entry;
    }
    return null;
  }

  async insert(input: UpsertRosterEntryInput): Promise<KycRosterEntry> {
    const entry: KycRosterEntry = {
      id: input.id,
      tenantId: input.tenantId,
      userId: input.userId,
      nikHash: input.nikHash,
      name: input.name,
      status: "pending",
      expiresAt: null,
      submittedBy: input.submittedBy,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };
    this.#entries.set(entry.id, entry);
    return entry;
  }

  async updateStatus(
    input: UpdateRosterStatusInput,
  ): Promise<KycRosterEntry | null> {
    const existing = this.#entries.get(input.id);
    if (!existing) return null;
    const updated: KycRosterEntry = {
      ...existing,
      status: input.status,
      expiresAt:
        "expiresAt" in input ? (input.expiresAt ?? null) : existing.expiresAt,
      updatedAt: input.updatedAt,
    };
    this.#entries.set(updated.id, updated);
    return updated;
  }

  async list(filter: ListRosterFilter): Promise<KycRosterPage> {
    const items = [...this.#entries.values()].filter(
      (entry) =>
        entry.tenantId === filter.tenantId &&
        (filter.status === undefined || entry.status === filter.status),
    );
    const total = items.length;
    const paginated = items
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .slice(filter.offset, filter.offset + filter.limit);
    return {
      items: paginated,
      total,
      limit: filter.limit,
      offset: filter.offset,
    };
  }

  async insertApproval(input: InsertApprovalInput): Promise<KycApproval> {
    const approval: KycApproval = {
      id: input.id,
      rosterId: input.rosterId,
      tenantId: input.tenantId,
      approverId: input.approverId,
      approvalSlot: input.approvalSlot,
      decision: input.decision,
      reason: input.reason,
      createdAt: input.createdAt,
      updatedAt: input.updatedAt,
    };
    this.#approvals.set(approval.id, approval);
    return approval;
  }

  async listApprovals(rosterId: string): Promise<KycApproval[]> {
    return [...this.#approvals.values()]
      .filter((a) => a.rosterId === rosterId)
      .sort((a, b) => a.approvalSlot - b.approvalSlot);
  }
}

// ---------------------------------------------------------------------------
// Drizzle/Postgres implementation (production)
// ---------------------------------------------------------------------------

function rowToEntry(row: typeof kycRoster.$inferSelect): KycRosterEntry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    userId: row.userId,
    nikHash: row.nikHash,
    name: row.name,
    status: row.status,
    expiresAt: row.expiresAt ?? null,
    submittedBy: row.submittedBy ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function rowToApproval(row: typeof kycApprovals.$inferSelect): KycApproval {
  return {
    id: row.id,
    rosterId: row.rosterId,
    tenantId: row.tenantId,
    approverId: row.approverId ?? null,
    approvalSlot: row.approvalSlot as 1 | 2,
    decision: row.decision,
    reason: row.reason ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createDrizzleKycRepository(
  db: PostgresJsDatabase<typeof dbSchema>,
): KycRepository {
  return {
    async findById(id, tenantId) {
      const rows = await db
        .select()
        .from(kycRoster)
        .where(and(eq(kycRoster.id, id), eq(kycRoster.tenantId, tenantId)))
        .limit(1);
      return rows[0] ? rowToEntry(rows[0]) : null;
    },

    async findByUserId(userId, tenantId) {
      const rows = await db
        .select()
        .from(kycRoster)
        .where(
          and(
            eq(kycRoster.userId, userId),
            eq(kycRoster.tenantId, tenantId),
          ),
        )
        .limit(1);
      return rows[0] ? rowToEntry(rows[0]) : null;
    },

    async insert(input) {
      const rows = await db
        .insert(kycRoster)
        .values({
          id: input.id,
          tenantId: input.tenantId,
          userId: input.userId,
          nikHash: input.nikHash,
          name: input.name,
          status: "pending",
          submittedBy: input.submittedBy ?? undefined,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("Insert returned no rows");
      return rowToEntry(row);
    },

    async updateStatus(input) {
      const updateValues: Partial<typeof kycRoster.$inferInsert> = {
        status: input.status,
        updatedAt: input.updatedAt,
      };
      if ("expiresAt" in input) {
        updateValues.expiresAt = input.expiresAt ?? undefined;
      }
      const rows = await db
        .update(kycRoster)
        .set(updateValues)
        .where(eq(kycRoster.id, input.id))
        .returning();
      return rows[0] ? rowToEntry(rows[0]) : null;
    },

    async list(filter) {
      const conditions = [eq(kycRoster.tenantId, filter.tenantId)];
      if (filter.status !== undefined) {
        conditions.push(eq(kycRoster.status, filter.status));
      }
      const where = and(...conditions);

      const [items, totalRows] = await Promise.all([
        db
          .select()
          .from(kycRoster)
          .where(where)
          .limit(filter.limit)
          .offset(filter.offset),
        db
          .select({ total: count() })
          .from(kycRoster)
          .where(where),
      ]);

      return {
        items: items.map(rowToEntry),
        total: Number(totalRows[0]?.total ?? 0),
        limit: filter.limit,
        offset: filter.offset,
      };
    },

    async insertApproval(input) {
      const rows = await db
        .insert(kycApprovals)
        .values({
          id: input.id,
          rosterId: input.rosterId,
          tenantId: input.tenantId,
          approverId: input.approverId ?? undefined,
          approvalSlot: input.approvalSlot,
          decision: input.decision,
          reason: input.reason ?? undefined,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("Insert returned no rows");
      return rowToApproval(row);
    },

    async listApprovals(rosterId) {
      const rows = await db
        .select()
        .from(kycApprovals)
        .where(eq(kycApprovals.rosterId, rosterId))
        .orderBy(kycApprovals.approvalSlot);
      return rows.map(rowToApproval);
    },
  };
}
