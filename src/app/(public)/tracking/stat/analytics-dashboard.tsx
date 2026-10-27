"use client";

import * as React from "react";
import {
  AlertTriangle,
  Clock3,
  FileText,
  Heart,
  MessageSquareText,
  MapPinned,
  RotateCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { BarChart, LineChart, PieChart } from "@/components/charts";
import { SourceBadge } from "@/components/source-badges";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  ANALYTICS_PERIOD_OPTIONS,
  ANALYTICS_REGION_OPTIONS,
  getDateRangeError,
  type AnalyticsSnapshot,
  type AnalyticsPeriod,
  type AnalyticsRegion,
} from "./analytics-data";
import { trackingStatisticsDashboardSchema } from "@/modules/analytics/tracking-statistics-contract";

const numberFormat = new Intl.NumberFormat("id-ID");
const DATE_TODAY = new Date();
const toLocalDateInput = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
const INITIAL_START_DATE = toLocalDateInput(
  new Date(DATE_TODAY.getFullYear(), DATE_TODAY.getMonth(), 1),
);
const INITIAL_END_DATE = toLocalDateInput(DATE_TODAY);

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  changePercent,
  inverseTrend = false,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ElementType;
  changePercent: number;
  inverseTrend?: boolean;
}) {
  const TrendIcon = changePercent < 0 ? TrendingDown : TrendingUp;
  const favorable = inverseTrend ? changePercent <= 0 : changePercent >= 0;

  return (
    <Card className="border-border/80 gap-4 py-5 shadow-none">
      <CardHeader className="gap-3 px-5">
        <div className="flex items-start justify-between gap-3">
          <CardDescription className="text-foreground/75 font-medium">
            {label}
          </CardDescription>
          <span className="bg-muted text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Icon aria-hidden="true" className="size-[18px]" />
          </span>
        </div>
        <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-2 px-5">
        <span className="text-muted-foreground text-xs">{detail}</span>
        <span
          aria-label={`${changePercent < 0 ? "Turun" : "Naik"} ${Math.abs(changePercent).toLocaleString("id-ID")}% dibanding periode sebelumnya`}
          className={`inline-flex items-center gap-1 text-xs font-medium ${
            favorable
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-amber-700 dark:text-amber-300"
          }`}
        >
          <TrendIcon aria-hidden="true" className="size-3.5" />
          {Math.abs(changePercent).toLocaleString("id-ID")}%
        </span>
        <SourceBadge source="SIMULATED" label="Simulasi" />
      </CardContent>
    </Card>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border/80 min-w-0 gap-4 shadow-none">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <SourceBadge source="SIMULATED" />
        </div>
      </CardHeader>
      <CardContent className="min-w-0">{children}</CardContent>
    </Card>
  );
}

function InteractiveLegend({
  items,
  hidden,
  onToggle,
  label,
}: {
  items: readonly { key: string; label: string; color: string }[];
  hidden: ReadonlySet<string>;
  onToggle: (key: string) => void;
  label: string;
}) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-x-4 gap-y-2">
      {items.map((item) => {
        const isHidden = hidden.has(item.key);
        return (
          <li key={item.key}>
            <button
              type="button"
              aria-pressed={!isHidden}
              onClick={() => onToggle(item.key)}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring inline-flex min-h-8 items-center gap-2 rounded-sm text-xs focus-visible:ring-2 focus-visible:outline-none"
            >
              <span
                aria-hidden="true"
                className="size-2.5 rounded-sm"
                style={{
                  backgroundColor: isHidden ? "transparent" : item.color,
                  outline: `1px solid ${item.color}`,
                }}
              />
              <span className={isHidden ? "line-through" : undefined}>
                {item.label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EmptyState() {
  return (
    <section
      aria-label="Analitik laporan"
      className="bg-card border-border rounded-xl border border-dashed px-6 py-16 text-center"
    >
      <FileText
        aria-hidden="true"
        className="text-muted-foreground mx-auto size-9"
      />
      <h2 className="mt-4 text-lg font-semibold">
        Belum ada agregat untuk filter ini
      </h2>
      <p className="text-muted-foreground mx-auto mt-2 max-w-md text-sm">
        Coba pilih rentang tanggal atau wilayah lain untuk melihat ringkasan.
      </p>
    </section>
  );
}

function LoadingState() {
  return (
    <section
      aria-label="Memuat statistik"
      aria-busy="true"
      className="space-y-4"
    >
      <p className="sr-only" role="status">
        Statistik sedang dimuat.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="border-border/80 bg-muted/40 h-36 animate-pulse rounded-xl border"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="border-border/80 bg-muted/40 h-80 animate-pulse rounded-xl border" />
        <div className="border-border/80 bg-muted/40 h-80 animate-pulse rounded-xl border" />
      </div>
    </section>
  );
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = React.useState<AnalyticsPeriod>("this-year");
  const [region, setRegion] = React.useState<AnalyticsRegion>("all");
  const [startDate, setStartDate] = React.useState(INITIAL_START_DATE);
  const [endDate, setEndDate] = React.useState(INITIAL_END_DATE);
  const [hiddenServices, setHiddenServices] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [hiddenTrendSeries, setHiddenTrendSeries] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [snapshot, setSnapshot] = React.useState<AnalyticsSnapshot | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const customDateError =
    period === "custom" ? getDateRangeError(startDate, endDate) : null;
  const services = (snapshot?.serviceDistribution ?? []).filter(
    (service) => !hiddenServices.has(service.name),
  );
  const visibleTrendSeries = [
    { key: "reports", name: "Total pengajuan", color: "#2563a6" },
    { key: "complaints", name: "Pengaduan", color: "#d97736" },
  ].filter((series) => !hiddenTrendSeries.has(series.key));
  const periodOptions = ANALYTICS_PERIOD_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  }));
  const regionOptions = ANALYTICS_REGION_OPTIONS.map((item) => ({
    value: item.value,
    label: item.label,
  }));

  React.useEffect(() => {
    if (customDateError) {
      setLoading(false);
      setSnapshot(null);
      setLoadError(null);
      return;
    }

    const controller = new AbortController();
    const parameters = new URLSearchParams({ period, region });
    if (period === "custom") {
      parameters.set("startDate", startDate);
      parameters.set("endDate", endDate);
    }
    setLoading(true);
    setLoadError(null);

    fetch(`/api/v1/stats/tracking-summary?${parameters.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok) {
          const errorMessage =
            typeof payload === "object" &&
            payload !== null &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "Analitik tidak dapat dimuat.";
          throw new Error(errorMessage);
        }
        return trackingStatisticsDashboardSchema.parse(payload);
      })
      .then((result) => {
        setSnapshot(result);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setSnapshot(null);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Analitik tidak dapat dimuat. Coba lagi.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [period, region, startDate, endDate, retryCount, customDateError]);

  function toggleHidden(
    setHidden: React.Dispatch<React.SetStateAction<Set<string>>>,
    key: string,
  ) {
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <header className="border-border/80 flex flex-col gap-5 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground text-xs"
          >
            <Link className="hover:text-foreground hover:underline" href="/">
              Beranda
            </Link>
            {" > "}
            <Link
              className="hover:text-foreground hover:underline"
              href="/tracking"
            >
              Layanan Publik
            </Link>
            {" > "}
            <Link
              className="hover:text-foreground hover:underline"
              href="/tracking"
            >
              Pelacakan
            </Link>
            {" > "}
            <span aria-current="page" className="text-foreground">
              Statistik
            </span>
          </nav>
          <p className="text-primary mt-4 text-xs font-semibold tracking-[0.16em] uppercase">
            Statistik layanan publik
          </p>
          <h1 className="text-foreground mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Analitik laporan
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed sm:text-base">
            Ringkasan agregat tentang laporan, waktu penyelesaian, dan
            pengalaman warga di berbagai wilayah.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <SourceBadge source="SIMULATED" label="Pratinjau data simulasi" />
          <p className="text-muted-foreground text-xs">
            Contoh agregat publik · tanpa data individu
          </p>
        </div>
      </header>

      <section
        aria-label="Filter statistik"
        className="bg-card border-border grid gap-4 rounded-xl border p-4 sm:grid-cols-2 sm:p-5 lg:grid-cols-[minmax(190px,0.8fr)_minmax(220px,1fr)_minmax(0,2fr)] lg:items-end"
      >
        <label className="space-y-1.5 text-xs font-medium">
          Periode
          <Select
            aria-label="Periode"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value as AnalyticsPeriod)
            }
            options={periodOptions}
            className="h-10 text-sm"
          />
        </label>
        <label className="space-y-1.5 text-xs font-medium">
          Wilayah
          <Select
            aria-label="Wilayah"
            value={region}
            onChange={(event) =>
              setRegion(event.target.value as AnalyticsRegion)
            }
            options={regionOptions}
            className="h-10 text-sm"
          />
        </label>
        {period === "custom" ? (
          <fieldset className="space-y-2 sm:col-span-2 lg:col-span-1">
            <legend className="text-xs font-medium">
              Rentang tanggal kustom
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-muted-foreground space-y-1 text-[11px]">
                Dari
                <input
                  aria-label="Tanggal mulai"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="border-input bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
              </label>
              <label className="text-muted-foreground space-y-1 text-[11px]">
                Sampai
                <input
                  aria-label="Tanggal akhir"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="border-input bg-background text-foreground focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                />
              </label>
            </div>
            {customDateError ? (
              <p role="alert" className="text-destructive text-xs">
                {customDateError}
              </p>
            ) : null}
          </fieldset>
        ) : (
          <p className="text-muted-foreground text-xs sm:col-span-2 lg:col-span-1 lg:pb-3">
            Pilih rentang waktu dan wilayah. Semua visualisasi mengikuti filter
            yang sama.
          </p>
        )}
      </section>

      {customDateError ? null : loading ? (
        <LoadingState />
      ) : loadError ? (
        <section
          aria-label="Kesalahan memuat statistik"
          className="border-border bg-card flex flex-col items-center rounded-xl border px-6 py-12 text-center"
        >
          <AlertTriangle
            aria-hidden="true"
            className="text-destructive size-8"
          />
          <h2 className="mt-4 text-lg font-semibold">
            Statistik belum dapat dimuat
          </h2>
          <p role="alert" className="text-muted-foreground mt-2 text-sm">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="text-primary focus-visible:ring-ring mt-4 inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            <RotateCw aria-hidden="true" className="size-4" />
            Coba lagi
          </button>
        </section>
      ) : !snapshot || snapshot.kpis.totalReports.value === 0 ? (
        <EmptyState />
      ) : (
        <>
          <section aria-labelledby="summary-heading" className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 id="summary-heading" className="text-base font-semibold">
                  Ringkasan kinerja
                </h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {snapshot.periodLabel} · {snapshot.regionLabel}
                </p>
              </div>
              <SourceBadge source="SIMULATED" label="Data simulasi agregat" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total pengajuan"
                value={numberFormat.format(snapshot.kpis.totalReports.value)}
                detail="Seluruh permohonan layanan"
                icon={FileText}
                changePercent={snapshot.kpis.totalReports.changePercent}
              />
              <MetricCard
                label="Total pengaduan"
                value={numberFormat.format(snapshot.kpis.totalComplaints.value)}
                detail="Bagian dari pengajuan layanan"
                icon={MessageSquareText}
                changePercent={snapshot.kpis.totalComplaints.changePercent}
              />
              <MetricCard
                label="Rata-rata penyelesaian"
                value={`${snapshot.kpis.averageResolutionDays.value.toLocaleString("id-ID")} hari`}
                detail="Dihitung dari agregat selesai"
                icon={Clock3}
                changePercent={
                  snapshot.kpis.averageResolutionDays.changePercent
                }
                inverseTrend
              />
              <MetricCard
                label="Tingkat kepuasan"
                value={`${snapshot.kpis.satisfactionRate.value.toLocaleString("id-ID")}%`}
                detail="Agregat umpan balik warga"
                icon={Heart}
                changePercent={snapshot.kpis.satisfactionRate.changePercent}
              />
            </div>
          </section>

          <section
            aria-label="Tren pengajuan dan pengaduan"
            className="grid gap-4 lg:grid-cols-5"
          >
            <div className="lg:col-span-3">
              <ChartCard
                title="Tren layanan"
                description={`${snapshot.periodLabel} · ${snapshot.regionLabel}`}
              >
                <div className="space-y-3">
                  <InteractiveLegend
                    label="Legenda tren layanan"
                    hidden={hiddenTrendSeries}
                    onToggle={(key) => toggleHidden(setHiddenTrendSeries, key)}
                    items={[
                      {
                        key: "reports",
                        label: "Total pengajuan",
                        color: "#2563a6",
                      },
                      {
                        key: "complaints",
                        label: "Pengaduan",
                        color: "#d97736",
                      },
                    ]}
                  />
                  <LineChart
                    data={snapshot.trend}
                    xKey="label"
                    series={visibleTrendSeries}
                    width="100%"
                    height={250}
                    ariaLabel={`Tren agregat total pengajuan dan pengaduan, ${snapshot.periodLabel}`}
                    showLegend={false}
                    showDots
                  />
                </div>
              </ChartCard>
            </div>
            <div className="lg:col-span-2">
              <ChartCard
                title="Distribusi layanan"
                description="Jenis layanan yang diajukan"
              >
                <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(145px,0.9fr)]">
                  <PieChart
                    data={services}
                    colors={services.map((service) => service.color)}
                    width="100%"
                    height={240}
                    innerRadius="62%"
                    outerRadius="88%"
                    showLegend={false}
                    ariaLabel="Distribusi jenis layanan publik"
                  />
                  <InteractiveLegend
                    label="Legenda distribusi layanan, tekan untuk menyaring"
                    hidden={hiddenServices}
                    onToggle={(key) => toggleHidden(setHiddenServices, key)}
                    items={snapshot.serviceDistribution.map((service) => ({
                      key: service.name,
                      label: service.name,
                      color: service.color,
                    }))}
                  />
                </div>
              </ChartCard>
            </div>
          </section>

          <section
            aria-label="Perbandingan wilayah, penyelesaian, dan sentimen"
            className="grid gap-4 lg:grid-cols-3"
          >
            <ChartCard
              title="5 wilayah teratas"
              description={
                region === "all"
                  ? "Berdasarkan jumlah pengajuan"
                  : `Kecamatan/kota di ${snapshot.regionLabel}`
              }
            >
              <BarChart
                data={snapshot.topRegions}
                xKey="name"
                series={[
                  { key: "reports", name: "Pengajuan", color: "#2563a6" },
                ]}
                width="100%"
                height={280}
                ariaLabel="Lima wilayah dengan jumlah pengajuan terbanyak"
                showLegend={false}
              />
            </ChartCard>
            <ChartCard
              title="Kinerja penyelesaian"
              description="Waktu rata-rata dibanding target layanan"
            >
              <BarChart
                data={snapshot.resolutionPerformance}
                xKey="service"
                series={[
                  {
                    key: "averageDays",
                    name: "Rata-rata (hari)",
                    color: "#d97736",
                  },
                  {
                    key: "targetDays",
                    name: "Target (hari)",
                    color: "#2563a6",
                  },
                ]}
                width="100%"
                height={280}
                ariaLabel="Waktu penyelesaian rata-rata dan target menurut layanan"
              />
            </ChartCard>
            <ChartCard
              title="Sentimen warga"
              description="Umpan balik agregat atas layanan"
            >
              <BarChart
                data={snapshot.citizenSentiment}
                xKey="name"
                series={[{ key: "value", name: "Respons", color: "#138574" }]}
                width="100%"
                height={280}
                ariaLabel="Jumlah sentimen warga menurut kategori"
                showLegend={false}
              />
            </ChartCard>
          </section>

          <Card className="border-border/80 gap-4 shadow-none">
            <CardHeader className="gap-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="text-base">
                    Layanan dengan waktu penyelesaian terpanjang
                  </CardTitle>
                  <CardDescription>
                    Diurutkan dari rata-rata waktu penyelesaian terlama
                  </CardDescription>
                </div>
                <SourceBadge source="SIMULATED" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="-mx-2 overflow-x-auto px-2">
                <table className="w-full min-w-[650px] border-collapse text-left text-sm">
                  <caption className="sr-only">
                    Layanan yang paling lama diselesaikan, terurut menurun
                  </caption>
                  <thead>
                    <tr className="border-border text-muted-foreground border-b text-xs">
                      <th className="py-3 pr-3 font-medium" scope="col">
                        Layanan
                      </th>
                      <th className="px-3 py-3 font-medium" scope="col">
                        Instansi
                      </th>
                      <th
                        className="px-3 py-3 text-right font-medium"
                        scope="col"
                      >
                        Kasus agregat
                      </th>
                      <th
                        className="px-3 py-3 text-right font-medium"
                        scope="col"
                      >
                        Rata-rata
                      </th>
                      <th
                        className="py-3 pl-3 text-right font-medium"
                        scope="col"
                      >
                        Target
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.longResolutionServices.map((service) => (
                      <tr
                        key={service.service}
                        className="border-border/70 border-b last:border-0"
                      >
                        <th
                          className="text-foreground py-3 pr-3 font-medium"
                          scope="row"
                        >
                          {service.service}
                        </th>
                        <td className="text-muted-foreground px-3 py-3">
                          {service.agency}
                        </td>
                        <td className="text-muted-foreground px-3 py-3 text-right tabular-nums">
                          {numberFormat.format(service.cases)}
                        </td>
                        <td className="text-foreground px-3 py-3 text-right font-semibold tabular-nums">
                          {service.averageDays.toLocaleString("id-ID")} hari
                        </td>
                        <td className="text-muted-foreground py-3 pl-3 text-right tabular-nums">
                          {service.targetDays} hari
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
            <MapPinned aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Seluruh angka adalah agregat simulasi per periode dan wilayah, bukan
            catatan individu atau capaian resmi. Rentang kustom memakai estimasi
            proporsional dari agregat contoh tahunan.
          </p>
        </>
      )}
    </main>
  );
}
