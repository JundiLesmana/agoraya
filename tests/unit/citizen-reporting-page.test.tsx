/** @vitest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createElement, type ReactNode } from "react";
import CitizenDashboardPage from "@/app/(citizen)/citizen/dashboard/page";

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
      screen.getByRole("heading", { name: "LAPOR WARGA", level: 1 }),
    ).toBeTruthy();
    expect(screen.getByText("Suara Anda, langkah awal perubahan")).toBeTruthy();
    expect(
      screen.getByText(
        "Laporkan masalah infrastruktur, dugaan korupsi, atau layanan publik. Setiap laporan akan melalui verifikasi dan tindak lanjut yang dapat Anda pantau. Saat ini halaman ini masih berupa pratinjau dan pengiriman laporan belum aktif.",
      ),
    ).toBeTruthy();
    expect(
      screen
        .getAllByRole("link", { name: "Buat laporan" })
        .every((link) => link.getAttribute("href") === "/citizen/reporting"),
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
    expect(
      screen
        .getByRole("link", { name: "Lihat contoh pelacakan" })
        .getAttribute("href"),
    ).toBe("/tracking");
    expect(
      screen
        .getByRole("link", { name: "Lihat laporan terbaru" })
        .getAttribute("href"),
    ).toBe("/#recent-reports");
  });
});
