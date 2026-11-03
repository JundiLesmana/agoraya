import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BudgetActualsTrend } from "@/app/(public)/data/_components/budget-actuals-trend";

const trendResponse = {
  wilayah: "Kota Bandung",
  periode: "2020-2024",
  source: "SIMULATED",
  data: [
    { tahun: 2020, anggaran: 1.8, realisasi: 1.5 },
    { tahun: 2021, anggaran: 2, realisasi: 1.7 },
    { tahun: 2022, anggaran: 2.3, realisasi: 2 },
    { tahun: 2023, anggaran: 2.6, realisasi: 2.3 },
    { tahun: 2024, anggaran: 3, realisasi: 2.7 },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BudgetActualsTrend", () => {
  it("renders the chart context, accessible data table, and accurate interpretation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => trendResponse,
      }),
    );

    render(<BudgetActualsTrend />);

    expect(
      await screen.findByRole("heading", {
        name: "Anggaran naik, bagaimana realisasinya?",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Kota Bandung · 2020-2024")).toBeTruthy();
    expect(screen.queryByText("Data contoh", { exact: true })).toBeNull();
    expect(document.querySelectorAll('[data-source="SIMULATED"]')).toHaveLength(
      0,
    );
    expect(screen.getByText("90% anggaran terealisasi pada 2024.")).toBeTruthy();
    expect(
      screen.getByText(/Naik 80% dibanding realisasi 2020 \(Rp1,5 triliun\)/),
    ).toBeTruthy();
    expect(screen.getByText(/Simulasi APBD Agoraya/)).toBeTruthy();

    const table = screen.getByRole("table", {
      name: /Data anggaran dan realisasi Kota Bandung tahun 2020 sampai 2024/i,
    });
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    expect(within(table).getByRole("row", { name: /2020 1,8 1,5/ })).toBeTruthy();
    expect(within(table).getByRole("row", { name: /2024 3,0 2,7/ })).toBeTruthy();
  });

  it("reports API failures and provides a retry action", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    render(<BudgetActualsTrend />);

    expect(
      await screen.findByRole("alert"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Coba lagi" })).toBeTruthy();
  });
});
