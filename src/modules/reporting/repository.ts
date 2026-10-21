import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ticketEvidence, tickets, ticketVotes } from "@/lib/db/schema";
import type * as dbSchema from "@/lib/db/schema";
import type {
  QcEvidence,
  Report,
  ReportStatus,
  ReportVote,
  VoteValue,
} from "./types";
import type { DuplicateCandidate } from "./dedup";

export interface ReportRepository {
  find(id: string, tenantId: string): Promise<Report | null>;
  listCandidates(
    tenantId: string,
    category: string,
    limit: number,
  ): Promise<DuplicateCandidate[]>;
  insert(
    input: Omit<
      Report,
      | "id"
      | "firstRespondedAt"
      | "resolvedAt"
      | "closedAt"
      | "slaEscalatedAt"
      | "assigneeId"
      | "duplicateOfId"
    > & { id?: string },
  ): Promise<Report>;
  markDuplicate(
    id: string,
    tenantId: string,
    duplicateOfId: string,
    now: Date,
  ): Promise<Report | null>;
  transition(input: {
    id: string;
    tenantId: string;
    from: ReportStatus;
    to: ReportStatus;
    assigneeId?: string | null;
    now: Date;
  }): Promise<Report | null>;
  listBreached(tenantId: string): Promise<Report[]>;
  markEscalated(
    id: string,
    tenantId: string,
    now: Date,
  ): Promise<Report | null>;
  addEvidence(
    input: Omit<QcEvidence, "id" | "createdAt"> & {
      id?: string;
      createdAt: Date;
    },
  ): Promise<QcEvidence>;
  listEvidence(reportId: string, tenantId: string): Promise<QcEvidence[]>;
  upsertVote(input: ReportVote): Promise<ReportVote>;
  listVotes(reportId: string, tenantId: string): Promise<ReportVote[]>;
}

export class InMemoryReportRepository implements ReportRepository {
  readonly #reports = new Map<string, Report>();
  readonly #evidence = new Map<string, QcEvidence>();
  readonly #votes = new Map<string, ReportVote>();
  async find(id: string, tenantId: string) {
    const r = this.#reports.get(id);
    return r?.tenantId === tenantId ? r : null;
  }
  async listCandidates(tenantId: string, category: string, limit: number) {
    return [...this.#reports.values()]
      .filter(
        (r) =>
          r.tenantId === tenantId &&
          r.category === category &&
          !r.duplicateOfId,
      )
      .slice(0, limit)
      .map(({ id, category: c, title, description, location }) => ({
        id,
        category: c,
        title,
        description,
        location,
      }));
  }
  async insert(input: Parameters<ReportRepository["insert"]>[0]) {
    const report: Report = {
      ...input,
      id: input.id ?? randomUUID(),
      assigneeId: null,
      duplicateOfId: null,
      firstRespondedAt: null,
      resolvedAt: null,
      closedAt: null,
      slaEscalatedAt: null,
    };
    this.#reports.set(report.id, report);
    return report;
  }
  async markDuplicate(
    id: string,
    tenantId: string,
    duplicateOfId: string,
    now: Date,
  ) {
    const r = await this.find(id, tenantId);
    if (!r) return null;
    const updated = { ...r, duplicateOfId, updatedAt: now };
    this.#reports.set(id, updated);
    return updated;
  }
  async transition(input: {
    id: string;
    tenantId: string;
    from: ReportStatus;
    to: ReportStatus;
    assigneeId?: string | null;
    now: Date;
  }) {
    const r = await this.find(input.id, input.tenantId);
    if (!r || r.status !== input.from) return null;
    const updated: Report = {
      ...r,
      status: input.to,
      assigneeId:
        input.assigneeId === undefined ? r.assigneeId : input.assigneeId,
      firstRespondedAt:
        input.to === "in_progress" && !r.firstRespondedAt
          ? input.now
          : r.firstRespondedAt,
      resolvedAt: input.to === "resolved" ? input.now : r.resolvedAt,
      closedAt: input.to === "closed" ? input.now : r.closedAt,
      updatedAt: input.now,
    };
    this.#reports.set(r.id, updated);
    return updated;
  }
  async listBreached(tenantId: string) {
    return [...this.#reports.values()].filter(
      (r) =>
        r.tenantId === tenantId &&
        !r.closedAt &&
        !r.firstRespondedAt &&
        !r.slaEscalatedAt,
    );
  }
  async markEscalated(id: string, tenantId: string, now: Date) {
    const r = await this.find(id, tenantId);
    if (!r || r.slaEscalatedAt) return null;
    const updated = { ...r, slaEscalatedAt: now, updatedAt: now };
    this.#reports.set(id, updated);
    return updated;
  }
  async addEvidence(
    input: Omit<QcEvidence, "id" | "createdAt"> & {
      id?: string;
      createdAt: Date;
    },
  ) {
    const evidence: QcEvidence = { ...input, id: input.id ?? randomUUID() };
    this.#evidence.set(evidence.id, evidence);
    return evidence;
  }
  async listEvidence(reportId: string, tenantId: string) {
    return [...this.#evidence.values()].filter(
      (e) => e.reportId === reportId && e.tenantId === tenantId,
    );
  }
  async upsertVote(input: ReportVote) {
    const key = `${input.reportId}:${input.voterId}`;
    this.#votes.set(key, input);
    return input;
  }
  async listVotes(reportId: string, tenantId: string) {
    return [...this.#votes.values()].filter(
      (v) => v.reportId === reportId && v.tenantId === tenantId,
    );
  }
}

function status(value: string): ReportStatus {
  if (
    ["submitted", "verified", "in_progress", "resolved", "closed"].includes(
      value,
    )
  )
    return value as ReportStatus;
  throw new Error(`Unsupported ticket status: ${value}`);
}
function rowToReport(row: typeof tickets.$inferSelect): Report {
  return {
    id: row.id,
    tenantId: row.tenantId,
    reporterId: row.citizenId ?? "",
    category: row.category,
    title: row.title,
    description: row.description,
    location: (row.location as Record<string, unknown> | null) ?? null,
    status: status(row.status),
    assigneeId: row.assigneeId ?? null,
    duplicateOfId: row.duplicateOfId ?? null,
    submittedAt: row.submittedAt ?? row.createdAt,
    responseDueAt: row.responseDueAt ?? row.createdAt,
    firstRespondedAt: row.firstRespondedAt ?? null,
    resolvedAt: row.resolvedAt ?? null,
    closedAt: row.closedAt ?? null,
    slaEscalatedAt: row.slaEscalatedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createDrizzleReportRepository(
  db: PostgresJsDatabase<typeof dbSchema>,
): ReportRepository {
  return {
    async find(id, tenantId) {
      const rows = await db
        .select()
        .from(tickets)
        .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)))
        .limit(1);
      return rows[0] ? rowToReport(rows[0]) : null;
    },
    async listCandidates(tenantId, category, limit) {
      const rows = await db
        .select({
          id: tickets.id,
          category: tickets.category,
          title: tickets.title,
          description: tickets.description,
          location: tickets.location,
        })
        .from(tickets)
        .where(
          and(eq(tickets.tenantId, tenantId), eq(tickets.category, category)),
        )
        .limit(limit);
      return rows.map((r) => ({
        ...r,
        location: (r.location as Record<string, unknown> | null) ?? null,
      }));
    },
    async insert(input) {
      const rows = await db
        .insert(tickets)
        .values({
          id: input.id ?? randomUUID(),
          tenantId: input.tenantId,
          citizenId: input.reporterId,
          category: input.category,
          title: input.title,
          description: input.description,
          status: "submitted",
          location: input.location,
          submittedAt: input.submittedAt,
          responseDueAt: input.responseDueAt,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .returning();
      if (!rows[0]) throw new Error("Report insert returned no row");
      return rowToReport(rows[0]);
    },
    async markDuplicate(id, tenantId, duplicateOfId, now) {
      const rows = await db
        .update(tickets)
        .set({ duplicateOfId, updatedAt: now })
        .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)))
        .returning();
      return rows[0] ? rowToReport(rows[0]) : null;
    },
    async transition(input) {
      const values = {
        status: input.to,
        assigneeId: input.assigneeId,
        firstRespondedAt: input.to === "in_progress" ? input.now : undefined,
        resolvedAt: input.to === "resolved" ? input.now : undefined,
        closedAt: input.to === "closed" ? input.now : undefined,
        updatedAt: input.now,
      };
      const rows = await db
        .update(tickets)
        .set(values)
        .where(
          and(
            eq(tickets.id, input.id),
            eq(tickets.tenantId, input.tenantId),
            eq(tickets.status, input.from),
          ),
        )
        .returning();
      return rows[0] ? rowToReport(rows[0]) : null;
    },
    async listBreached(tenantId) {
      const rows = await db
        .select()
        .from(tickets)
        .where(
          and(
            eq(tickets.tenantId, tenantId),
            inArray(tickets.status, ["submitted", "verified"]),
          ),
        )
        .limit(100);
      return rows.map(rowToReport);
    },
    async markEscalated(id, tenantId, now) {
      const rows = await db
        .update(tickets)
        .set({ slaEscalatedAt: now, updatedAt: now })
        .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)))
        .returning();
      return rows[0] ? rowToReport(rows[0]) : null;
    },
    async addEvidence(input) {
      const rows = await db
        .insert(ticketEvidence)
        .values({
          id: input.id ?? randomUUID(),
          ticketId: input.reportId,
          tenantId: input.tenantId,
          uploadedBy: input.uploadedBy,
          storageKey: input.storageKey,
          mediaType: input.mediaType,
          note: input.note,
          createdAt: input.createdAt,
          updatedAt: input.createdAt,
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("Evidence insert returned no row");
      return {
        id: row.id,
        reportId: row.ticketId,
        tenantId: row.tenantId,
        uploadedBy: row.uploadedBy,
        storageKey: row.storageKey,
        mediaType: row.mediaType,
        note: row.note ?? null,
        createdAt: row.createdAt,
      };
    },
    async listEvidence(reportId, tenantId) {
      const rows = await db
        .select()
        .from(ticketEvidence)
        .where(
          and(
            eq(ticketEvidence.ticketId, reportId),
            eq(ticketEvidence.tenantId, tenantId),
          ),
        );
      return rows.map((r) => ({
        id: r.id,
        reportId: r.ticketId,
        tenantId: r.tenantId,
        uploadedBy: r.uploadedBy,
        storageKey: r.storageKey,
        mediaType: r.mediaType,
        note: r.note ?? null,
        createdAt: r.createdAt,
      }));
    },
    async upsertVote(input) {
      const rows = await db
        .insert(ticketVotes)
        .values({
          ticketId: input.reportId,
          tenantId: input.tenantId,
          voterId: input.voterId,
          value: input.value,
          createdAt: input.createdAt,
          updatedAt: input.updatedAt,
        })
        .onConflictDoUpdate({
          target: [ticketVotes.ticketId, ticketVotes.voterId],
          set: { value: input.value, updatedAt: input.updatedAt },
        })
        .returning();
      const row = rows[0];
      if (!row) throw new Error("Vote upsert returned no row");
      return {
        reportId: row.ticketId,
        tenantId: row.tenantId,
        voterId: row.voterId,
        value: row.value as VoteValue,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    },
    async listVotes(reportId, tenantId) {
      const rows = await db
        .select()
        .from(ticketVotes)
        .where(
          and(
            eq(ticketVotes.ticketId, reportId),
            eq(ticketVotes.tenantId, tenantId),
          ),
        );
      return rows.map((r) => ({
        reportId: r.ticketId,
        tenantId: r.tenantId,
        voterId: r.voterId,
        value: r.value as VoteValue,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
    },
  };
}
