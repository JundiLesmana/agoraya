import { z } from "zod";

export const datasetFormatSchema = z.enum(["CSV", "JSON", "PDF", "API"]);

const datasetUrlSchema = z
  .string()
  .min(1)
  .refine((value) => {
    if (value.startsWith("/")) {
      return !value.startsWith("//") && !value.includes("\\");
    }

    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  });

export const datasetCatalogQuerySchema = z.strictObject({
  search: z.string().trim().max(200).default(""),
  category: z.string().trim().min(1).max(100).optional(),
  format: datasetFormatSchema.optional(),
  agency: z.string().trim().min(1).max(255).optional(),
  sort: z.enum(["relevance", "recent", "downloads"]).default("relevance"),
  page: z.coerce.number().int().min(1).max(10000).default(1),
});

export const datasetResourceSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  format: datasetFormatSchema,
  url: datasetUrlSchema,
});

export const datasetDictionaryColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
  description: z.string(),
});

const datasetFieldsSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  title: z.string(),
  summary: z.string(),
  category: z.string(),
  sourceOrganization: z.string(),
  sourceLabel: z.enum([
    "BPS_API",
    "SIMULATED",
    "CITIZEN_UNVERIFIED",
    "ASN_SUBMITTED",
  ]),
  tags: z.array(z.string()),
  lastUpdatedAt: z.string().datetime(),
  downloadsCount: z.number().int().nonnegative(),
  resources: z.array(datasetResourceSchema),
});

export const datasetCatalogItemSchema = datasetFieldsSchema;
export const datasetMetadataRecordSchema = datasetFieldsSchema.extend({
  description: z.string(),
  sourceUrl: datasetUrlSchema.nullable(),
  licenseName: z.string(),
  licenseUrl: datasetUrlSchema.nullable(),
  dataDictionary: z.array(datasetDictionaryColumnSchema),
});

const schemaOrgDistributionSchema = z.object({
  "@type": z.literal("DataDownload"),
  name: z.string(),
  encodingFormat: z.string(),
  contentUrl: z.string().url(),
});

export const datasetMetadataSchema = datasetMetadataRecordSchema.extend({
  "@context": z.literal("https://schema.org"),
  "@type": z.literal("Dataset"),
  "@id": z.string().url(),
  name: z.string(),
  identifier: z.string(),
  keywords: z.array(z.string()),
  dateModified: z.string().datetime(),
  creator: z.object({
    "@type": z.literal("Organization"),
    name: z.string(),
  }),
  license: z.string(),
  distribution: z.array(schemaOrgDistributionSchema),
  variableMeasured: z.array(
    z.object({
      "@type": z.literal("PropertyValue"),
      name: z.string(),
      description: z.string(),
    }),
  ),
});

export const datasetCatalogResponseSchema = z.object({
  data: z.array(datasetCatalogItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.literal(12),
  totalPages: z.number().int().nonnegative(),
  filters: z.object({
    categories: z.array(z.string()),
    agencies: z.array(z.string()),
  }),
});

export type DatasetCatalogQuery = z.output<typeof datasetCatalogQuerySchema>;
export type DatasetCatalogItem = z.infer<typeof datasetCatalogItemSchema>;
export type DatasetMetadataRecord = z.infer<typeof datasetMetadataRecordSchema>;
export type DatasetMetadata = z.infer<typeof datasetMetadataSchema>;
export type DatasetCatalogResponse = z.infer<
  typeof datasetCatalogResponseSchema
>;

const SCHEMA_ORG_FORMATS: Record<
  z.infer<typeof datasetFormatSchema>,
  string
> = {
  CSV: "text/csv",
  JSON: "application/json",
  PDF: "application/pdf",
  API: "application/json",
};

export function toSchemaOrgDataset(
  dataset: DatasetMetadataRecord,
  origin: string,
): DatasetMetadata {
  return datasetMetadataSchema.parse({
    ...dataset,
    "@context": "https://schema.org",
    "@type": "Dataset",
    "@id": new URL(`/api/asn/datasets/${dataset.slug}`, origin).toString(),
    name: dataset.title,
    identifier: dataset.slug,
    keywords: dataset.tags,
    dateModified: dataset.lastUpdatedAt,
    creator: {
      "@type": "Organization",
      name: dataset.sourceOrganization,
    },
    license: dataset.licenseUrl ?? dataset.licenseName,
    distribution: dataset.resources.map((resource) => ({
      "@type": "DataDownload",
      name: resource.title,
      encodingFormat: SCHEMA_ORG_FORMATS[resource.format],
      contentUrl: new URL(resource.url, origin).toString(),
    })),
    variableMeasured: dataset.dataDictionary.map((column) => ({
      "@type": "PropertyValue",
      name: column.name,
      description: column.description,
    })),
  });
}
