import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { datasetResources, datasets } from "@/lib/db/schema";
import { upsertBpsDatasetCatalog } from "@/modules/integrations/bps/catalog";

const insertCalls = vi.hoisted(
  () =>
    [] as Array<{
      readonly table: unknown;
      readonly values: Record<string, unknown>;
      readonly target: unknown;
    }>,
);

function fakeDatabase(): PostgresJsDatabase<typeof schema> {
  return {
    insert: vi.fn((table: unknown) => {
      let values: Record<string, unknown> = {};
      let target: unknown;
      const builder = {
        values: vi.fn((input: Record<string, unknown>) => {
          values = input;
          return builder;
        }),
        onConflictDoUpdate: vi.fn((config: { target: unknown }) => {
          target = config.target;
          insertCalls.push({ table, values, target });
          return builder;
        }),
        returning: vi.fn(async () => [{ id: "dataset-id" }]),
      };
      return builder;
    }),
  } as unknown as PostgresJsDatabase<typeof schema>;
}

describe("upsertBpsDatasetCatalog", () => {
  beforeEach(() => {
    insertCalls.length = 0;
  });

  it("registers unpublished BPS metadata and a cache API resource for review", async () => {
    const database = fakeDatabase();
    const lastUpdatedAt = new Date("2026-11-06T00:00:00.000Z");

    await upsertBpsDatasetCatalog(database, lastUpdatedAt);

    expect(insertCalls).toHaveLength(2);
    expect(insertCalls[0].table).toBe(datasets);
    expect(insertCalls[0].target).toBe(datasets.slug);
    expect(insertCalls[0].values).toMatchObject({
      slug: "statistik-bps",
      sourceLabel: "BPS_API",
      lastUpdatedAt,
      isPublished: false,
    });
    expect(insertCalls[0].values.dataDictionary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "indicator_code" }),
        expect.objectContaining({ name: "region_code" }),
        expect.objectContaining({ name: "year" }),
        expect.objectContaining({ name: "value" }),
        expect.objectContaining({ name: "unit" }),
      ]),
    );
    expect(insertCalls[0].values).not.toHaveProperty("rawPayload");

    expect(insertCalls[1].table).toBe(datasetResources);
    expect(insertCalls[1].values).toMatchObject({
      datasetId: "dataset-id",
      format: "API",
      url: "/api/analytics/statistics",
    });
  });
});
