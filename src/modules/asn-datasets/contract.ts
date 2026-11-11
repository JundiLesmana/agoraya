import { z } from "zod";

export const datasetAssignmentTypeSchema = z.enum([
  "statistics",
  "apbd",
  "project",
]);

export const datasetCategorySchema = z.enum([
  "Anggaran",
  "Proyek",
  "Statistik",
]);

const dictionaryColumnSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  type: z.enum(["integer", "decimal", "date", "text"]),
  description: z.string().trim().max(500),
});

export const datasetSubmissionPayloadSchema = z
  .strictObject({
    submissionId: z.string().uuid().optional(),
    assignmentType: datasetAssignmentTypeSchema,
    agencyId: z.string().trim().max(120).optional().default(""),
    regionId: z.string().trim().max(120).optional().default(""),
    regionName: z.string().trim().max(160).optional().default(""),
    sectorId: z.string().trim().max(100).optional().default(""),
    referenceYear: z.coerce.number().int().min(2000).max(2100),
    projectId: z.string().uuid().optional(),
    title: z.string().trim().min(1).max(255),
    summary: z.string().trim().min(1).max(500),
    description: z.string().trim().min(1).max(4000),
    category: datasetCategorySchema,
    sourceOrganization: z.string().trim().min(1).max(255),
    sourceUrl: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .default("")
      .refine(
        (value) => !value || /^https:\/\//i.test(value),
        "URL sumber harus menggunakan HTTPS.",
      ),
    licenseName: z.string().trim().min(1).max(160),
    licenseUrl: z
      .string()
      .trim()
      .max(2048)
      .optional()
      .default("")
      .refine(
        (value) => !value || /^https:\/\//i.test(value),
        "URL lisensi harus menggunakan HTTPS.",
      ),
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
    dataDictionary: z.array(dictionaryColumnSchema).max(100).optional(),
    periodStart: z.string().date().optional(),
    periodEnd: z.string().date().optional(),
    frequency: z.enum(["monthly", "quarterly", "annual", "irregular"]),
    mode: z.enum(["draft", "submit"]),
  })
  .superRefine((payload, context) => {
    const categoryAssignment: Record<
      z.infer<typeof datasetCategorySchema>,
      z.infer<typeof datasetAssignmentTypeSchema>
    > = {
      Anggaran: "apbd",
      Proyek: "project",
      Statistik: "statistics",
    };
    if (categoryAssignment[payload.category] !== payload.assignmentType) {
      context.addIssue({
        code: "custom",
        path: ["assignmentType"],
        message: "Kategori dataset tidak sesuai dengan penugasan operator.",
      });
    }
    if (payload.assignmentType === "project" && !payload.projectId) {
      context.addIssue({
        code: "custom",
        path: ["projectId"],
        message: "Pilih proyek yang termasuk dalam penugasan Anda.",
      });
    }
    if (
      payload.assignmentType !== "project" &&
      (!payload.agencyId || !payload.regionId || !payload.regionName || !payload.sectorId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["agencyId"],
        message: "Pilih instansi, wilayah, dan urusan dari penugasan Anda.",
      });
    }
    if (
      payload.periodStart &&
      payload.periodEnd &&
      payload.periodStart > payload.periodEnd
    ) {
      context.addIssue({
        code: "custom",
        path: ["periodEnd"],
        message: "Tanggal akhir periode harus setelah tanggal mulai.",
      });
    }
    if (new Set(payload.tags.map((tag) => tag.toLocaleLowerCase("id-ID"))).size !== payload.tags.length) {
      context.addIssue({
        code: "custom",
        path: ["tags"],
        message: "Tag tidak boleh duplikat.",
      });
    }
    if (
      payload.dataDictionary &&
      new Set(payload.dataDictionary.map((column) => column.name.toLocaleLowerCase("id-ID"))).size !==
        payload.dataDictionary.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["dataDictionary"],
        message: "Nama kolom kamus data tidak boleh duplikat.",
      });
    }
  });

export const datasetAssignmentSchema = z.strictObject({
  assignmentType: datasetAssignmentTypeSchema,
  agencyId: z.string(),
  regionId: z.string(),
  regionName: z.string(),
  sectorId: z.string(),
  referenceYear: z.number().int(),
  projectId: z.string().uuid().nullable(),
  projectLabel: z.string().nullable(),
});

export const datasetSubmissionSummarySchema = z.strictObject({
  id: z.string().uuid(),
  datasetId: z.string().uuid(),
  title: z.string(),
  summary: z.string(),
  category: datasetCategorySchema,
  sourceOrganization: z.string(),
  sourceLabel: z.enum(["BPS_API", "ASN_SUBMITTED"]),
  sourceKind: z.enum(["manual", "bps"]),
  status: z.enum(["draft", "submitted", "published"]),
  assignmentType: datasetAssignmentTypeSchema,
  agencyId: z.string().nullable(),
  regionId: z.string().nullable(),
  regionName: z.string().nullable(),
  sectorId: z.string(),
  referenceYear: z.number().int(),
  projectId: z.string().uuid().nullable(),
  projectLabel: z.string().nullable(),
  recordCount: z.number().int().nonnegative(),
  createdByName: z.string(),
  updatedAt: z.string().datetime(),
  submittedAt: z.string().datetime().nullable(),
});

export const datasetSubmissionDetailSchema =
  datasetSubmissionSummarySchema.extend({
    description: z.string(),
    sourceUrl: z.string().nullable(),
    licenseName: z.string(),
    licenseUrl: z.string().nullable(),
    tags: z.array(z.string()),
    dataDictionary: z.array(dictionaryColumnSchema),
    periodStart: z.string().nullable(),
    periodEnd: z.string().nullable(),
    frequency: z.enum(["monthly", "quarterly", "annual", "irregular"]),
    csvData: z.string(),
  });

export const datasetWorkspaceResponseSchema = z.strictObject({
  assignments: z.array(datasetAssignmentSchema),
  submissions: z.array(datasetSubmissionSummarySchema),
  detail: datasetSubmissionDetailSchema.nullable(),
});

export const datasetSourceSchema = z.strictObject({
  id: z.string().uuid(),
  title: z.string(),
  category: datasetCategorySchema,
  sourceLabel: z.enum(["BPS_API", "ASN_SUBMITTED"]),
  sourceOrganization: z.string(),
  regionName: z.string().nullable(),
  sectorId: z.string(),
  referenceYear: z.number().int(),
  submittedAt: z.string().datetime(),
});

export const datasetSourcesResponseSchema = z.strictObject({
  sources: z.array(datasetSourceSchema),
});

export type DatasetAssignment = z.infer<typeof datasetAssignmentSchema>;
export type DatasetSubmissionPayload = z.infer<
  typeof datasetSubmissionPayloadSchema
>;
export type DatasetSubmissionSummary = z.infer<
  typeof datasetSubmissionSummarySchema
>;
export type DatasetSubmissionDetail = z.infer<
  typeof datasetSubmissionDetailSchema
>;
export type DatasetSource = z.infer<typeof datasetSourceSchema>;
