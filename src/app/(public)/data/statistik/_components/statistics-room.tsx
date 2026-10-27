"use client";

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Clock3,
  Download,
  FileText,
  Heart,
  MessageSquareWarning,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { ServiceSpaceNavigation } from "@/components/service-space-navigation";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  publicStatisticsDashboardSchema,
  type PublicStatisticsDashboard,
} from "@/modules/analytics/public-statistics-contract";
import { formatCompactNumber } from "@/lib/statistics-format";

const PERIOD_OPTIONS = [
  { value: "this-month", label: "Bulan ini" },
  { value: "this-quarter", label: "Kuartal ini" },
  { value: "this-year", label: "Tahun ini" },
  { value: "custom", label: "Kustom" },
];
const LEGEND_COLOR_CLASSES = [
  "bg-blue-600",
  "bg-orange-500",
  "bg-cyan-600",
  "bg-violet-600",
  "bg-emerald-600",
  "bg-red-600",
  "bg-amber-600",
  "bg-pink-600",
] as const;

const REGION_OPTIONS = [
  { value: "all", label: "Semua wilayah" },
  { value: "jabar", label: "Jawa Barat" },
  { value: "jateng", label: "Jawa Tengah" },
  { value: "jatim", label: "Jawa Timur" },
];

interface StatisticsFilters {
  period: string;
  region: string;
  startDate: string;
  endDate: string;
}

const INITIAL_FILTERS: StatisticsFilters = {
  period: "this-year",
  region: "all",
  startDate: "",
  endDate: "",
};

function displayedCount(value: number | null): string {
  return value === null ? "< 5" : formatCompactNumber(value);
}

function displayedMetric(value: number | null, suffix = ""): string {
  return value === null
    ? "Tidak cukup data"
    : `${value.toLocaleString("id-ID", { maximumFractionDigits: 1 })}${suffix}`;
}

function trendLabel(value: number | null): string {
  if (value === null) return "Belum cukup data pembanding";
  return `${Math.abs(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`;
}

function toCsvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function createStatisticsCsv(dashboard: PublicStatisticsDashboard): string {
  const rows: (string | number)[][] = [
    ["Ringkasan Ruang Statistik"],
    ["Periode", dashboard.periodLabel],
    ["Wilayah", dashboard.regionLabel],
    [],
    ["Metrik", "Nilai", "Perubahan"],
    [
      "Total Pengajuan",
      displayedCount(dashboard.kpis.totalApplications),
      trendLabel(dashboard.kpis.applicationTrend),
    ],
    [
      "Total Pengaduan",
      displayedCount(dashboard.kpis.totalComplaints),
      trendLabel(dashboard.kpis.complaintTrend),
    ],
    [
      "Rata-rata Waktu Penyelesaian (hari)",
      displayedMetric(dashboard.kpis.averageResolutionDays),
      trendLabel(dashboard.kpis.resolutionTrend),
    ],
    [
      "Tingkat Kepuasan (%)",
      displayedMetric(dashboard.kpis.satisfactionRate),
      trendLabel(dashboard.kpis.satisfactionTrend),
    ],
    [],
    ["Tren", "Pengajuan", "Pengaduan"],
    ...dashboard.trends.map((item) => [
      item.label,
      displayedCount(item.applications),
      displayedCount(item.complaints),
    ]),
    [],
    ["Distribusi Layanan", "Jumlah"],
    ...dashboard.serviceDistribution.map((item) => [
      item.name,
      displayedCount(item.value),
    ]),
    [],
    ["Wilayah", "Jumlah Pengajuan"],
    ...dashboard.topRegions.map((item) => [
      item.region,
      displayedCount(item.applications),
    ]),
    [],
    [
      "Layanan Bottleneck",
      "Instansi",
      "Volume",
      "Target (hari)",
      "Rata-rata (hari)",
      "Deviasi (%)",
    ],
    ...dashboard.bottlenecks.map((item) => [
      item.service,
      item.agency,
      displayedCount(item.volume),
      item.targetDays,
      item.averageDays,
      item.deviationPercent,
    ]),
  ];

  return `\uFEFF${rows.map((row) => row.map(toCsvCell).join(",")).join("\r\n")}`;
}

function LazyChart({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "160px" },
    );
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="min-w-0">
      {visible ? (
        children
      ) : (
        <div
          aria-label={`Grafik ${label} dimuat saat terlihat`}
          className="bg-muted/40 text-muted-foreground flex h-64 items-center justify-center rounded-md text-sm"
          role="status"
        >
          Grafik akan dimuat saat bagian ini terlihat.
        </div>
      )}
    </div>
  );
}

function TrendIndicator({
  value,
  inverse = false,
}: {
  value: number | null;
  inverse?: boolean;
}) {
  if (value === null) {
    return (
      <span className="text-muted-foreground text-xs">{trendLabel(value)}</span>
    );
  }
  const isPositive = inverse ? value <= 0 : value >= 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        isPositive
          ? "text-emerald-700 dark:text-emerald-400"
          : "text-destructive"
      }`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {trendLabel(value)} dibanding periode sebelumnya
    </span>
  );
}

function KpiCard({
  title,
  value,
  suffix,
  trend,
  icon: Icon,
  inverseTrend = false,
}: {
  title: string;
  value: string;
  suffix?: string;
  trend: number | null;
  icon: typeof FileText;
  inverseTrend?: boolean;
}) {
  return (
    <Card className="gap-4 py-5">
      <CardHeader className="flex-row items-start justify-between px-5">
        <div className="space-y-1">
          <p className="text-muted-foreground text-sm">{title}</p>
          <SourceBadge source="SIMULATED" />
        </div>
        <Icon aria-hidden="true" className="text-primary size-5" />
      </CardHeader>
      <CardContent className="space-y-2 px-5">
        <p className="text-3xl font-bold tracking-tight">
          {value}
          {suffix ? (
            <span className="ml-1 text-base font-medium">{suffix}</span>
          ) : null}
        </p>
        <TrendIndicator value={trend} inverse={inverseTrend} />
      </CardContent>
    </Card>
  );
}

export function StatisticsRoom() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [dashboard, setDashboard] = useState<PublicStatisticsDashboard | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterError, setFilterError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [visibleServices, setVisibleServices] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        period: appliedFilters.period,
        region: appliedFilters.region,
      });
      if (appliedFilters.period === "custom") {
        params.set("startDate", appliedFilters.startDate);
        params.set("endDate", appliedFilters.endDate);
      }

      try {
        const response = await fetch(`/api/v1/stats/summary?${params}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Statistik belum dapat dimuat.");
        }
        const result = publicStatisticsDashboardSchema.safeParse(
          await response.json(),
        );
        if (!result.success) {
          throw new Error("Format data statistik tidak valid.");
        }
        setDashboard(result.data);
        setVisibleServices(
          result.data.serviceDistribution
            .filter((item) => item.value !== null)
            .map((item) => item.name),
        );
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Terjadi kesalahan saat memuat statistik.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void load();
    return () => controller.abort();
  }, [appliedFilters]);

  const serviceData = useMemo(
    () =>
      (dashboard?.serviceDistribution ?? []).filter(
        (item): item is { name: string; value: number } =>
          item.value !== null && visibleServices.includes(item.name),
      ),
    [dashboard, visibleServices],
  );

  const applyFilters = useCallback(() => {
    if (
      filters.period === "custom" &&
      (!filters.startDate || !filters.endDate)
    ) {
      setFilterError("Pilih tanggal mulai dan tanggal akhir.");
      return;
    }
    if (filters.period === "custom" && filters.startDate > filters.endDate) {
      setFilterError("Tanggal mulai tidak boleh setelah tanggal akhir.");
      return;
    }
    setFilterError(null);
    setAppliedFilters({ ...filters });
  }, [filters]);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setFilterError(null);
    setAppliedFilters({ ...INITIAL_FILTERS });
  }, []);

  const downloadSummary = useCallback(() => {
    if (!dashboard) return;

    try {
      const blob = new Blob([createStatisticsCsv(dashboard)], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "ringkasan-statistik.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setDownloadError(null);
    } catch {
      setDownloadError("Ringkasan statistik gagal diunduh. Silakan coba lagi.");
    }
  }, [dashboard]);

  const isEmpty =
    dashboard !== null &&
    dashboard.trends.length === 0 &&
    dashboard.serviceDistribution.length === 0 &&
    dashboard.topRegions.length === 0;

  return (
    <main className="pb-12">
      <section className="border-border bg-background border-b">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="text-sm">
            <ol className="text-muted-foreground flex flex-wrap items-center gap-2">
              <li>
                <Link className="hover:text-foreground" href="/">
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  className="hover:text-foreground"
                  href="/tracking"
                >
                  Layanan Publik
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link className="hover:text-foreground" href="/tracking">
                  Pelacakan
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-foreground font-medium">
                Statistik
              </li>
            </ol>
          </nav>
          <header className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Ruang Statistik
              </h1>
              <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
                Pantau permintaan dan kinerja pengaduan, perizinan, serta
                bantuan sosial dalam satu ringkasan komprehensif.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 sm:items-end">
              <Button
                className="h-10"
                disabled={loading || !dashboard}
                onClick={downloadSummary}
                type="button"
              >
                <Download aria-hidden="true" className="size-4" />
                Unduh ringkasan
              </Button>
              <SourceBadge source="SIMULATED" label="Pratinjau data simulasi" />
            </div>
          </header>
          {downloadError ? (
            <p aria-live="polite" className="text-destructive mt-2 text-sm">
              {downloadError}
            </p>
          ) : null}
          <ServiceSpaceNavigation activeSpace="statistics" variant="plain" />
        </div>
      </section>

      <div className="container mx-auto space-y-8 px-4 py-8">
        <Card className="gap-4 py-5">
          <CardHeader className="px-5">
            <h2 className="font-semibold">Filter statistik</h2>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="space-y-2 text-sm font-medium">
                Periode
                <Select
                  aria-label="Periode statistik"
                  onChange={(event) => {
                    setFilters((previous) => ({
                      ...previous,
                      period: event.target.value,
                    }));
                    setFilterError(null);
                  }}
                  options={PERIOD_OPTIONS}
                  value={filters.period}
                />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Wilayah
                <Select
                  aria-label="Wilayah statistik"
                  onChange={(event) =>
                    setFilters((previous) => ({
                      ...previous,
                      region: event.target.value,
                    }))
                  }
                  options={REGION_OPTIONS}
                  value={filters.region}
                />
              </label>
              {filters.period === "custom" ? (
                <>
                  <label className="space-y-2 text-sm font-medium">
                    Tanggal mulai
                    <Input
                      aria-label="Tanggal mulai"
                      onChange={(event) =>
                        setFilters((previous) => ({
                          ...previous,
                          startDate: event.target.value,
                        }))
                      }
                      type="date"
                      value={filters.startDate}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium">
                    Tanggal akhir
                    <Input
                      aria-label="Tanggal akhir"
                      onChange={(event) =>
                        setFilters((previous) => ({
                          ...previous,
                          endDate: event.target.value,
                        }))
                      }
                      type="date"
                      value={filters.endDate}
                    />
                  </label>
                </>
              ) : null}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className="text-destructive text-sm">
                {filterError ?? ""}
              </p>
              <div className="flex gap-2">
                <Button onClick={resetFilters} type="button" variant="outline">
                  <RotateCcw aria-hidden="true" className="size-4" />
                  Atur ulang
                </Button>
                <Button disabled={loading} onClick={applyFilters} type="button">
                  <CalendarDays aria-hidden="true" className="size-4" />
                  Terapkan filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div
            aria-label="Memuat statistik"
            className="space-y-4"
            role="status"
          >
            <div className="bg-muted h-6 w-48 animate-pulse rounded" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  className="bg-muted h-32 animate-pulse rounded-xl"
                  key={index}
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <section
            aria-labelledby="statistics-error-title"
            className="border-destructive/30 bg-destructive/5 rounded-xl border p-8 text-center"
          >
            <h2 className="font-semibold" id="statistics-error-title">
              Statistik tidak dapat dimuat
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">{error}</p>
            <Button
              className="mt-4"
              onClick={() => setAppliedFilters({ ...appliedFilters })}
              type="button"
              variant="outline"
            >
              Coba lagi
            </Button>
          </section>
        ) : isEmpty || !dashboard ? (
          <section className="rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">
              Belum ada data statistik untuk filter ini.
            </p>
            <p className="text-muted-foreground mt-2 text-sm">
              Coba pilih wilayah atau periode lain.
            </p>
          </section>
        ) : (
          <>
            <section aria-labelledby="summary-title" className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold" id="summary-title">
                  Ringkasan kinerja portal
                </h2>
                <p className="text-muted-foreground text-sm">
                  {dashboard.periodLabel} · {dashboard.regionLabel}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  icon={FileText}
                  title="Total Pengajuan"
                  trend={dashboard.kpis.applicationTrend}
                  value={displayedCount(dashboard.kpis.totalApplications)}
                />
                <KpiCard
                  icon={MessageSquareWarning}
                  title="Total Pengaduan"
                  trend={dashboard.kpis.complaintTrend}
                  value={displayedCount(dashboard.kpis.totalComplaints)}
                />
                <KpiCard
                  icon={Clock3}
                  inverseTrend
                  suffix={
                    dashboard.kpis.averageResolutionDays === null
                      ? undefined
                      : "hari"
                  }
                  title="Rata-rata Waktu Penyelesaian"
                  trend={dashboard.kpis.resolutionTrend}
                  value={displayedMetric(dashboard.kpis.averageResolutionDays)}
                />
                <KpiCard
                  icon={Heart}
                  suffix={
                    dashboard.kpis.satisfactionRate === null ? undefined : "%"
                  }
                  title="Tingkat Kepuasan"
                  trend={dashboard.kpis.satisfactionTrend}
                  value={displayedMetric(dashboard.kpis.satisfactionRate)}
                />
              </div>
            </section>

            <section aria-labelledby="trend-title">
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold" id="trend-title">
                      Tren Pengajuan &amp; Pengaduan
                    </h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                      Perubahan volume dari waktu ke waktu
                    </p>
                  </div>
                  <SourceBadge source="SIMULATED" />
                </CardHeader>
                <CardContent>
                  <LazyChart label="tren pengajuan dan pengaduan">
                    <LineChart
                      ariaLabel="Tren agregat pengajuan dan pengaduan"
                      data={[...dashboard.trends]}
                      height={300}
                      series={[
                        {
                          key: "applications",
                          name: "Pengajuan",
                          color: "#2563eb",
                        },
                        {
                          key: "complaints",
                          name: "Pengaduan",
                          color: "#f97316",
                        },
                      ]}
                      width="100%"
                      xKey="label"
                    />
                  </LazyChart>
                </CardContent>
              </Card>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Distribusi Layanan Publik
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Pilih jenis layanan untuk menampilkan atau menyembunyikan
                    bagian grafik.
                  </p>
                  <SourceBadge source="SIMULATED" />
                </CardHeader>
                <CardContent>
                  <LazyChart label="distribusi layanan publik">
                    {serviceData.length > 0 ? (
                      <PieChart
                        ariaLabel="Distribusi agregat jenis layanan publik"
                        data={serviceData}
                        height={280}
                        innerRadius="56%"
                        showLegend={false}
                        width="100%"
                      />
                    ) : (
                      <p className="text-muted-foreground py-12 text-center text-sm">
                        Pilih setidaknya satu kategori layanan.
                      </p>
                    )}
                  </LazyChart>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {dashboard.serviceDistribution.map((service, index) => {
                      const selected = visibleServices.includes(service.name);
                      return (
                        <button
                          aria-pressed={selected}
                          className="hover:bg-muted focus-visible:ring-ring flex min-w-0 items-center justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          key={service.name}
                          onClick={() =>
                            setVisibleServices((previous) =>
                              selected
                                ? previous.filter(
                                    (name) => name !== service.name,
                                  )
                                : [...previous, service.name],
                            )
                          }
                          type="button"
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className={`size-2.5 shrink-0 rounded-full ${LEGEND_COLOR_CLASSES[index % LEGEND_COLOR_CLASSES.length]}`}
                            />
                            <span className="truncate">{service.name}</span>
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            {displayedCount(service.value)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">Top 5 Wilayah</h2>
                  <p className="text-muted-foreground text-sm">
                    Wilayah dengan volume pengajuan tertinggi
                  </p>
                  <SourceBadge source="SIMULATED" />
                </CardHeader>
                <CardContent>
                  <LazyChart label="lima wilayah teratas">
                    <BarChart
                      ariaLabel="Lima wilayah dengan pengajuan terbanyak"
                      data={[...dashboard.topRegions]}
                      height={280}
                      series={[
                        {
                          key: "applications",
                          name: "Pengajuan",
                          color: "#2563eb",
                        },
                      ]}
                      width="100%"
                      xKey="region"
                    />
                  </LazyChart>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Performa Penyelesaian
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Jumlah layanan menurut status dan minggu
                  </p>
                  <SourceBadge source="SIMULATED" />
                </CardHeader>
                <CardContent>
                  <LazyChart label="performa penyelesaian">
                    <BarChart
                      ariaLabel="Perbandingan status penyelesaian layanan"
                      data={[...dashboard.completionPerformance]}
                      height={260}
                      series={[
                        { key: "completed", name: "Selesai", color: "#059669" },
                        {
                          key: "processing",
                          name: "Diproses",
                          color: "#f59e0b",
                        },
                        { key: "overdue", name: "Terlambat", color: "#dc2626" },
                      ]}
                      width="100%"
                      xKey="period"
                    />
                  </LazyChart>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h2 className="text-lg font-semibold">
                    Sentimen &amp; Umpan Balik
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Respons agregat warga setelah layanan selesai
                  </p>
                  <SourceBadge source="SIMULATED" />
                </CardHeader>
                <CardContent>
                  <LazyChart label="sentimen dan umpan balik">
                    <BarChart
                      ariaLabel="Sentimen warga terhadap layanan"
                      data={[...dashboard.sentiment]}
                      height={260}
                      series={[
                        { key: "count", name: "Umpan balik", color: "#0d9488" },
                      ]}
                      width="100%"
                      xKey="label"
                    />
                  </LazyChart>
                  <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                    {dashboard.sentiment.map((item) => (
                      <li className="text-muted-foreground" key={item.label}>
                        <span className="text-foreground font-medium">
                          {item.label}:
                        </span>{" "}
                        {item.percentage === null
                          ? "Tidak cukup data"
                          : `${item.percentage}%`}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Layanan dengan Waktu Penyelesaian Terlama
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Diurutkan berdasarkan rata-rata waktu penyelesaian tertinggi
                  </p>
                </div>
                <SourceBadge source="SIMULATED" />
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                    <thead>
                      <tr className="text-muted-foreground border-b text-xs uppercase">
                        <th className="px-3 py-3 font-medium">Nama layanan</th>
                        <th className="px-3 py-3 font-medium">Instansi</th>
                        <th className="px-3 py-3 text-right font-medium">
                          Volume total
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Target SLA
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Rata-rata durasi
                        </th>
                        <th className="px-3 py-3 text-right font-medium">
                          Deviasi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.bottlenecks.map((item) => (
                        <tr
                          className="border-b last:border-0"
                          key={item.service}
                        >
                          <th className="px-3 py-4 font-medium" scope="row">
                            {item.service}
                          </th>
                          <td className="text-muted-foreground px-3 py-4">
                            {item.agency}
                          </td>
                          <td className="px-3 py-4 text-right tabular-nums">
                            {displayedCount(item.volume)}
                          </td>
                          <td className="px-3 py-4 text-right tabular-nums">
                            {item.targetDays} hari
                          </td>
                          <td className="px-3 py-4 text-right font-semibold tabular-nums">
                            {item.averageDays.toLocaleString("id-ID")} hari
                          </td>
                          <td className="px-3 py-4 text-right tabular-nums">
                            {item.deviationPercent > 0
                              ? `+${item.deviationPercent}%`
                              : `${item.deviationPercent}%`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <aside className="border-primary/20 bg-primary/5 flex items-start gap-3 rounded-lg border p-4 text-sm">
              <ShieldCheck
                aria-hidden="true"
                className="text-primary mt-0.5 size-5 shrink-0"
              />
              <p className="text-muted-foreground">
                Statistik ini hanya menampilkan data agregat simulasi. Angka
                pada kelompok berukuran kurang dari 5 disamarkan sebagai “&lt;
                5”. Halaman ini tidak menampilkan identitas maupun rincian
                pengajuan warga.
              </p>
            </aside>
            <p className="text-muted-foreground text-xs">
              <ArrowRight aria-hidden="true" className="mr-1 inline size-3" />
              Ringkasan tidak menggantikan pemeriksaan data operasional
              instansi.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
