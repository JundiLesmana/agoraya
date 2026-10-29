// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { BudgetTrend } from "@/app/(public)/insights/_components/budget-trend";
import { getBudgetTrend } from "@/lib/insight-anggaran";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BudgetTrend", () => {
  it("renders the five-year budget trend, accessible data table, and 2024 interpretation", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(getBudgetTrend()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<BudgetTrend fokus="Kota Bandung" />);

    expect(
      await screen.findByText("90% anggaran terealisasi pada 2024."),
    ).toBeTruthy();
    const table = screen.getByRole("table", {
      name: /tren anggaran dan realisasi kota bandung 2020-2024/i,
    });
    expect(within(table).getAllByRole("row")).toHaveLength(6);
    expect(screen.getByText("Data contoh")).toBeTruthy();
    expect(screen.getByText(/belum disesuaikan dengan inflasi/i)).toBeTruthy();
  });
});
