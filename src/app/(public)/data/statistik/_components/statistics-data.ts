import { INDONESIAN_PROVINCES } from "@/lib/indonesia-administrative-areas";

export type StatisticsYear = "2024" | "2025";
export type StatisticsRegion = string;
export type StatisticsCategory =
  "Semua kategori" | "Penduduk" | "Kesejahteraan" | "Ekonomi";

export interface StatisticsIndicator {
  id: string;
  name: string;
  description: string;
  unit: string;
  category: Exclude<StatisticsCategory, "Semua kategori">;
  format: "population" | "index" | "percent" | "growth" | "years";
  lowerIsBetter?: boolean;
  values: Record<StatisticsYear, number>;
}

const LEGACY_PROVINCE_IDS = new Map<string, string>([
  ["Jawa Barat", "jabar"],
  ["Jawa Tengah", "jateng"],
  ["Jawa Timur", "jatim"],
]);

export const STATISTICS_REGIONS: {
  id: StatisticsRegion;
  name: string;
}[] = INDONESIAN_PROVINCES.map((province) => {
  const name = province.replace(/^Provinsi /, "");
  const legacyId = LEGACY_PROVINCE_IDS.get(name);
  return {
    id:
      legacyId ??
      `provinsi-${name
        .toLocaleLowerCase("id-ID")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`,
    name,
  };
});

export const SUPPORTED_STATISTICS_REGIONS = ["jabar", "jateng", "jatim"];

export const STATISTICS_INDICATORS: StatisticsIndicator[] = [
  {
    id: "penduduk",
    name: "Jumlah penduduk",
    description: "Jumlah penduduk pada pertengahan tahun.",
    unit: "juta jiwa",
    category: "Penduduk",
    format: "population",
    values: { "2024": 49.8, "2025": 50.4 },
  },
  {
    id: "ipm",
    name: "Indeks pembangunan manusia",
    description: "Indeks gabungan kesehatan, pendidikan, dan standar hidup.",
    unit: "indeks (0–100)",
    category: "Kesejahteraan",
    format: "index",
    values: { "2024": 74.5, "2025": 75.2 },
  },
  {
    id: "kemiskinan",
    name: "Tingkat kemiskinan",
    description: "Persentase penduduk di bawah garis kemiskinan.",
    unit: "% penduduk",
    category: "Kesejahteraan",
    format: "percent",
    lowerIsBetter: true,
    values: { "2024": 7.8, "2025": 7.4 },
  },
  {
    id: "pengangguran",
    name: "Pengangguran terbuka",
    description: "Persentase pengangguran dalam angkatan kerja.",
    unit: "% angkatan kerja",
    category: "Ekonomi",
    format: "percent",
    lowerIsBetter: true,
    values: { "2024": 7.1, "2025": 6.8 },
  },
  {
    id: "pertumbuhan",
    name: "Pertumbuhan ekonomi",
    description: "Perubahan PDRB atas dasar harga konstan.",
    unit: "% per tahun",
    category: "Ekonomi",
    format: "growth",
    values: { "2024": 5.0, "2025": 5.2 },
  },
  {
    id: "harapan-hidup",
    name: "Umur harapan hidup",
    description: "Perkiraan rata-rata tahun hidup sejak lahir.",
    unit: "tahun",
    category: "Kesejahteraan",
    format: "years",
    values: { "2024": 73.7, "2025": 74.0 },
  },
];

const REGIONAL_STATISTICS_VALUES: {
  region: StatisticsRegion;
  indicatorValues: { id: string; values: Record<StatisticsYear, number> }[];
}[] = [
  {
    region: "jabar",
    indicatorValues: STATISTICS_INDICATORS.map(({ id, values }) => ({
      id,
      values,
    })),
  },
  {
    region: "jateng",
    indicatorValues: [
      { id: "penduduk", values: { "2024": 37.9, "2025": 38.1 } },
      { id: "ipm", values: { "2024": 74.0, "2025": 74.6 } },
      { id: "kemiskinan", values: { "2024": 10.5, "2025": 10.2 } },
      { id: "pengangguran", values: { "2024": 5.5, "2025": 5.1 } },
      { id: "pertumbuhan", values: { "2024": 4.9, "2025": 5.1 } },
      { id: "harapan-hidup", values: { "2024": 74.2, "2025": 74.5 } },
    ],
  },
  {
    region: "jatim",
    indicatorValues: [
      { id: "penduduk", values: { "2024": 41.5, "2025": 41.8 } },
      { id: "ipm", values: { "2024": 74.3, "2025": 75.0 } },
      { id: "kemiskinan", values: { "2024": 10.4, "2025": 9.8 } },
      { id: "pengangguran", values: { "2024": 4.1, "2025": 3.8 } },
      { id: "pertumbuhan", values: { "2024": 4.8, "2025": 5.0 } },
      { id: "harapan-hidup", values: { "2024": 74.5, "2025": 74.8 } },
    ],
  },
];

const REGIONAL_IPM_VALUES: {
  region: StatisticsRegion;
  values: { year: string; value: number }[];
}[] = [
  {
    region: "jabar",
    values: [
      { year: "2021", value: 72.4 },
      { year: "2022", value: 73.1 },
      { year: "2023", value: 73.8 },
      { year: "2024", value: 74.5 },
      { year: "2025", value: 75.2 },
    ],
  },
  {
    region: "jateng",
    values: [
      { year: "2021", value: 72.1 },
      { year: "2022", value: 72.7 },
      { year: "2023", value: 73.3 },
      { year: "2024", value: 74.0 },
      { year: "2025", value: 74.6 },
    ],
  },
  {
    region: "jatim",
    values: [
      { year: "2021", value: 72.3 },
      { year: "2022", value: 73.0 },
      { year: "2023", value: 73.6 },
      { year: "2024", value: 74.3 },
      { year: "2025", value: 75.0 },
    ],
  },
];

export function getStatisticsValues(
  indicator: StatisticsIndicator,
  region: StatisticsRegion,
): Record<StatisticsYear, number> {
  return (
    REGIONAL_STATISTICS_VALUES.find(
      (entry) => entry.region === region,
    )?.indicatorValues.find((entry) => entry.id === indicator.id)?.values ??
    indicator.values
  );
}

export function getRegionalIpm(region: StatisticsRegion, year: string): number {
  return (
    REGIONAL_IPM_VALUES.find((entry) => entry.region === region)?.values.find(
      (entry) => entry.year === year,
    )?.value ?? 0
  );
}

export function formatStatisticsValue(
  value: number,
  format: StatisticsIndicator["format"],
): string {
  const formatted = formatStatisticsNumber(value);

  switch (format) {
    case "population":
      return `${formatted} juta jiwa`;
    case "percent":
    case "growth":
      return `${formatted}%`;
    case "years":
      return `${formatted} tahun`;
    case "index":
      return formatted;
  }
}

export function formatStatisticsNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatStatisticsDelta(
  indicator: StatisticsIndicator,
  values = indicator.values,
): string {
  const delta = values["2025"] - values["2024"];
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "";
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(Math.abs(delta));

  switch (indicator.format) {
    case "population":
      return `${sign}${formatted} juta jiwa`;
    case "percent":
      return `${sign}${formatted} pp`;
    case "growth":
      return `${sign}${formatted} poin`;
    case "years":
      return `${sign}${formatted} tahun`;
    case "index":
      return `${sign}${formatted} poin`;
  }
}

export function filterStatisticsIndicators(
  indicators: readonly StatisticsIndicator[],
  search: string,
  category: StatisticsCategory,
): StatisticsIndicator[] {
  const normalizedSearch = search.trim().toLocaleLowerCase("id");

  return indicators.filter((indicator) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${indicator.name} ${indicator.description} ${indicator.unit}`
        .toLocaleLowerCase("id")
        .includes(normalizedSearch) ||
      indicator.id.toLocaleLowerCase("id").includes(normalizedSearch) ||
      (indicator.id === "ipm" && "ipm".includes(normalizedSearch));
    return (
      matchesSearch &&
      (category === "Semua kategori" || indicator.category === category)
    );
  });
}

export function exportStatisticsCsv(
  indicators: readonly StatisticsIndicator[],
  region: StatisticsRegion = "jabar",
): string {
  const escape = (value: string | number) =>
    `"${String(value).replaceAll('"', '""')}"`;
  const rows = indicators.map((indicator) => [
    indicator.name,
    indicator.unit,
    indicator.category,
    getStatisticsValues(indicator, region)["2024"],
    getStatisticsValues(indicator, region)["2025"],
    getStatisticsValues(indicator, region)["2025"] -
      getStatisticsValues(indicator, region)["2024"],
  ]);

  return [
    [
      "Indikator",
      "Satuan",
      "Kategori",
      "Nilai 2024",
      "Nilai 2025",
      "Perubahan",
    ],
    ...rows,
  ]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");
}
