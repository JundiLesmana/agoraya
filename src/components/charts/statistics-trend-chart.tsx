"use client";

import { useEffect, useState } from "react";
import { LineChart } from "./line-chart";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatisticsTrendChartProps {
  /** Kode indikator (misal `IND_KEMISKINAN`). */
  indicator: string;
  /** Kode wilayah BPS (misal `31`, `3201`). */
  region: string;
  /** Tinggi grafik. */
  height?: number;
  /** Kelas tambahan. */
  className?: string;
  /** ARIA label grafik. */
  ariaLabel?: string;
}

interface StatisticsPayload {
  readonly source: "BPS_API" | "SIMULATED" | null;
  readonly data: readonly {
    readonly year: number;
    readonly value: number;
    readonly regionCode: string;
    readonly indicatorCode: string;
  }[];
}

export function StatisticsTrendChart({
  indicator,
  region,
  height = 300,
  className,
  ariaLabel = "Grafik tren indikator statistik",
}: StatisticsTrendChartProps) {
  const [data, setData] = useState<
    { readonly year: number; readonly value: number }[]
  >([]);
  const [source, setSource] = useState<"BPS_API" | "SIMULATED" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setError(null);
      setLoading(true);
      try {
        const response = await fetch(
          `/api/analytics/statistics?indicator=${encodeURIComponent(indicator)}&region=${encodeURIComponent(
            region,
          )}`,
        );
        if (!response.ok) throw new Error("Data statistik tidak dapat dimuat.");
        const payload = (await response.json()) as StatisticsPayload;
        if (!active) return;
        setSource(payload.source);
        setData(
          payload.data.map((row) => ({
            year: row.year,
            value: row.value,
          })),
        );
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat grafik statistik.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [indicator, region]);

  if (loading) {
    return (
      <Card className={cn("min-w-0 shadow-sm", className)}>
        <CardHeader className="px-4 py-3">
          <span className="text-sm font-medium">Tren {indicator}</span>
        </CardHeader>
        <CardContent
          aria-label="Memuat grafik statistik"
          className="space-y-3 p-4"
          role="status"
        >
          <div
            aria-hidden="true"
            className="bg-muted h-32 w-full animate-pulse rounded-xl"
          />
          <div
            aria-hidden="true"
            className="bg-muted h-6 w-2/5 animate-pulse rounded-md"
          />
          <div
            aria-hidden="true"
            className="bg-muted h-6 w-1/3 animate-pulse rounded-md"
          />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className={cn(
          "border-destructive/30 min-w-0 border shadow-sm",
          className,
        )}
      >
        <CardContent className="text-destructive p-4 text-center text-sm">
          {error}
        </CardContent>
      </Card>
    );
  }

  const seriesName = "Nilai";
  return (
    <Card className={cn("min-w-0 shadow-sm", className)}>
      <CardHeader className="flex-row items-center justify-between px-4 py-3">
        <div>
          <span className="text-sm font-medium">Tren {indicator}</span>
          <p className="text-muted-foreground text-xs">
            Wilayah {region} · data dari analitik teragregasi
          </p>
        </div>
        {source && (
          <SourceBadge
            source={source}
            label={
              source === "BPS_API"
                ? "Sumber: BPS API"
                : "Sumber: Data Simulasi (Demo)"
            }
          />
        )}
      </CardHeader>
      <CardContent className="p-4">
        {data.length === 0 ? (
          <p
            role="status"
            className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm"
          >
            Tidak ada data indikator {indicator} untuk wilayah {region}.
          </p>
        ) : (
          <LineChart
            data={data}
            xKey="year"
            series={[{ key: "value", name: seriesName }]}
            width="100%"
            height={height}
            ariaLabel={ariaLabel}
          />
        )}
      </CardContent>
    </Card>
  );
}
