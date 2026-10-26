// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import StatisticsPage from "@/app/(public)/data/statistik/page";

describe("regional statistics page", () => {
  it("renders the dashboard structure and active public-data tab", () => {
    render(<StatisticsPage />);

    const title = screen.getByRole("heading", {
      level: 1,
      name: "Statistik Daerah",
    });
    expect(title.classList.contains("text-2xl")).toBe(true);
    const introduction = screen.getByText(
      /Kenali kondisi penduduk, ekonomi, dan kesejahteraan/,
    );
    expect(introduction.classList.contains("text-xs")).toBe(true);
    expect(introduction.className).not.toContain("max-w-2xl");
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeTruthy();
    const tabs = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    expect(
      within(tabs)
        .getByRole("link", { name: "Statistik daerah" })
        .getAttribute("aria-current"),
    ).toBe("location");
    expect(screen.getAllByText("Potret Jawa Barat").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("table", { name: /Daftar indikator daerah/ }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Sumber, cakupan & metodologi" }),
    ).toBeTruthy();
    expect(
      screen.queryByText(/Potret Jawa Barat: Perbandingan utama 2024 vs 2025/),
    ).toBeNull();
    expect(
      screen.getByText("Selisih kecil, konteks tetap penting."),
    ).toBeTruthy();
  });

  it("applies shareable filters to cards and indicator table and supports search", () => {
    render(<StatisticsPage />);
    fireEvent.change(screen.getByRole("combobox", { name: "Wilayah utama" }), {
      target: { value: "jateng" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Tahun" }), {
      target: { value: "2024" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    expect(screen.getByText("Potret Jawa Tengah")).toBeTruthy();
    expect(screen.getByText("37,9 juta jiwa")).toBeTruthy();
    expect(window.location.search).toContain("wilayah=jateng");
    expect(window.location.search).toContain("tahun=2024");

    fireEvent.change(screen.getByRole("textbox", { name: "Cari indikator" }), {
      target: { value: "IPM" },
    });
    const table = screen.getByRole("table", {
      name: /Daftar indikator daerah/,
    });
    expect(within(table).getByText("Indeks pembangunan manusia")).toBeTruthy();
    expect(within(table).queryByText("Jumlah penduduk")).toBeNull();
  });

  it("explains unavailable monthly data and provides metadata and downloads", () => {
    const createObjectURL = vi.fn(() => "blob:statistics");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<StatisticsPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Frekuensi" }), {
      target: { value: "bulanan" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));
    expect(
      screen.getByText(/Tidak ada data bulanan pada snapshot yang tersedia/),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Metadata" }));
    expect(screen.getByText(/"kolom"/)).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Unduh CSV dataset lengkap" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Unduh JSON" }));
    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(anchorClick).toHaveBeenCalledTimes(2);
    anchorClick.mockRestore();
    vi.unstubAllGlobals();
  });
});
