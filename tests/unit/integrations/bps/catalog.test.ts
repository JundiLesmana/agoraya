import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import { datasetResources, datasets } from "@/lib/db/schema";
import {
  serializeBpsStatisticsCsv,
  upsertBpsDatasetCatalog,
} from "@/modules/integrations/bps/catalog";

const insertCalls = vi.hoisted(
  () =>
    [] as Array<{
      readonly table: unknown;
      readonly values: Record<string, unknown>;
      readonly target: unknown;
    }>,
);
const selectRows = [
  {
    indicatorCode: "bps:0000:413:0:0",
    indicatorName: "Indeks Pembangunan Manusia",
    regionCode: "1100",
    year: 2024,
    value: 74.03,
    unit: "Indeks",
  },
];

function fakeDatabase(): PostgresJsDatabase<typeof schema> {
  return {
    select: vi.fn(() => {
      const builder = {
        from: vi.fn(() => builder),
        where: vi.fn(() => builder),
        orderBy: vi.fn(async () => selectRows),
      };
      return builder;
    }),
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

  it("registers a published BPS dataset with processed CSV and API resources", async () => {
    const database = fakeDatabase();
    const lastUpdatedAt = new Date("2026-11-06T00:00:00.000Z");

    await upsertBpsDatasetCatalog(database, lastUpdatedAt);

    expect(insertCalls).toHaveLength(3);
    expect(insertCalls[0].table).toBe(datasets);
    expect(insertCalls[0].target).toBe(datasets.slug);
    expect(insertCalls[0].values).toMatchObject({
      slug: "statistik-bps",
      sourceLabel: "BPS_API",
      lastUpdatedAt,
      isPublished: true,
      csvData: expect.stringContaining(
        '"Indeks Pembangunan Manusia","Kesejahteraan"',
      ),
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
    expect(insertCalls[2].values).toMatchObject({
      datasetId: "dataset-id",
      format: "CSV",
      url: "/api/asn/datasets/statistik-bps/download",
    });
  });

  it("serializes categorized data and quotes CSV cells safely", () => {
    expect(
      serializeBpsStatisticsCsv([
        {
          indicatorCode: "bps:0000:413:0:0",
          indicatorName: '=HYPERLINK("https://example.test")',
          regionCode: "1100",
          year: 2024,
          value: 74.03,
          unit: "Indeks",
        },
      ]),
    ).toContain(
      `"'=HYPERLINK(""https://example.test"")","Statistik","bps:0000:413:0:0","1100","2024","74.03","Indeks"`,
    );
  });
});
