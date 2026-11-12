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
const transactionCalls = vi.hoisted(() => ({ count: 0 }));
const pruneCalls = vi.hoisted(() => ({ count: 0 }));

let rowsToReturn: unknown[] = [];

vi.mock("@/lib/db", () => {
  const database = {
    insert: vi.fn((table: unknown) => {
      let values: Record<string, unknown>[] = [];
      const builder = {
        values: vi.fn((inputRows: Record<string, unknown>[]) => {
          values = inputRows;
          return builder;
        }),
        onConflictDoUpdate: vi.fn(
          (config: { target: unknown[]; set: Record<string, unknown> }) => {
            insertCalls.push({
              table,
              values,
              targetNames: config.target.map(
                (target) =>
                  (target as { name?: string }).name ?? String(target),
              ),
              setKeys: Object.keys(config.set),
              set: config.set,
            });
            return builder;
          },
        ),
        returning: vi.fn(async () => rowsToReturn),
      };
      return builder;
    }),
    execute: vi.fn(async () => {
      pruneCalls.count += 1;
      return [];
    }),
  };
  const transaction = vi.fn(
    async (callback: (transaction: typeof database) => Promise<unknown>) => {
      transactionCalls.count += 1;
      return callback(database);
    },
  );
  return {
    db: vi.fn(
      () => ({ ...database, transaction }) as unknown as PostgresJsDatabase,
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
  transactionCalls.count = 0;
  pruneCalls.count = 0;
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
    expect(transactionCalls.count).toBe(1);
    expect(pruneCalls.count).toBe(1);
    expect(insertCalls).toHaveLength(1);
    const call = insertCalls[0];
    expect(call.table).toBe(bpsStatistics);
    expect(call.targetNames).toEqual(["indicator_code", "region_code", "year"]);
    expect(call.setKeys).toEqual([
      "value",
      "indicatorName",
      "unit",
      "sourceLabel",
      "lastSyncedAt",
    ]);
    expect(call.set.sourceLabel).toBe("BPS_API");
    expect(call.set.lastSyncedAt).toBeInstanceOf(Date);
    expect(typeof call.set.value).toBe("object");
    expect(call.values).toHaveLength(2);
    for (const row of call.values) {
      expect(row).toMatchObject({
        sourceLabel: "BPS_API",
        indicatorCode: expect.any(String),
        indicatorName: expect.any(String),
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

  it("menolak batch yang melampaui batas storage sebelum membuka transaksi", async () => {
    const inputs = Array.from({ length: 2_001 }, (_, index) => ({
      ...baseInput,
      regionCode: String(index),
    }));

    await expect(upsertBpsStatistics(inputs)).rejects.toThrow(RangeError);
    expect(transactionCalls.count).toBe(0);
    expect(pruneCalls.count).toBe(0);
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
