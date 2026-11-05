import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import type { PostgresJsDatabase } from "@/lib/db";
import { bpsStatistics } from "@/lib/db/schema";
import {
  upsertBpsStatistics,
  type BpsStatisticsInput,
} from "@/modules/integrations/bps";

const insertCalls = vi.hoisted(
  () =>
    [] as Array<{
      readonly table: unknown;
      readonly values: readonly Record<string, unknown>[];
      readonly targetNames: readonly string[];
      readonly setKeys: readonly string[];
      readonly set: Record<string, unknown>;
    }>,
);

let rowsToReturn: unknown[] = [];

vi.mock("@/lib/db", () => {
  return {
    db: vi.fn(
      () =>
        ({
          insert: vi.fn((table: unknown) => {
            let values: Record<string, unknown>[] = [];
            const self = {
              values: vi.fn((inputRows: Record<string, unknown>[]) => {
                values = inputRows;
                return self;
              }),
              onConflictDoUpdate: vi.fn(
                (config: {
                  target: unknown[];
                  set: Record<string, unknown>;
                }) => {
                  insertCalls.push({
                    table,
                    values,
                    targetNames: config.target.map(
                      (t) => (t as { name?: string }).name ?? String(t),
                    ),
                    setKeys: Object.keys(config.set),
                    set: config.set,
                  });
                  return self;
                },
              ),
              returning: vi.fn(async () => rowsToReturn),
            };
            return self;
          }),
        }) as unknown as PostgresJsDatabase,
    ),
  };
});

const baseInput: BpsStatisticsInput = {
  indicatorCode: "IND_POVERTY",
  regionCode: "3171",
  year: 2023,
  value: 11.04,
  unit: "persen",
};

beforeEach(() => {
  vi.clearAllMocks();
  insertCalls.length = 0;
  rowsToReturn = [];
});

describe("upsertBpsStatistics", () => {
  it("menyisipkan baris baru dengan source_label 'BPS_API' dan target konflik (indicator_code, region_code, year)", async () => {
    rowsToReturn = [{ id: "row-1" }, { id: "row-2" }];
    const inputs: BpsStatisticsInput[] = [
      { ...baseInput },
      { ...baseInput, regionCode: "3172", value: 12.5 },
    ];

    const result = await upsertBpsStatistics(inputs);

    expect(db).toHaveBeenCalledTimes(1);
    expect(insertCalls).toHaveLength(1);
    const call = insertCalls[0];
    expect(call.table).toBe(bpsStatistics);
    expect(call.targetNames).toEqual(["indicator_code", "region_code", "year"]);
    expect(call.setKeys).toEqual(["value", "lastSyncedAt"]);
    expect(call.set.lastSyncedAt).toBeInstanceOf(Date);
    expect(typeof call.set.value).toBe("object");
    expect(call.values).toHaveLength(2);
    for (const row of call.values) {
      expect(row).toMatchObject({
        sourceLabel: "BPS_API",
        indicatorCode: expect.any(String),
        regionCode: expect.any(String),
        year: expect.any(Number),
        unit: expect.any(String),
        lastSyncedAt: expect.any(Date),
      });
    }
    expect(result.count).toBe(2);
    expect(result.rows).toBe(rowsToReturn);
  });

  it("tidak memanggil database saat input kosong", async () => {
    const result = await upsertBpsStatistics([]);

    expect(result).toEqual({ count: 0, rows: [] });
    expect(insertCalls).toHaveLength(0);
  });

  it("hasil payload identik saat dipanggil berkali-kali dengan data yang sama (idempoten)", async () => {
    rowsToReturn = [{ id: "row-1" }];
    const inputs: BpsStatisticsInput[] = [baseInput];

    const first = await upsertBpsStatistics(inputs);
    const second = await upsertBpsStatistics(inputs);

    expect(first.count).toBe(1);
    expect(second.count).toBe(1);
    expect(insertCalls).toHaveLength(2);

    const firstRow = { ...insertCalls[0].values[0] };
    const secondRow = { ...insertCalls[1].values[0] };
    delete firstRow.lastSyncedAt;
    delete secondRow.lastSyncedAt;
    expect(firstRow).toEqual(secondRow);
  });
});
