import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bpsStatistics } from "@/lib/db/schema";

export interface BpsStatisticsRow {
  readonly indicatorCode: string;
  readonly regionCode: string;
  readonly year: number;
  readonly value: number;
  readonly unit: string;
  readonly sourceLabel: string;
  readonly lastSyncedAt: Date;
}

export type BpsStatisticsSource = "BPS_API" | "SIMULATED" | null;

/**
 * Mengambil statistik BPS untuk ditampilkan publik dengan prioritas:
 * baris yang bersumber dari `BPS_API` diutamakan. Jika belum ada data
 * BPS_API sama sekali, baru fallback ke baris `SIMULATED` (hasil seed awal)
 * agar dashboard tidak kosong saat integrasi BPS belum sempurna.
 *
 * Tidak ada retry agresif di sini; keandalan dijamin oleh cron harian yang
 * menimpa baris SIMULATED dengan data BPS_API saat tersedia.
 */
export async function selectPublicBpsStatistics(
  database = db(),
): Promise<{
  readonly rows: readonly BpsStatisticsRow[];
  readonly source: BpsStatisticsSource;
}> {
  const bpsApiRows = await database
    .select()
    .from(bpsStatistics)
    .where(eq(bpsStatistics.sourceLabel, "BPS_API"))
    .orderBy(bpsStatistics.lastSyncedAt);

  if (bpsApiRows.length > 0) {
    return { rows: bpsApiRows, source: "BPS_API" };
  }

  const simulatedRows = await database
    .select()
    .from(bpsStatistics)
    .where(eq(bpsStatistics.sourceLabel, "SIMULATED"))
    .orderBy(bpsStatistics.lastSyncedAt);

  return {
    rows: simulatedRows,
    source: simulatedRows.length > 0 ? ("SIMULATED" as const) : null,
  };
}
