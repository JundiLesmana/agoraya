// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryKpiCards } from "@/app/(public)/data/_components/summary-kpi-cards";

const data = {
  totalAnggaran: 80_000_000_000_000,
  realisasi: 60_000_000_000_000,
  proyekSelesai: 156,
  totalProyek: 240,
  cakupanWilayah: 27,
};

describe("SummaryKpiCards", () => {
  it("renders all four summary metrics with compact values and clear percentages", () => {
    render(<SummaryKpiCards data={data} />);

    expect(screen.getByText("Rp80T")).toBeTruthy();
    expect(screen.getByText("Rp60T")).toBeTruthy();
    expect(screen.getByText("75% dari total anggaran")).toBeTruthy();
    expect(screen.getByText("156 / 240")).toBeTruthy();
    expect(screen.getByText("65% dari seluruh proyek")).toBeTruthy();
    expect(screen.getByText("27 daerah")).toBeTruthy();
    expect(screen.queryByText("Simulasi", { exact: true })).toBeNull();
    expect(document.querySelectorAll('[data-source="SIMULATED"]')).toHaveLength(
      0,
    );
  });

  it("renders accessible metric descriptions", () => {
    render(<SummaryKpiCards data={data} />);

    expect(
      screen.getByRole("group", { name: "Total anggaran 80 triliun rupiah" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("group", {
        name: "Realisasi anggaran 60 triliun rupiah, 75% dari total anggaran",
      }),
    ).toBeTruthy();
  });

  it("renders informative skeleton cards while aggregate data is unavailable", () => {
    render(<SummaryKpiCards data={null} />);

    expect(
      screen
        .getByRole("status", { name: "Ringkasan anggaran dan pembangunan" })
        .getAttribute("aria-busy"),
    ).toBe("true");
    expect(document.querySelectorAll('[data-slot="card"]')).toHaveLength(4);
  });
});
