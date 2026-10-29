import {
  publicStatisticsDashboardSchema,
  type PublicStatisticsDashboard,
  type PublicStatisticsQuery,
} from "./public-statistics-contract";
import { calculateTrendPercent } from "@/lib/statistics-format";

const MINIMUM_PUBLIC_CELL_SIZE = 5;

const PERIODS = {
  "this-month": { label: "Bulan ini", scale: 0.1 },
  "this-quarter": { label: "Kuartal ini", scale: 0.3 },
  "this-year": { label: "Tahun ini", scale: 1 },
  custom: { label: "Periode kustom", scale: 1 },
} as const;

const REGIONS = {
  all: { label: "Semua wilayah", scale: 1 },
  jabar: { label: "Jawa Barat", scale: 0.58 },
  jateng: { label: "Jawa Tengah", scale: 0.31 },
  jatim: { label: "Jawa Timur", scale: 0.26 },
} as const;

const BASE_TRENDS = [
  { label: "Jan", applications: 80, complaints: 64 },
  { label: "Feb", applications: 85, complaints: 68 },
  { label: "Mar", applications: 90, complaints: 72 },
  { label: "Apr", applications: 95, complaints: 76 },
  { label: "Mei", applications: 100, complaints: 80 },
  { label: "Jun", applications: 105, complaints: 84 },
  { label: "Jul", applications: 90, complaints: 72 },
  { label: "Agu", applications: 85, complaints: 68 },
  { label: "Sep", applications: 110, complaints: 88 },
  { label: "Okt", applications: 110, complaints: 88 },
  { label: "Nov", applications: 120, complaints: 96 },
  { label: "Des", applications: 130, complaints: 104 },
] as const;

const BASE_MONTH_TRENDS = [
  { label: "Minggu 1", applications: 240, complaints: 192 },
  { label: "Minggu 2", applications: 280, complaints: 224 },
  { label: "Minggu 3", applications: 310, complaints: 248 },
  { label: "Minggu 4", applications: 370, complaints: 296 },
] as const;

const BASE_SERVICES = [
  { name: "Pengaduan warga", value: 480 },
  { name: "Perizinan", value: 360 },
  { name: "Sosial", value: 240 },
  { name: "Administrasi", value: 120 },
] as const;

const BASE_REGIONS = [
  { region: "Kec. Sukamaju", applications: 340 },
  { region: "Kec. Cibadak", applications: 280 },
  { region: "Kec. Melati", applications: 210 },
  { region: "Kec. Cempaka", applications: 190 },
  { region: "Kec. Tanjung", applications: 180 },
] as const;

const BASE_PERFORMANCE = [
  { period: "Minggu 1", completed: 240, processing: 36, overdue: 12 },
  { period: "Minggu 2", completed: 300, processing: 42, overdue: 16 },
  { period: "Minggu 3", completed: 360, processing: 48, overdue: 20 },
  { period: "Minggu 4", completed: 300, processing: 40, overdue: 14 },
] as const;

const BASE_SENTIMENT = [
  { label: "Positif", count: 652, percentage: 68 },
  { label: "Netral", count: 211, percentage: 22 },
  { label: "Negatif", count: 97, percentage: 10 },
] as const;

const BASE_BOTTLENECKS = [
  {
    service: "Verifikasi Bantuan Sosial",
    agency: "Dinas Sosial",
    volume: 96,
    targetDays: 10,
    averageDays: 12.5,
  },
  {
    service: "Izin Trayek Angkutan Umum",
    agency: "Dinas Perhubungan",
    volume: 142,
    targetDays: 5,
    averageDays: 8.2,
  },
  {
    service: "Persetujuan Bangunan Gedung",
    agency: "Dinas Perizinan",
    volume: 86,
    targetDays: 7,
    averageDays: 7.1,
  },
  {
    service: "Peremajaan Rambu Jalan",
    agency: "Dinas Perhubungan",
    volume: 120,
    targetDays: 5,
    averageDays: 5.4,
  },
] as const;

function countForPublicDisplay(value: number, scale: number): number | null {
  const count = Math.round(value * scale);
  return count < MINIMUM_PUBLIC_CELL_SIZE ? null : count;
}

function customPeriodScale(query: PublicStatisticsQuery): number {
  if (query.period !== "custom" || !query.startDate || !query.endDate) {
    return PERIODS[query.period].scale;
  }

  const start = new Date(`${query.startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${query.endDate}T00:00:00.000Z`).getTime();
  const inclusiveDays = Math.floor((end - start) / 86_400_000) + 1;
  return inclusiveDays / 365;
}

function getTrendPercent(current: number, previous: number): number | null {
  if (
    current < MINIMUM_PUBLIC_CELL_SIZE ||
    previous < MINIMUM_PUBLIC_CELL_SIZE
  ) {
    return null;
  }
  return calculateTrendPercent(current, previous);
}

function getPeriodLabel(query: PublicStatisticsQuery): string {
  if (query.period === "custom" && query.startDate && query.endDate) {
    return `${query.startDate} – ${query.endDate}`;
  }
  return PERIODS[query.period].label;
}

function trendSeries(
  query: PublicStatisticsQuery,
  periodScale: number,
  regionScale: number,
) {
  const rows =
    query.period === "this-month"
      ? BASE_MONTH_TRENDS
      : query.period === "this-quarter"
        ? BASE_TRENDS.slice(-3)
        : BASE_TRENDS;

  if (query.period === "custom") {
    const totalScale = periodScale * regionScale;
    const weights = [0.2, 0.25, 0.25, 0.3];
    return weights.map((weight, index) => ({
      label: `Bagian ${index + 1}`,
      applications: countForPublicDisplay(1200 * weight, totalScale),
      complaints: countForPublicDisplay(960 * weight, totalScale),
    }));
  }

  const trendScale =
    query.period === "this-month" ? periodScale * regionScale : regionScale;
  return rows.map((item) => ({
    label: item.label,
    applications: countForPublicDisplay(item.applications, trendScale),
    complaints: countForPublicDisplay(item.complaints, trendScale),
  }));
}

// TODO(#127): replace these synthetic aggregates with a privacy-reviewed analytics source.
export function getPublicStatistics(
  query: PublicStatisticsQuery,
): PublicStatisticsDashboard {
  const periodScale = customPeriodScale(query);
  const scale = periodScale * REGIONS[query.region].scale;
  const currentApplications = Math.round(1200 * scale);
  const previousApplications = Math.round(1080 * scale);
  const currentComplaints = Math.round(960 * scale);
  const previousComplaints = Math.round(900 * scale);

  const dashboard: PublicStatisticsDashboard = {
    periodLabel: getPeriodLabel(query),
    regionLabel: REGIONS[query.region].label,
    kpis: {
      totalApplications:
        currentApplications < MINIMUM_PUBLIC_CELL_SIZE
          ? null
          : currentApplications,
      applicationTrend: getTrendPercent(
        currentApplications,
        previousApplications,
      ),
      totalComplaints:
        currentComplaints < MINIMUM_PUBLIC_CELL_SIZE ? null : currentComplaints,
      complaintTrend: getTrendPercent(currentComplaints, previousComplaints),
      averageResolutionDays:
        currentComplaints < MINIMUM_PUBLIC_CELL_SIZE ? null : 5.4,
      resolutionTrend:
        currentComplaints < MINIMUM_PUBLIC_CELL_SIZE ? null : -4.2,
      satisfactionRate:
        currentComplaints < MINIMUM_PUBLIC_CELL_SIZE ? null : 84.2,
      satisfactionTrend:
        currentComplaints < MINIMUM_PUBLIC_CELL_SIZE ? null : 2.1,
    },
    trends: trendSeries(query, periodScale, REGIONS[query.region].scale),
    serviceDistribution: BASE_SERVICES.map((item) => ({
      name: item.name,
      value: countForPublicDisplay(item.value, scale),
    })),
    topRegions: BASE_REGIONS.map((item) => ({
      region: item.region,
      applications: countForPublicDisplay(item.applications, scale),
    })),
    completionPerformance: BASE_PERFORMANCE.map((item) => ({
      period: item.period,
      completed: countForPublicDisplay(item.completed, scale),
      processing: countForPublicDisplay(item.processing, scale),
      overdue: countForPublicDisplay(item.overdue, scale),
    })),
    sentiment: BASE_SENTIMENT.map((item) => ({
      label: item.label,
      count: countForPublicDisplay(item.count, scale),
      percentage:
        countForPublicDisplay(item.count, scale) === null
          ? null
          : item.percentage,
    })),
    bottlenecks: BASE_BOTTLENECKS.map((item) => ({
      ...item,
      volume: countForPublicDisplay(item.volume, scale),
      deviationPercent: Number(
        (
          ((item.averageDays - item.targetDays) / item.targetDays) *
          100
        ).toFixed(1),
      ),
    })).sort((left, right) => right.averageDays - left.averageDays),
  };

  return publicStatisticsDashboardSchema.parse(dashboard);
}
