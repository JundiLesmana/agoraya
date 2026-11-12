import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bpsStatistics } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

const SOURCE_LABEL = "BPS_API";
const MAX_CACHED_STATISTICS_ROWS = 2_000;

export interface BpsStatisticsInput {
  readonly indicatorCode: string;
  readonly indicatorName?: string;
  readonly regionCode: string;
  readonly year: number;
  readonly value: number;
  readonly unit: string;
}

export interface UpsertBpsStatisticsResult {
  readonly count: number;
  readonly rows: readonly unknown[];
}

export async function upsertBpsStatistics(
  inputs: readonly BpsStatisticsInput[],
  database = db(),
): Promise<UpsertBpsStatisticsResult> {
  if (inputs.length === 0) {
    return { count: 0, rows: [] };
  }
  if (inputs.length > MAX_CACHED_STATISTICS_ROWS) {
    throw new RangeError(
      `Maksimal ${MAX_CACHED_STATISTICS_ROWS} agregat BPS dapat disimpan.`,
    );
  }

  const now = new Date();
  const rows = await database.transaction(async (transaction) => {
    const savedRows = await transaction
      .insert(bpsStatistics)
      .values(
        inputs.map((input) => ({
          indicatorCode: input.indicatorCode,
          indicatorName: input.indicatorName ?? input.indicatorCode,
          regionCode: input.regionCode,
          year: input.year,
          value: input.value,
          unit: input.unit,
          sourceLabel: SOURCE_LABEL,
          lastSyncedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: [
          bpsStatistics.indicatorCode,
          bpsStatistics.regionCode,
          bpsStatistics.year,
        ],
        set: {
          value: sql`excluded.value`,
          indicatorName: sql`excluded.indicator_name`,
          unit: sql`excluded.unit`,
          sourceLabel: SOURCE_LABEL,
          lastSyncedAt: now,
        },
      })
      .returning();

    await transaction.execute(sql`
      DELETE FROM bps_statistics
      WHERE id NOT IN (
        SELECT id
        FROM bps_statistics
        ORDER BY last_synced_at DESC, indicator_code, region_code, year
        LIMIT ${MAX_CACHED_STATISTICS_ROWS}
      )
    `);
    return savedRows;
  });

  logger.info("bps.service.upsert", {
    count: rows.length,
    sourceLabel: SOURCE_LABEL,
  });

  return { count: rows.length, rows };
}
