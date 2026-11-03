import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/v1/stats/summary/route";
import { getPublicStatistics } from "@/modules/analytics/public-statistics";
import { publicStatisticsQuerySchema } from "@/modules/analytics/public-statistics-contract";

describe("public statistics API", () => {
  it("returns pre-aggregated data with default filters", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/stats/summary"),
    );

    expect(response.status).toBe(200);
    const result = await response.json();
    expect(result.periodLabel).toBe("Tahun ini");
    expect(result.regionLabel).toBe("Semua wilayah");
    expect(result.kpis.totalApplications).toBe(1200);
    expect(result.trends).toHaveLength(12);
  });

  it("rejects invalid and reversed custom date ranges", async () => {
    const invalidDate = await GET(
      new Request(
        "http://localhost/api/v1/stats/summary?period=custom&startDate=2026-02-30&endDate=2026-03-01",
      ),
    );
    const reversedRange = await GET(
      new Request(
        "http://localhost/api/v1/stats/summary?period=custom&startDate=2026-04-01&endDate=2026-03-31",
      ),
    );

    expect(invalidDate.status).toBe(400);
    expect(reversedRange.status).toBe(400);
  });

  it("updates the response for selected period and region filters", () => {
    const parsed = publicStatisticsQuerySchema.parse({
      period: "this-quarter",
      region: "jabar",
    });

    const result = getPublicStatistics(parsed);

    expect(result.periodLabel).toBe("Kuartal ini");
    expect(result.regionLabel).toBe("Jawa Barat");
    expect(result.kpis.totalApplications).toBe(209);
  });

  it("suppresses counts and related metrics below the privacy threshold", () => {
    const parsed = publicStatisticsQuerySchema.parse({
      period: "custom",
      region: "jatim",
      startDate: "2026-01-01",
      endDate: "2026-01-01",
    });
    const result = getPublicStatistics(parsed);

    expect(result.kpis.totalApplications).toBeNull();
    expect(result.kpis.satisfactionRate).toBeNull();
    expect(result.sentiment.every((item) => item.count === null)).toBe(true);
    expect(result.sentiment.every((item) => item.percentage === null)).toBe(
      true,
    );
    expect(result.bottlenecks.every((item) => item.volume === null)).toBe(true);
  });

  it("returns bottleneck services sorted by longest average resolution time", () => {
    const result = getPublicStatistics(publicStatisticsQuerySchema.parse({}));

    expect(result.bottlenecks.map((item) => item.averageDays)).toEqual([
      12.5, 8.2, 7.1, 5.4,
    ]);
  });
});
