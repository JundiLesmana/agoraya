import { describe, expect, it, vi } from "vitest";
import type { Database, Row } from "@/lib/db";
import { createAnalyticsRepository } from "@/modules/analytics/repository";

const tenantId = "11111111-1111-4111-8111-111111111111";

function fakeDatabase(rows: readonly Row[]) {
  const calls: Array<{ text: string; params?: readonly unknown[] }> = [];
  const query = vi.fn(async (text: string, params?: readonly unknown[]) => {
    calls.push({ text, params });
    return [...rows];
  });
  const database: Database = {
    query: async <T extends Row = Row>(
      text: string,
      params?: readonly unknown[],
    ) => (await query(text, params)) as T[],
    queryOne: async () => null,
    transaction: async <T>(callback: (tx: Database) => Promise<T>) =>
      callback(database),
    end: async () => undefined,
  };
  return { database, query, calls };
}

describe("analytics database repository", () => {
  it("uses a tenant-bound read and maps PostgreSQL numeric values", async () => {
    const { database, calls } = fakeDatabase([
      {
        category: "roads",
        status: "resolved",
        ticket_count: "7",
        resolved_count: "7",
        resolution_seconds_sum: "700.5",
        average_resolution_seconds: "100.0714286",
      },
    ]);
    const repository = createAnalyticsRepository(database);

    await expect(repository.listTicketAggregates(tenantId)).resolves.toEqual([
      {
        category: "roads",
        status: "resolved",
        count: 7,
        resolvedCount: 7,
        resolutionSecondsSum: 700.5,
        averageResolutionSeconds: 100.0714286,
      },
    ]);
    expect(calls[0]?.text).toContain("WHERE tenant_id = $1");
    expect(calls[0]?.params).toEqual([tenantId]);
  });

  it("rejects inconsistent aggregate rows instead of silently coercing them", async () => {
    const { database } = fakeDatabase([
      {
        category: "roads",
        status: "resolved",
        ticket_count: "2",
        resolved_count: "3",
        resolution_seconds_sum: "0",
        average_resolution_seconds: "10",
      },
    ]);
    const repository = createAnalyticsRepository(database);

    await expect(repository.listTicketAggregates(tenantId)).rejects.toThrow(
      "Inconsistent analytics aggregate result",
    );
  });
});
