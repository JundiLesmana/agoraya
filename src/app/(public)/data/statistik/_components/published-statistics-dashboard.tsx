"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Download, Info, LoaderCircle } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { publishedStatisticInputsSchema } from "@/modules/statistics-input";
import { PublicCategoryDatasets } from "../../_components/public-category-datasets";

type PublishedEntry = z.infer<
  typeof publishedStatisticInputsSchema
>["entries"][number];

function downloadCsv(entries: readonly PublishedEntry[]) {
  const rows = [
    [
      "Wilayah",
      "Tahun",
      "Indikator",
      "Periode",
      "Nilai",
      "Satuan",
      "Sumber",
      "Metodologi",
      "Dipublikasikan",
    ],
    ...entries.flatMap((entry) =>
      entry.values.map((point) => [
        entry.regionName,
        String(entry.referenceYear),
        entry.indicatorName,
        point.periodValue,
        String(point.value),
        entry.unit,
        entry.sourceName,
        entry.methodology,
        entry.publishedAt,
      ]),
    ),
  ];
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${cell.replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\r\n");
  const url = URL.createObjectURL(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "statistik-asn-terpublikasi.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function latestPeriod(entry: PublishedEntry) {
  return [...entry.values].sort((left, right) =>
    left.periodValue.localeCompare(right.periodValue, "id"),
  ).at(-1);
}

export function PublishedStatisticsDashboard() {
  const [entries, setEntries] = useState<PublishedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [regionId, setRegionId] = useState("all");
  const [year, setYear] = useState("all");
  const [indicatorId, setIndicatorId] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function loadPublishedStatistics() {
      try {
        const response = await fetch("/api/v1/statistics/published", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Data statistik ASN tidak dapat dimuat.");
        }
        const payload: unknown = await response.json();
        const parsed = publishedStatisticInputsSchema.safeParse(payload);
        if (!parsed.success) {
          throw new Error("Format data statistik ASN tidak valid.");
        }
        setEntries(parsed.data.entries);
        setError(false);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadPublishedStatistics();
    return () => controller.abort();
  }, []);

  const regions = useMemo(
    () =>
      [...new Map(entries.map((entry) => [entry.regionId, entry.regionName]))]
        .map(([id, name]) => ({ id, name }))
        .sort((left, right) => left.name.localeCompare(right.name, "id")),
    [entries],
  );
  const years = useMemo(
    () => [...new Set(entries.map((entry) => entry.referenceYear))].sort(
      (left, right) => right - left,
    ),
    [entries],
  );
  const filteredEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (regionId === "all" || entry.regionId === regionId) &&
          (year === "all" || entry.referenceYear === Number(year)),
      ),
    [entries, regionId, year],
  );
  const indicators = useMemo(
    () =>
      [
        ...new Map(
          filteredEntries.map((entry) => [
            entry.indicatorId,
            entry.indicatorName,
          ]),
        ),
      ].map(([id, name]) => ({ id, name })),
    [filteredEntries],
  );
  const selectedIndicatorId =
    indicators.find((item) => item.id === indicatorId)?.id ??
    indicators[0]?.id ??
    "";
  const chartEntry = useMemo(() => {
    const matching = filteredEntries
      .filter((entry) => entry.indicatorId === selectedIndicatorId)
      .sort((left, right) =>
        right.publishedAt.localeCompare(left.publishedAt),
      );
    return matching[0];
  }, [filteredEntries, selectedIndicatorId]);
  const latestEntries = useMemo(() => {
    const latest = new Map<string, PublishedEntry>();
    for (const entry of filteredEntries) {
      const key = `${entry.regionId}:${entry.indicatorId}:${entry.referenceYear}`;
      const current = latest.get(key);
      if (!current || entry.publishedAt > current.publishedAt) {
        latest.set(key, entry);
      }
    }
    return [...latest.values()].sort(
      (left, right) =>
        left.regionName.localeCompare(right.regionName, "id") ||
        left.indicatorName.localeCompare(right.indicatorName, "id"),
    );
  }, [filteredEntries]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-border relative left-1/2 -mt-6 w-screen -translate-x-1/2 border-b bg-sky-50/70 py-6 dark:bg-sky-950/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground mb-4 text-xs"
          >
            <ol className="flex flex-wrap items-center gap-1">
              <li><Link href="/" className="hover:text-primary">Beranda</Link></li>
              <li aria-hidden="true">&gt;</li>
              <li><Link href="/data" className="hover:text-primary">Data Pemerintah</Link></li>
              <li aria-hidden="true">&gt;</li>
              <li aria-current="page" className="text-primary font-medium">Statistik daerah</li>
            </ol>
          </nav>
          <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
            Statistik Daerah
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7">
            Indikator statistik yang dipublikasikan melalui workspace ASN,
            ditampilkan sesuai wilayah, periode, dan sumber pelaporannya.
          </p>
        </div>
      </header>

      <nav
        aria-label="Kategori data pemerintah"
        className="border-border flex gap-6 overflow-x-auto border-b"
      >
        {[
          { label: "Ringkasan", href: "/data" },
          { label: "Anggaran", href: "/data/anggaran" },
          { label: "Proyek", href: "/data/project" },
          { label: "Statistik daerah", href: "/data/statistik", active: true },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.active ? "location" : undefined}
            className={`shrink-0 border-b-2 px-0 py-2.5 text-sm ${
              tab.active
                ? "border-primary text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      <Card className="gap-4 py-4 shadow-sm">
        <CardHeader className="px-4 py-0">
          <h2 className="text-sm font-semibold">Jelajahi statistik terpublikasi</h2>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 sm:grid-cols-3">
          <label className="space-y-1.5 text-xs font-medium">
            Wilayah
            <Select
              aria-label="Wilayah statistik"
              value={regionId}
              onChange={(event) => setRegionId(event.target.value)}
              options={[
                { value: "all", label: "Semua wilayah" },
                ...regions.map((region) => ({
                  value: region.id,
                  label: region.name,
                })),
              ]}
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Tahun
            <Select
              aria-label="Tahun statistik"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              options={[
                { value: "all", label: "Semua tahun" },
                ...years.map((item) => ({
                  value: String(item),
                  label: String(item),
                })),
              ]}
            />
          </label>
          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              disabled={filteredEntries.length === 0}
              onClick={() => downloadCsv(filteredEntries)}
            >
              <Download className="size-4" aria-hidden="true" />
              Unduh CSV
            </Button>
          </div>
        </CardContent>
        <p className="text-muted-foreground px-4 text-xs">
          {loading
            ? "Memuat data statistik terpublikasi…"
            : `${latestEntries.length} indikator · ${regionId === "all" ? "seluruh wilayah" : regions.find((item) => item.id === regionId)?.name} · ${year === "all" ? "semua tahun" : year}`}
        </p>
      </Card>

      {error ? (
        <p role="alert" className="text-destructive rounded-md border p-3 text-sm">
          Data statistik ASN tidak dapat dimuat. Coba muat ulang halaman.
        </p>
      ) : null}
      {loading ? (
        <div role="status" className="text-muted-foreground flex items-center gap-2 text-sm">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Memuat data terpublikasi…
        </div>
      ) : !error && latestEntries.length === 0 ? (
        <p role="status" className="text-muted-foreground rounded-lg border border-dashed p-5 text-sm">
          Belum ada data statistik ASN yang dipublikasikan untuk filter ini.
          Data draf tidak ditampilkan.
        </p>
      ) : null}

      {!loading && !error && latestEntries.length > 0 ? (
        <>
          <section aria-labelledby="statistics-indicators-title" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="statistics-indicators-title" className="text-lg font-semibold">
                  Indikator terpublikasi
                </h2>
                <p className="text-muted-foreground text-xs">
                  Satu publikasi terbaru per wilayah, indikator, dan tahun.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {latestEntries.map((entry) => {
                const point = latestPeriod(entry);
                return (
                  <Card key={`${entry.id}-${entry.referenceYear}`} className="gap-3 p-4 shadow-sm">
                    <CardHeader className="p-0">
                      <p className="text-muted-foreground text-xs">
                        {entry.regionName} · {entry.referenceYear}
                      </p>
                      <h3 className="font-semibold">{entry.indicatorName}</h3>
                    </CardHeader>
                    <CardContent className="space-y-1 p-0">
                      <p className="text-2xl font-semibold tabular-nums">
                        {point
                          ? new Intl.NumberFormat("id-ID", {
                              maximumFractionDigits: 2,
                            }).format(point.value)
                          : "—"}{" "}
                        <span className="text-muted-foreground text-sm font-normal">
                          {entry.unit}
                        </span>
                      </p>
                      <p className="text-muted-foreground text-xs">
                        Periode {point?.periodValue ?? "tidak tersedia"} · Sumber: {entry.sourceName}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section aria-labelledby="statistics-trend-title" className="space-y-3">
            <div>
              <h2 id="statistics-trend-title" className="text-lg font-semibold">
                Tren indikator
              </h2>
              <p className="text-muted-foreground text-xs">
                Nilai per periode dari publikasi terbaru untuk indikator terpilih.
              </p>
            </div>
            <Card className="shadow-sm">
              <CardHeader className="px-4 pt-4 pb-0">
                <label className="max-w-md space-y-1.5 text-xs font-medium">
                  Indikator
                  <Select
                    aria-label="Pilih indikator tren"
                    value={selectedIndicatorId}
                    onChange={(event) => setIndicatorId(event.target.value)}
                    options={indicators.map((item) => ({
                      value: item.id,
                      label: item.name,
                    }))}
                  />
                </label>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {chartEntry ? (
                  <p className="text-muted-foreground text-xs">
                    {chartEntry.regionName} · {chartEntry.referenceYear} ·{" "}
                    {chartEntry.sourceName}
                  </p>
                ) : null}
                {chartEntry?.values.length ? (
                  chartEntry.values.map((point) => {
                    const maxValue = Math.max(
                      ...chartEntry.values.map((item) => item.value),
                      1,
                    );
                    return (
                      <div key={`${point.periodValue}-${point.value}`}>
                        <div className="mb-1 flex justify-between gap-3 text-xs">
                          <span>{point.periodValue}</span>
                          <span className="font-semibold tabular-nums">
                            {new Intl.NumberFormat("id-ID", {
                              maximumFractionDigits: 2,
                            }).format(point.value)}{" "}
                            {chartEntry.unit}
                          </span>
                        </div>
                        <div
                          className="bg-muted h-2 rounded-full"
                          role="img"
                          aria-label={`${chartEntry.indicatorName}, ${point.periodValue}: ${point.value} ${chartEntry.unit}`}
                        >
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${Math.min((point.value / maxValue) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p role="status" className="text-muted-foreground text-sm">
                    Tidak ada nilai periode untuk indikator ini.
                  </p>
                )}
              </CardContent>
            </Card>
          </section>

          <section aria-labelledby="statistics-table-title">
            <Card className="shadow-sm">
              <CardHeader className="flex-row items-center justify-between gap-3 px-4 pt-4 pb-0">
                <div>
                  <h2 id="statistics-table-title" className="text-lg font-semibold">
                    Rincian publikasi statistik
                  </h2>
                  <p className="text-muted-foreground text-xs">
                    Setiap baris berasal dari input ASN berstatus terbit.
                  </p>
                </div>
                <Button
                  variant="outline"
                  disabled={filteredEntries.length === 0}
                  onClick={() => downloadCsv(filteredEntries)}
                >
                  <Download className="size-4" aria-hidden="true" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="overflow-x-auto">
                  <table
                    aria-labelledby="statistics-table-title"
                    className="w-full min-w-[700px] text-left text-xs"
                  >
                    <thead className="bg-muted/40 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3">Wilayah / indikator</th>
                        <th className="px-3 py-3">Tahun</th>
                        <th className="px-3 py-3">Nilai periode</th>
                        <th className="px-3 py-3">Sumber & metodologi</th>
                        <th className="px-3 py-3">Dipublikasikan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {filteredEntries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-accent/40">
                          <th className="px-3 py-3 font-medium">
                            {entry.regionName}
                            <span className="text-muted-foreground mt-1 block font-normal">
                              {entry.indicatorName}
                            </span>
                          </th>
                          <td className="px-3 py-3">{entry.referenceYear}</td>
                          <td className="px-3 py-3">
                            {entry.values.map((point) => (
                              <span key={point.periodValue} className="block">
                                {point.periodValue}: {new Intl.NumberFormat("id-ID", {
                                  maximumFractionDigits: 2,
                                }).format(point.value)} {entry.unit}
                              </span>
                            ))}
                          </td>
                          <td className="px-3 py-3">
                            {entry.sourceName}
                            <span className="text-muted-foreground mt-1 block">
                              {entry.methodology}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            {new Intl.DateTimeFormat("id-ID", {
                              dateStyle: "medium",
                            }).format(new Date(entry.publishedAt))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </section>

          <p className="text-muted-foreground flex items-start gap-2 rounded-md bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Nilai berasal dari publikasi ASN; perbedaan sumber, cakupan, dan
            metodologi perlu diperhatikan sebelum membandingkan wilayah.
          </p>
        </>
      ) : null}

      <PublicCategoryDatasets category="Statistik" />
    </div>
  );
}