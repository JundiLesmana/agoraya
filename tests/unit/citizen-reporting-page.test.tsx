/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import CitizenDashboardPage from "@/app/(citizen)/citizen/dashboard/page";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => createElement("img", props),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => createElement("a", { href, ...props }, children),
}));

describe("CitizenDashboardPage", () => {
  it("renders the reporting hero and links to the report form", () => {
    render(<CitizenDashboardPage />);

    expect(
      screen.getByRole("heading", {
        name: "Suara Anda, langkah awal perubahan.",
        level: 1,
      }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Laporkan masalah di sekitar Anda. Dari infrastruktur rusak hingga dugaan penyimpangan, setiap laporan melalui verifikasi dan dapat dipantau tindak lanjutnya.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("link", { name: "Buat laporan" })
        .some((link) => link.getAttribute("href") === "#report-form"),
    ).toBe(true);
  });

  it("renders the four accessible category links with an icon and description", () => {
    const { container } = render(<CitizenDashboardPage />);
    const categories = [
      "Infrastruktur",
      "Dugaan korupsi",
      "Lingkungan",
      "Layanan lainnya",
    ];

    for (const category of categories) {
      const action = screen.getByRole("link", {
        name: `Buat laporan kategori ${category}`,
      });
      expect(action.querySelector("svg")).toBeTruthy();
      expect(action.textContent).toMatch(/\S+\./);
      expect(action.getAttribute("href")).toBe(
        `/citizen/reporting?category=${encodeURIComponent(category)}`,
      );
    }

    expect(
      container.querySelector(".grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4"),
    ).toBeTruthy();
  });

  it("explains the reporting flow and links to examples and recent reports", () => {
    render(<CitizenDashboardPage />);

    expect(
      screen.getByRole("heading", {
        name: "Dari laporan hingga penyelesaian",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Kirim laporan")).toBeTruthy();
    expect(screen.getByText("Verifikasi")).toBeTruthy();
    expect(screen.getByText("Tindak lanjut")).toBeTruthy();
    expect(screen.getByText("Konfirmasi hasil")).toBeTruthy();
    const trackingLink = screen.getByRole("link", {
      name: "Lihat contoh pelacakan",
    });
    const recentReportsLink = screen.getByRole("link", {
      name: "Lihat laporan terbaru",
    });
    expect(trackingLink.getAttribute("href")).toBe("/tracking");
    expect(recentReportsLink.getAttribute("href")).toBe("/#recent-reports");
    expect(recentReportsLink.className).toBe(trackingLink.className);
  });

  it("renders the report form, tracking example, sample reports, and help section", () => {
    const { container } = render(<CitizenDashboardPage />);

    expect(
      screen.getByRole("heading", { name: "Bantu kami memahami masalahnya" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", {
        name: "Laporan terkirim, tindak lanjut terlihat",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Kenali laporan dan progresnya" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Melapor dengan lebih tenang" }),
    ).toBeTruthy();
    expect(
      container.querySelector(
        'img[src="/lapor-warga/jalan-rusak.png"][alt="Jalan berlubang di Jl. Melati"]',
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        'img[src="/lapor-warga/sampah-serakan.png"][alt="Sampah menumpuk di tepi saluran"]',
      ),
    ).toBeTruthy();
    expect(
      container.querySelector(
        'img[src="/lapor-warga/lampu-jalan.png"][alt="Lampu jalan kembali menyala"]',
      ),
    ).toBeTruthy();
  });
});
