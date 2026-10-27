"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Database,
  Download,
  GraduationCap,
  HeartPulse,
  Info,
  MapPin,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { LineChart } from "@/components/charts/line-chart";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  exportStatisticsCsv,
  filterStatisticsIndicators,
  formatStatisticsDelta,
  formatStatisticsNumber,
  formatStatisticsValue,
  getRegionalIpm,
  getStatisticsValues,
  STATISTICS_INDICATORS,
  STATISTICS_REGIONS,
  type StatisticsCategory,
  type StatisticsIndicator,
  type StatisticsRegion,
  type StatisticsYear,
} from "./statistics-data";

type StatisticsFrequency = "tahunan" | "bulanan";

interface Filters {
  region: StatisticsRegion;
  year: StatisticsYear;
  frequency: StatisticsFrequency;
}

const DEFAULT_FILTERS: Filters = {
  region: "jabar",
  year: "2025",
  frequency: "tahunan",
};

const KPI_PRESENTATION = [
  {
    indicatorId: "penduduk",
    Icon: Users,
    description: "Estimasi penduduk pertengahan tahun",
  },
  { indicatorId: "ipm", Icon: GraduationCap, description: "Indeks (0–100)" },
  {
    indicatorId: "kemiskinan",
    Icon: HeartPulse,
    description: "Persentase penduduk",
  },
  {
    indicatorId: "pengangguran",
    Icon: BriefcaseBusiness,
    description: "Persentase angkatan kerja",
  },
  { indicatorId: "pertumbuhan", Icon: Activity, description: "Per tahun" },
  { indicatorId: "harapan-hidup", Icon: HeartPulse, description: "Tahun" },
];

const CATEGORIES: StatisticsCategory[] = [
  "Semua kategori",
  "Penduduk",
  "Kesejahteraan",
  "Ekonomi",
];

function parseFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  const region = params.get("wilayah");
  const year = params.get("tahun");
  const frequency = params.get("frekuensi");
  const selectedRegion = STATISTICS_REGIONS.find((item) => item.id === region);

  return {
    region: selectedRegion?.id ?? DEFAULT_FILTERS.region,
    year: year === "2024" || year === "2025" ? year : DEFAULT_FILTERS.year,
    frequency:
      frequency === "bulanan" || frequency === "tahunan"
        ? frequency
        : DEFAULT_FILTERS.frequency,
  };
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function deltaIsPositive(
  indicator: StatisticsIndicator,
  values: Record<StatisticsYear, number>,
): boolean {
  const delta = values["2025"] - values["2024"];
  return indicator.lowerIsBetter ? delta <= 0 : delta >= 0;
}

export function StatisticsDashboard() {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState("");
  const [category, setCategory] =
    useState<StatisticsCategory>("Semua kategori");
  const [showMetadata, setShowMetadata] = useState(false);

  useEffect(() => {
    const fromUrl = parseFilters(window.location.search);
    setFilters(fromUrl);
    setDraftFilters(fromUrl);

    const syncFromUrl = () => {
      const nextFilters = parseFilters(window.location.search);
      setFilters(nextFilters);
      setDraftFilters(nextFilters);
    };
    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const visibleIndicators = useMemo(
    () => filterStatisticsIndicators(STATISTICS_INDICATORS, search, category),
    [search, category],
  );
  const selectedRegion =
    STATISTICS_REGIONS.find((region) => region.id === filters.region) ??
    STATISTICS_REGIONS[0];
  const kpiIndicators = STATISTICS_INDICATORS;
  const chartData = ["2021", "2022", "2023", "2024", "2025"].map((year) => ({
    year,
    jabar: getRegionalIpm("jabar", year),
    jateng: getRegionalIpm("jateng", year),
    jatim: getRegionalIpm("jatim", year),
  }));

  function applyFilters() {
    setFilters(draftFilters);
    const params = new URLSearchParams({
      wilayah: draftFilters.region,
      tahun: draftFilters.year,
      frekuensi: draftFilters.frequency,
    });
    window.history.pushState(null, "", `?${params.toString()}`);
  }

  function resetFilters() {
    setDraftFilters(DEFAULT_FILTERS);
    setFilters(DEFAULT_FILTERS);
    window.history.pushState(null, "", window.location.pathname);
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="border-border relative left-1/2 -mt-6 w-screen -translate-x-1/2 border-b bg-sky-50/70 px-4 py-6 dark:bg-sky-950/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-muted-foreground mb-3 text-xs"
            >
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-primary">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">&gt;</li>
                <li>
                  <Link href="/data" className="hover:text-primary">
                    Data Pemerintah
                  </Link>
                </li>
                <li aria-hidden="true">&gt;</li>
                <li aria-current="page" className="text-primary font-medium">
                  Statistik daerah
                </li>
              </ol>
            </nav>
            <h1 className="text-2xl font-semibold tracking-tight">
              Statistik Daerah
            </h1>
            <p className="text-muted-foreground mt-1 text-xs">
              Kenali kondisi penduduk, ekonomi, dan kesejahteraan. Lihat
              perubahan dari tahun ke tahun dan bandingkan antarwilayah.
            </p>
          </div>
          <Button
            onClick={() =>
              downloadFile(
                "ringkasan-statistik-daerah.json",
                JSON.stringify(
                  {
                    wilayah: selectedRegion.name,
                    tahun: filters.year,
                    data: kpiIndicators.map((indicator) => ({
                      ...indicator,
                      values: getStatisticsValues(indicator, filters.region),
                    })),
                  },
                  null,
                  2,
                ),
                "application/json;charset=utf-8",
              )
            }
          >
            <Download className="size-4" aria-hidden="true" />
            Unduh ringkasan
          </Button>
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
            className={`focus-visible:ring-ring shrink-0 border-b-2 px-0 py-2.5 text-sm focus-visible:ring-2 focus-visible:outline-none ${
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
        <CardHeader className="flex-row items-center justify-between px-4 py-0">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="text-primary size-4" aria-hidden="true" />
            Jelajahi statistik
          </h2>
          <Button variant="link" size="sm" onClick={resetFilters}>
            Reset filter
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 md:grid-cols-4">
          <label className="space-y-1.5 text-xs font-medium">
            Wilayah utama
            <Select
              aria-label="Wilayah utama"
              value={draftFilters.region}
              onChange={(event) => {
                const region = STATISTICS_REGIONS.find(
                  (item) => item.id === event.target.value,
                );
                if (region) {
                  setDraftFilters((current) => ({
                    ...current,
                    region: region.id,
                  }));
                }
              }}
              options={STATISTICS_REGIONS.map(({ id, name }) => ({
                value: id,
                label: `Provinsi ${name}`,
              }))}
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Tahun
            <Select
              aria-label="Tahun"
              value={draftFilters.year}
              onChange={(event) => {
                const year = event.target.value;
                if (year === "2024" || year === "2025") {
                  setDraftFilters((current) => ({
                    ...current,
                    year,
                  }));
                }
              }}
              options={[
                { value: "2025", label: "2025" },
                { value: "2024", label: "2024" },
              ]}
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Frekuensi
            <Select
              aria-label="Frekuensi"
              value={draftFilters.frequency}
              onChange={(event) => {
                const frequency = event.target.value;
                if (frequency === "bulanan" || frequency === "tahunan") {
                  setDraftFilters((current) => ({
                    ...current,
                    frequency,
                  }));
                }
              }}
              options={[
                { value: "tahunan", label: "Tahunan" },
                { value: "bulanan", label: "Bulanan" },
              ]}
            />
          </label>
          <div className="flex items-end">
            <Button onClick={applyFilters} className="w-full">
              Terapkan filter
            </Button>
          </div>
        </CardContent>
        <p className="text-muted-foreground px-4 text-xs">
          <span className="rounded-full bg-blue-100 px-2 py-1 font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            {selectedRegion.name} · Tahun {filters.year}
          </span>{" "}
          Pembaruan visualisasi: 30 Sep 2025, 16.00 WIB
        </p>
      </Card>

      <section aria-labelledby="potret-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="potret-title" className="text-lg font-semibold">
              Potret {selectedRegion.name}
            </h2>
            <p className="text-muted-foreground text-xs">
              Perubahan terhadap 2024 · pp = poin persentase
            </p>
          </div>
          <SourceBadge
            source="SIMULATED"
            label="Indikator tahunan · simulasi"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {kpiIndicators.map((indicator) => {
            const presentation = KPI_PRESENTATION.find(
              (item) => item.indicatorId === indicator.id,
            );
            const Icon = presentation?.Icon ?? Activity;
            const values = getStatisticsValues(indicator, filters.region);
            const currentValue =
              filters.year === "2024" ? values["2024"] : values["2025"];
            return (
              <Card key={indicator.id} className="gap-3 p-4 shadow-sm">
                <CardHeader className="flex-row items-center justify-between p-0">
                  <span className="text-primary inline-flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <SourceBadge
                    source="SIMULATED"
                    label="Simulasi"
                    withIcon={false}
                    className="px-1.5 py-0.5 text-[10px]"
                  />
                </CardHeader>
                <CardContent className="space-y-1 p-0">
                  <p className="text-muted-foreground text-xs">
                    {indicator.name}
                  </p>
                  <p className="text-2xl font-semibold tabular-nums">
                    {formatStatisticsValue(currentValue, indicator.format)}
                  </p>
                  {filters.year === "2025" ? (
                    <p
                      className={`text-xs font-medium ${deltaIsPositive(indicator, values) ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
                    >
                      {deltaIsPositive(indicator, values) ? (
                        <ArrowUp
                          className="mr-1 inline size-3"
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowDown
                          className="mr-1 inline size-3"
                          aria-hidden="true"
                        />
                      )}
                      {formatStatisticsDelta(indicator, values)} dari tahun
                      sebelumnya
                    </p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Data pembanding 2023 tidak tersedia
                    </p>
                  )}
                  <p className="text-muted-foreground text-xs">
                    {presentation?.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <p className="flex items-start gap-2 rounded-md bg-sky-50 px-3 py-2.5 text-xs leading-5 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
        <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Nilai tidak selalu berarti lebih baik. Pertumbuhan penduduk bersifat
        deskriptif; penurunan kemiskinan dan pengangguran menunjukkan perbaikan.
      </p>

      <section aria-labelledby="comparison-title" className="space-y-3">
        <div>
          <h2 id="comparison-title" className="text-lg font-semibold">
            Lihat perubahan, pahami perbedaan
          </h2>
          <p className="text-muted-foreground text-xs">
            Satu indikator, periode yang sama, dan wilayah setingkat untuk
            perbandingan yang adil.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <Card className="min-w-0 shadow-sm">
            <CardHeader className="flex-row items-start justify-between px-4 pt-4 pb-0">
              <div>
                <h3 className="font-semibold">Tren pembangunan manusia</h3>
                <p className="text-muted-foreground text-xs">
                  IPM 2021–2025 · indeks 0–100 · data ilustratif
                </p>
              </div>
              <SourceBadge
                source="SIMULATED"
                label="Simulasi"
                withIcon={false}
              />
            </CardHeader>
            <CardContent className="pt-3">
              {filters.frequency === "tahunan" ? (
                <LineChart
                  data={chartData}
                  xKey="year"
                  series={[
                    { key: "jabar", name: "Jawa Barat", color: "#2563eb" },
                    { key: "jateng", name: "Jawa Tengah", color: "#14b8a6" },
                    { key: "jatim", name: "Jawa Timur", color: "#64748b" },
                  ]}
                  width="100%"
                  height={280}
                  ariaLabel="Perbandingan IPM Jawa Barat, Jawa Tengah, dan Jawa Timur tahun 2021 sampai 2025"
                />
              ) : (
                <p
                  role="status"
                  className="text-muted-foreground rounded-md border border-dashed p-8 text-center text-sm"
                >
                  Data IPM pada snapshot ini tersedia tahunan, bukan bulanan.
                  Pilih frekuensi Tahunan untuk melihat tren yang dapat
                  dibandingkan.
                </p>
              )}
              <p className="mt-3 rounded-md bg-emerald-50 p-3 text-xs leading-5 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                <strong>Jawa Barat naik 0,7 poin dari 2024.</strong> IPM
                merangkum kesehatan, pendidikan, dan standar hidup. Nilai lebih
                tinggi menunjukkan capaian relatif lebih baik, bukan berarti
                semua warga mengalami dampak yang sama.
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="px-4 pt-4 pb-0">
              <h3 className="font-semibold">Bandingkan capaian daerah</h3>
              <p className="text-muted-foreground text-xs">
                IPM tahun {filters.year} · indeks 0–100
              </p>
            </CardHeader>
            <CardContent className="space-y-4 pt-3">
              {filters.frequency === "bulanan" ? (
                <p
                  role="status"
                  className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm"
                >
                  Perbandingan IPM antarwilayah pada snapshot ini hanya tersedia
                  tahunan.
                </p>
              ) : (
                <>
                  {STATISTICS_REGIONS.map((region) => {
                    const value = getRegionalIpm(region.id, filters.year);
                    return (
                      <div key={region.id}>
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="font-medium">{region.name}</span>
                          <span className="font-semibold tabular-nums">
                            {value.toLocaleString("id-ID", {
                              minimumFractionDigits: 1,
                            })}
                          </span>
                        </div>
                        <div
                          className="bg-muted h-2 rounded-full"
                          role="img"
                          aria-label={`IPM ${region.name}: ${value.toLocaleString("id-ID")}`}
                        >
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${(value / 100) * 100}%` }}
                          />
                        </div>
                        <p className="text-muted-foreground mt-1 text-[10px]">
                          Indeks pembangunan manusia
                        </p>
                      </div>
                    );
                  })}
                  <div className="rounded-md bg-sky-50 p-3 text-xs leading-5 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
                    <strong>Selisih kecil, konteks tetap penting.</strong>
                    <p className="text-muted-foreground mt-1">
                      Perbedaan IPM bukan peringkat kesejahteraan yang mutlak.
                      Perhatikan definisi, periode, dan kondisi tiap wilayah.
                    </p>
                  </div>
                  <p className="text-muted-foreground text-[10px]">
                    Sumber: snapshot data ilustratif Agoraya · wilayah setingkat
                    · periode dan definisi sama.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="indicator-table-title">
        <Card className="shadow-sm">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-0">
            <div>
              <h2 id="indicator-table-title" className="text-lg font-semibold">
                Telusuri indikator daerah
              </h2>
              <p className="text-muted-foreground text-xs">
                6 indikator {selectedRegion.name} · nilai 2024 dan 2025.
              </p>
            </div>
            <Button
              aria-label="Unduh CSV indikator terfilter"
              variant="outline"
              disabled={filters.frequency === "bulanan"}
              onClick={() =>
                downloadFile(
                  "indikator-statistik-daerah.csv",
                  exportStatisticsCsv(visibleIndicators, filters.region),
                  "text/csv;charset=utf-8",
                )
              }
            >
              <Download className="size-4" aria-hidden="true" />
              Unduh CSV
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-4">
            <div className="grid gap-2 sm:grid-cols-[1fr_180px]">
              <label className="relative">
                <Search
                  className="text-muted-foreground absolute top-2.5 left-3 size-4"
                  aria-hidden="true"
                />
                <Input
                  aria-label="Cari indikator"
                  placeholder="Cari nama indikator..."
                  className="pl-9"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </label>
              <Select
                aria-label="Filter kategori indikator"
                value={category}
                options={CATEGORIES.map((value) => ({
                  value,
                  label: value,
                }))}
                onChange={(event) => {
                  const nextCategory = CATEGORIES.find(
                    (item) => item === event.target.value,
                  );
                  if (nextCategory) setCategory(nextCategory);
                }}
              />
            </div>
            {filters.frequency === "bulanan" ? (
              <p
                role="status"
                className="text-muted-foreground border-border rounded-md border border-dashed p-6 text-center text-sm"
              >
                Tidak ada data bulanan pada snapshot yang tersedia. Pilih
                frekuensi Tahunan atau unduh dataset tahunan.
              </p>
            ) : visibleIndicators.length === 0 ? (
              <p
                role="status"
                className="text-muted-foreground border-border rounded-md border border-dashed p-6 text-center text-sm"
              >
                Tidak ada indikator yang cocok. Ubah kata pencarian atau
                kategori.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <caption className="sr-only">
                    Daftar indikator daerah dan perubahan nilai 2024 ke 2025
                  </caption>
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th scope="col" className="px-3 py-3">
                        Indikator / definisi singkat
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Satuan
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Periode
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Nilai 2024
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Nilai 2025
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Perubahan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {visibleIndicators.map((indicator) => (
                      <tr key={indicator.id} className="hover:bg-accent/40">
                        <th scope="row" className="px-3 py-3 font-medium">
                          {indicator.name}
                          <span className="text-muted-foreground mt-1 block font-normal">
                            {indicator.description}
                          </span>
                        </th>
                        <td className="text-muted-foreground px-3 py-3">
                          {indicator.unit}
                        </td>
                        <td className="text-muted-foreground px-3 py-3">
                          2024–2025
                        </td>
                        <td className="text-muted-foreground px-3 py-3 tabular-nums">
                          {formatStatisticsNumber(
                            getStatisticsValues(indicator, filters.region)[
                              "2024"
                            ],
                          )}
                        </td>
                        <td className="px-3 py-3 font-semibold tabular-nums">
                          {formatStatisticsNumber(
                            getStatisticsValues(indicator, filters.region)[
                              "2025"
                            ],
                          )}
                        </td>
                        <td className="px-3 py-3 font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
                          {formatStatisticsDelta(
                            indicator,
                            getStatisticsValues(indicator, filters.region),
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <details open className="border-primary rounded-lg border p-3">
              <summary className="text-primary cursor-pointer text-xs font-semibold">
                DEFINISI INDIKATOR TERPILIH · Indeks pembangunan manusia (IPM)
              </summary>
              <div className="space-y-2 pt-3 text-xs leading-5">
                <p>
                  Menggambarkan capaian pembangunan manusia melalui umur panjang
                  dan hidup sehat, pengetahuan, serta standar hidup layak. Skala
                  0–100; semakin tinggi nilainya, semakin baik capaian relatif
                  pada dimensi tersebut.
                </p>
                <ul className="grid gap-1 sm:grid-cols-3">
                  <li>
                    <HeartPulse
                      className="text-primary mr-1 inline size-3"
                      aria-hidden="true"
                    />
                    <strong>Kesehatan:</strong> umur harapan hidup.
                  </li>
                  <li>
                    <GraduationCap
                      className="text-primary mr-1 inline size-3"
                      aria-hidden="true"
                    />
                    <strong>Pendidikan:</strong> harapan lama sekolah dan
                    rata-rata lama sekolah.
                  </li>
                  <li>
                    <Activity
                      className="text-primary mr-1 inline size-3"
                      aria-hidden="true"
                    />
                    <strong>Ekonomi:</strong> pengeluaran riil per kapita
                    disesuaikan.
                  </li>
                </ul>
                <p className="rounded-md bg-sky-50 p-2 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
                  Contoh: IPM 74,5 → 75,2 = naik 0,7 poin, bukan kenaikan 0,7%.
                </p>
                <a
                  href="#metodologi"
                  className="text-primary inline-flex items-center gap-1 font-medium"
                >
                  Lihat metadata & metodologi{" "}
                  <ArrowUp className="size-3" aria-hidden="true" />
                </a>
              </div>
            </details>
            <p className="text-muted-foreground text-[10px]">
              Menampilkan {visibleIndicators.length} dari{" "}
              {STATISTICS_INDICATORS.length} indikator · Sumber ilustratif · pp
              = poin persentase.
            </p>
          </CardContent>
        </Card>
      </section>

      <section id="metodologi" aria-labelledby="methodology-title">
        <Card className="shadow-sm">
          <CardHeader className="flex-row items-center gap-2 px-4 pt-4 pb-0">
            <Database className="text-primary size-4" aria-hidden="true" />
            <h2 id="methodology-title" className="text-lg font-semibold">
              Sumber, cakupan & metodologi
            </h2>
          </CardHeader>
          <CardContent className="grid gap-x-8 gap-y-4 pt-4 text-xs sm:grid-cols-2">
            <div>
              <h3 className="font-semibold">Sumber angka</h3>
              <p className="text-muted-foreground mt-1">
                Snapshot data ilustratif Agoraya. Angka ini bukan publikasi
                resmi atau data API BPS dan tidak untuk dikutip sebagai
                statistik pemerintah.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Periode & pembaruan</h3>
              <p className="text-muted-foreground mt-1">
                Ringkasan tahunan 2025 dibandingkan dengan 2024. Tren IPM
                2021–2025. Snapshot terakhir diperbarui 30 September 2025.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Cakupan wilayah</h3>
              <p className="text-muted-foreground mt-1">
                6 indikator untuk provinsi Jawa Barat, Jawa Tengah, dan Jawa
                Timur; pembanding IPM dibatasi pada tiga provinsi tersebut.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">Cara membaca perubahan</h3>
              <p className="text-muted-foreground mt-1">
                Selisih = nilai 2025 − nilai 2024. Kemiskinan dan pengangguran
                memakai pp (poin persentase), bukan persen relatif; IPM memakai
                poin indeks.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section aria-labelledby="dataset-title">
        <Card className="gap-3 shadow-sm">
          <CardHeader className="flex-row flex-wrap items-start justify-between gap-4 px-4 pt-4 pb-0">
            <div>
              <p className="text-primary flex items-center gap-1 text-[10px] font-semibold uppercase">
                <Database className="size-3" aria-hidden="true" /> Dataset view
              </p>
              <h2 id="dataset-title" className="mt-1 font-semibold">
                Indikator statistik daerah
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                6 indikator {selectedRegion.name} 2024–2025 + tren IPM 3
                provinsi 2021–2025. Termasuk definisi, periode, dan penanda data
                ilustratif.
              </p>
              <Button
                variant="link"
                size="sm"
                className="px-0"
                onClick={() => setShowMetadata(!showMetadata)}
              >
                <BookOpen className="size-3" aria-hidden="true" />
                Metadata
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                aria-label="Unduh CSV dataset lengkap"
                variant="outline"
                onClick={() =>
                  downloadFile(
                    "indikator-statistik-daerah.csv",
                    exportStatisticsCsv(STATISTICS_INDICATORS, filters.region),
                    "text/csv;charset=utf-8",
                  )
                }
              >
                <Download className="size-4" aria-hidden="true" />
                Unduh CSV
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  downloadFile(
                    "indikator-statistik-daerah.json",
                    JSON.stringify(
                      {
                        wilayah: selectedRegion.name,
                        frekuensi: filters.frequency,
                        indikator: STATISTICS_INDICATORS.map((indicator) => ({
                          ...indicator,
                          values: getStatisticsValues(
                            indicator,
                            filters.region,
                          ),
                        })),
                      },
                      null,
                      2,
                    ),
                    "application/json;charset=utf-8",
                  )
                }
              >
                <Download className="size-4" aria-hidden="true" />
                Unduh JSON
              </Button>
            </div>
          </CardHeader>
          {showMetadata ? (
            <CardContent className="px-4 pb-4">
              <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs whitespace-pre-wrap">
                {JSON.stringify(
                  {
                    judul: "Indikator statistik daerah",
                    sumber: "Simulasi Agoraya, bukan data resmi BPS",
                    periode: ["2024", "2025"],
                    cakupan: STATISTICS_REGIONS.map((region) => region.name),
                    pembaruan: "2025-09-30",
                    kolom: [
                      "indikator",
                      "satuan",
                      "periode",
                      "nilai_2024",
                      "nilai_2025",
                      "perubahan",
                    ],
                  },
                  null,
                  2,
                )}
              </pre>
            </CardContent>
          ) : null}
        </Card>
      </section>

      <aside className="rounded-lg bg-sky-50 p-4 text-xs leading-5 text-sky-950 dark:bg-sky-950/30 dark:text-sky-100">
        <h2 className="flex items-center gap-2 font-semibold">
          <ShieldCheck className="size-4" aria-hidden="true" />
          Data terbuka, konteks tetap penting.
        </h2>
        <p className="mt-2">
          Informasi pada halaman ini adalah data ilustratif untuk demonstrasi,
          bukan kondisi resmi atau angka final pemerintah. Tahun 2025 adalah
          snapshot tahunan. Jangan gunakan sebagai satu-satunya dasar keputusan
          kebijakan. Perbedaan antarwilayah dipengaruhi cakupan definisi,
          satuan, dan periode data.
        </p>
        <div className="mt-2 flex flex-wrap gap-4">
          <a href="#metodologi" className="text-primary font-medium">
            Panduan membaca data{" "}
            <ArrowUp className="inline size-3" aria-hidden="true" />
          </a>
          <Link href="/data" className="text-primary font-medium">
            Kembali ke Data Pemerintah{" "}
            <MapPin className="inline size-3" aria-hidden="true" />
          </Link>
        </div>
      </aside>
    </div>
  );
}
