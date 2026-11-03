import { describe, expect, it } from "vitest";
import {
  formatRelativeDatasetDate,
  getHighlightedTextParts,
} from "@/lib/dataset-catalog-presentation";
import {
  datasetCatalogQuerySchema,
  datasetMetadataRecordSchema,
  datasetResourceSchema,
  toSchemaOrgDataset,
} from "@/modules/dataset-catalog/contract";
import { buildDatasetCatalogWhere } from "@/modules/dataset-catalog/repository";

describe("dataset catalog presentation helpers", () => {
  it("highlights each search term without interpreting regex characters", () => {
    expect(
      getHighlightedTextParts("APBD dan proyek daerah", "APBD proyek"),
    ).toEqual([
      { text: "APBD", highlighted: true },
      { text: " dan ", highlighted: false },
      { text: "proyek", highlighted: true },
      { text: " daerah", highlighted: false },
    ]);
    expect(getHighlightedTextParts(".* dataset", ".*")[0]).toEqual({
      text: ".*",
      highlighted: true,
    });
  });

  it("formats relative update dates in Indonesian", () => {
    const now = new Date("2026-11-02T00:00:00.000Z");
    expect(formatRelativeDatasetDate("2026-10-31T00:00:00.000Z", now)).toBe(
      "2 hari yang lalu",
    );
  });

  it("rejects overlong catalog search queries", () => {
    expect(
      datasetCatalogQuerySchema.safeParse({ search: "a".repeat(201) }).success,
    ).toBe(false);
  });

  it("only accepts safe resource URLs", () => {
    const base = {
      id: "26000000-0000-4000-8000-000000000001",
      title: "Dataset",
      format: "CSV",
    };
    expect(
      datasetResourceSchema.safeParse({ ...base, url: "/data/example.csv" })
        .success,
    ).toBe(true);
    expect(
      datasetResourceSchema.safeParse({
        ...base,
        url: "javascript:alert(1)",
      }).success,
    ).toBe(false);
    expect(
      datasetResourceSchema.safeParse({
        ...base,
        url: "//example.com/file.csv",
      }).success,
    ).toBe(false);
  });

  it("publishes detail metadata as schema.org Dataset JSON-LD", () => {
    const dataset = datasetMetadataRecordSchema.parse({
      id: "26000000-0000-4000-8000-000000000001",
      slug: "anggaran-realisasi-apbd",
      title: "Anggaran & realisasi APBD",
      summary: "Ringkasan anggaran.",
      description: "Metadata dataset APBD.",
      category: "Ekonomi",
      sourceOrganization: "Dinas Keuangan",
      sourceLabel: "SIMULATED",
      tags: ["APBD"],
      lastUpdatedAt: "2025-09-30T00:00:00.000Z",
      downloadsCount: 0,
      resources: [
        {
          id: "27000000-0000-4000-8000-000000000001",
          title: "Anggaran CSV",
          format: "CSV",
          url: "/data/anggaran-realisasi-apbd.csv",
        },
      ],
      sourceUrl: null,
      licenseName: "Data simulasi",
      licenseUrl: null,
      dataDictionary: [
        {
          name: "periode",
          type: "tanggal",
          description: "Bulan laporan.",
        },
      ],
    });
    const structuredDataset = toSchemaOrgDataset(
      dataset,
      "https://agoraya.test",
    );

    expect(structuredDataset["@context"]).toBe("https://schema.org");
    expect(structuredDataset["@type"]).toBe("Dataset");
    expect(structuredDataset.name).toBe(dataset.title);
    expect(structuredDataset.creator.name).toBe(dataset.sourceOrganization);
    expect(structuredDataset.distribution[0]).toMatchObject({
      "@type": "DataDownload",
      encodingFormat: "text/csv",
      contentUrl: "https://agoraya.test/data/anggaran-realisasi-apbd.csv",
    });
    expect(structuredDataset.variableMeasured[0].name).toBe("periode");
  });

  it("binds search text and filters as SQL parameters", () => {
    const maliciousSearch = "' OR 1=1; DROP TABLE datasets; --";
    const parsed = datasetCatalogQuerySchema.parse({
      search: maliciousSearch,
      category: "Ekonomi",
      format: "CSV",
      agency: "Dinas Keuangan",
    });
    const query = buildDatasetCatalogWhere(parsed);

    expect(query.whereSql).toContain(
      "d.search_vector @@ websearch_to_tsquery('simple', $1)",
    );
    expect(query.whereSql).toContain("d.category = $2");
    expect(query.whereSql).toContain("d.source_organization = $3");
    expect(query.whereSql).toContain("filtered_resource.format = $4");
    expect(query.whereSql).not.toContain(maliciousSearch);
    expect(query.params).toEqual([
      maliciousSearch,
      "Ekonomi",
      "Dinas Keuangan",
      "CSV",
    ]);
  });
});
