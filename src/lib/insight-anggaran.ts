import { z } from "zod";

export const budgetTrendQuerySchema = z.object({
  tahun: z.literal("2020-2024"),
});

export const budgetTrendDatumSchema = z.object({
  tahun: z.number().int(),
  anggaran: z.number().nonnegative(),
  realisasi: z.number().nonnegative(),
});

export const budgetTrendResponseSchema = z.object({
  wilayah: z.literal("Kota Bandung"),
  periode: z.literal("2020-2024"),
  source: z.literal("SIMULATED"),
  data: z.array(budgetTrendDatumSchema).length(5),
});

export type BudgetTrendDatum = z.infer<typeof budgetTrendDatumSchema>;
export type BudgetTrendResponse = z.infer<typeof budgetTrendResponseSchema>;

const BUDGET_TREND_DATA: BudgetTrendDatum[] = [
  { tahun: 2020, anggaran: 1.8, realisasi: 1.5 },
  { tahun: 2021, anggaran: 2.0, realisasi: 1.7 },
  { tahun: 2022, anggaran: 2.3, realisasi: 2.0 },
  { tahun: 2023, anggaran: 2.6, realisasi: 2.3 },
  { tahun: 2024, anggaran: 3.0, realisasi: 2.7 },
];

export function getBudgetTrend(): BudgetTrendResponse {
  return budgetTrendResponseSchema.parse({
    wilayah: "Kota Bandung",
    periode: "2020-2024",
    source: "SIMULATED",
    data: BUDGET_TREND_DATA,
  });
}

export function transformBudgetTrendData(data: readonly BudgetTrendDatum[]) {
  return data.map(({ tahun, anggaran, realisasi }) => ({
    tahun: String(tahun),
    anggaran,
    realisasi,
  }));
}

export function calculateBudgetTrendSummary(data: readonly BudgetTrendDatum[]) {
  if (data.length === 0) {
    throw new Error("Data tren anggaran tidak boleh kosong.");
  }

  const firstYear = data[0];
  const lastYear = data[data.length - 1];

  return {
    realizationRate: Math.round((lastYear.realisasi / lastYear.anggaran) * 100),
    realizationIncrease: Math.round(
      ((lastYear.realisasi - firstYear.realisasi) / firstYear.realisasi) * 100,
    ),
    realizationDelta:
      Math.round((lastYear.realisasi - firstYear.realisasi) * 10) / 10,
  };
}
