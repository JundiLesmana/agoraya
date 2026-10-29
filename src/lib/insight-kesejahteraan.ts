import { z } from "zod";

export const WELLBEING_INDICATOR_IDS = [
  "kemiskinan",
  "pengangguran",
  "sekolah",
  "harapan_hidup",
] as const;

export const wellbeingIndicatorIdSchema = z.enum(WELLBEING_INDICATOR_IDS);
export type WellbeingIndicatorId = z.infer<typeof wellbeingIndicatorIdSchema>;

const wellbeingDirectionSchema = z.enum([
  "lower-is-better",
  "higher-is-better",
]);

const wellbeingIndicatorSchema = z.object({
  id: wellbeingIndicatorIdSchema,
  label: z.string().min(1),
  unit: z.enum(["poin persentase", "tahun"]),
  value2023: z.number().finite(),
  value2024: z.number().finite(),
  delta: z.number().finite(),
  direction: wellbeingDirectionSchema,
});

export const wellbeingResponseSchema = z.object({
  wilayah: z.string().min(1),
  periode: z.literal("2023-2024"),
  source: z.literal("SIMULATED"),
  data: z.array(wellbeingIndicatorSchema).max(10),
});

export type WellbeingIndicator = z.infer<typeof wellbeingIndicatorSchema>;
export type WellbeingResponse = z.infer<typeof wellbeingResponseSchema>;

const SIMULATED_INDICATORS: WellbeingIndicator[] = [
  {
    id: "kemiskinan",
    label: "Penduduk miskin (%)",
    unit: "poin persentase",
    value2023: 4.0,
    value2024: 3.8,
    delta: -0.2,
    direction: "lower-is-better",
  },
  {
    id: "pengangguran",
    label: "Pengangguran terbuka (%)",
    unit: "poin persentase",
    value2023: 7.1,
    value2024: 6.8,
    delta: -0.3,
    direction: "lower-is-better",
  },
  {
    id: "sekolah",
    label: "Rata-rata lama sekolah (tahun)",
    unit: "tahun",
    value2023: 10.5,
    value2024: 10.7,
    delta: 0.2,
    direction: "higher-is-better",
  },
  {
    id: "harapan_hidup",
    label: "Umur harapan hidup (tahun)",
    unit: "tahun",
    value2023: 73.7,
    value2024: 74.0,
    delta: 0.3,
    direction: "higher-is-better",
  },
];

export function getWellbeingInsights(
  indicators: readonly WellbeingIndicatorId[] = WELLBEING_INDICATOR_IDS,
): WellbeingResponse {
  const selected = new Set(indicators);

  return wellbeingResponseSchema.parse({
    wilayah: "Kota Bandung",
    periode: "2023-2024",
    source: "SIMULATED",
    data: SIMULATED_INDICATORS.filter((indicator) =>
      selected.has(indicator.id),
    ),
  });
}

export function formatDelta(delta: number, unit: string): string {
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: delta === 0 ? "auto" : "always",
  }).format(delta);

  return `${formatted} ${unit}`;
}

export function determineColor(
  indicator: Pick<WellbeingIndicator, "direction">,
  delta: number,
): "green" | "red" | "neutral" {
  if (delta === 0) {
    return "neutral";
  }

  const isImprovement =
    (indicator.direction === "lower-is-better" && delta < 0) ||
    (indicator.direction === "higher-is-better" && delta > 0);

  return isImprovement ? "green" : "red";
}

export function formatIndicatorValue(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}
