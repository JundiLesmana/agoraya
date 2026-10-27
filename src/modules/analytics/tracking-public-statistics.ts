import type {
  TrackingStatisticsDashboard,
  TrackingStatisticsQuery,
} from "./tracking-statistics-contract";

type AnalyticsPeriod = TrackingStatisticsQuery["period"];
type AnalyticsRegion = TrackingStatisticsQuery["region"];
type AnalyticsFilters = TrackingStatisticsQuery;
type ChartDatum = Record<string, string | number | null>;

interface AggregateRegion {
  id: Exclude<AnalyticsRegion, "all">;
  label: string;
  reports: number;
  complaints: number;
  averageDays: number;
  satisfaction: number;
  resolvedRate: number;
  reportChange: number;
  complaintChange: number;
  resolutionChange: number;
  satisfactionChange: number;
  services: { name: string; count: number; color: string }[];
  districts: { name: string; reports: number }[];
  resolution: {
    service: string;
    agency: string;
    cases: number;
    averageDays: number;
    targetDays: number;
  }[];
  sentiment: { name: string; value: number; color: string }[];
  monthlyTrend: { label: string; reports: number; complaints: number }[];
}

const MONTHS = [
  "Nov",
  "Des",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
];
const SERVICE_TYPES = [
  ["Infrastruktur", "#2563a6"],
  ["Administrasi", "#dc7437"],
  ["Kebersihan", "#138574"],
  ["Kesehatan", "#9d5a9c"],
  ["Bantuan sosial", "#be8a24"],
  ["Lainnya", "#68778a"],
] as const;
const DISTRICTS: Record<Exclude<AnalyticsRegion, "all">, readonly string[]> = {
  jabar: [
    "Kota Bandung",
    "Kab. Bogor",
    "Kota Bekasi",
    "Kab. Bandung",
    "Kab. Garut",
  ],
  jateng: [
    "Kota Semarang",
    "Kab. Banyumas",
    "Kota Surakarta",
    "Kab. Klaten",
    "Kab. Kudus",
  ],
  jatim: [
    "Kota Surabaya",
    "Kab. Malang",
    "Kota Malang",
    "Kab. Jember",
    "Kab. Sidoarjo",
  ],
  jakarta: [
    "Jakarta Selatan",
    "Jakarta Timur",
    "Jakarta Barat",
    "Jakarta Pusat",
    "Jakarta Utara",
  ],
  sumut: [
    "Kota Medan",
    "Kab. Deli Serdang",
    "Kota Binjai",
    "Kab. Simalungun",
    "Kab. Langkat",
  ],
  sulsel: [
    "Kota Makassar",
    "Kab. Gowa",
    "Kota Parepare",
    "Kab. Maros",
    "Kab. Bone",
  ],
  bali: [
    "Kota Denpasar",
    "Kab. Badung",
    "Kab. Gianyar",
    "Kab. Buleleng",
    "Kab. Tabanan",
  ],
};

function getDistricts(id: Exclude<AnalyticsRegion, "all">): readonly string[] {
  switch (id) {
    case "jabar":
      return DISTRICTS.jabar;
    case "jateng":
      return DISTRICTS.jateng;
    case "jatim":
      return DISTRICTS.jatim;
    case "jakarta":
      return DISTRICTS.jakarta;
    case "sumut":
      return DISTRICTS.sumut;
    case "sulsel":
      return DISTRICTS.sulsel;
    case "bali":
      return DISTRICTS.bali;
  }
}

function createRegion(
  id: Exclude<AnalyticsRegion, "all">,
  label: string,
  reports: number,
  averageDays: number,
  satisfaction: number,
  resolvedRate: number,
  serviceShares: readonly number[],
  districtShares: readonly number[],
  trendOffset: number,
  changeSeed = trendOffset,
): AggregateRegion {
  const complaints = Math.round(reports * 0.42);
  const serviceTotal = reports;
  const services = SERVICE_TYPES.map(([name, color], index) => ({
    name,
    color,
    count: Math.round(serviceTotal * (serviceShares.at(index) ?? 0)),
  }));
  const districts = getDistricts(id).map((name, index) => ({
    name,
    reports: Math.round(reports * (districtShares.at(index) ?? 0)),
  }));
  const resolution = [
    {
      service: "Perbaikan jalan lingkungan",
      agency: "Dinas PUPR",
      targetDays: 7,
      offset: 2.6,
    },
    {
      service: "Perizinan usaha mikro",
      agency: "DPMPTSP",
      targetDays: 5,
      offset: 1.9,
    },
    {
      service: "Penanganan sampah",
      agency: "Dinas Lingkungan Hidup",
      targetDays: 3,
      offset: 1.3,
    },
    {
      service: "Perbaikan penerangan jalan",
      agency: "Dinas Perhubungan",
      targetDays: 4,
      offset: 0.8,
    },
    {
      service: "Administrasi kependudukan",
      agency: "Disdukcapil",
      targetDays: 3,
      offset: 0.4,
    },
  ].map((item, index) => ({
    service: item.service,
    agency: item.agency,
    cases: Math.round(reports * (0.12 - index * 0.012)),
    averageDays: Number((averageDays + item.offset).toFixed(1)),
    targetDays: item.targetDays,
  }));

  return {
    id,
    label,
    reports,
    complaints,
    averageDays,
    satisfaction,
    resolvedRate,
    reportChange: 3 + changeSeed * 0.6,
    complaintChange: 2 + changeSeed * 0.4,
    resolutionChange: -2 - changeSeed * 0.3,
    satisfactionChange: 0.8 + changeSeed * 0.15,
    services,
    districts,
    resolution,
    sentiment: [
      { name: "Puas", value: Math.round(reports * 0.67), color: "#138574" },
      {
        name: "Cukup puas",
        value: Math.round(reports * 0.24),
        color: "#d29727",
      },
      {
        name: "Belum puas",
        value: Math.round(reports * 0.09),
        color: "#c75b55",
      },
    ],
    monthlyTrend: MONTHS.map((month, index) => {
      const monthFactor = 0.065 + ((index * 7 + trendOffset) % 8) * 0.004;
      const monthlyReports = Math.round(reports * monthFactor);
      return {
        label: month,
        reports: monthlyReports,
        complaints: Math.round(monthlyReports * 0.42),
      };
    }),
  };
}

const AGGREGATE_REGIONS: readonly AggregateRegion[] = [
  createRegion(
    "jabar",
    "Jawa Barat",
    84200,
    4.8,
    82,
    88,
    [0.27, 0.19, 0.18, 0.12, 0.13, 0.11],
    [0.24, 0.22, 0.19, 0.16, 0.13],
    0,
  ),
  createRegion(
    "jateng",
    "Jawa Tengah",
    61800,
    5.2,
    80,
    85,
    [0.25, 0.2, 0.17, 0.13, 0.14, 0.11],
    [0.25, 0.21, 0.19, 0.16, 0.13],
    2,
  ),
  createRegion(
    "jatim",
    "Jawa Timur",
    73500,
    5.5,
    79,
    84,
    [0.28, 0.18, 0.18, 0.12, 0.13, 0.11],
    [0.24, 0.22, 0.19, 0.17, 0.12],
    4,
  ),
  createRegion(
    "jakarta",
    "DKI Jakarta",
    56900,
    3.9,
    85,
    91,
    [0.22, 0.23, 0.17, 0.15, 0.12, 0.11],
    [0.23, 0.22, 0.2, 0.19, 0.1],
    1,
  ),
  createRegion(
    "sumut",
    "Sumatera Utara",
    42700,
    6.1,
    76,
    80,
    [0.26, 0.19, 0.16, 0.13, 0.15, 0.11],
    [0.24, 0.21, 0.19, 0.18, 0.12],
    3,
  ),
  createRegion(
    "sulsel",
    "Sulawesi Selatan",
    35900,
    5.8,
    78,
    82,
    [0.25, 0.18, 0.18, 0.14, 0.14, 0.11],
    [0.25, 0.21, 0.19, 0.18, 0.11],
    5,
  ),
  createRegion(
    "bali",
    "Bali",
    28400,
    4.2,
    86,
    90,
    [0.2, 0.18, 0.18, 0.14, 0.17, 0.13],
    [0.26, 0.22, 0.19, 0.18, 0.09],
    6,
  ),
];

const REGION_LABELS: Record<AnalyticsRegion, string> = {
  all: "Seluruh wilayah",
  jabar: "Jawa Barat",
  jateng: "Jawa Tengah",
  jatim: "Jawa Timur",
  jakarta: "DKI Jakarta",
  sumut: "Sumatera Utara",
  sulsel: "Sulawesi Selatan",
  bali: "Bali",
};

export const ANALYTICS_PERIOD_OPTIONS: {
  value: AnalyticsPeriod;
  label: string;
}[] = [
  { value: "this-month", label: "Bulan ini" },
  { value: "this-quarter", label: "Kuartal ini" },
  { value: "this-year", label: "Tahun ini" },
  { value: "custom", label: "Kustom" },
];

export const ANALYTICS_REGION_OPTIONS: {
  value: AnalyticsRegion;
  label: string;
}[] = [
  { value: "all", label: "Semua wilayah" },
  ...AGGREGATE_REGIONS.map(({ id, label: regionLabel }) => ({
    value: id,
    label: regionLabel,
  })),
];

export function getDateRangeError(
  startDate: string,
  endDate: string,
): string | null {
  const isValidDate = (value: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return "Masukkan tanggal awal dan akhir yang valid.";
  }
  if (startDate > endDate) {
    return "Tanggal awal harus sama dengan atau sebelum tanggal akhir.";
  }
  const days =
    (Date.parse(`${endDate}T00:00:00Z`) -
      Date.parse(`${startDate}T00:00:00Z`)) /
      86_400_000 +
    1;
  if (days > 366) {
    return "Rentang tanggal kustom maksimal 366 hari.";
  }
  return null;
}

function roundCount(value: number, factor: number) {
  return Math.max(0, Math.round(value * factor));
}

function getPeriodFactor(filters: AnalyticsFilters): number {
  if (filters.period === "this-month") return 1 / 12;
  if (filters.period === "this-quarter") return 0.25;
  if (filters.period === "this-year") return 1;
  const dayCount =
    (Date.parse(`${filters.endDate}T00:00:00Z`) -
      Date.parse(`${filters.startDate}T00:00:00Z`)) /
      86_400_000 +
    1;
  return dayCount / 365;
}

function getPeriodLabel(filters: AnalyticsFilters): string {
  switch (filters.period) {
    case "this-month":
      return "Bulan ini";
    case "this-quarter":
      return "Kuartal ini";
    case "this-year":
      return "Tahun ini";
    case "custom":
      return `${filters.startDate} — ${filters.endDate}`;
  }
}

export function getAnalyticsSnapshot(
  filters: AnalyticsFilters,
): TrackingStatisticsDashboard {
  const selectedRegions =
    filters.region === "all"
      ? AGGREGATE_REGIONS
      : AGGREGATE_REGIONS.filter((region) => region.id === filters.region);
  const factor = getPeriodFactor(filters);
  const reportTotal = selectedRegions.reduce(
    (sum, region) => sum + region.reports,
    0,
  );
  const complaintTotal = selectedRegions.reduce(
    (sum, region) => sum + region.complaints,
    0,
  );
  const weightedAverage = (
    key:
      | "averageDays"
      | "satisfaction"
      | "resolvedRate"
      | "reportChange"
      | "complaintChange"
      | "resolutionChange"
      | "satisfactionChange",
  ) => {
    const getMetric = (region: AggregateRegion) => {
      switch (key) {
        case "averageDays":
          return region.averageDays;
        case "satisfaction":
          return region.satisfaction;
        case "resolvedRate":
          return region.resolvedRate;
        case "reportChange":
          return region.reportChange;
        case "complaintChange":
          return region.complaintChange;
        case "resolutionChange":
          return region.resolutionChange;
        case "satisfactionChange":
          return region.satisfactionChange;
      }
    };
    const weightedTotal = selectedRegions.reduce((sum, region) => {
      return sum + getMetric(region) * region.reports;
    }, 0);
    return weightedTotal / reportTotal;
  };
  const distribution = SERVICE_TYPES.map(([name, color]) => ({
    name,
    color,
    value: roundCount(
      selectedRegions.reduce(
        (sum, region) =>
          sum +
          (region.services.find((item) => item.name === name)?.count ?? 0),
        0,
      ),
      factor,
    ),
  }));
  const trendStart =
    filters.period === "this-month"
      ? 11
      : filters.period === "this-quarter"
        ? 9
        : filters.period === "custom"
          ? Math.max(0, 12 - Math.ceil(factor * 12))
          : 0;
  const trendIndexes =
    filters.period === "this-month"
      ? [11]
      : filters.period === "this-year"
        ? Array.from(
            { length: new Date().getMonth() + 1 },
            (_, monthIndex) => (monthIndex + 2) % 12,
          )
        : Array.from(
            { length: 12 - trendStart },
            (_, index) => trendStart + index,
          );
  const customTrendScale =
    filters.period === "custom"
      ? Math.min(1, (factor * 12) / trendIndexes.length)
      : 1;
  const trend = trendIndexes.map((monthIndex) => {
    const month = selectedRegions[0]?.monthlyTrend.at(monthIndex);
    return {
      label: month?.label ?? "Bulan ini",
      reports: selectedRegions.reduce(
        (sum, region) =>
          sum +
          roundCount(
            region.monthlyTrend.at(monthIndex)?.reports ?? 0,
            customTrendScale,
          ),
        0,
      ),
      complaints: selectedRegions.reduce(
        (sum, region) =>
          sum +
          roundCount(
            region.monthlyTrend.at(monthIndex)?.complaints ?? 0,
            customTrendScale,
          ),
        0,
      ),
    };
  });
  const areas =
    filters.region === "all"
      ? selectedRegions.map((region) => ({
          name: region.label,
          reports: roundCount(region.reports, factor),
        }))
      : (selectedRegions[0]?.districts.map((district) => ({
          name: district.name,
          reports: roundCount(district.reports, factor),
        })) ?? []);
  const resolutionPerformance = selectedRegions
    .flatMap((region) => region.resolution)
    .reduce<ChartDatum[]>((rows, item) => {
      const existing = rows.find((row) => row.service === item.service);
      if (existing) {
        const oldCases = Number(existing.cases);
        const totalCases = oldCases + item.cases;
        existing.averageDays = Number(
          (
            (Number(existing.averageDays) * oldCases +
              item.averageDays * item.cases) /
            totalCases
          ).toFixed(1),
        );
        existing.targetDays = item.targetDays;
        existing.cases = totalCases;
      } else {
        rows.push({
          service: item.service,
          averageDays: item.averageDays,
          targetDays: item.targetDays,
          cases: item.cases,
        });
      }
      return rows;
    }, [])
    .map((item) => ({
      service: String(item.service),
      averageDays: Number(item.averageDays),
      targetDays: Number(item.targetDays),
      cases: roundCount(Number(item.cases), factor),
    }));
  const sentimentNames = ["Puas", "Cukup puas", "Belum puas"];
  const sentimentColors = ["#138574", "#d29727", "#c75b55"];
  const sentiment = sentimentNames.map((name, index) => ({
    name,
    color: sentimentColors.at(index) ?? "#68778a",
    value: roundCount(
      selectedRegions.reduce(
        (sum, region) =>
          sum +
          (region.sentiment.find((item) => item.name === name)?.value ?? 0),
        0,
      ),
      factor,
    ),
  }));
  const longResolutionServices = selectedRegions
    .flatMap((region) => region.resolution)
    .reduce<TrackingStatisticsDashboard["longResolutionServices"]>(
      (rows, item) => {
        const existing = rows.find((row) => row.service === item.service);
        if (existing) {
          const totalCases = existing.cases + item.cases;
          existing.averageDays = Number(
            (
              (existing.averageDays * existing.cases +
                item.averageDays * item.cases) /
              totalCases
            ).toFixed(1),
          );
          existing.cases = totalCases;
        } else {
          rows.push({ ...item });
        }
        return rows;
      },
      [],
    )
    .map((item) => ({ ...item, cases: roundCount(item.cases, factor) }))
    .sort((a, b) => b.averageDays - a.averageDays);

  return {
    periodLabel: getPeriodLabel(filters),
    regionLabel: REGION_LABELS[filters.region],
    kpis: {
      totalReports: {
        value: roundCount(reportTotal, factor),
        changePercent: Number(weightedAverage("reportChange").toFixed(1)),
      },
      totalComplaints: {
        value: roundCount(complaintTotal, factor),
        changePercent: Number(weightedAverage("complaintChange").toFixed(1)),
      },
      averageResolutionDays: {
        value: Number(weightedAverage("averageDays").toFixed(1)),
        changePercent: Number(weightedAverage("resolutionChange").toFixed(1)),
      },
      satisfactionRate: {
        value: Number(weightedAverage("satisfaction").toFixed(1)),
        changePercent: Number(weightedAverage("satisfactionChange").toFixed(1)),
      },
    },
    trend,
    serviceDistribution: distribution,
    topRegions: areas
      .sort((a, b) => Number(b.reports) - Number(a.reports))
      .slice(0, 5),
    resolutionPerformance,
    citizenSentiment: sentiment,
    longResolutionServices,
  };
}
