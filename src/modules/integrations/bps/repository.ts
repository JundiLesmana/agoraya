import { and, eq } from "drizzle-orm";
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

export interface BpsStatisticsFilters {
  readonly indicatorCode?: string;
  readonly regionCode?: string;
}

/**
 * Membangun query statistik BPS dengan filter indikator dan wilayah.
 * Semua filter bersifat opsional; ketika dikosongkan, query mengambil semua
 * baris untuk source_label yang ditentukan.
 */
function buildStatisticsQuery(
  database: ReturnType<typeof db>,
  sourceLabel: "BPS_API" | "SIMULATED",
  filters: BpsStatisticsFilters,
) {
  const conditions = [eq(bpsStatistics.sourceLabel, sourceLabel)];
  if (filters.indicatorCode) {
    conditions.push(eq(bpsStatistics.indicatorCode, filters.indicatorCode));
  }
  if (filters.regionCode) {
    conditions.push(eq(bpsStatistics.regionCode, filters.regionCode));
  }
  return database
    .select()
    .from(bpsStatistics)
    .where(and(...conditions))
    .orderBy(bpsStatistics.lastSyncedAt);
}

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
  filters: BpsStatisticsFilters = {},
): Promise<{
  readonly rows: readonly BpsStatisticsRow[];
  readonly source: BpsStatisticsSource;
}> {
  const bpsApiRows = await buildStatisticsQuery(database, "BPS_API", filters);

  if (bpsApiRows.length > 0) {
    return { rows: bpsApiRows, source: "BPS_API" };
  }

  const simulatedRows = await buildStatisticsQuery(database, "SIMULATED", filters);

  return {
    rows: simulatedRows,
    source: simulatedRows.length > 0 ? ("SIMULATED" as const) : null,
  };
}
