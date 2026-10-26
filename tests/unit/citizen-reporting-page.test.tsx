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
        "Laporkan masalah infrastruktur, dugaan korupsi, atau layanan publik. Setiap laporan akan melalui verifikasi dan tindak lanjut yang dapat Anda pantau.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Buat laporan" }).getAttribute("href"),
    ).toBe("/citizen/reporting");
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
});
