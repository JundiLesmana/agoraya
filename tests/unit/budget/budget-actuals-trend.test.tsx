import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BudgetActualsTrend } from "@/app/(public)/data/_components/budget-actuals-trend";

const trendResponse = {
  entries: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      agencyId: "pemda-bandung",
      regionId: "bandung",
      regionName: "Kota Bandung",
      sectorId: "pendidikan",
      referenceYear: 2020,
      publishedAt: "2026-11-10T00:00:00.000Z",
      items: [
        {
          code: "PENDIDIKAN",
          programName: "Pendidikan",
          subactivityName: "Pendidikan dasar",
          pagu: "1800000000000",
          realisasi: "1500000000000",
          periodValue: "Q1",
        },
        ...["Q2", "Q3", "Q4"].map((periodValue) => ({
          code: "PENDIDIKAN",
          programName: "Pendidikan",
          subactivityName: "Pendidikan dasar",
          pagu: "0",
          realisasi: "0",
          periodValue,
        })),
      ],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      agencyId: "pemda-bandung",
      regionId: "bandung",
      regionName: "Kota Bandung",
      sectorId: "pendidikan",
      referenceYear: 2024,
      publishedAt: "2026-11-10T00:00:00.000Z",
      items: [
        {
          code: "PENDIDIKAN",
          programName: "Pendidikan",
          subactivityName: "Pendidikan dasar",
          pagu: "3000000000000",
          realisasi: "2700000000000",
          periodValue: "Q1",
        },
        ...["Q2", "Q3", "Q4"].map((periodValue) => ({
          code: "PENDIDIKAN",
          programName: "Pendidikan",
          subactivityName: "Pendidikan dasar",
          pagu: "0",
          realisasi: "0",
          periodValue,
        })),
      ],
    },
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

    expect(await screen.findByText(/Pada 2024, 90%/)).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Anggaran dan realisasi APBD",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Akumulasi data APBD yang telah dipublikasikan · seluruh wilayah",
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Pada 2024, 90% pagu yang dipublikasikan telah terealisasi/,
      ),
    ).toBeTruthy();

    const table = screen.getByRole("table", {
      name: /Pagu dan realisasi APBD terpublikasi menurut tahun/i,
    });
    expect(within(table).getAllByRole("row")).toHaveLength(3);
    expect(within(table).getByRole("row", { name: /2020 1,8 1,5/ })).toBeTruthy();
    expect(within(table).getByRole("row", { name: /2024 3 2,7/ })).toBeTruthy();
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
