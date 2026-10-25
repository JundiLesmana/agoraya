import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge } from '@/components/source-badges/source-badge';
import { PieChart } from '@/components/charts/pie-chart';
import { LineChart } from '@/components/charts/line-chart';
import { DashboardMockup } from '../_components/dashboard-preview';
import { SummaryKpiCards, type SummaryKpiData } from './_components/summary-kpi-cards';

// TODO: Replace with the read-only public-data aggregate endpoint when available.
const SUMMARY_KPI_DATA: SummaryKpiData = {
  totalAnggaran: 80_000_000_000_000,
  realisasi: 60_000_000_000_000,
  proyekSelesai: 156,
  totalProyek: 240,
  cakupanWilayah: 27,
};

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
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
      <SummaryKpiCards data={SUMMARY_KPI_DATA} />

      <section className="space-y-8">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.12fr)] lg:gap-12">
          <div className="max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-primary">Data Pemerintah</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-card-foreground sm:text-5xl">
              Akses Data, Pahami Kondisi, Lihat Bukti Nyata
            </h1>
            <p className="mt-5 text-base leading-8 text-muted-foreground sm:text-lg">
              Jelajahi dataset pemerintah, pantau anggaran, dan baca kondisi publik melalui dashboard yang ringkas,
              terbuka, dan mudah dipahami oleh ASN, eksekutif, dan peneliti.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button asChild size="lg" className="rounded-full px-6 shadow-lg shadow-primary/20">
                <Link href="/data/catalog">
                  Jelajahi Semua Data
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
