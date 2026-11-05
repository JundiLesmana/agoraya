import { describe, expect, it } from "vitest";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema/index";
import { selectPublicBpsStatistics } from "@/modules/integrations/bps/repository";

const simulatedRows = [
  {
    indicatorCode: "IND_PENDUDUK",
    regionCode: "3171",
    year: 2024,
    value: 10562088,
    unit: "jiwa",
    sourceLabel: "SIMULATED",
    lastSyncedAt: new Date("2024-01-01T00:00:00.000Z"),
  },
];

const bpsApiRows = [
  {
    indicatorCode: "IND_PENDUDUK",
    regionCode: "3171",
    year: 2024,
    value: 10600000,
    unit: "jiwa",
    sourceLabel: "BPS_API",
    lastSyncedAt: new Date("2024-06-01T00:00:00.000Z"),
  },
];

function fakeDatabase(
  firstCall: unknown[],
  secondCall: unknown[],
): PostgresJsDatabase<typeof schema> {
  let callIndex = 0;
  return {
    select: () => ({
      from: () => ({
        where: () => {
          const rows = callIndex === 0 ? firstCall : secondCall ?? [];
          callIndex += 1;
          return { orderBy: () => rows };
        },
      }),
    }),
  } as unknown as PostgresJsDatabase<typeof schema>;
}

describe("selectPublicBpsStatistics", () => {
  it("mengutamakan data BPS_API dan tidak fallback ke SIMULATED saat BPS_API tersedia", async () => {
    const database = fakeDatabase(bpsApiRows, simulatedRows);

    const { rows, source } = await selectPublicBpsStatistics(database);

    expect(source).toBe("BPS_API");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceLabel: "BPS_API", value: 10600000 });
  });

  it("fallback ke SIMULATED saat data BPS_API belum ada", async () => {
    const database = fakeDatabase([], simulatedRows);

    const { rows, source } = await selectPublicBpsStatistics(database);

    expect(source).toBe("SIMULATED");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceLabel: "SIMULATED", value: 10562088 });
  });

  it("mengembalikan source null dan data kosong saat tidak ada data sama sekali", async () => {
    const database = fakeDatabase([], []);

    const { rows, source } = await selectPublicBpsStatistics(database);

    expect(source).toBeNull();
    expect(rows).toHaveLength(0);
  });
});
