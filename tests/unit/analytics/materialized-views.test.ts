import { describe, expect, it, vi } from "vitest";
import type { Database, Row } from "@/lib/db";
import {
  refreshAnalyticsMaterializedView,
  REFRESH_ANALYTICS_MATERIALIZED_VIEW_SQL,
} from "@/modules/analytics/materialized-views";

describe("analytics materialized view refresh", () => {
  it("runs a concurrent refresh and surfaces database errors", async () => {
    const calls: Array<{ text: string; params?: readonly unknown[] }> = [];
    const query = vi.fn(async (text: string, params?: readonly unknown[]) => {
      calls.push({ text, params });
      return [] as Row[];
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
    await refreshAnalyticsMaterializedView(database);
    expect(calls).toEqual([
      { text: REFRESH_ANALYTICS_MATERIALIZED_VIEW_SQL, params: undefined },
    ]);

    query.mockRejectedValueOnce(new Error("refresh failed"));
    await expect(refreshAnalyticsMaterializedView(database)).rejects.toThrow(
      "refresh failed",
    );
  });
});
