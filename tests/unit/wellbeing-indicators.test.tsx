// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { WellbeingIndicators } from "@/app/(public)/insights/_components/wellbeing-indicators";
import { getWellbeingInsights } from "@/lib/insight-kesejahteraan";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("WellbeingIndicators", () => {
  it("renders all values, interpretations, direction colors, and disclaimers", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify(getWellbeingInsights()), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    render(<WellbeingIndicators />);

    const table = await screen.findByRole("table");
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(5);
    expect(
      within(table).getByRole("columnheader", {
        name: /perubahan; hijau berarti indikator membaik dan merah berarti memburuk/i,
      }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("row", {
        name: /penduduk miskin.*4,0.*3,8.*-0,2 poin persentase.*lebih rendah = lebih baik/i,
      }),
    ).toBeTruthy();
    expect(
      within(table).getByRole("row", {
        name: /rata-rata lama sekolah.*10,5.*10,7.*\+0,2 tahun.*lebih tinggi = lebih baik/i,
      }),
    ).toBeTruthy();

    const favorableDeltas = table.querySelectorAll(".text-emerald-700");
    expect(favorableDeltas).toHaveLength(4);
    expect(
      screen.getByText(
        "Empat indikator bergerak membaik. Perubahan ini belum membuktikan dampak anggaran. Setiap indikator membutuhkan waktu berbeda.",
      ),
    ).toBeTruthy();
    expect(screen.getAllByText("Data contoh").length).toBeGreaterThan(0);
    expect(screen.getByText("Simulasi sosial-ekonomi Agoraya")).toBeTruthy();
  });

  it("requests the four indicator IDs from the API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(getWellbeingInsights()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<WellbeingIndicators />);
    await screen.findByRole("table");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/insight/kesejahteraan?indikator=kemiskinan,pengangguran,sekolah,harapan_hidup",
      { cache: "no-store" },
    );
  });
});
