import { z } from "zod";

export const statisticsPeriodSchema = z.enum([
  "this-month",
  "this-quarter",
  "this-year",
  "custom",
]);

export const statisticsRegionSchema = z.enum([
  "all",
  "jabar",
  "jateng",
  "jatim",
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

export const publicStatisticsQuerySchema = z
  .object({
    period: statisticsPeriodSchema.default("this-year"),
    region: statisticsRegionSchema.default("all"),
    startDate: isoDateSchema.optional(),
    endDate: isoDateSchema.optional(),
  })
  .superRefine((query, context) => {
    if (query.period === "custom") {
      if (!query.startDate || !query.endDate) {
        context.addIssue({
          code: "custom",
          message:
            "Rentang tanggal khusus harus memiliki tanggal mulai dan akhir.",
        });
      } else if (query.startDate > query.endDate) {
        context.addIssue({
          code: "custom",
          message: "Tanggal mulai tidak boleh setelah tanggal akhir.",
        });
      }
    } else if (query.startDate || query.endDate) {
      context.addIssue({
        code: "custom",
        message: "Rentang tanggal hanya dapat digunakan untuk periode khusus.",
      });
    }
  });

const nullableCountSchema = z.number().int().nonnegative().nullable();

export const publicStatisticsDashboardSchema = z.object({
  periodLabel: z.string(),
  regionLabel: z.string(),
  kpis: z.object({
    totalApplications: nullableCountSchema,
    applicationTrend: z.number().nullable(),
    totalComplaints: nullableCountSchema,
    complaintTrend: z.number().nullable(),
    averageResolutionDays: z.number().nonnegative().nullable(),
    resolutionTrend: z.number().nullable(),
    satisfactionRate: z.number().min(0).max(100).nullable(),
    satisfactionTrend: z.number().nullable(),
  }),
  trends: z.array(
    z.object({
      label: z.string(),
      applications: nullableCountSchema,
      complaints: nullableCountSchema,
    }),
  ),
  serviceDistribution: z.array(
    z.object({
      name: z.string(),
      value: nullableCountSchema,
    }),
  ),
  topRegions: z.array(
    z.object({
      region: z.string(),
      applications: nullableCountSchema,
    }),
  ),
  completionPerformance: z.array(
    z.object({
      period: z.string(),
      completed: nullableCountSchema,
      processing: nullableCountSchema,
      overdue: nullableCountSchema,
    }),
  ),
  sentiment: z.array(
    z.object({
      label: z.string(),
      count: nullableCountSchema,
      percentage: z.number().min(0).max(100).nullable(),
    }),
  ),
  bottlenecks: z.array(
    z.object({
      service: z.string(),
      agency: z.string(),
      volume: nullableCountSchema,
      targetDays: z.number().positive(),
      averageDays: z.number().positive(),
      deviationPercent: z.number(),
    }),
  ),
});

export type PublicStatisticsQuery = z.infer<typeof publicStatisticsQuerySchema>;
export type PublicStatisticsDashboard = z.infer<
  typeof publicStatisticsDashboardSchema
>;
