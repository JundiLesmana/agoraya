import { describe, expect, it } from "vitest";
import {
  exportStatisticsCsv,
  filterStatisticsIndicators,
  formatStatisticsDelta,
  formatStatisticsNumber,
  formatStatisticsValue,
  getStatisticsValues,
  STATISTICS_INDICATORS,
} from "@/app/(public)/data/statistik/_components/statistics-data";

describe("regional statistics data", () => {
  it("formats values and year-over-year deltas with Indonesian units", () => {
    expect(formatStatisticsValue(50.4, "population")).toBe("50,4 juta jiwa");
    expect(formatStatisticsValue(75.2, "index")).toBe("75,2");
    expect(formatStatisticsValue(7.4, "percent")).toBe("7,4%");
    expect(formatStatisticsNumber(7.4)).toBe("7,4");
    expect(formatStatisticsDelta(STATISTICS_INDICATORS[1])).toBe("+0,7 poin");
    expect(formatStatisticsDelta(STATISTICS_INDICATORS[2])).toBe("−0,4 pp");
    expect(
      getStatisticsValues(STATISTICS_INDICATORS[0], "jateng")["2025"],
    ).toBe(38.1);
  });

  it("filters indicators by localized search and category", () => {
    expect(
      filterStatisticsIndicators(
        STATISTICS_INDICATORS,
        " IPM ",
        "Semua kategori",
      ).map((indicator) => indicator.id),
    ).toEqual(["ipm"]);
    expect(
      filterStatisticsIndicators(STATISTICS_INDICATORS, "", "Ekonomi").map(
        (indicator) => indicator.id,
      ),
    ).toEqual(["pengangguran", "pertumbuhan"]);
  });

  it("exports the complete dataset as escaped CSV", () => {
    const csv = exportStatisticsCsv(STATISTICS_INDICATORS);
    expect(csv.split("\r\n")).toHaveLength(7);
    expect(csv).toContain('"Nilai 2024","Nilai 2025","Perubahan"');
    expect(csv).toContain('"Indeks pembangunan manusia","indeks (0–100)"');
  });
});
