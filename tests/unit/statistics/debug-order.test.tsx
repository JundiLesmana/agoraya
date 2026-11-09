// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatisticsPage from "@/app/(public)/data/statistik/page";

describe("debug ordering", () => {
  it("lists sections", () => {
    render(<StatisticsPage />);
    const sections = Array.from(document.querySelectorAll("section")).map(
      (s) => s.getAttribute("aria-labelledby") || s.getAttribute("id") || "",
    );
    expect(sections.join(" | ")).toContain("indicator-table-title");
    expect(sections.join(" | ")).toContain("indikator-api-title");
    const idx = sections.findIndex((s) => s === "indikator-api-title");
    const pubIdx = sections.findIndex((s) => s === "published-statistic-inputs");
    console.log("IDX_API", idx, "IDX_PUB", pubIdx);
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(pubIdx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThan(pubIdx);
  });
});
