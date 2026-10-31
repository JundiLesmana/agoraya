"use client";

import { Suspense, useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FolderKanban,
  MapPinned,
  RotateCw,
} from "lucide-react";
import { PieChart } from "@/components/charts/pie-chart";
import { SourceBadge } from "@/components/source-badges";
import { Button } from "@/components/ui/button";
import {
  projectDashboardSummarySchema,
  type ProjectDashboardSummary,
} from "@/lib/summary";
import { DatasetInformation } from "./dataset-information";
import { FeaturedProject } from "./featured-project";
import {
  DEFAULT_FILTERS,
  FilterControls,
  type FilterValues,
} from "./filter-controls";
import { formatInfoBanner, InfoBanner } from "./info-banner";
import { ProyekData } from "./proyek-data";

const TABS = [
  { id: "ringkasan", label: "Ringkasan" },
  { id: "anggaran", label: "Anggaran" },
  { id: "proyek", label: "Proyek" },
  { id: "statistik-daerah", label: "Statistik daerah" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const STATUS_COLORS = ["#1ca58f", "#3478e5", "#f08b3e"] as const;

function SummaryCards({ summary }: { summary: ProjectDashboardSummary }) {
  const completedPercent = summary.totalProyek
    ? Math.round((summary.selesai / summary.totalProyek) * 100)
    : 0;
  const inProgressPercent = summary.totalProyek
    ? Math.round((summary.berjalan / summary.totalProyek) * 100)
    : 0;
  const delayedPercent = summary.totalProyek
    ? Math.round((summary.tertunda / summary.totalProyek) * 100)
    : 0;
  const cards = [
    {
      label: "Total proyek",
      value: summary.totalProyek,
      detail: "seluruh sektor",
      icon: FolderKanban,
      style: "bg-blue-50 text-blue-700",
    },
    {
      label: "Selesai",
      value: summary.selesai,
      detail: `${completedPercent}% dari total proyek`,
      icon: CheckCircle2,
      style: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Berjalan",
      value: summary.berjalan,
      detail: `${inProgressPercent}% dari total proyek`,
      icon: Clock3,
      style: "bg-blue-50 text-blue-700",
    },
    {
      label: "Tertunda",
      value: summary.tertunda,
      detail: `${delayedPercent}% · perlu perhatian`,
      icon: AlertCircle,
      style: "bg-orange-50 text-orange-700",
    },
    {
      label: "Cakupan wilayah",
      value: summary.totalWilayah,
      detail: "kabupaten / kota",
      icon: MapPinned,
      style: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <section
      aria-label="Ringkasan proyek Jawa Barat"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      {cards.map(({ label, value, detail, icon: Icon, style }) => (
        <article
          key={label}
          className="rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <span
            aria-hidden="true"
            className={`inline-flex size-9 items-center justify-center rounded-lg ${style}`}
          >
            <Icon className="size-4" />
          </span>
          <div className="mt-3 flex items-center justify-between gap-2">
            <h3 className="text-sm text-muted-foreground">{label}</h3>
            <SourceBadge source="SIMULATED" withIcon={false} />
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </article>
      ))}
    </section>
  );
}

function DashboardCharts({ summary }: { summary: ProjectDashboardSummary }) {
  const statusData = [
    { name: "Selesai", value: summary.selesai, color: STATUS_COLORS[0] },
    { name: "Berjalan", value: summary.berjalan, color: STATUS_COLORS[1] },
    { name: "Tertunda", value: summary.tertunda, color: STATUS_COLORS[2] },
  ];
  const completePercent = summary.totalProyek
    ? Math.round((summary.selesai / summary.totalProyek) * 100)
    : 0;
  const maxSectorTotal = Math.max(
    ...summary.sektor.map((sector) => sector.total),
    1,
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.6fr)]">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Progres penyelesaian</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {summary.totalProyek} proyek · status per 30 September 2025
            </p>
          </div>
          <SourceBadge source="SIMULATED" withIcon={false} />
        </div>
        {summary.totalProyek === 0 ? (
          <p role="status" className="py-10 text-center text-sm text-muted-foreground">
            Tidak ada data untuk filter ini.
          </p>
        ) : (
          <>
            <div className="relative mx-auto mt-3 h-48 w-full max-w-sm">
              <PieChart
                data={statusData}
                colors={STATUS_COLORS}
                width="100%"
                height={192}
                innerRadius="66%"
                outerRadius="88%"
                showLegend={false}
                ariaLabel="Distribusi progres penyelesaian proyek"
              />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold">{completePercent}%</span>
                <span className="text-xs text-muted-foreground">selesai</span>
              </div>
            </div>
            <ul className="mt-2 space-y-2 text-xs">
              {statusData.map((item) => {
                const percent = Math.round(
                  (item.value / summary.totalProyek) * 100,
                );
                return (
                  <li key={item.name} className="flex justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="size-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.name}
                    </span>
                    <span className="font-medium">
                      {item.value} · {percent}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {summary.tertunda > 0 ? (
          <p className="mt-4 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-800">
            {summary.tertunda} proyek tertunda memerlukan perhatian.
          </p>
        ) : null}
        <p className="mt-3 text-xs text-muted-foreground">
          Persentase berdasarkan jumlah proyek, bukan rata-rata progres fisik.
        </p>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold">Penyelesaian per sektor</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Jumlah proyek selesai dibandingkan total di tiap sektor
            </p>
          </div>
          <SourceBadge source="SIMULATED" withIcon={false} />
        </div>
        {summary.sektor.every((sector) => sector.total === 0) ? (
          <p role="status" className="py-10 text-center text-sm text-muted-foreground">
            Tidak ada data untuk filter ini.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {summary.sektor.map((sector) => (
              <div key={sector.nama}>
                <div className="mb-1.5 flex justify-between gap-3 text-xs">
                  <span className="font-medium">{sector.nama}</span>
                  <span className="text-muted-foreground">
                    {sector.selesai} / {sector.total} proyek
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${sector.nama}: ${sector.selesai} dari ${sector.total} proyek selesai`}
                  className="h-2 overflow-hidden rounded-full bg-blue-100"
                >
                  <div
                    className="h-full rounded-full bg-teal-600"
                    style={{
                      width: `${(sector.selesai / maxSectorTotal) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Perbandingan jumlah proyek, bukan besaran anggaran.
        </p>
      </section>
    </div>
  );
}

function SummaryLoading() {
  return (
    <section
      aria-label="Memuat ringkasan proyek"
      role="status"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          key={index}
          className="h-32 animate-pulse rounded-xl border border-border bg-muted/40"
        />
      ))}
    </section>
  );
}

export function ProjectDashboard() {
  const [filters, setFilters] = useState<FilterValues>(DEFAULT_FILTERS);
  const [activeTab, setActiveTab] = useState<TabId>("proyek");
  const [summary, setSummary] = useState<ProjectDashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const query = new URLSearchParams(filters).toString();

  useEffect(() => {
    const controller = new AbortController();

    async function loadSummary() {
      setIsLoading(true);
      setHasError(false);
      setSummary(null);

      try {
        const response = await fetch(`/api/projects/summary?${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Project summary request failed.");
        const result = projectDashboardSummarySchema.parse(
          await response.json(),
        );
        setSummary(result);
      } catch {
        if (!controller.signal.aborted) setHasError(true);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadSummary();
    return () => controller.abort();
  }, [query, retryCount]);

  const handleReset = () => setFilters(DEFAULT_FILTERS);
  const banner = formatInfoBanner(
    filters.wilayah,
    filters.periode,
    "30 Sep 2025, 16.00 WIB",
  );

  return (
    <>
      <header className="hero-enter rounded-xl bg-sky-50 px-5 py-6 dark:bg-sky-950/30 sm:px-7">
        <h1 className="text-3xl leading-tight font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
          Pantau proyek daerah
        </h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          Telusuri progres, anggaran, dan tahapan pembangunan di Jawa Barat.
        </p>
      </header>

      <div className="border-b border-border">
        <div
          role="tablist"
          aria-label="Kategori data pemerintah"
          className="flex flex-wrap gap-x-4 sm:gap-x-5"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls="project-tab-panel"
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
                  return;
                }
                event.preventDefault();
                const currentIndex = TABS.findIndex(
                  (item) => item.id === tab.id,
                );
                const direction = event.key === "ArrowRight" ? 1 : -1;
                const nextTab =
                  TABS[(currentIndex + direction + TABS.length) % TABS.length];
                if (nextTab) {
                  setActiveTab(nextTab.id);
                  document.getElementById(`tab-${nextTab.id}`)?.focus();
                }
              }}
              className={`-mb-px whitespace-nowrap border-b-2 px-1 py-3 text-sm ${
                activeTab === tab.id
                  ? "border-primary font-semibold text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Suspense
        fallback={
          <div
            role="status"
            aria-label="Memuat filter proyek"
            className="h-36 animate-pulse rounded-xl border border-border bg-muted/40"
          />
        }
      >
        <FilterControls
          filters={filters}
          onApply={setFilters}
          onReset={handleReset}
        />
      </Suspense>
      <InfoBanner {...banner} />

      <section
        id="project-tab-panel"
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="space-y-5"
      >
        {isLoading ? (
          <SummaryLoading />
        ) : hasError ? (
          <div
            role="alert"
            className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>Ringkasan proyek gagal dimuat.</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              <RotateCw aria-hidden="true" className="size-4" />
              Coba lagi
            </Button>
          </div>
        ) : summary ? (
          <>
            {activeTab === "proyek" || activeTab === "ringkasan" ? (
              <>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-lg font-semibold">
                    Ringkasan proyek Jawa Barat
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Januari - September 2025
                  </p>
                </div>
                <SummaryCards summary={summary} />
                <DashboardCharts summary={summary} />
              </>
            ) : null}

            {activeTab === "anggaran" ? (
              <section className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Anggaran proyek</h2>
                  <SourceBadge source="SIMULATED" />
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Sorotan anggaran menampilkan nilai anggaran dan realisasi
                  ilustratif proyek unggulan.
                </p>
                <FeaturedProject />
              </section>
            ) : null}

            {activeTab === "statistik-daerah" ? (
              <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Cakupan statistik daerah
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Kabupaten/kota yang tercakup pada dataset proyek terpilih.
                    </p>
                  </div>
                  <SourceBadge source="SIMULATED" />
                </div>
                <p className="mt-5 text-3xl font-semibold">
                  {summary.totalWilayah}{" "}
                  <span className="text-base font-normal text-muted-foreground">
                    kabupaten / kota
                  </span>
                </p>
              </section>
            ) : null}

            {activeTab === "proyek" ? (
              <>
                <FeaturedProject />
                <ProyekData filters={filters} />
              </>
            ) : null}
          </>
        ) : null}
      </section>

      <DatasetInformation />
    </>
  );
}
