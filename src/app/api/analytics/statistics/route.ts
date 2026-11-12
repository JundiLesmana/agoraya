import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { categorizeBpsIndicator } from "@/modules/integrations/bps/category";
import { selectPublicBpsStatistics } from "@/modules/integrations/bps/repository";

export const dynamic = "force-dynamic";

const StatisticsQuerySchema = z.object({
  indicator: z.string().min(1, "kode indikator tidak boleh kosong").optional(),
  region: z.string().min(1, "kode wilayah tidak boleh kosong").optional(),
  latest: z.enum(["true", "false"]).optional(),
});

const BPS_INDICATOR_ALIASES = new Map([
  ["POV", "bps:0000:192:434:61"],
  ["IND_KEMISKINAN", "bps:0000:192:434:61"],
  ["IND_PENDUDUK", "bps:0000:1886:585:0"],
  ["IND_IPM", "bps:0000:413:0:0"],
  ["IND_SANITASI", "bps:0000:847:0:0"],
]);

const SIMULATED_INDICATOR_ALIASES = new Map([
  ["POV", "IND_KEMISKINAN"],
  ["IND_KEMISKINAN", "IND_KEMISKINAN"],
  ["IND_PENDUDUK", "IND_PENDUDUK"],
]);

function normalizePublicRegionCode(regionCode: string): string {
  if (
    /^\d{4}$/.test(regionCode) &&
    regionCode.endsWith("00") &&
    !regionCode.startsWith("00")
  ) {
    return regionCode.slice(0, 2);
  }
  return regionCode;
}

export type StatisticsResponse = {
  readonly source: "BPS_API" | "SIMULATED" | null;
  readonly indicator: string | undefined;
  readonly region: string | undefined;
  readonly count: number;
  readonly data: readonly {
    readonly year: number;
    readonly value: number;
    readonly unit: string;
    readonly regionCode: string;
    readonly indicatorCode: string;
    readonly indicatorName: string;
    readonly category: string;
  }[];
};

/**
 * Endpoint statistik publik yang sudah teragregasi dan siap dikonsumsi
 * frontend (Recharts).
 *
 * Query parameter:
 * - `indicator`: kode indikator (misal `POV`, `IND_KEMISKINAN`) — opsional
 * - `region`: kode wilayah BPS (misal `31`, `3201`) — opsional
 * - `latest=true`: hanya baris tahun terbaru untuk setiap wilayah
 *
 * Respons berisi `data` dalam bentuk `[{ year, value }]` siap dipakai Recharts,
 * dilengkapi nama dan kategori indikator serta `source` untuk provenance.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const parsed = StatisticsQuerySchema.safeParse({
    indicator: url.searchParams.get("indicator") ?? undefined,
    region: url.searchParams.get("region") ?? undefined,
    latest: url.searchParams.get("latest") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parameter query tidak valid." },
      { status: 400 },
    );
  }

  const requestedIndicator = parsed.data.indicator;
  const indicatorCode = requestedIndicator
    ? (BPS_INDICATOR_ALIASES.get(requestedIndicator) ?? requestedIndicator)
    : undefined;
  const regionCode = parsed.data.region;
  const bpsRegionCode =
    regionCode && /^\d{2}$/.test(regionCode) ? `${regionCode}00` : regionCode;
  const { rows: queryRows, source } = await selectPublicBpsStatistics(db(), {
    indicatorCode,
    regionCode: bpsRegionCode,
    simulatedIndicatorCode: requestedIndicator
      ? SIMULATED_INDICATOR_ALIASES.get(requestedIndicator)
      : undefined,
    simulatedRegionCode: regionCode,
  });
  const orderedRows = queryRows
    .map((row) => ({
      ...row,
      regionCode:
        source === "BPS_API"
          ? normalizePublicRegionCode(row.regionCode)
          : row.regionCode,
    }))
    .sort(
      (left, right) =>
        left.year - right.year ||
        left.regionCode.localeCompare(right.regionCode),
    );
  const rows =
    parsed.data.latest === "true"
      ? Array.from(
          orderedRows.reduce((latestByRegion, row) => {
            const latest = latestByRegion.get(row.regionCode);
            if (!latest || row.year > latest.year) {
              latestByRegion.set(row.regionCode, row);
            }
            return latestByRegion;
          }, new Map<string, (typeof orderedRows)[number]>()),
          ([, row]) => row,
        ).sort((left, right) => left.regionCode.localeCompare(right.regionCode))
      : orderedRows;

  const response: StatisticsResponse = {
    source,
    indicator: indicatorCode,
    region: parsed.data.region,
    count: rows.length,
    data: rows.map((row) => ({
      year: row.year,
      value: Number(row.value),
      unit: row.unit,
      regionCode: row.regionCode,
      indicatorCode: row.indicatorCode,
      indicatorName: row.indicatorName || row.indicatorCode,
      category: categorizeBpsIndicator(row.indicatorName || row.indicatorCode),
    })),
  };

  return NextResponse.json(response);
}
