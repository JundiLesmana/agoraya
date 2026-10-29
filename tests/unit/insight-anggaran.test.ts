import { describe, expect, it } from "vitest";
import {
  calculateBudgetTrendSummary,
  getBudgetTrend,
  transformBudgetTrendData,
} from "@/lib/insight-anggaran";

describe("budget insight data", () => {
  it("transforms the five-year API values into chart rows", () => {
    expect(transformBudgetTrendData(getBudgetTrend().data)).toEqual([
      { tahun: "2020", anggaran: 1.8, realisasi: 1.5 },
      { tahun: "2021", anggaran: 2, realisasi: 1.7 },
      { tahun: "2022", anggaran: 2.3, realisasi: 2 },
      { tahun: "2023", anggaran: 2.6, realisasi: 2.3 },
      { tahun: "2024", anggaran: 3, realisasi: 2.7 },
    ]);
  });

  it("calculates the 2024 realization rate and increase from 2020", () => {
    expect(calculateBudgetTrendSummary(getBudgetTrend().data)).toEqual({
      realizationRate: 90,
      realizationIncrease: 80,
      realizationDelta: 1.2,
    });
  });

  it("rejects an empty trend instead of returning misleading summary values", () => {
    expect(() => calculateBudgetTrendSummary([])).toThrow(
      "Data tren anggaran tidak boleh kosong.",
    );
  });
});
