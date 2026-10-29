// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TimelyServiceComparison } from "@/app/(public)/insights/_components/timely-service-comparison";

const apiResponse = {
  period: 2024,
  cities: [
    { city: "Bandung", percentage: 88 },
    { city: "Bogor", percentage: 84 },
    { city: "Depok", percentage: 81 },
    { city: "Bekasi", percentage: 78 },
    { city: "Cimahi", percentage: 75 },
  ],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("TimelyServiceComparison", () => {
  it("renders the five accessible city values, average, context, and sample label", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(apiResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(<TimelyServiceComparison />);

    const table = await screen.findByRole("table");
    const tableRows = within(table).getAllByRole("row");
    expect(tableRows).toHaveLength(6);
    expect(
      within(table).getByRole("row", { name: /kota bandung 88%/i }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("row", { name: /kota depok 81%/i }),
    ).toBeTruthy();
    expect(screen.getByText("81%")).toBeTruthy();
    expect(
      screen.getByText(
        /bukan peningkatan kualitas layanan keseluruhan\. volume permohonan dan jenis layanan tiap kota dapat berbeda\./i,
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("Data contoh").length).toBeGreaterThan(0);
  });
});
