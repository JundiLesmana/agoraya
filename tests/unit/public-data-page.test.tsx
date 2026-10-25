// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import PublicDataPage from "@/app/(public)/data/page";
import PublicBudgetPage from "@/app/(public)/data/anggaran/page";
import PublicProjectsPage from "@/app/(public)/data/project/page";

describe("PublicDataPage", () => {
  it("renders the public dashboard, charts, catalog, and disclaimer", () => {
    render(<PublicDataPage />);

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Ringkasan" })
        .getAttribute("href"),
    ).toBe("/data");
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Anggaran" })
        .getAttribute("href"),
    ).toBe("/data/anggaran");
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Proyek" })
        .getAttribute("href"),
    ).toBe("/data/project");
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Statistik daerah" })
        .getAttribute("href"),
    ).toBe("/data/statistik");
    expect(
      screen.getByRole("heading", { name: "Data Pemerintah" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Ringkasan Anggaran dan Pembangunan",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Rp80T")).toBeTruthy();
    expect(screen.getByText("Rp60T")).toBeTruthy();
    expect(screen.getByText("156 / 240")).toBeTruthy();
    expect(screen.getByText("27 daerah")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Tren realisasi anggaran" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Anggaran per sektor" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Statistik daerah" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Pantau proyek, lihat dampaknya" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Eksplorasi lebih lanjut dengan dataset",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("Data terbuka, konteks tetap penting."),
    ).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: /Definisi & metodologi/ })
        .getAttribute("href"),
    ).toBe("#metodologi");
  });

  it("renders the dedicated budget page with searchable sector details", () => {
    render(<PublicBudgetPage />);

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Anggaran" })
        .getAttribute("aria-current"),
    ).toBe("location");
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Anggaran & realisasi APBD",
      }),
    ).toBeTruthy();
    expect(screen.getAllByText("Sisa anggaran").length).toBeGreaterThan(1);
    expect(screen.getAllByText("Tingkat realisasi").length).toBeGreaterThan(1);
    expect(
      screen.getByRole("heading", { name: "Rincian anggaran per sektor" }),
    ).toBeTruthy();

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari sektor atau urusan" }),
      { target: { value: "Pendidikan" } },
    );
    const table = screen.getByRole("table", {
      name: /Rincian alokasi anggaran/,
    });
    expect(within(table).getByText("Pendidikan")).toBeTruthy();
    expect(within(table).queryByText("Kesehatan")).toBeNull();
  });

  it("opens the project subpage with project-specific tabs and filters", () => {
    render(<PublicProjectsPage />);

    const categoryNavigation = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    expect(
      within(categoryNavigation)
        .getByRole("link", { name: "Proyek" })
        .getAttribute("aria-current"),
    ).toBe("location");
    expect(
      screen.getByRole("heading", { name: "Pantau proyek daerah" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Sektor proyek" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Status proyek" }),
    ).toBeTruthy();
    expect(screen.getByText("Progres penyelesaian")).toBeTruthy();
    expect(screen.getByText("Penyelesaian per sektor")).toBeTruthy();

    const projectTable = screen.getByRole("table", { name: /Daftar proyek/ });
    fireEvent.change(screen.getByRole("combobox", { name: "Status proyek" }), {
      target: { value: "Tertunda" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));
    expect(within(projectTable).getByText("Sistem air bersih")).toBeTruthy();
    expect(
      within(projectTable).queryByText("Pembangunan Puskesmas"),
    ).toBeNull();
  });

  it("updates summary and chart data when region, year, and period filters change", () => {
    render(<PublicDataPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Wilayah" }), {
      target: { value: "bogor" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Tahun anggaran" }), {
      target: { value: "2024" },
    });
    fireEvent.change(
      screen.getByRole("combobox", { name: "Periode kumulatif" }),
      {
        target: { value: "q2" },
      },
    );

    expect(screen.getByText("Rp16,9T")).toBeTruthy();
    expect(screen.getByText("Rp8,5T")).toBeTruthy();
    expect(screen.getByText("1 daerah")).toBeTruthy();
    expect(
      screen.getAllByText(/Kabupaten Bogor · 2024 · s\.d\. Triwulan II/),
    ).toHaveLength(2);
    expect(screen.getByText(/Januari – Jun 2024/)).toBeTruthy();
  });

  it("filters and sorts project rows and opens project details", () => {
    render(<PublicDataPage />);

    fireEvent.change(
      screen.getByRole("textbox", { name: "Cari nama proyek atau instansi" }),
      {
        target: { value: "Rehabilitasi" },
      },
    );
    const table = screen.getByRole("table", { name: /Daftar proyek/ });
    expect(within(table).getByText("Rehabilitasi 12 sekolah")).toBeTruthy();
    expect(within(table).queryByText("Pembangunan Puskesmas")).toBeNull();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Periode kumulatif" }),
      {
        target: { value: "q1" },
      },
    );
    expect(within(table).getByText("Rp20M")).toBeTruthy();

    fireEvent.click(within(table).getByRole("button", { name: "Detail" }));
    const dialog = screen.getByRole("dialog", {
      name: "Rehabilitasi 12 sekolah",
    });
    expect(within(dialog).getByText("75% · Berjalan")).toBeTruthy();
    expect(within(dialog).getByText("3.600 orang")).toBeTruthy();
    expect(
      within(dialog).getByRole("heading", { name: "Timeline proyek" }),
    ).toBeTruthy();
  });

  it("downloads filtered summary, project CSV, catalog CSV, and metadata", () => {
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<PublicDataPage />);

    fireEvent.click(screen.getByRole("button", { name: "Unduh ringkasan" }));
    fireEvent.click(screen.getByRole("button", { name: "Unduh daftar" }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Unduh CSV Anggaran & realisasi APBD",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Unduh metadata Anggaran & realisasi APBD",
      }),
    );

    expect(createObjectURL).toHaveBeenCalledTimes(4);
    expect(revokeObjectURL).toHaveBeenCalledTimes(4);
    expect(anchorClick).toHaveBeenCalledTimes(4);
    anchorClick.mockRestore();
    vi.unstubAllGlobals();
  });
});
