import { z } from "zod";

export const APBD_PERIODS = [
  { value: "Q1", label: "Triwulan I" },
  { value: "Q2", label: "Triwulan II" },
  { value: "Q3", label: "Triwulan III" },
  { value: "Q4", label: "Triwulan IV" },
] as const;

export const APBD_PERIOD_TYPE = z.enum(["monthly", "quarterly"]);
export const APBD_ENTRY_STATUSES = z.enum(["draft", "published"]);

const apbdAmountSchema = z
  .string()
  .regex(/^\d{1,20}$/, "Nilai harus bilangan bulat rupiah maksimal 20 digit.")
  .nullable();

export const apbdPeriodValueSchema = z.strictObject({
  periodType: z.literal("quarterly"),
  periodValue: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  pagu: apbdAmountSchema,
  realisasi: apbdAmountSchema,
});

export const apbdItemSchema = z.strictObject({
  id: z.string().uuid().optional(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .refine((value) => !value.includes("\0"), "Kode sub-kegiatan tidak valid."),
  programName: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .refine((value) => !value.includes("\0"), "Nama program tidak valid."),
  subactivityName: z
    .string()
    .trim()
    .min(1)
    .max(240)
    .refine((value) => !value.includes("\0"), "Nama sub-kegiatan tidak valid."),
  periods: z.array(apbdPeriodValueSchema).length(4),
});

export const apbdContextQuerySchema = z.strictObject({
  referenceYear: z.coerce.number().int().min(2000).max(2100),
  agencyId: z.string().trim().min(1).max(120),
  regionId: z.string().trim().min(1).max(120),
  sectorId: z.string().trim().min(1).max(100),
});

export const apbdSavePayloadSchema = z
  .strictObject({
    referenceYear: z.number().int().min(2000).max(2100),
    agencyId: z.string().trim().min(1).max(120),
    regionId: z.string().trim().min(1).max(120),
    sectorId: z.string().trim().min(1).max(100),
    status: APBD_ENTRY_STATUSES,
    revisionOfId: z.string().uuid().optional(),
    sourceDatasetSubmissionId: z.string().uuid().nullable().optional().default(null),
    revisionReason: z
      .string()
      .trim()
      .max(1000)
      .refine((value) => !value.includes("\0"), "Catatan revisi tidak valid.")
      .default(""),
    items: z.array(z.unknown()).max(500),
  })
  .superRefine((payload, context) => {
    if (payload.revisionOfId && payload.revisionReason.length < 10) {
      context.addIssue({
        code: "custom",
        path: ["revisionReason"],
        message: "Catatan revisi minimal 10 karakter.",
      });
    }
    if (payload.status === "published" && payload.items.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Tambahkan minimal satu sub-kegiatan sebelum publikasi.",
      });
    }
  });

const apbdAssignmentSchema = z.strictObject({
  agencyId: z.string(),
  regionId: z.string(),
  regionName: z.string(),
  sectorId: z.string(),
});

const apbdEntryItemViewSchema = z.strictObject({
  id: z.string().uuid(),
  code: z.string(),
  programName: z.string(),
  subactivityName: z.string(),
  periods: z.array(apbdPeriodValueSchema),
});

const apbdAuditViewSchema = z.strictObject({
  itemCode: z.string(),
  periodValue: z.string(),
  field: z.enum(["pagu", "realisasi"]),
  previousValue: z.string().nullable(),
  newValue: z.string(),
  actorName: z.string(),
  changedAt: z.string().datetime(),
});

const apbdEntryViewSchema = z.strictObject({
  id: z.string().uuid(),
  status: APBD_ENTRY_STATUSES,
  revisionOfId: z.string().uuid().nullable(),
  sourceDatasetSubmissionId: z.string().uuid().nullable(),
  revisionReason: z.string(),
  updatedBy: z.string(),
  updatedAt: z.string().datetime(),
  items: z.array(apbdEntryItemViewSchema),
  audit: z.array(apbdAuditViewSchema),
});

export const apbdWorkspaceResponseSchema = z.strictObject({
  assignments: z.array(apbdAssignmentSchema),
  entry: apbdEntryViewSchema.nullable(),
});

export const publishedApbdResponseSchema = z.strictObject({
  entries: z.array(
    z.strictObject({
      id: z.string().uuid(),
      agencyId: z.string(),
      regionId: z.string(),
      regionName: z.string(),
      sectorId: z.string(),
      referenceYear: z.number().int(),
      publishedAt: z.string().datetime(),
      items: z.array(
        z.strictObject({
          code: z.string(),
          programName: z.string(),
          subactivityName: z.string(),
          periodValue: z.enum(["Q1", "Q2", "Q3", "Q4"]),
          pagu: apbdAmountSchema,
          realisasi: apbdAmountSchema,
        }),
      ),
    }),
  ),
});

export type ApbdPeriodValue = z.infer<typeof apbdPeriodValueSchema>;
export type ApbdItem = z.infer<typeof apbdItemSchema>;
export type ApbdAssignment = z.infer<typeof apbdAssignmentSchema>;
export type ApbdWorkspaceResponse = z.infer<
  typeof apbdWorkspaceResponseSchema
>;
export type PublishedApbdResponse = z.infer<
  typeof publishedApbdResponseSchema
>;
export type ApbdSavePayload = z.infer<typeof apbdSavePayloadSchema>;
