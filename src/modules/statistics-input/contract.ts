import { z } from "zod";

export const STATISTIC_SECTORS = [
  { id: "economy", label: "Ekonomi" },
  { id: "agriculture", label: "Pertanian" },
  { id: "social", label: "Sosial & Kesejahteraan" },
] as const;

export const STATISTIC_INDICATORS = [
  {
    id: "tpt",
    name: "Tingkat Pengangguran Terbuka (TPT)",
    definition:
      "Persentase jumlah pengangguran terhadap jumlah angkatan kerja.",
    unit: "Persen",
    frequency: "Triwulanan",
    periodType: "quarterly",
    sectorId: "economy",
    precision: 2,
  },
  {
    id: "inflasi",
    name: "Inflasi",
    definition:
      "Perubahan indeks harga konsumen dibandingkan periode sebelumnya.",
    unit: "Persen",
    frequency: "Bulanan",
    periodType: "monthly",
    sectorId: "economy",
    precision: 2,
  },
  {
    id: "kemiskinan",
    name: "Tingkat Kemiskinan",
    definition: "Persentase penduduk yang berada di bawah garis kemiskinan.",
    unit: "Persen",
    frequency: "Tahunan",
    periodType: "annual",
    sectorId: "social",
    precision: 2,
  },
  {
    id: "produksi-padi",
    name: "Produksi Padi",
    definition:
      "Total produksi padi berdasarkan periode pelaporan yang dipilih.",
    unit: "Ton",
    frequency: "Triwulanan",
    periodType: "quarterly",
    sectorId: "agriculture",
    precision: 2,
  },
] as const;

export const statisticPeriodTypeSchema = z.enum([
  "monthly",
  "quarterly",
  "annual",
]);

const statisticPeriodSchema = z.object({
  periodValue: z.string().min(1).max(16),
  value: z.number().finite().min(0).max(1_000_000_000_000),
  explanation: z.string().trim().max(500).default(""),
});

export const statisticInputPayloadSchema = z
  .strictObject({
    referenceYear: z.number().int().min(2000).max(2100),
    regionId: z.string().trim().min(1).max(120),
    sectorId: z.enum(["economy", "agriculture", "social"]),
    indicatorId: z.enum(["tpt", "inflasi", "kemiskinan", "produksi-padi"]),
    periodType: statisticPeriodTypeSchema,
    status: z.enum(["draft", "published"]),
    sourceName: z.string().trim().max(255).default(""),
    methodology: z.string().trim().max(10000).default(""),
    values: z.array(statisticPeriodSchema).min(1).max(12),
  })
  .superRefine((payload, context) => {
    const indicator = STATISTIC_INDICATORS.find(
      (item) => item.id === payload.indicatorId,
    );
    if (
      !indicator ||
      indicator.sectorId !== payload.sectorId ||
      indicator.periodType !== payload.periodType
    ) {
      context.addIssue({
        code: "custom",
        path: ["indicatorId"],
        message: "Indikator tidak sesuai dengan sektor atau frekuensinya.",
      });
    }

    const seen = new Set<string>();
    for (const [index, item] of payload.values.entries()) {
      const validPeriod =
        payload.periodType === "monthly"
          ? /^(0[1-9]|1[0-2])$/.test(item.periodValue)
          : payload.periodType === "quarterly"
            ? /^Q[1-4]$/.test(item.periodValue)
            : item.periodValue === String(payload.referenceYear);
      if (!validPeriod) {
        context.addIssue({
          code: "custom",
          path: ["values", index, "periodValue"],
          message: "Periode tidak sesuai dengan frekuensi indikator.",
        });
      }
      if (seen.has(item.periodValue)) {
        context.addIssue({
          code: "custom",
          path: ["values", index, "periodValue"],
          message: "Periode tidak boleh duplikat.",
        });
      }
      seen.add(item.periodValue);
    }

    if (payload.status === "published") {
      if (!payload.sourceName) {
        context.addIssue({
          code: "custom",
          path: ["sourceName"],
          message: "Sumber data wajib diisi sebelum publikasi.",
        });
      }
      if (!payload.methodology) {
        context.addIssue({
          code: "custom",
          path: ["methodology"],
          message: "Metodologi wajib diisi sebelum publikasi.",
        });
      }
    }
  });

export const statisticEntryQuerySchema = z.strictObject({
  referenceYear: z.coerce.number().int().min(2000).max(2100),
  regionId: z.string().trim().min(1).max(120),
  sectorId: z.enum(["economy", "agriculture", "social"]),
  indicatorId: z.enum(["tpt", "inflasi", "kemiskinan", "produksi-padi"]),
});

const statisticAssignmentSchema = z.object({
  agencyId: z.string(),
  regionId: z.string(),
  regionName: z.string(),
  sectorId: z.enum(["economy", "agriculture", "social"]),
});

const statisticEntryViewSchema = z.object({
  id: z.string().nullable(),
  status: z.enum(["draft", "published"]).nullable(),
  sourceName: z.string(),
  methodology: z.string(),
  values: z.array(
    z.object({
      periodValue: z.string(),
      value: z.number(),
      explanation: z.string(),
    }),
  ),
  documents: z.array(
    z.object({
      id: z.string(),
      originalName: z.string(),
      fileSize: z.number().int().nonnegative(),
    }),
  ),
  history: z.array(
    z.object({
      periodValue: z.string(),
      previousValue: z.number().nullable(),
      newValue: z.number(),
      actorName: z.string(),
      changedAt: z.string().datetime(),
    }),
  ),
});

export const statisticWorkspaceResponseSchema = z.object({
  assignments: z.array(statisticAssignmentSchema),
  indicators: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      definition: z.string(),
      unit: z.string(),
      frequency: z.string(),
      periodType: statisticPeriodTypeSchema,
      sectorId: z.enum(["economy", "agriculture", "social"]),
      precision: z.number().int().min(0).max(6),
    }),
  ),
  entry: statisticEntryViewSchema.nullable(),
});

export const statisticSaveResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "published"]),
});

export const publishedStatisticInputsSchema = z.object({
  entries: z.array(
    z.object({
      id: z.string().uuid(),
      regionId: z.string(),
      regionName: z.string(),
      sectorId: z.enum(["economy", "agriculture", "social"]),
      indicatorId: z.string(),
      indicatorName: z.string(),
      unit: z.string(),
      referenceYear: z.number().int(),
      sourceName: z.string(),
      methodology: z.string(),
      publishedAt: z.string().datetime(),
      values: z.array(
        z.object({
          periodValue: z.string(),
          value: z.number(),
        }),
      ),
    }),
  ),
});

export type StatisticPeriodType = z.infer<typeof statisticPeriodTypeSchema>;
export type StatisticInputPayload = z.infer<typeof statisticInputPayloadSchema>;
export type StatisticIndicator = (typeof STATISTIC_INDICATORS)[number];
export type StatisticAssignment = {
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: (typeof STATISTIC_SECTORS)[number]["id"];
};
export type StatisticWorkspaceResponse = z.infer<
  typeof statisticWorkspaceResponseSchema
>;

export interface StatisticEntryView {
  readonly id: string | null;
  readonly status: "draft" | "published" | null;
  readonly sourceName: string;
  readonly methodology: string;
  readonly values: readonly {
    readonly periodValue: string;
    readonly value: number;
    readonly explanation: string;
  }[];
  readonly documents: readonly {
    readonly id: string;
    readonly originalName: string;
    readonly fileSize: number;
  }[];
  readonly history: readonly {
    readonly periodValue: string;
    readonly previousValue: number | null;
    readonly newValue: number;
    readonly actorName: string;
    readonly changedAt: string;
  }[];
}
