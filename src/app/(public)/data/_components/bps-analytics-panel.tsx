"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { LineChart } from "@/components/charts/line-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { PublicCategoryDatasets } from "./public-category-datasets";

const BpsStatisticsResponseSchema = z.object({
  source: z.enum(["BPS_API", "SIMULATED"]).nullable(),
  data: z.array(
    z.object({
      year: z.number().int(),
      value: z.number(),
      unit: z.string(),
      regionCode: z.string(),
      indicatorCode: z.string(),
      indicatorName: z.string().optional(),
      category: z.string().optional(),
    }),
  ),
});
type BpsStatisticsResponse = z.infer<typeof BpsStatisticsResponseSchema>;

const EMPTY_RESPONSE: BpsStatisticsResponse = { source: null, data: [] };

export function BpsAnalyticsPanel({
  includeAllAsnCategories = false,
}: {
  includeAllAsnCategories?: boolean;
}) {
  const [response, setResponse] = useState(EMPTY_RESPONSE);
  const [selectedCategory, setSelectedCategory] = useState("Semua kategori");
  const [selectedIndicator, setSelectedIndicator] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function loadStatistics() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetch("/api/analytics/statistics", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!result.ok) throw new Error("Data statistik BPS gagal dimuat.");
        const payload: unknown = await result.json();
        if (
          typeof payload !== "object" ||
          payload === null ||
          !("data" in payload) ||
          !Array.isArray(payload.data)
        ) {
          throw new Error("Format data statistik BPS tidak valid.");
        }
        if (!controller.signal.aborted) {
          setResponse(BpsStatisticsResponseSchema.parse(payload));
        }
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Data statistik BPS gagal dimuat.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadStatistics();
    return () => controller.abort();
  }, []);

  const categories = useMemo(
    () =>
      [
        ...new Set(response.data.map((row) => row.category ?? "Statistik")),
      ].sort((left, right) => left.localeCompare(right, "id")),
    [response.data],
  );
  const indicators = useMemo(() => {
    const visibleRows =
      selectedCategory === "Semua kategori"
        ? response.data
        : response.data.filter(
            (row) => (row.category ?? "Statistik") === selectedCategory,
          );
    return [
      ...new Map(
        visibleRows.map((row) => [
          row.indicatorCode,
          {
            code: row.indicatorCode,
            name: row.indicatorName ?? row.indicatorCode,
            category: row.category ?? "Statistik",
          },
        ]),
      ).values(),
    ];
  }, [response.data, selectedCategory]);

  const indicatorCode = indicators.some(
    (indicator) => indicator.code === selectedIndicator,
  )
    ? selectedIndicator
    : (indicators[0]?.code ?? "");
  const indicatorRows = response.data.filter(
    (row) => row.indicatorCode === indicatorCode,
  );
  const regions = [...new Set(indicatorRows.map((row) => row.regionCode))].sort(
    (left, right) => left.localeCompare(right, "id"),
  );
  const regionCode = regions.includes(selectedRegion)
    ? selectedRegion
    : (regions[0] ?? "");
  const activeIndicator = indicators.find(
    (indicator) => indicator.code === indicatorCode,
  );
  const chartData = indicatorRows
    .filter((row) => row.regionCode === regionCode)
    .sort((left, right) => left.year - right.year)
    .map((row) => ({ year: row.year, value: row.value }));
  const unit =
    indicatorRows.find((row) => row.regionCode === regionCode)?.unit ?? "";

  return (
    <section aria-labelledby="bps-analytics-title" className="space-y-4">
      <Card className="border-border shadow-sm">
        <CardHeader className="px-4 pt-4 pb-2">
          <h2
            id="bps-analytics-title"
            className="text-base font-semibold tracking-tight"
          >
            Analitik statistik BPS
          </h2>
          <CardDescription className="text-xs">
            Respons BPS telah dinormalisasi menjadi indikator, kategori,
            wilayah, tahun, nilai, dan satuan. Data ASN ditampilkan sebagai
            metadata dataset, tanpa menjumlahkan indikator yang berbeda satuan.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-muted-foreground space-y-1 text-xs">
              Kategori data
              <select
                className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm"
                value={selectedCategory}
                onChange={(event) => {
                  setSelectedCategory(event.target.value);
                  setSelectedIndicator("");
                }}
              >
                <option>Semua kategori</option>
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="text-muted-foreground space-y-1 text-xs">
              Indikator
              <select
                className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm"
                value={indicatorCode}
                onChange={(event) => {
                  setSelectedIndicator(event.target.value);
                  setSelectedRegion("");
                }}
              >
                {indicators.map((indicator) => (
                  <option key={indicator.code} value={indicator.code}>
                    {indicator.name} · {indicator.category}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-muted-foreground space-y-1 text-xs">
              Kode wilayah
              <select
                className="border-input bg-background text-foreground h-10 w-full rounded-md border px-3 text-sm"
                value={regionCode}
                onChange={(event) => setSelectedRegion(event.target.value)}
              >
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {isLoading ? (
            <p
              role="status"
              className="text-muted-foreground py-12 text-center text-sm"
            >
              Memuat statistik BPS...
            </p>
          ) : error ? (
            <p
              role="alert"
              className="text-destructive py-8 text-center text-sm"
            >
              {error}
            </p>
          ) : chartData.length === 0 ? (
            <p
              role="status"
              className="text-muted-foreground py-8 text-center text-sm"
            >
              Belum ada data BPS terpublikasi untuk indikator ini.
            </p>
          ) : (
            <>
              <p className="text-muted-foreground text-xs">
                {activeIndicator?.name} · {activeIndicator?.category} · wilayah{" "}
                {regionCode} · satuan {unit}
              </p>
              <LineChart
                data={chartData}
                xKey="year"
                series={[
                  { key: "value", name: activeIndicator?.name ?? "Nilai" },
                ]}
                width="100%"
                height={280}
                showGrid
                showTooltip
                ariaLabel={`Grafik ${activeIndicator?.name ?? "indikator BPS"} wilayah ${regionCode}, satuan ${unit}`}
              />
              <p className="text-muted-foreground text-xs">
                Sumber:{" "}
                {response.source === "BPS_API"
                  ? "BPS API"
                  : "snapshot simulasi Agoraya"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      {includeAllAsnCategories ? (
        <div className="space-y-4">
          <PublicCategoryDatasets category="Statistik" />
          <PublicCategoryDatasets category="Anggaran" />
          <PublicCategoryDatasets category="Proyek" />
        </div>
      ) : (
        <PublicCategoryDatasets category="Statistik" />
      )}
    </section>
  );
}