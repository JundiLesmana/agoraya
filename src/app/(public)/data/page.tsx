"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Download,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { PieChart } from "@/components/charts/pie-chart";
import { LineChart } from "@/components/charts/line-chart";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { DashboardMockup } from "../_components/dashboard-preview";

const DEFAULT_FILTER = {
  wilayah: "jawa-barat",
  tahun: "2025",
  periode: "q3",
} as const;

type DashboardFilter = {
  wilayah: string;
  tahun: string;
  periode: string;
};

const REGION_OPTIONS = [
  { value: "jawa-barat", label: "Provinsi Jawa Barat" },
  { value: "dki-jakarta", label: "Provinsi DKI Jakarta" },
  { value: "jawa-tengah", label: "Provinsi Jawa Tengah" },
  { value: "jawa-timur", label: "Provinsi Jawa Timur" },
  { value: "banten", label: "Provinsi Banten" },
] as const;

const YEAR_OPTIONS = ["2023", "2024", "2025", "2026"].map((year) => ({
  value: year,
  label: year,
}));

const PERIOD_OPTIONS = [
  { value: "q1", label: "s.d. Triwulan I" },
  { value: "q2", label: "s.d. Triwulan II" },
  { value: "q3", label: "s.d. Triwulan III" },
  { value: "q4", label: "s.d. Triwulan IV" },
] as const;

function readFilterFromUrl(): DashboardFilter {
  const params = new URLSearchParams(window.location.search);
  const wilayah = params.get("wilayah");
  const tahun = params.get("tahun");
  const periode = params.get("periode");
  const getValidValue = (
    options: readonly { value: string }[],
    value: string | null,
    fallback: string,
  ) => options.find((option) => option.value === value)?.value ?? fallback;

  return {
    wilayah: getValidValue(REGION_OPTIONS, wilayah, DEFAULT_FILTER.wilayah),
    tahun: getValidValue(YEAR_OPTIONS, tahun, DEFAULT_FILTER.tahun),
    periode: getValidValue(PERIOD_OPTIONS, periode, DEFAULT_FILTER.periode),
  };
}

function getFilterSummary(filter: DashboardFilter) {
  const wilayah =
    REGION_OPTIONS.find((option) => option.value === filter.wilayah)?.label ??
    filter.wilayah;
  const periode =
    PERIOD_OPTIONS.find((option) => option.value === filter.periode)?.label ??
    filter.periode;
  return `${wilayah} · ${filter.tahun} · ${periode}`;
}

function FilterFields({
  filter,
  onChange,
  idPrefix,
}: {
  filter: DashboardFilter;
  onChange: (filter: DashboardFilter) => void;
  idPrefix: string;
}) {
  const fields = [
    {
      key: "wilayah" as const,
      label: "Wilayah",
      icon: MapPin,
      options: REGION_OPTIONS,
    },
    {
      key: "tahun" as const,
      label: "Tahun anggaran",
      icon: CalendarDays,
      options: YEAR_OPTIONS,
    },
    {
      key: "periode" as const,
      label: "Periode kumulatif",
      icon: Clock3,
      options: PERIOD_OPTIONS,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {fields.map(({ key, label, icon: Icon, options }) => {
        const id = `${idPrefix}-${key}`;
        const value =
          key === "wilayah"
            ? filter.wilayah
            : key === "tahun"
              ? filter.tahun
              : filter.periode;
        return (
          <div key={key} className="space-y-2">
            <Label
              htmlFor={id}
              className="text-muted-foreground text-xs font-medium"
            >
              {label}
            </Label>
            <div className="relative">
              <Icon
                className="text-primary pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                aria-hidden="true"
              />
              <Select
                id={id}
                aria-label={label}
                value={value}
                options={options}
                onChange={(event) => {
                  const value = event.target.value;
                  if (key === "wilayah")
                    onChange({ ...filter, wilayah: value });
                  if (key === "tahun") onChange({ ...filter, tahun: value });
                  if (key === "periode")
                    onChange({ ...filter, periode: value });
                }}
                className="bg-background h-11 appearance-none pr-3 pl-10 text-sm"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const DASHBOARD_STATS = [
  {
    value: "+10.000",
    label: "Dataset",
    description: "Dataset nasional dan sektoral",
    source: "SIMULATED" as const,
  },
  {
    value: "34",
    label: "Provinsi",
    description: "Cakupan wilayah Indonesia",
    source: "SIMULATED" as const,
  },
  {
    value: "514",
    label: "Kabupaten/Kota",
    description: "Unit administratif terpantau",
    source: "SIMULATED" as const,
  },
  {
    value: "100%",
    label: "Terbuka",
    description: "Akses data publik transparan",
    source: "SIMULATED" as const,
  },
] as const;

// TODO(#24): replace with real data from modules/public-data when available
const MOCK_SECTOR_DATA = [
  { name: "Infrastruktur", value: 28 },
  { name: "Pendidikan", value: 19 },
  { name: "Kesehatan", value: 18 },
  { name: "Perlindungan Sosial", value: 17 },
  { name: "Lainnya", value: 18 },
];

// TODO(#24): replace with real data from modules/public-data when available
const MOCK_TREND_DATA = [
  { bulan: "Jan", anggaran: 3800, realisasi: 2900 },
  { bulan: "Feb", anggaran: 3800, realisasi: 3100 },
  { bulan: "Mar", anggaran: 3800, realisasi: 3300 },
  { bulan: "Apr", anggaran: 3900, realisasi: 3500 },
  { bulan: "Mei", anggaran: 4000, realisasi: 3600 },
  { bulan: "Jun", anggaran: 4000, realisasi: 3700 },
  { bulan: "Jul", anggaran: 4100, realisasi: 3800 },
  { bulan: "Agu", anggaran: 4100, realisasi: 3900 },
  { bulan: "Sep", anggaran: 4200, realisasi: 4000 },
  { bulan: "Okt", anggaran: 4200, realisasi: 4050 },
  { bulan: "Nov", anggaran: 4300, realisasi: 4100 },
  { bulan: "Des", anggaran: 4300, realisasi: 4200 },
];

export default function PublicDataPage() {
  const [draftFilter, setDraftFilter] =
    React.useState<DashboardFilter>(DEFAULT_FILTER);
  const [appliedFilter, setAppliedFilter] =
    React.useState<DashboardFilter>(DEFAULT_FILTER);
  const [mobileFiltersOpen, setMobileFiltersOpen] = React.useState(false);

  React.useEffect(() => {
    const syncFilterFromUrl = () => {
      const filter = readFilterFromUrl();
      setDraftFilter(filter);
      setAppliedFilter(filter);
    };

    syncFilterFromUrl();
    window.addEventListener("popstate", syncFilterFromUrl);
    return () => window.removeEventListener("popstate", syncFilterFromUrl);
  }, []);

  const applyFilter = (filter: DashboardFilter) => {
    const url = new URL(window.location.href);
    url.searchParams.set("wilayah", filter.wilayah);
    url.searchParams.set("tahun", filter.tahun);
    url.searchParams.set("periode", filter.periode);
    window.history.pushState({}, "", url);
    setDraftFilter(filter);
    setAppliedFilter(filter);
    setMobileFiltersOpen(false);
  };

  const resetFilter = () => {
    setDraftFilter(DEFAULT_FILTER);
    applyFilter(DEFAULT_FILTER);
  };

  const downloadSummary = () => {
    const csv = [
      ["Ringkasan dashboard Data Pemerintah"],
      [
        "Wilayah",
        REGION_OPTIONS.find((option) => option.value === appliedFilter.wilayah)
          ?.label ?? appliedFilter.wilayah,
      ],
      ["Tahun anggaran", appliedFilter.tahun],
      [
        "Periode kumulatif",
        PERIOD_OPTIONS.find((option) => option.value === appliedFilter.periode)
          ?.label ?? appliedFilter.periode,
      ],
      ["Sumber", "Data simulasi"],
      [],
      ["Indikator", "Nilai"],
      ...DASHBOARD_STATS.map((stat) => [stat.label, stat.value]),
      [],
      ["Realisasi anggaran per sektor", "Nilai"],
      ...filteredSectorData.map((item) => [item.name, String(item.value)]),
      [],
      ["Bulan", "Anggaran", "Realisasi"],
      ...filteredTrendData.map((item) => [
        item.bulan,
        String(item.anggaran),
        String(item.realisasi),
      ]),
    ]
      .map((row) =>
        row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `ringkasan-data-pemerintah-${appliedFilter.tahun}-${appliedFilter.periode}.csv`;
    link.click();
    URL.revokeObjectURL(downloadUrl);
  };

  const periodEndMonth =
    (PERIOD_OPTIONS.findIndex(
      (option) => option.value === appliedFilter.periode,
    ) +
      1) *
    3;
  const regionScale =
    appliedFilter.wilayah === DEFAULT_FILTER.wilayah
      ? 1
      : 0.92 +
        (REGION_OPTIONS.findIndex(
          (option) => option.value === appliedFilter.wilayah,
        ) %
          4) *
          0.04;
  const yearScale =
    1 + (Number(appliedFilter.tahun) - Number(DEFAULT_FILTER.tahun)) * 0.015;
  const filterScale = regionScale * yearScale;
  const filteredTrendData = MOCK_TREND_DATA.slice(0, periodEndMonth).map(
    (item) => ({
      ...item,
      anggaran: Math.round(item.anggaran * filterScale),
      realisasi: Math.round(item.realisasi * filterScale),
    }),
  );
  const filteredSectorData = MOCK_SECTOR_DATA.map((item, index) => ({
    ...item,
    value: Math.max(
      1,
      Math.round(
        item.value * filterScale +
          index * ((Number(appliedFilter.tahun) % 3) - 1),
      ),
    ),
  }));
  const activeFilterSummary = getFilterSummary(appliedFilter);

  return (
    <main className="space-y-8 pb-10">
      <section className="bg-sky-50 dark:bg-sky-950/30">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground mb-5 text-xs"
          >
            <Link href="/" className="hover:text-primary">
              Beranda
            </Link>
            <span className="mx-2" aria-hidden="true">
              ›
            </span>
            <span aria-current="page" className="text-primary font-medium">
              Data Pemerintah
            </span>
          </nav>
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
                Data Pemerintah
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6 sm:text-base">
                Pantau anggaran, proyek, dan jelajahi statistik daerah dalam
                satu dashboard terbuka
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-10">
                <Link href="#data-visualizations">
                  Jelajahi data
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10"
                onClick={downloadSummary}
              >
                <Download className="size-4" aria-hidden="true" />
                Unduh ringkasan
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section
        id="filters"
        aria-labelledby="filters-title"
        className="container mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2
              id="filters-title"
              className="text-card-foreground flex items-center gap-2 text-sm font-semibold"
            >
              <SlidersHorizontal
                className="text-primary size-4"
                aria-hidden="true"
              />
              Jelajahi data
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilter}
              className="text-primary"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Reset filter
            </Button>
          </div>

          <div className="hidden gap-4 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <FilterFields
              filter={draftFilter}
              onChange={setDraftFilter}
              idPrefix="desktop-filter"
            />
            <Button
              type="button"
              onClick={() => applyFilter(draftFilter)}
              className="h-11 whitespace-nowrap"
            >
              Terapkan filter
            </Button>
          </div>
          <div className="md:hidden">
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between"
              onClick={() => setMobileFiltersOpen(true)}
              aria-haspopup="dialog"
            >
              <span>Atur filter</span>
              <SlidersHorizontal className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <p aria-live="polite" className="text-muted-foreground mt-3 text-xs">
            <span className="bg-primary/10 text-primary mr-2 inline-flex rounded-full px-2.5 py-1 font-medium">
              {activeFilterSummary}
            </span>
            Ringkasan dan visualisasi menampilkan data simulasi sesuai filter
            yang diterapkan.
          </p>
        </div>
      </section>

      <Modal
        open={mobileFiltersOpen}
        onOpenChange={setMobileFiltersOpen}
        title="Filter data pemerintah"
        description="Pilih wilayah, tahun anggaran, dan periode kumulatif."
        contentClassName="fixed inset-x-0 bottom-0 top-auto left-0 max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl sm:rounded-t-2xl"
        footer={
          <Button
            type="button"
            onClick={() => applyFilter(draftFilter)}
            className="w-full sm:w-auto"
          >
            Terapkan filter
          </Button>
        }
      >
        <FilterFields
          filter={draftFilter}
          onChange={setDraftFilter}
          idPrefix="mobile-filter"
        />
      </Modal>

      <div className="container mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
        <section className="space-y-8">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-12">
            <div className="max-w-xl">
              <div className="mt-2 flex flex-wrap items-center gap-4">
                <SourceBadge
                  source="SIMULATED"
                  label="Preview mockup"
                  className="px-1.5 text-[10px] sm:px-2 sm:text-xs"
                />
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {DASHBOARD_STATS.map((stat) => (
                  <Card
                    key={stat.label}
                    className="border-border bg-card shadow-sm"
                  >
                    <CardHeader className="space-y-2 px-4 pt-4 pb-2">
                      <CardDescription className="text-muted-foreground text-xs font-semibold tracking-[0.24em] uppercase">
                        {stat.label}
                      </CardDescription>
                      <CardTitle className="text-card-foreground text-3xl font-semibold tracking-tight">
                        {stat.value}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3 px-4 pb-4">
                      <p className="text-muted-foreground max-w-[11rem] text-sm leading-6">
                        {stat.description}
                      </p>
                      <SourceBadge
                        source={stat.source}
                        label={stat.source}
                        withIcon={false}
                        className="shrink-0 px-1.5 text-[10px] sm:px-2 sm:text-xs"
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="order-last lg:order-none">
              <DashboardMockup />
            </div>
          </div>
        </section>

        <section
          id="data-visualizations"
          aria-labelledby="visualizations-title"
          className="space-y-6"
        >
          <h2
            id="visualizations-title"
            className="text-card-foreground text-2xl font-semibold tracking-tight"
          >
            Visualisasi Data Pemerintah
          </h2>
          <p className="text-muted-foreground">
            Ringkasan alokasi dan tren realisasi anggaran pemerintah untuk{" "}
            {activeFilterSummary}.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="px-4 pt-4 pb-3">
                <CardTitle className="text-card-foreground text-base font-semibold">
                  Realisasi Anggaran per Sektor
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Komposisi alokasi anggaran dalam diagram donat.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[260px]">
                  <PieChart
                    data={filteredSectorData}
                    height={240}
                    width="100%"
                    showLegend={true}
                    showTooltip={true}
                    innerRadius="60%"
                    outerRadius="85%"
                    ariaLabel="Grafik realisasi anggaran per sektor"
                  />
                </div>
                <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
                  <SourceBadge
                    source="SIMULATED"
                    label="SIMULATED"
                    withIcon={false}
                    className="px-1.5 text-[10px] sm:px-2 sm:text-xs"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardHeader className="px-4 pt-4 pb-3">
                <CardTitle className="text-card-foreground text-base font-semibold">
                  Tren Realisasi Anggaran
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Perbandingan anggaran dan realisasi bulanan.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[260px]">
                  <LineChart
                    data={filteredTrendData}
                    xKey="bulan"
                    series={[
                      { key: "anggaran", name: "Anggaran" },
                      { key: "realisasi", name: "Realisasi" },
                    ]}
                    height={240}
                    width="100%"
                    showGrid={true}
                    showLegend={true}
                    showTooltip={true}
                    showDots={false}
                    ariaLabel="Grafik tren realisasi anggaran bulanan"
                  />
                </div>
                <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
                  <SourceBadge
                    source="SIMULATED"
                    label="SIMULATED"
                    withIcon={false}
                    className="px-1.5 text-[10px] sm:px-2 sm:text-xs"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
