"use client";

import { useCallback, useEffect, useState } from "react";
import { Info, RefreshCw } from "lucide-react";
import { SourceBadge } from "@/components/source-badges";
import {
  determineColor,
  formatDelta,
  formatIndicatorValue,
  WELLBEING_INDICATOR_IDS,
  wellbeingResponseSchema,
  type WellbeingResponse,
} from "@/lib/insight-kesejahteraan";

const INDICATORS_QUERY = WELLBEING_INDICATOR_IDS.join(",");

function deltaColorClass(color: "green" | "red" | "neutral"): string {
  switch (color) {
    case "green":
      return "text-emerald-700 dark:text-emerald-400";
    case "red":
      return "text-red-700 dark:text-red-400";
    case "neutral":
      return "text-muted-foreground";
  }
}

function WellbeingSkeleton() {
  return (
    <section
      aria-label="Memuat indikator kesejahteraan"
      aria-busy="true"
      className="border-border bg-card animate-pulse space-y-4 rounded-xl border p-5"
    >
      <span className="sr-only">Memuat indikator kesejahteraan...</span>
      <div className="bg-muted h-7 w-2/3 rounded" />
      <div className="bg-muted h-4 w-1/2 rounded" />
      <div className="bg-muted h-48 rounded" />
    </section>
  );
}

function WellbeingError({ onRetry }: { onRetry: () => void }) {
  return (
    <section
      aria-labelledby="wellbeing-title"
      className="border-border bg-card rounded-xl border p-5"
    >
      <h2 id="wellbeing-title" className="text-xl font-semibold">
        Apakah kondisi warga membaik?
      </h2>
      <div
        role="alert"
        className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
      >
        <span>Gagal memuat indikator kesejahteraan.</span>
        <button
          type="button"
          onClick={onRetry}
          className="focus-visible:outline-primary inline-flex items-center gap-2 font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Coba lagi
        </button>
      </div>
    </section>
  );
}

function WellbeingTable({ data }: { data: WellbeingResponse }) {
  if (data.data.length === 0) {
    return (
      <section
        aria-labelledby="wellbeing-title"
        className="border-border bg-card rounded-xl border p-5"
      >
        <h2 id="wellbeing-title" className="text-xl font-semibold">
          Apakah kondisi warga membaik?
        </h2>
        <p role="status" className="text-muted-foreground mt-4 text-sm">
          Belum ada data indikator kesejahteraan.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="wellbeing-title"
      className="border-border bg-card space-y-5 rounded-xl border p-5 sm:p-6"
    >
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            Kesejahteraan warga
          </p>
          <SourceBadge
            source="SIMULATED"
            label="Data contoh"
            withIcon={false}
          />
        </div>
        <h2
          id="wellbeing-title"
          className="text-foreground text-2xl font-bold tracking-tight"
        >
          Apakah kondisi warga membaik?
        </h2>
        <p className="text-muted-foreground text-sm">
          {data.wilayah} · {data.periode} · Data contoh
        </p>
        <p className="text-muted-foreground text-xs">
          Simulasi sosial-ekonomi Agoraya
        </p>
      </header>

      <div
        role="region"
        aria-label="Tabel indikator kesejahteraan, dapat digulir horizontal"
        tabIndex={0}
        className="focus-visible:outline-primary overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <caption className="sr-only">
            Perbandingan indikator kesejahteraan Kota Bandung tahun 2023 dan
            2024
          </caption>
          <thead>
            <tr className="border-border text-muted-foreground border-b">
              <th scope="col" className="px-3 py-3 font-semibold">
                Indikator
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                2023
              </th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">
                2024
              </th>
              <th
                scope="col"
                aria-label="Perubahan; hijau berarti indikator membaik dan merah berarti memburuk"
                className="px-3 py-3 font-semibold"
              >
                Perubahan
              </th>
              <th scope="col" className="px-3 py-3 font-semibold">
                Interpretasi
              </th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((indicator) => {
              const color = determineColor(indicator, indicator.delta);
              const direction =
                color === "green"
                  ? "membaik"
                  : color === "red"
                    ? "memburuk"
                    : "tidak berubah";

              return (
                <tr
                  key={indicator.id}
                  className="border-border border-b last:border-0"
                >
                  <th scope="row" className="px-3 py-4 font-medium">
                    {indicator.label}
                  </th>
                  <td className="px-3 py-4 text-right tabular-nums">
                    {formatIndicatorValue(indicator.value2023)}
                  </td>
                  <td className="px-3 py-4 text-right tabular-nums">
                    {formatIndicatorValue(indicator.value2024)}
                  </td>
                  <td className="px-3 py-4">
                    <span className={`font-semibold ${deltaColorClass(color)}`}>
                      {formatDelta(indicator.delta, indicator.unit)}
                      <span className="sr-only">, {direction}</span>
                    </span>
                  </td>
                  <td className="text-muted-foreground px-3 py-4">
                    {indicator.direction === "lower-is-better"
                      ? "Lebih rendah = lebih baik"
                      : "Lebih tinggi = lebih baik"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <aside className="border-primary bg-muted/60 flex gap-3 rounded-lg border-l-4 p-4 text-sm">
        <Info
          className="text-primary mt-0.5 size-5 shrink-0"
          aria-hidden="true"
        />
        <p className="text-foreground leading-relaxed">
          Empat indikator bergerak membaik. Perubahan ini belum membuktikan
          dampak anggaran. Setiap indikator membutuhkan waktu berbeda.
        </p>
      </aside>
    </section>
  );
}

export function WellbeingIndicators() {
  const [data, setData] = useState<WellbeingResponse | null>(null);
  const [hasError, setHasError] = useState(false);

  const fetchData = useCallback(async () => {
    setHasError(false);

    try {
      const response = await fetch(
        `/api/insight/kesejahteraan?indikator=${INDICATORS_QUERY}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error("Gagal memuat indikator kesejahteraan.");
      }

      const result = wellbeingResponseSchema.parse(await response.json());
      setData(result);
    } catch {
      setHasError(true);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (hasError) {
    return <WellbeingError onRetry={() => void fetchData()} />;
  }

  if (!data) {
    return <WellbeingSkeleton />;
  }

  return <WellbeingTable data={data} />;
}
