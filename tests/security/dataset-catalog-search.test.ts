import { describe, expect, it } from "vitest";
import { datasetCatalogQuerySchema } from "@/modules/dataset-catalog/contract";
import { buildDatasetCatalogWhere } from "@/modules/dataset-catalog/repository";

describe("dataset catalog search safety", () => {
  it("keeps SQL injection payloads in bound parameters", () => {
    const payload = "'; DROP TABLE datasets; --";
    const query = buildDatasetCatalogWhere(
      datasetCatalogQuerySchema.parse({ search: payload }),
    );

    expect(query.whereSql).toContain("websearch_to_tsquery('simple', $1)");
    expect(query.whereSql).not.toContain(payload);
    expect(query.params).toEqual([payload]);
  });
});
