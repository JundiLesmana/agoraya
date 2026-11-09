import type { BpsAdapter } from "./adapter";
import { upsertBpsDatasetCatalog } from "./catalog";
import {
  MAX_BPS_RECORDS_PER_SYNC,
  parseBpsIndicatorSelectors,
  parseBpsResponse,
  parseLatestBpsYear,
} from "./parser";
import { upsertBpsStatistics, type BpsStatisticsInput } from "./service";
import { logger } from "@/lib/logger";

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
  indicatorConfiguration: string | undefined,
): Promise<BpsSyncResult> {
  let inputs: BpsStatisticsInput[];
  try {
    const selectors = parseBpsIndicatorSelectors(indicatorConfiguration ?? "");
    const inputsByKey = new Map<string, BpsStatisticsInput>();
    for (const selector of selectors) {
      const yearsEndpoint = `/list/model/th/lang/ind/domain/${selector.domain}/var/${selector.indicatorId}`;
      const latest = parseLatestBpsYear(await adapter.fetchJson(yearsEndpoint));
      const dataEndpoint = `/list/model/data/domain/${selector.domain}/var/${selector.indicatorId}/th/${latest.yearId}`;
      const records = parseBpsResponse(
        await adapter.fetchJson(dataEndpoint),
        selector,
        latest.yearId,
        latest.year,
      );
      for (const record of records) {
        inputsByKey.set(
          JSON.stringify([
            record.indicatorCode,
            record.regionCode,
            record.year,
          ]),
          record,
        );
        if (inputsByKey.size > MAX_BPS_RECORDS_PER_SYNC) {
          throw new RangeError(
            `Respons BPS melebihi batas ${MAX_BPS_RECORDS_PER_SYNC} agregat.`,
          );
        }
      }
    }
    inputs = [...inputsByKey.values()];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "BPS sinkronisasi gagal";
    logger.warn("bps.sync.failed", {
      message,
      sourceLabel: "SIMULATED",
    });
    return { synced: false, count: 0, error: message };
  }

  const result = await upsertBpsStatistics(inputs);
  await upsertBpsDatasetCatalog();

  logger.info("bps.sync.completed", {
    count: result.count,
    sourceLabel: "BPS_API",
    catalogUpdated: true,
  });

  return { synced: true, count: result.count };
}
