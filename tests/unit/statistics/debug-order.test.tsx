// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import StatisticsPage from "@/app/(public)/data/statistik/page";

describe("debug ordering", () => {
  it("lists published statistics sections in page order", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const publishedStatistics = String(input).includes(
          "/api/v1/statistics/published",
        );
        return new Response(
          JSON.stringify(
            publishedStatistics
              ? {
                  entries: [
                    {
                      id: "550e8400-e29b-41d4-a716-446655440001",
                      regionId: "region-jabar",
                      regionName: "Jawa Barat",
                      sectorId: "social",
                      indicatorId: "poverty",
                      indicatorName: "Tingkat kemiskinan",
                      unit: "%",
                      referenceYear: 2025,
                      sourceName: "BPS",
                      methodology: "Survei sosial ekonomi",
                      publishedAt: "2026-01-15T00:00:00.000Z",
                      values: [{ periodValue: "2025", value: 8.7 }],
                    },
                  ],
                }
              : {},
          ),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );
    render(<StatisticsPage />);
    await screen.findByRole("heading", { name: "Rincian publikasi statistik" });
    const sections = Array.from(document.querySelectorAll("section")).map(
      (section) =>
        section.getAttribute("aria-labelledby") ||
        section.getAttribute("id") ||
        "",
    );
    const indicatorsIndex = sections.indexOf("statistics-indicators-title");
    const trendIndex = sections.indexOf("statistics-trend-title");
    const tableIndex = sections.indexOf("statistics-table-title");
    const datasetsIndex = sections.indexOf("public-datasets-Statistik");

    expect(indicatorsIndex).toBeGreaterThanOrEqual(0);
    expect(trendIndex).toBeGreaterThan(indicatorsIndex);
    expect(tableIndex).toBeGreaterThan(trendIndex);
    expect(datasetsIndex).toBeGreaterThan(tableIndex);
  });
});
