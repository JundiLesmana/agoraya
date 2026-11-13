import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bpsStatistics } from "@/lib/db/schema";

export interface BpsStatisticsRow {
  readonly indicatorCode: string;
  readonly indicatorName: string;
  readonly regionCode: string;
  readonly year: number;
  readonly value: number;
  readonly unit: string;
  readonly category: string;
  readonly sourceLabel: string;
  readonly lastSyncedAt: Date;
}

export type BpsStatisticsSource = "BPS_API" | "SIMULATED" | null;

export interface BpsStatisticsFilters {
  readonly indicatorCode?: string;
  readonly regionCode?: string;
  readonly simulatedIndicatorCode?: string;
  readonly simulatedRegionCode?: string;
}


function buildStatisticsQuery(
  database: ReturnType<typeof db>,
  sourceLabel: "BPS_API" | "SIMULATED",
  filters: BpsStatisticsFilters,
) {
  const conditions = [eq(bpsStatistics.sourceLabel, sourceLabel)];
  const indicatorCode =
    sourceLabel === "SIMULATED"
      ? (filters.simulatedIndicatorCode ?? filters.indicatorCode)
      : filters.indicatorCode;
  const regionCode =
    sourceLabel === "SIMULATED"
      ? (filters.simulatedRegionCode ?? filters.regionCode)
      : filters.regionCode;
  if (indicatorCode) {
    conditions.push(eq(bpsStatistics.indicatorCode, indicatorCode));
  }
  if (regionCode) {
    conditions.push(eq(bpsStatistics.regionCode, regionCode));
  }
  return database
    .select()
    .from(bpsStatistics)
    .where(and(...conditions))
    .orderBy(bpsStatistics.lastSyncedAt);
}

export async function selectPublicBpsStatistics(
  database = db(),
  filters: BpsStatisticsFilters = {},
): Promise<{
  readonly rows: readonly BpsStatisticsRow[];
  readonly source: BpsStatisticsSource;
}> {
  const bpsApiRows = await buildStatisticsQuery(database, "BPS_API", filters);

  if (bpsApiRows.length > 0) {
    return { rows: bpsApiRows, source: "BPS_API" };
  }

  const simulatedRows = await buildStatisticsQuery(
    database,
    "SIMULATED",
    filters,
  );

  return {
    rows: simulatedRows,
    source: simulatedRows.length > 0 ? ("SIMULATED" as const) : null,
  };
}