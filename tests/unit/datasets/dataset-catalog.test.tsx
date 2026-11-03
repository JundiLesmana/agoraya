// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DatasetCatalog } from "@/app/(public)/data/_components/dataset-catalog";

describe("DatasetCatalog", () => {
  it("lists the three downloadable datasets and required scope details", () => {
    render(<DatasetCatalog />);

    expect(
      screen.getByRole("heading", {
        name: "Eksplorasi lebih lanjut dengan dataset",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Anggaran & realisasi APBD" }),
    ).toBeTruthy();
    expect(screen.getByText("9 periode bulanan · 4 sektor")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Progres proyek daerah" }),
    ).toBeTruthy();
    expect(screen.getByText("240 proyek · 27 kabupaten/kota")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Indikator statistik daerah" }),
    ).toBeTruthy();
    expect(
      screen.getByText("4 indikator · perbandingan 2024–2025"),
    ).toBeTruthy();

    const downloads = screen.getAllByRole("link", { name: "CSV" });
    expect(downloads).toHaveLength(3);
    expect(downloads.map((link) => link.getAttribute("href"))).toEqual([
      "/data/anggaran-realisasi-apbd.csv",
      "/data/progres-proyek-daerah.csv",
      "/data/indikator-statistik-daerah.csv",
    ]);
    downloads.forEach((link) =>
      expect(link.hasAttribute("download")).toBe(true),
    );
  });

  it("opens metadata with the selected dataset column names and types", () => {
    render(<DatasetCatalog />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Lihat metadata Anggaran & realisasi APBD",
      }),
    );

    const dialog = screen.getByRole("dialog", {
      name: "Metadata: Anggaran & realisasi APBD",
    });
    expect(
      within(dialog).getByRole("columnheader", { name: "Kolom" }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("rowheader", { name: "periode" }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("cell", { name: "tanggal (YYYY-MM)" }),
    ).toBeTruthy();
    expect(
      within(dialog).getByRole("rowheader", { name: "anggaran_rupiah" }),
    ).toBeTruthy();
  });

  it("presents the illustrative-data disclaimer and working documentation anchors accessibly", () => {
    render(<DatasetCatalog />);

    const disclaimer = screen.getByRole("note", {
      name: "Data terbuka, konteks tetap penting.",
    });
    expect(disclaimer.textContent).toContain(
      "Dashboard ini adalah rancangan dengan data ilustratif, tanpa koneksi data langsung.",
    );
    expect(
      within(disclaimer).getByRole("img", {
        name: "Informasi penting tentang data",
      }),
    ).toBeTruthy();
    expect(
      within(disclaimer)
        .getByRole("link", { name: "Definisi & metodologi →" })
        .getAttribute("href"),
    ).toBe("#definisi-metodologi");
    expect(
      within(disclaimer)
        .getByRole("link", { name: "Panduan data →" })
        .getAttribute("href"),
    ).toBe("#panduan-data");
    expect(document.getElementById("definisi-metodologi")).toBeTruthy();
    expect(document.getElementById("panduan-data")).toBeTruthy();
  });
});
