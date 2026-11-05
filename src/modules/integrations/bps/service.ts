import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { bpsStatistics } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

const SOURCE_LABEL = "BPS_API";

export interface BpsStatisticsInput {
  readonly indicatorCode: string;
  readonly regionCode: string;
  readonly year: number;
  readonly value: number;
  readonly unit: string;
}

export interface UpsertBpsStatisticsResult {
  readonly count: number;
  readonly rows: readonly unknown[];
}

/**
 * Menyimpan statistik BPS secara idempoten. Jika baris untuk kombinasi
 * (indicator_code, region_code, year) sudah ada, hanya `value` dan
 * `last_synced_at` yang diperbarui, sehingga eksekusi berulang (CRON harian)
 * tidak membengkakkan tabel. `source_label` diisi secara otomatis dengan
 * 'BPS_API'.
 */
export async function upsertBpsStatistics(
  inputs: readonly BpsStatisticsInput[],
  database = db(),
): Promise<UpsertBpsStatisticsResult> {
  if (inputs.length === 0) {
    return { count: 0, rows: [] };
  }

  const now = new Date();
  const rows = await database
    .insert(bpsStatistics)
    .values(
      inputs.map((input) => ({
        indicatorCode: input.indicatorCode,
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
        lastSyncedAt: now,
      },
    })
    .returning();

  logger.info("bps.service.upsert", {
    count: rows.length,
    sourceLabel: SOURCE_LABEL,
  });

  return { count: rows.length, rows };
}
