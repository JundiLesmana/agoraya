"use client";

import { useCallback, useEffect, useState } from "react";
import { Info, RefreshCw } from "lucide-react";
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

function getIndicatorScale(
  id: WellbeingResponse["data"][number]["id"],
): number {
  switch (id) {
    case "kemiskinan":
      return 10;
    case "pengangguran":
    case "sekolah":
      return 15;
    case "harapan_hidup":
      return 100;
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

function WellbeingTable({
  data,
  fokus,
}: {
  data: WellbeingResponse;
  fokus: string;
}) {
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
        <p className="text-primary text-xs font-semibold tracking-wider uppercase">
          Kesejahteraan warga
        </p>
        <h2
          id="wellbeing-title"
          className="text-foreground text-2xl font-bold tracking-tight"
        >
          Apakah kondisi warga membaik?
        </h2>
        <p className="text-muted-foreground text-sm">
          {data.wilayah} · {data.periode}
        </p>
        <p className="text-muted-foreground text-xs">
          Simulasi sosial-ekonomi Agoraya
        </p>
      </header>

      <div>
        <div
          aria-label="Indikator kesejahteraan dibandingkan per tahun"
          className="mb-3 flex items-center gap-4 text-xs"
        >
          <span className="text-muted-foreground inline-flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm bg-slate-300"
              aria-hidden="true"
            />
            2023
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-2">
            <span
              className="size-2.5 rounded-sm bg-violet-600"
              aria-hidden="true"
            />
            2024
          </span>
        </div>
        <div className="space-y-3">
          {data.data.map((indicator) => {
            const color = determineColor(indicator, indicator.delta);
            const scale = getIndicatorScale(indicator.id);
            const value2023Width = Math.min(
              100,
              (indicator.value2023 / scale) * 100,
            );
            const value2024Width = Math.min(
              100,
              (indicator.value2024 / scale) * 100,
            );

            return (
              <article
                key={indicator.id}
                aria-label={indicator.label}
                className="bg-muted/30 rounded-lg p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="text-foreground text-xs font-semibold">
                    {indicator.label}
                  </h3>
                  <span className="text-muted-foreground shrink-0 text-[10px]">
                    0–{scale}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 text-[10px]">
                    <span className="text-muted-foreground">2023</span>
                    <div
                      role="meter"
                      aria-label={`${indicator.label}, 2023`}
                      aria-valuemin={0}
                      aria-valuemax={scale}
                      aria-valuenow={indicator.value2023}
                      className="bg-muted h-2 overflow-hidden rounded-full"
                    >
                      <div
                        className="h-full rounded-full bg-slate-300"
                        style={{ width: `${value2023Width}%` }}
                      />
                    </div>
                    <span className="text-foreground text-right font-semibold tabular-nums">
                      {formatIndicatorValue(indicator.value2023)}
                    </span>
                  </div>
                  <div className="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-2 text-[10px]">
                    <span className="text-muted-foreground">2024</span>
                    <div
                      role="meter"
                      aria-label={`${indicator.label}, 2024`}
                      aria-valuemin={0}
                      aria-valuemax={scale}
                      aria-valuenow={indicator.value2024}
                      className="bg-muted h-2 overflow-hidden rounded-full"
                    >
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{ width: `${value2024Width}%` }}
                      />
                    </div>
                    <span className="text-foreground text-right font-semibold tabular-nums">
                      {formatIndicatorValue(indicator.value2024)}
                    </span>
                  </div>
                </div>
                <p
                  className={`mt-2 text-[10px] font-semibold ${deltaColorClass(color)}`}
                >
                  {indicator.delta < 0 ? "Turun" : "Naik"}{" "}
                  {formatIndicatorValue(Math.abs(indicator.delta))}{" "}
                  {indicator.unit}
                </p>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  {indicator.direction === "lower-is-better"
                    ? "Lebih rendah lebih baik"
                    : "Lebih tinggi lebih baik"}
                </p>
              </article>
            );
          })}
        </div>
        <div className="sr-only">
          <table>
            <caption>
              Perbandingan indikator kesejahteraan {fokus} tahun 2023 dan 2024
            </caption>
            <thead>
              <tr>
                <th scope="col">Indikator</th>
                <th scope="col">2023</th>
                <th scope="col">2024</th>
                <th
                  scope="col"
                  aria-label="Perubahan; hijau berarti indikator membaik dan merah berarti memburuk"
                >
                  Perubahan
                </th>
                <th scope="col">Interpretasi</th>
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
                  <tr key={indicator.id}>
                    <th scope="row">{indicator.label}</th>
                    <td>{formatIndicatorValue(indicator.value2023)}</td>
                    <td>{formatIndicatorValue(indicator.value2024)}</td>
                    <td>
                      {formatDelta(indicator.delta, indicator.unit)},{" "}
                      {direction}
                    </td>
                    <td>
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

export function WellbeingIndicators({
  fokus = "Kota Bandung",
}: {
  fokus?: string;
}) {
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

  return <WellbeingTable data={data} fokus={fokus} />;
}
