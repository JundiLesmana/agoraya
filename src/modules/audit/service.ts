import { and, count, desc, eq, gte, ilike, isNotNull, lte, or, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as dbSchema from "@/lib/db/schema";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { auditEvents } from "@/lib/db/schema/analytics";
import { AuditHashChain } from "./hash-chain";
import type { AuditEntry, AuditEntryInput, AuditExportFormat } from "./types";
import { exportAuditTrail } from "./anchor-export";

const DEFAULT_LOOKBACK_DAYS = 7;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;
const EVENT_ID_SEQUENCE_WIDTH = 3;
const EVENT_ID_PATTERN = /^AUD-(\d{8})-([A-Za-z0-9]{3,})$/;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MASK_KEYS = [
  "password",
  "passwordHash",
  "secret",
  "signature",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "email",
  "emailMasked",
  "nip",
  "nik",
  "nikHash",
] as const;

export interface AuditLogFilters {
  readonly tenantId?: string;
  readonly startDate?: string;
  readonly endDate?: string;
  readonly actorId?: string;
  readonly module?: string;
  readonly action?: string;
  readonly result?: string;
  readonly objectType?: string;
  readonly searchQuery?: string;
  readonly limit?: number;
  readonly offset?: number;
}

export interface AuditLogRecord {
  readonly eventId: string;
  readonly id: string;
  readonly timestamp: string;
  readonly actorId: string | null;
  readonly module: string;
  readonly action: string;
  readonly result: string;
  readonly objectType: string;
  readonly objectId: string | null;
  readonly summary: string;
  readonly metadata: Readonly<Record<string, unknown>>;
  readonly chainSequence: number | null;
  readonly previousHash: string | null;
  readonly hash: string | null;
  readonly signature: string | null;
}

export interface AuditLogListResult {
  readonly data: readonly AuditLogRecord[];
  readonly meta: {
    readonly total: number;
    readonly limit: number;
    readonly offset: number;
    readonly dateRange: {
      readonly startDate: string;
      readonly endDate: string;
    };
  };
}

export interface AuditLogSummaryResult {
  readonly data: {
    readonly total: number;
    readonly byModule: ReadonlyArray<{ readonly module: string; readonly count: number }>;
    readonly byAction: ReadonlyArray<{ readonly action: string; readonly count: number }>;
    readonly byResult: ReadonlyArray<{ readonly result: string; readonly count: number }>;
    readonly byObjectType: ReadonlyArray<{ readonly objectType: string; readonly count: number }>;
  };
}

export type AuditDatabase = Pick<
  PostgresJsDatabase<typeof dbSchema>,
  "select" | "insert" | "transaction"
>;

interface NormalizedFilters {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly tenantId: string | null;
  readonly actorId: string | null;
  readonly module: string | null;
  readonly action: string | null;
  readonly result: string | null;
  readonly objectType: string | null;
  readonly searchQuery: string | null;
  readonly limit: number;
  readonly offset: number;
}

interface AuditDetails {
  readonly module: string;
  readonly result: string;
  readonly objectType: string;
  readonly objectId: string | null;
  readonly summary: string;
}

function getAuditSecret(): string {
  const secret = process.env.AUDIT_HASH_SECRET ?? process.env.AUDIT_HMAC_SECRET ?? process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUDIT_HASH_SECRET or AUDIT_HMAC_SECRET must contain at least 32 characters");
  }
  return secret;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sanitizeMetadata(value: unknown): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) return {};
  return deepMask(value) as Readonly<Record<string, unknown>>;
}

function deepMask(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => deepMask(item));
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => {
      if (MASK_KEYS.some((candidate) => candidate.toLowerCase() === key.toLowerCase())) {
        return [key, "***"];
      }
      return [key, deepMask(nested)];
    }),
  );
}

function parseDateBoundary(value: string | undefined, boundary: "start" | "end"): Date | null {
  if (!value) return null;
  const hasTime = value.includes("T");
  const parsed = new Date(hasTime ? value : `${value}${boundary === "start" ? "T00:00:00.000Z" : "T23:59:59.999Z"}`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`Invalid ${boundary === "start" ? "start_date" : "end_date"}.`);
  }
  return parsed;
}

function normalizeFilters(filters: AuditLogFilters = {}): NormalizedFilters {
  const now = new Date();
  const endDate = parseDateBoundary(filters.endDate, "end") ?? now;
  const startDate =
    parseDateBoundary(filters.startDate, "start") ??
    new Date(endDate.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  if (startDate > endDate) {
    throw new ValidationError("start_date must be earlier than or equal to end_date.");
  }
  const limit = filters.limit === undefined ? DEFAULT_LIMIT : Math.trunc(filters.limit);
  const offset = filters.offset === undefined ? 0 : Math.trunc(filters.offset);
  if (limit < 1 || limit > MAX_LIMIT) {
    throw new ValidationError(`limit must be between 1 and ${MAX_LIMIT}.`);
  }
  if (offset < 0) {
    throw new ValidationError("offset must be zero or greater.");
  }
  if (filters.actorId && !UUID_PATTERN.test(filters.actorId)) {
    throw new ValidationError("actor_id must be a valid UUID.");
  }
  if (filters.tenantId && !UUID_PATTERN.test(filters.tenantId)) {
    throw new ValidationError("tenant_id must be a valid UUID.");
  }
  return {
    startDate,
    endDate,
    tenantId: filters.tenantId?.trim() || null,
    actorId: filters.actorId?.trim() || null,
    module: filters.module?.trim() || null,
    action: filters.action?.trim() || null,
    result: filters.result?.trim() || null,
    objectType: filters.objectType?.trim() || null,
    searchQuery: filters.searchQuery?.trim() || null,
    limit,
    offset,
  };
}

function moduleFromAction(action: string): string {
  return action.split(".")[0] ?? "unknown";
}

function resultFromMetadata(metadata: Readonly<Record<string, unknown>>): string {
  const direct = metadata.result;
  if (typeof direct === "string" && direct.length > 0) return direct;
  return "success";
}

function objectTypeFromRow(action: string, targetTable: string): string {
  return targetTable || action.split(".")[1] || "unknown";
}

function summaryFromRow(action: string, targetTable: string, targetId: string | null, result: string): string {
  const noun = targetTable || "object";
  const identifier = targetId ? ` ${targetId}` : "";
  return `${action} on ${noun}${identifier} (${result})`;
}

function toEventIdFromDate(date: Date, sequence: number): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${date.getUTCDate()}`.padStart(2, "0");
  return `AUD-${year}${month}${day}-${String(sequence).padStart(EVENT_ID_SEQUENCE_WIDTH, "0")}`;
}

function parseEventId(eventId: string): { readonly date: string; readonly sequence: number } {
  const match = EVENT_ID_PATTERN.exec(eventId);
  if (!match) {
    throw new ValidationError("Invalid event_id.");
  }
  const sequenceNum = /^\d+$/.test(match[2])
    ? Number(match[2])
    : Number.parseInt(match[2], 16) || Number(match[2].replace(/\D/g, "")) || 0;
  return {
    date: match[1],
    sequence: sequenceNum,
  };
}

function auditDetails(row: typeof auditEvents.$inferSelect): AuditDetails {
  const result = resultFromMetadata(sanitizeMetadata(row.metadata));
  return {
    module: moduleFromAction(row.action),
    result,
    objectType: objectTypeFromRow(row.action, row.targetTable),
    objectId: row.targetId,
    summary: summaryFromRow(row.action, row.targetTable, row.targetId, result),
  };
}

function toRecord(row: typeof auditEvents.$inferSelect): AuditLogRecord {
  const metadata = sanitizeMetadata(row.metadata);
  const details = auditDetails(row);
  return {
    eventId: toEventIdFromDate(row.createdAt, row.chainSequence ?? 0),
    id: row.id,
    timestamp: row.createdAt.toISOString(),
    actorId: row.actorId,
    module: details.module,
    action: row.action,
    result: details.result,
    objectType: details.objectType,
    objectId: details.objectId,
    summary: details.summary,
    metadata,
    chainSequence: row.chainSequence,
    previousHash: row.previousHash,
    hash: row.hash,
    signature: row.signature,
  };
}

function buildWhere(filters: NormalizedFilters): SQL[] {
  const conditions: SQL[] = [
    gte(auditEvents.createdAt, filters.startDate),
    lte(auditEvents.createdAt, filters.endDate),
  ];
  if (filters.tenantId) {
    conditions.push(
      sql`${auditEvents.metadata} ->> 'tenantId' = ${filters.tenantId}`,
    );
  }
  if (filters.actorId) conditions.push(eq(auditEvents.actorId, filters.actorId));
  if (filters.action) conditions.push(eq(auditEvents.action, filters.action));
  if (filters.module) conditions.push(ilike(auditEvents.action, `${filters.module}.%`));
  if (filters.objectType) {
    const objectCondition = or(
      eq(auditEvents.targetTable, filters.objectType),
      sql`split_part(${auditEvents.action}, '.', 2) = ${filters.objectType}`,
    );
    if (objectCondition) conditions.push(objectCondition);
  }
  if (filters.result) {
    conditions.push(sql`COALESCE(${auditEvents.metadata} ->> 'result', 'success') = ${filters.result}`);
  }
  if (filters.searchQuery) {
    const query = `%${filters.searchQuery.replace(/[\\%_]/g, "\\$&")}%`;
    const searchCondition = or(
      ilike(auditEvents.action, query),
      ilike(auditEvents.targetTable, query),
      sql`${auditEvents.targetId}::text ILIKE ${query}`,
      sql`CAST(${auditEvents.metadata} AS text) ILIKE ${query}`,
    );
    if (searchCondition) conditions.push(searchCondition);
  }
  return conditions;
}

function mapAuditEntry(row: typeof auditEvents.$inferSelect): AuditEntry | null {
  if (
    row.chainSequence === null ||
    row.hash === null ||
    row.signature === null ||
    row.previousHash === null
  ) {
    return null;
  }

  return {
    id: row.id,
    action: row.action,
    actorId: row.actorId,
    targetTable: row.targetTable,
    targetId: row.targetId,
    metadata: sanitizeMetadata(row.metadata),
    occurredAt: row.createdAt,
    sequence: row.chainSequence,
    previousHash: row.previousHash,
    hash: row.hash,
    signature: row.signature,
  };
}


export async function appendAuditEvent(
  database: Pick<AuditDatabase, "select" | "insert" | "transaction">,
  event: AuditEntryInput,
): Promise<void> {
  await database.transaction(async (transaction) => {
    const [head] = await transaction
      .select({ sequence: auditEvents.chainSequence, hash: auditEvents.hash })
      .from(auditEvents)
      .where(isNotNull(auditEvents.chainSequence))
      .orderBy(desc(auditEvents.chainSequence))
      .limit(1);
    const chain = new AuditHashChain({
      secret: getAuditSecret(),
      initialPreviousHash: head?.hash ?? null,
      initialSequence: head?.sequence ?? 0,
    });
    const entry = chain.append(event);
    await transaction.insert(auditEvents).values({
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
  });
}

export async function listAuditLogs(
  database: Pick<AuditDatabase, "select">,
  filters: AuditLogFilters = {},
): Promise<AuditLogListResult> {
  const normalized = normalizeFilters(filters);
  const conditions = buildWhere(normalized);
  const where = and(...conditions);
  const [rows, totals] = await Promise.all([
    database
      .select()
      .from(auditEvents)
      .where(where)
      .orderBy(desc(auditEvents.createdAt))
      .limit(normalized.limit)
      .offset(normalized.offset),
    database.select({ total: count() }).from(auditEvents).where(where),
  ]);
  return {
    data: rows.map(toRecord),
    meta: {
      total: Number(totals[0]?.total ?? 0),
      limit: normalized.limit,
      offset: normalized.offset,
      dateRange: {
        startDate: normalized.startDate.toISOString(),
        endDate: normalized.endDate.toISOString(),
      },
    },
  };
}

export async function getAuditLogByEventId(
  database: Pick<AuditDatabase, "select">,
  eventId: string,
  tenantId?: string,
): Promise<{ readonly data: AuditLogRecord }> {
  const parsedEventId = parseEventId(eventId);
  const rows = await database
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.chainSequence, parsedEventId.sequence),
        ...(tenantId
          ? [sql`${auditEvents.metadata} ->> 'tenantId' = ${tenantId}`]
          : []),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new NotFoundError("Audit log not found.");
  }

  const expectedEventId = toEventIdFromDate(row.createdAt, parsedEventId.sequence);
  if (expectedEventId !== eventId) {
    throw new NotFoundError("Audit log not found.");
  }

  return { data: toRecord(row) };
}

export async function exportAuditLogs(
  database: Pick<AuditDatabase, "select">,
  filters: AuditLogFilters,
  format: AuditExportFormat,
): Promise<{ readonly contentType: string; readonly body: string }> {
  const normalized = normalizeFilters({ ...filters, limit: MAX_LIMIT, offset: 0 });
  const conditions = [...buildWhere(normalized), isNotNull(auditEvents.chainSequence)];
  const rows = await database
    .select()
    .from(auditEvents)
    .where(and(...conditions))
    .orderBy(desc(auditEvents.chainSequence));
  const entries: AuditEntry[] = rows
    .map(mapAuditEntry)
    .filter((entry): entry is AuditEntry => entry !== null);
  const body = exportAuditTrail(entries, format);
  return {
    contentType: format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
    body,
  };
}

export async function summarizeAuditLogs(
  database: Pick<AuditDatabase, "select">,
  filters: AuditLogFilters = {},
): Promise<AuditLogSummaryResult> {
  const normalized = normalizeFilters({ ...filters, limit: MAX_LIMIT, offset: 0 });
  const rows = await database
    .select()
    .from(auditEvents)
    .where(and(...buildWhere(normalized)));
  const records = rows.map(toRecord);
  const tally = <T extends string>(values: readonly T[]) =>
    [...values.reduce((map, value) => map.set(value, (map.get(value) ?? 0) + 1), new Map<string, number>())]
      .map(([key, count]) => ({ key, count }))
      .sort((left, right) => right.count - left.count || left.key.localeCompare(right.key));
  return {
    data: {
      total: records.length,
      byModule: tally(records.map((record) => record.module)).map(({ key, count }) => ({ module: key, count })),
      byAction: tally(records.map((record) => record.action)).map(({ key, count }) => ({ action: key, count })),
      byResult: tally(records.map((record) => record.result)).map(({ key, count }) => ({ result: key, count })),
      byObjectType: tally(records.map((record) => record.objectType)).map(({ key, count }) => ({ objectType: key, count })),
    },
  };
}
