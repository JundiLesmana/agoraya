import { randomUUID } from "crypto";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../../src/lib/db/schema/index.js";
import { bpsSnapshots, bpsStatistics } from "../../src/lib/db/schema/index.js";

export const BPS_SNAPSHOT_SEEDS = [
  {
    dataset: "penduduk_menurut_provinsi",
    region: "DKI Jakarta",
    year: 2024,
    month: 12,
    payload: {
      total: 10562088,
      unit: "jiwa",
      note: "Simulated snapshot for demo purposes only.",
    },
  },
  {
    dataset: "kemiskinan_menurut_kabupaten_kota",
    region: "Jawa Barat",
    year: 2024,
    month: 6,
    payload: {
      jumlah_penduduk_miskin: 3420000,
      persentase: 7.4,
      unit: "orang",
      note: "Simulated snapshot for demo purposes only.",
    },
  },
  {
    dataset: "indeks_pembangunan_manusia",
    region: "Nasional",
    year: 2023,
    month: 12,
    payload: {
      ipm: 72.29,
      unit: "indeks",
      note: "Simulated snapshot for demo purposes only.",
    },
  },
] as const;

/**
 * Upsert BPS snapshots. Matched on (dataset, region, year, month).
 * Idempotent: safe to run repeatedly.
 */
export async function seedBpsSnapshots(
  dbx: PostgresJsDatabase<typeof schema>,
): Promise<number> {
  let inserted = 0;
  for (const s of BPS_SNAPSHOT_SEEDS) {
    await dbx
      .insert(bpsSnapshots)
      .values({
        id: randomUUID(),
        dataset: s.dataset,
        region: s.region,
        year: s.year,
        month: s.month,
        payload: s.payload,
        sourceLabel: "SIMULATED",
      })
      .onConflictDoUpdate({
        target: [
          bpsSnapshots.dataset,
          bpsSnapshots.region,
          bpsSnapshots.year,
          bpsSnapshots.month,
        ],
        set: {
          payload: s.payload,
          sourceLabel: "SIMULATED",
          updatedAt: new Date(),
        },
      });
    inserted += 1;
  }
  return inserted;
}

export const BPS_STATISTICS_SIMULATED_SEEDS = [
  /**
   * Tingkat kemiskinan (IND_KEMISKINAN) per provinsi — data simulasi untuk
   * demo dashboard publik. Kode wilayah pakai kode provinsi BPS (2 digit,
   * misal `31` = DKI Jakarta) agar cocok dengan GeoJSON statis di /public.
   */
  { indicatorCode: "IND_KEMISKINAN", regionCode: "31", year: 2021, value: 11.04, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "31", year: 2022, value: 10.50, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "31", year: 2023, value: 9.80, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "31", year: 2024, value: 9.20, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "31", year: 2025, value: 8.70, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "32", year: 2024, value: 7.40, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "32", year: 2025, value: 7.10, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "33", year: 2024, value: 9.10, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "33", year: 2025, value: 8.80, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "35", year: 2024, value: 10.20, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "35", year: 2025, value: 9.90, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_KEMISKINAN", regionCode: "36", year: 2024, value: 8.30, unit: "persen", category: "Kesejahteraan" },
  { indicatorCode: "IND_PENDUDUK", regionCode: "31", year: 2024, value: 10562088, unit: "jiwa", category: "Penduduk" },
  { indicatorCode: "IND_PENDUDUK", regionCode: "32", year: 2024, value: 48200000, unit: "jiwa", category: "Penduduk" },
  { indicatorCode: "IND_PENDUDUK", regionCode: "33", year: 2024, value: 37000000, unit: "jiwa", category: "Penduduk" },
  { indicatorCode: "IND_PENDUDUK", regionCode: "35", year: 2024, value: 40000000, unit: "jiwa", category: "Penduduk" },
  { indicatorCode: "IND_IPM", regionCode: "NASIONAL", year: 2023, value: 72.29, unit: "indeks", category: "Kesejahteraan" },
] as const;

/**
 * Seed awal statistik BPS dengan source_label = 'SIMULATED'. Idempoten:
 * baris yang sudah ada (termasuk yang sudah ditimpa BPS_API oleh cron) tidak
 * ditimpa kembali, sehingga data publikasi BPS asli tetap terjangkau setelah
 * sinkronisasi berhasil.
 */
export async function seedBpsStatisticsSimulated(
  dbx: PostgresJsDatabase<typeof schema>,
): Promise<number> {
  let inserted = 0;
  for (const s of BPS_STATISTICS_SIMULATED_SEEDS) {
    await dbx
      .insert(bpsStatistics)
      .values({
        indicatorCode: s.indicatorCode,
        regionCode: s.regionCode,
        year: s.year,
        value: s.value,
        unit: s.unit,
        category: s.category,
        sourceLabel: "SIMULATED",
        lastSyncedAt: new Date(),
      })
      .onConflictDoNothing({
        target: [
          bpsStatistics.indicatorCode,
          bpsStatistics.regionCode,
          bpsStatistics.year,
        ],
      });
    inserted += 1;
  }
  return inserted;
}
