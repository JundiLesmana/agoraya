import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { selectPublicBpsStatistics } from "@/modules/integrations/bps/repository";

export const dynamic = "force-dynamic";

const StatisticsQuerySchema = z.object({
  indicator: z.string().min(1, "kode indikator tidak boleh kosong").optional(),
  region: z.string().min(1, "kode wilayah tidak boleh kosong").optional(),
  latest: z.enum(["true", "false"]).optional(),
});

const INDICATOR_ALIASES: Readonly<Record<string, string>> = {
  POV: "IND_KEMISKINAN",
};

export type StatisticsResponse = {
  readonly source: "BPS_API" | "SIMULATED" | null;
  readonly indicator: string | undefined;
  readonly region: string | undefined;
  readonly count: number;
  readonly data: readonly {
    readonly year: number;
    readonly value: number;
    readonly regionCode: string;
    readonly indicatorCode: string;
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
 * serta `source` untuk men label provenance data di sisi klien.
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

  const indicatorCode = parsed.data.indicator
    ? (INDICATOR_ALIASES[parsed.data.indicator] ?? parsed.data.indicator)
    : undefined;
  const { rows: queryRows, source } = await selectPublicBpsStatistics(db(), {
    indicatorCode,
    regionCode: parsed.data.region,
  });
  const orderedRows = [...queryRows].sort(
    (left, right) =>
      left.year - right.year || left.regionCode.localeCompare(right.regionCode),
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
      regionCode: row.regionCode,
      indicatorCode: row.indicatorCode,
    })),
  };

  return NextResponse.json(response);
}
