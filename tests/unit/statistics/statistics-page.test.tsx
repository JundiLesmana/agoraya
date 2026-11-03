// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StatisticsPage from "@/app/(public)/data/statistik/page";

afterEach(() => {
  window.history.replaceState(null, "", window.location.pathname);
});

describe("regional statistics page", () => {
  it("renders the dashboard structure and active public-data tab", () => {
    render(<StatisticsPage />);

    const title = screen.getByRole("heading", {
      level: 1,
      name: "Statistik Daerah",
    });
    expect(title.classList.contains("text-3xl")).toBe(true);
    const introduction = screen.getByText(
      /Kenali kondisi penduduk, ekonomi, dan kesejahteraan/,
    );
    expect(introduction.classList.contains("text-base")).toBe(true);
    expect(introduction.className).toContain("max-w-2xl");
    expect(title.className).toContain("sm:text-4xl");
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }).className,
    ).toContain("text-xs");
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
    expect(screen.queryByText("Indikator tahunan · simulasi")).toBeNull();
    expect(screen.queryByText("Simulasi", { exact: true })).toBeNull();
    expect(document.querySelectorAll('[data-source="SIMULATED"]')).toHaveLength(
      0,
    );
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
    expect(screen.getByText("Jawa Tengah · Utama")).toBeTruthy();
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

  it("offers all Indonesian provinces and years from 2020 through 2025", () => {
    render(<StatisticsPage />);

    const regionSelect = screen.getByRole("combobox", {
      name: "Wilayah utama",
    }) as HTMLSelectElement;
    const provinceOptions = Array.from(regionSelect.options);
    expect(provinceOptions).toHaveLength(38);
    expect(provinceOptions.map((option) => option.label)).toContain(
      "Provinsi Aceh",
    );
    expect(provinceOptions.map((option) => option.label)).toContain(
      "Provinsi Papua Barat Daya",
    );

    const yearSelect = screen.getByRole("combobox", {
      name: "Tahun",
    }) as HTMLSelectElement;
    expect(
      Array.from(yearSelect.options).map((option) => option.value),
    ).toEqual(["2025", "2024", "2023", "2022", "2021", "2020"]);
  });

  it("keeps unavailable province/year combinations explicit instead of showing other data", () => {
    render(<StatisticsPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Wilayah utama" }), {
      target: { value: "provinsi-aceh" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Tahun" }), {
      target: { value: "2020" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    expect(
      screen
        .getByText(
          /Data simulasi statistik belum tersedia untuk Aceh tahun 2020/,
        )
        .getAttribute("role"),
    ).toBe("status");
    expect(screen.queryByText("Potret Jawa Barat")).toBeNull();
    expect(window.location.search).toContain("wilayah=provinsi-aceh");
    expect(window.location.search).toContain("tahun=2020");
  });

  it("updates the trend and comparison list from the selected indicator and provinces", () => {
    render(<StatisticsPage />);

    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Indikator grafik dan perbandingan",
      }),
      { target: { value: "kemiskinan" } },
    );
    expect(
      screen.getByRole("table", {
        name: /Perbandingan Tingkat kemiskinan Jawa Barat, Jawa Tengah, Jawa Timur/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("Tingkat kemiskinan tahun 2025 · % penduduk"),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Hapus Jawa Tengah dari perbandingan",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Tambah daerah" }));
    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Pilih provinsi untuk ditambahkan",
      }),
      { target: { value: "provinsi-aceh" } },
    );

    expect(screen.getByText("Data belum tersedia")).toBeTruthy();
    expect(screen.getAllByText("Aceh", { exact: true })).not.toHaveLength(0);
    for (const province of [
      "provinsi-sumatera-utara",
      "provinsi-sumatera-barat",
    ]) {
      fireEvent.click(screen.getByRole("button", { name: "Tambah daerah" }));
      fireEvent.change(
        screen.getByRole("combobox", {
          name: "Pilih provinsi untuk ditambahkan",
        }),
        { target: { value: province } },
      );
    }

    expect(
      screen.getByText("5 provinsi dipilih · maksimal 5 provinsi"),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Tambah daerah" })
        .hasAttribute("disabled"),
    ).toBe(true);
    expect(
      screen.getByRole("table", {
        name: /Perbandingan Tingkat kemiskinan Jawa Barat, Jawa Timur, Aceh/,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Hapus Aceh dari perbandingan",
      }),
    ).toBeTruthy();
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
