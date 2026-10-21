import { DatabaseError } from "@/lib/errors";
import type { Database, Row } from "@/lib/db";

export interface TicketAggregate {
  readonly category: string;
  readonly status: string;
  readonly count: number;
  readonly resolvedCount: number;
  readonly resolutionSecondsSum: number;
  readonly averageResolutionSeconds: number | null;
}

export interface AnalyticsRepository {
  listTicketAggregates(tenantId: string): Promise<readonly TicketAggregate[]>;
}

interface TicketAggregateRow extends Row {
  category: unknown;
  status: unknown;
  ticket_count: unknown;
  resolved_count: unknown;
  resolution_seconds_sum: unknown;
  average_resolution_seconds: unknown;
}

const LIST_TICKET_AGGREGATES_SQL = `
  SELECT
    category,
    status,
    ticket_count,
    resolved_count,
    resolution_seconds_sum,
    average_resolution_seconds
  FROM analytics_ticket_aggregates
  WHERE tenant_id = $1
  ORDER BY category, status
`;

function readText(value: unknown, column: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new DatabaseError(`Invalid analytics result column: ${column}`);
  }
  return value;
}

function readNumber(value: unknown, column: string): number {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(parsed)) {
    throw new DatabaseError(`Invalid analytics result column: ${column}`);
  }
  return parsed;
}

function readCount(value: unknown, column: string): number {
  const parsed = readNumber(value, column);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new DatabaseError(`Invalid analytics result column: ${column}`);
  }
  return parsed;
}

function readNullableNumber(value: unknown, column: string): number | null {
  const parsed = value === null ? null : readNumber(value, column);
  if (parsed !== null && parsed < 0) {
    throw new DatabaseError(`Invalid analytics result column: ${column}`);
  }
  return parsed;
}

function toTicketAggregate(row: TicketAggregateRow): TicketAggregate {
  const count = readCount(row.ticket_count, "ticket_count");
  const resolvedCount = readCount(row.resolved_count, "resolved_count");
  const resolutionSecondsSum = readNullableNumber(
    row.resolution_seconds_sum,
    "resolution_seconds_sum",
  );
  const averageResolutionSeconds = readNullableNumber(
    row.average_resolution_seconds,
    "average_resolution_seconds",
  );
  if (
    resolvedCount > count ||
    resolutionSecondsSum === null ||
    (resolvedCount === 0 && averageResolutionSeconds !== null) ||
    (resolvedCount > 0 && averageResolutionSeconds === null)
  ) {
    throw new DatabaseError("Inconsistent analytics aggregate result");
  }
  return {
    category: readText(row.category, "category"),
    status: readText(row.status, "status"),
    count,
    resolvedCount,
    resolutionSecondsSum,
    averageResolutionSeconds,
  };
}

export function createAnalyticsRepository(
  database: Database,
): AnalyticsRepository {
  return {
    async listTicketAggregates(tenantId) {
      const rows = await database.query<TicketAggregateRow>(
        LIST_TICKET_AGGREGATES_SQL,
        [tenantId],
      );
      return rows.map(toTicketAggregate);
    },
  };
}
