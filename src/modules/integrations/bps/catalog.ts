import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bpsStatistics, datasetResources, datasets } from "@/lib/db/schema";

const BPS_DATASET_SLUG = "statistik-bps";
const BPS_STATISTICS_RESOURCE_URL = "/api/analytics/statistics";
const BPS_CSV_RESOURCE_URL = `/api/asn/datasets/${BPS_DATASET_SLUG}/download`;

const BPS_DATA_DICTIONARY = [
    {
      name: "indicator_name",
      type: "string",
      description: "Nama indikator dari metadata BPS.",
    },
    {
      name: "category",
      type: "string",
      description: "Kategori indikator yang diterima dari BPS API (turvar).",
    },
    {
      name: "indicator_code",
      type: "string",
      description: "Kode indikator statistik BPS.",
    },
    {
      name: "region_code",
      type: "string",
      description: "Kode wilayah statistik BPS.",
    },
    {
      name: "year",
      type: "integer",
      description: "Tahun referensi data.",
    },
    {
      name: "value",
      type: "decimal",
      description: "Nilai agregat indikator.",
    },
    {
      name: "unit",
      type: "string",
      description: "Satuan nilai indikator.",
    },
  ] as const;

function csvCell(value: string | number): string {
  const safeValue =
    typeof value === "string" && /^\s*[=+\-@]/.test(value)
      ? `'${value}`
      : String(value);
  return `"${safeValue.replaceAll('"', '""')}"`;
}

export function serializeBpsStatisticsCsv(
  rows: readonly {
    readonly indicatorCode: string;
    readonly indicatorName: string;
    readonly regionCode: string;
    readonly year: number;
    readonly value: number;
    readonly unit: string;
    readonly category: string;
  }[],
): string {
  const records = [
    [
      "indicator_name",
      "category",
      "indicator_code",
      "region_code",
      "year",
      "value",
      "unit",
    ],
    ...rows.map((row) => [
      row.indicatorName || row.indicatorCode,
      row.category,
      row.indicatorCode,
      row.regionCode,
      row.year,
      row.value,
      row.unit,
    ]),
  ];
  return records.map((record) => record.map(csvCell).join(",")).join("\r\n");
}

/**
 * Registers the normalized BPS snapshot and its generated CSV for public use.
 */
export async function upsertBpsDatasetCatalog(
  database = db(),
  lastUpdatedAt = new Date(),
): Promise<void> {
  const statistics = await database
    .select({
      indicatorCode: bpsStatistics.indicatorCode,
      indicatorName: bpsStatistics.indicatorName,
      regionCode: bpsStatistics.regionCode,
      year: bpsStatistics.year,
      value: bpsStatistics.value,
      unit: bpsStatistics.unit,
      category: bpsStatistics.category,
    })
    .from(bpsStatistics)
    .where(eq(bpsStatistics.sourceLabel, "BPS_API"))
    .orderBy(
      bpsStatistics.indicatorName,
      bpsStatistics.year,
      bpsStatistics.regionCode,
    );
  if (statistics.length === 0) {
    throw new Error("Tidak ada agregat BPS untuk membentuk dataset CSV.");
  }
  const csvData = serializeBpsStatisticsCsv(statistics);

  const [dataset] = await database
    .insert(datasets)
    .values({
      slug: BPS_DATASET_SLUG,
      title: "Statistik BPS",
      summary:
        "Data statistik BPS teragregasi berdasarkan indikator, wilayah, tahun, dan satuan.",
      description:
        "Dataset statistik yang disinkronkan dari BPS API. Hanya agregat inti yang disimpan; respons mentah BPS tidak disimpan.",
      category: "Statistik",
      sourceOrganization: "Badan Pusat Statistik",
      sourceUrl: "https://webapi.bps.go.id/developer/",
      sourceLabel: "BPS_API",
      licenseName: "Sesuai ketentuan BPS",
      licenseUrl: null,
      tags: ["statistik", "BPS", "indikator", "wilayah"],
      dataDictionary: [...BPS_DATA_DICTIONARY],
      lastUpdatedAt,
      isPublished: true,
      csvData,
    })
    .onConflictDoUpdate({
      target: datasets.slug,
      set: {
        title: "Statistik BPS",
        summary:
          "Data statistik BPS teragregasi berdasarkan indikator, wilayah, tahun, dan satuan.",
        description:
          "Dataset statistik yang disinkronkan dari BPS API. Hanya agregat inti yang disimpan; respons mentah BPS tidak disimpan.",
        category: "Statistik",
        sourceOrganization: "Badan Pusat Statistik",
        sourceUrl: "https://webapi.bps.go.id/developer/",
        sourceLabel: "BPS_API",
        licenseName: "Sesuai ketentuan BPS",
        licenseUrl: null,
        tags: ["statistik", "BPS", "indikator", "wilayah"],
        dataDictionary: [...BPS_DATA_DICTIONARY],
        lastUpdatedAt,
        isPublished: true,
        csvData,
      },
    })
    .returning({ id: datasets.id });

  if (!dataset) {
    throw new Error("Dataset BPS tidak dapat disimpan ke katalog ASN.");
  }

  await database
    .insert(datasetResources)
    .values({
      datasetId: dataset.id,
      title: "Statistik BPS melalui API cache",
      format: "API",
      url: BPS_STATISTICS_RESOURCE_URL,
    })
    .onConflictDoUpdate({
      target: [
        datasetResources.datasetId,
        datasetResources.format,
        datasetResources.url,
      ],
      set: { title: "Statistik BPS melalui API cache" },
    });
  await database
    .insert(datasetResources)
    .values({
      datasetId: dataset.id,
      title: "Statistik BPS terolah (CSV)",
      format: "CSV",
      url: BPS_CSV_RESOURCE_URL,
    })
    .onConflictDoUpdate({
      target: [
        datasetResources.datasetId,
        datasetResources.format,
        datasetResources.url,
      ],
      set: { title: "Statistik BPS terolah (CSV)" },
    });
}

export async function getPendingBpsDatasetReview(database = db()) {
  const [dataset] = await database
    .select({
      slug: datasets.slug,
      title: datasets.title,
      summary: datasets.summary,
      lastUpdatedAt: datasets.lastUpdatedAt,
    })
    .from(datasets)
    .where(
      and(
        eq(datasets.slug, BPS_DATASET_SLUG),
        eq(datasets.sourceLabel, "BPS_API"),
        eq(datasets.isPublished, false),
      ),
    )
    .limit(1);

  if (!dataset) return null;

  const [countResult, preview] = await Promise.all([
    database
      .select({ recordCount: count() })
      .from(bpsStatistics)
      .where(eq(bpsStatistics.sourceLabel, "BPS_API")),
    database
      .select({
        indicatorCode: bpsStatistics.indicatorCode,
        regionCode: bpsStatistics.regionCode,
        year: bpsStatistics.year,
        value: bpsStatistics.value,
        unit: bpsStatistics.unit,
      })
      .from(bpsStatistics)
      .where(eq(bpsStatistics.sourceLabel, "BPS_API"))
      .orderBy(
        desc(bpsStatistics.year),
        bpsStatistics.indicatorCode,
        bpsStatistics.regionCode,
      )
      .limit(5),
  ]);

  return {
    ...dataset,
    recordCount: Number(countResult[0]?.recordCount ?? 0),
    preview,
  };
}

export async function publishBpsDatasetReview(
  database = db(),
): Promise<boolean> {
  const published = await database
    .update(datasets)
    .set({ isPublished: true })
    .where(
      and(
        eq(datasets.slug, BPS_DATASET_SLUG),
        eq(datasets.sourceLabel, "BPS_API"),
        eq(datasets.isPublished, false),
      ),
    )
    .returning({ id: datasets.id });

  return published.length > 0;
}
