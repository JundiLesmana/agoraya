import {
  trackingStatisticsQuerySchema,
  type TrackingStatisticsDashboard,
  type TrackingStatisticsPeriod,
  type TrackingStatisticsRegion,
} from "@/modules/analytics/tracking-statistics-contract";

export type AnalyticsPeriod = TrackingStatisticsPeriod;
export type AnalyticsRegion = TrackingStatisticsRegion;
export type AnalyticsSnapshot = TrackingStatisticsDashboard;

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
  { value: "jabar", label: "Jawa Barat" },
  { value: "jateng", label: "Jawa Tengah" },
  { value: "jatim", label: "Jawa Timur" },
  { value: "jakarta", label: "DKI Jakarta" },
  { value: "sumut", label: "Sumatera Utara" },
  { value: "sulsel", label: "Sulawesi Selatan" },
  { value: "bali", label: "Bali" },
];

export function getDateRangeError(
  startDate: string,
  endDate: string,
): string | null {
  const parsed = trackingStatisticsQuerySchema.safeParse({
    period: "custom",
    region: "all",
    startDate,
    endDate,
  });
  return parsed.success
    ? null
    : (parsed.error.issues[0]?.message ?? "Rentang tanggal tidak valid.");
}
