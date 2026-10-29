import { z } from "zod";

export const TIMELY_SERVICE_CITIES = [
  "Bandung",
  "Bogor",
  "Depok",
  "Bekasi",
  "Cimahi",
] as const;

const timelyServiceCitySchema = z.object({
  city: z.enum(TIMELY_SERVICE_CITIES),
  percentage: z.number().min(0).max(100),
});

export const timelyServiceResponseSchema = z.object({
  period: z.number().int(),
  cities: z.array(timelyServiceCitySchema).length(5),
});

export type TimelyServiceResponse = z.infer<typeof timelyServiceResponseSchema>;

export interface TimelyServiceChartRow {
  city: (typeof TIMELY_SERVICE_CITIES)[number];
  percentage: number;
  deltaFromAverage: number;
}

export interface TimelyServiceComparison {
  period: number;
  rows: TimelyServiceChartRow[];
  average: number;
  roundedAverage: number;
}

export function transformTimelyServiceResponse(
  response: TimelyServiceResponse,
): TimelyServiceComparison {
  const average =
    response.cities.reduce((total, item) => total + item.percentage, 0) /
    response.cities.length;

  return {
    period: response.period,
    average,
    roundedAverage: Math.round(average),
    rows: response.cities.map((item) => ({
      ...item,
      deltaFromAverage: item.percentage - average,
    })),
  };
}

export function formatPercentagePoints(value: number): string {
  const roundedValue = Math.round(value);
  const sign = roundedValue > 0 ? "+" : "";
  return `${sign}${roundedValue} poin persentase`;
}
