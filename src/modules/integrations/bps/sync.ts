import type { BpsAdapter } from "./adapter";
import { parseBpsResponse } from "./parser";
import { upsertBpsStatistics, type BpsStatisticsInput } from "./service";
import { logger } from "@/lib/logger";

export const BPS_STATISTIK_ENDPOINT = "/statistik/data";

export const DEFAULT_BPS_INDICATOR_CODE = "IND_BPS_UTAMA";
export const DEFAULT_BPS_UNIT = "orang";

export interface BpsSyncResult {
  readonly synced: boolean;
  readonly count: number;
  readonly error?: string;
}

/**
 * Mengambil data BPS melalui adapter, mem-parsisinya, lalu upsert ke
 * `bps_statistics` dengan `source_label = 'BPS_API'`.
 *
 * Jika BPS API gagal (4xx/5xx/timeout) atau respons tidak valid, fungsi ini
 * tidak melempar exception: mencatat warning ke logger dan mengembalikan
 * `{ synced: false }` agar data snapshot terakhir (termasuk SIMULATED dari
 * seed) tetap tersedia untuk publik.
 */
export async function syncBpsStatistics(
  adapter: BpsAdapter,
  endpoint: string = BPS_STATISTIK_ENDPOINT,
): Promise<BpsSyncResult> {
  try {
    const raw = await adapter.fetchJson(endpoint);
    const records = parseBpsResponse(raw);

    const inputs: BpsStatisticsInput[] = records.map((record) => ({
      indicatorCode: DEFAULT_BPS_INDICATOR_CODE,
      regionCode: record.regionCode,
      year: record.year,
      value: record.value,
      unit: DEFAULT_BPS_UNIT,
    }));

    const result = await upsertBpsStatistics(inputs);

    logger.info("bps.sync.completed", {
      count: result.count,
      sourceLabel: "BPS_API",
      endpoint,
    });

    return { synced: true, count: result.count };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "BPS sinkronisasi gagal";
    logger.warn("bps.sync.failed", {
      message,
      endpoint,
      sourceLabel: "SIMULATED",
    });
    return { synced: false, count: 0, error: message };
  }
}
