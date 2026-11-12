import { z } from "zod";

export const ASN_PERFORMANCE_TASK_TYPES = [
  "layanan_kesehatan",
  "layanan_pendidikan",
  "layanan_sosial",
  "laporan_warga",
  "perizinan",
  "submit_cms",
  "apbd_input",
  "review_cms",
  "review_kyc",
  "review_workflow",
  "access_management",
  "decision_engine",
] as const;

export type AsnPerformanceTaskType =
  (typeof ASN_PERFORMANCE_TASK_TYPES)[number];

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

const intStringSchema = z.coerce.number().int();

export const asnPerformanceFiltersSchema = z
  .object({
    start_date: dateOnlySchema.optional(),
    end_date: dateOnlySchema.optional(),
    task_types: z
      .union([
        z.enum(ASN_PERFORMANCE_TASK_TYPES),
        z.array(z.enum(ASN_PERFORMANCE_TASK_TYPES)),
      ])
      .optional()
      .transform((value) => {
        if (!value) return undefined;
        return Array.isArray(value) ? value : [value];
      }),
    opd: z.string().min(1).optional(),
    unit: z.string().min(1).optional(),
    position: z.string().min(1).optional(),
    q: z.string().min(1).optional(),
    limit: intStringSchema.min(1).max(100).optional(),
    offset: intStringSchema.min(0).optional(),
    granularity: z.enum(["day", "week"]).optional(),
    format: z.enum(["json", "csv"]).optional(),
  })
  .strict();

export interface AsnPerformanceFilters {
  readonly startDate: Date;
  readonly endDate: Date;
  readonly taskTypes: readonly AsnPerformanceTaskType[];
  readonly opd?: string;
  readonly unit?: string;
  readonly position?: string;
  readonly q?: string;
  readonly limit: number;
  readonly offset: number;
  readonly granularity: "day" | "week";
}

export function resolveAsnPerformanceFilters(
  input: z.infer<typeof asnPerformanceFiltersSchema>,
): AsnPerformanceFilters {
  const now = new Date();
  const endDate = input.end_date ? endOfDay(parseDateOnly(input.end_date)) : endOfDay(now);
  const startDate = input.start_date
    ? startOfDay(parseDateOnly(input.start_date))
    : startOfDay(new Date(endDate.getTime() - 27 * DAY_MS));

  if (endDate.getTime() < startDate.getTime()) {
    throw new Error("end_date must be greater than or equal to start_date");
  }

  return {
    startDate,
    endDate,
    taskTypes: input.task_types ?? ASN_PERFORMANCE_TASK_TYPES,
    opd: input.opd,
    unit: input.unit,
    position: input.position,
    q: input.q,
    limit: input.limit ?? 20,
    offset: input.offset ?? 0,
    granularity: input.granularity ?? "day",
  };
}

export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function startOfDay(value: Date): Date {
  return new Date(
    Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()),
  );
}

function endOfDay(value: Date): Date {
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
