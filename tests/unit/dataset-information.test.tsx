// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { DatasetInformation } from "@/app/(public)/data-pemerintah/proyek/_components/dataset-information";

describe("DatasetInformation", () => {
  it("shows the dataset card, direct CSV download, and prominent disclaimer", () => {
    render(<DatasetInformation />);

    expect(
      screen.getByRole("heading", { name: "Progres proyek daerah" }),
    ).toBeTruthy();
    expect(
      screen.getByText("240 proyek · 27 kabupaten/kota · CSV/JSON"),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Sumber: simulasi pelaksanaan pembangunan - 30 Sep 2025",
      ),
    ).toBeTruthy();

    const csvLink = screen.getByRole("link", { name: "Unduh CSV" });
    expect(csvLink.getAttribute("href")).toBe("/api/projects?format=csv");
    expect(
      screen.getByRole("heading", {
        name: "Data terbuka, konteks tetap penting.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(/data ilustratif tanpa koneksi data langsung/i),
    ).toBeTruthy();
    expect(
      screen.getByText(
        /Target selesai adalah rencana, bukan tanggal penyelesaian aktual/,
      ),
    ).toBeTruthy();
  });

  it("opens metadata structure and provides metadata and JSON downloads", () => {
    render(<DatasetInformation />);

    fireEvent.click(screen.getByRole("button", { name: "Metadata" }));

    expect(
      screen.getByRole("dialog", {
        name: "Metadata — Progres proyek daerah",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("row", { name: /progres_fisik/ })).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Unduh metadata JSON" })
        .getAttribute("href"),
    ).toBe("/datasets/progres-proyek-metadata.json");
    expect(
      screen
        .getByRole("link", { name: "Unduh data JSON" })
        .getAttribute("href"),
    ).toBe("/api/projects?format=json&download=true");
  });

  it("links both methodology and data-reading guidance to their documentation sections", () => {
    render(<DatasetInformation />);

    expect(
      screen
        .getByRole("link", { name: "Definisi & metodologi →" })
        .getAttribute("href"),
    ).toBe("/data-pemerintah/proyek/metodologi#definisi");
    expect(
      screen
        .getByRole("link", { name: "Panduan membaca data →" })
        .getAttribute("href"),
    ).toBe("/data-pemerintah/proyek/metodologi#panduan");
  });
});
