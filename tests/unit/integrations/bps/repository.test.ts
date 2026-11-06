import { describe, expect, it } from "vitest";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema/index";
import { bpsStatistics } from "@/lib/db/schema";
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
): { database: PostgresJsDatabase<typeof schema>; whereCalls: unknown[]; orderByCalls: unknown[] } {
  let callIndex = 0;
  const whereCalls: unknown[] = [];
  const orderByCalls: unknown[] = [];
  const database = {
    select: () => ({
      from: () => ({
        where: (condition: unknown) => {
          whereCalls.push(condition);
          const rows = callIndex === 0 ? firstCall : secondCall ?? [];
          callIndex += 1;
          return { orderBy: (ordering: unknown) => { orderByCalls.push(ordering); return rows; } };
        },
      }),
    }),
  } as unknown as PostgresJsDatabase<typeof schema>;
  return { database, whereCalls, orderByCalls };
}

describe("selectPublicBpsStatistics", () => {
  it("mengutamakan data BPS_API dan tidak fallback ke SIMULATED saat BPS_API tersedia", async () => {
    const { database } = fakeDatabase(bpsApiRows, simulatedRows);

    const { rows, source } = await selectPublicBpsStatistics(database);

    expect(source).toBe("BPS_API");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceLabel: "BPS_API", value: 10600000 });
  });

  it("fallback ke SIMULATED saat data BPS_API belum ada", async () => {
    const { database } = fakeDatabase([], simulatedRows);

    const { rows, source } = await selectPublicBpsStatistics(database);

    expect(source).toBe("SIMULATED");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ sourceLabel: "SIMULATED", value: 10562088 });
  });

  it("mengembalikan source null dan data kosong saat tidak ada data sama sekali", async () => {
    const { database } = fakeDatabase([], []);

    const { rows, source } = await selectPublicBpsStatistics(database);

    expect(source).toBeNull();
    expect(rows).toHaveLength(0);
  });

  it("meneruskan filter indikator dan wilayah ke kueri database", async () => {
    const { database, whereCalls, orderByCalls } = fakeDatabase(
      [],
      simulatedRows,
    );

    await selectPublicBpsStatistics(database, {
      indicatorCode: "IND_KEMISKINAN",
      regionCode: "31",
    });

    // Kueri BPS_API (kosong) lalu fallback ke SIMULATED.
    expect(whereCalls).toHaveLength(2);
    expect(whereCalls.every((call) => call != null && typeof call === "object")).toBe(true);
    expect(orderByCalls.every((call) => call === bpsStatistics.lastSyncedAt)).toBe(true);
  });
});
