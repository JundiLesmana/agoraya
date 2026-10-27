import { z } from "zod";

export const trackingStatisticsPeriodSchema = z.enum([
  "this-month",
  "this-quarter",
  "this-year",
  "custom",
]);

export const trackingStatisticsRegionSchema = z.enum([
  "all",
  "jabar",
  "jateng",
  "jatim",
  "jakarta",
  "sumut",
  "sulsel",
  "bali",
]);

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  });

export const trackingStatisticsQuerySchema = z
  .object({
    period: trackingStatisticsPeriodSchema.default("this-year"),
    region: trackingStatisticsRegionSchema.default("all"),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
  })
  .superRefine((query, context) => {
    if (query.period === "custom") {
      if (!query.startDate || !query.endDate) {
        context.addIssue({
          code: "custom",
          message: "Periode kustom memerlukan tanggal mulai dan akhir.",
        });
        return;
      }
      if (query.startDate > query.endDate) {
        context.addIssue({
          code: "custom",
          message: "Tanggal awal harus sama dengan atau sebelum tanggal akhir.",
        });
        return;
      }
      const days =
        (Date.parse(`${query.endDate}T00:00:00Z`) -
          Date.parse(`${query.startDate}T00:00:00Z`)) /
          86_400_000 +
        1;
      if (days > 366) {
        context.addIssue({
          code: "custom",
          message: "Rentang tanggal kustom maksimal 366 hari.",
        });
      }
    } else if (query.startDate || query.endDate) {
      context.addIssue({
        code: "custom",
        message: "Tanggal mulai dan akhir hanya berlaku untuk periode kustom.",
      });
    }
  });

const chartDatumSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.null()]),
);

export const trackingStatisticsDashboardSchema = z.object({
  periodLabel: z.string(),
  regionLabel: z.string(),
  kpis: z.object({
    totalReports: z.object({
      value: z.number().int().nonnegative(),
      changePercent: z.number(),
    }),
    totalComplaints: z.object({
      value: z.number().int().nonnegative(),
      changePercent: z.number(),
    }),
    averageResolutionDays: z.object({
      value: z.number().nonnegative(),
      changePercent: z.number(),
    }),
    satisfactionRate: z.object({
      value: z.number().min(0).max(100),
      changePercent: z.number(),
    }),
  }),
  trend: z.array(chartDatumSchema),
  serviceDistribution: z.array(
    z.object({
      name: z.string(),
      value: z.number().int().nonnegative(),
      color: z.string(),
    }),
  ),
  topRegions: z.array(chartDatumSchema),
  resolutionPerformance: z.array(chartDatumSchema),
  citizenSentiment: z.array(chartDatumSchema),
  longResolutionServices: z.array(
    z.object({
      service: z.string(),
      agency: z.string(),
      cases: z.number().int().nonnegative(),
      averageDays: z.number().nonnegative(),
      targetDays: z.number().positive(),
    }),
  ),
});

export type TrackingStatisticsQuery = z.infer<
  typeof trackingStatisticsQuerySchema
>;
export type TrackingStatisticsPeriod = z.infer<
  typeof trackingStatisticsPeriodSchema
>;
export type TrackingStatisticsRegion = z.infer<
  typeof trackingStatisticsRegionSchema
>;
export type TrackingStatisticsDashboard = z.infer<
  typeof trackingStatisticsDashboardSchema
>;
