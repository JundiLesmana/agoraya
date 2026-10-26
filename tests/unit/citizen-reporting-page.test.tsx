/** @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import CitizenDashboardPage from "@/app/(citizen)/citizen/dashboard/page";

describe("CitizenDashboardPage", () => {
  it("renders the reporting hero and its report entry button", () => {
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
    expect(screen.getByRole("button", { name: "Buat laporan" })).toBeTruthy();
  });

  it("renders the four accessible quick actions with an icon and description", () => {
    const { container } = render(<CitizenDashboardPage />);
    const categories = [
      "Infrastruktur",
      "Dugaan korupsi",
      "Lingkungan",
      "Layanan lainnya",
    ];

    for (const category of categories) {
      const action = screen.getByRole("button", {
        name: `Buat laporan kategori ${category}`,
      });
      expect(action.querySelector("svg")).toBeTruthy();
      expect(action.textContent).toMatch(/\S+\./);
    }

    expect(
      container.querySelector(".grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-4"),
    ).toBeTruthy();
  });

  it("opens the form with the selected quick-action category", () => {
    render(<CitizenDashboardPage />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Buat laporan kategori Infrastruktur",
      }),
    );

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Kategori laporan" }),
    ).toHaveProperty("value", "Infrastruktur");
  });

  it("opens the form without a category when the hero CTA is clicked", () => {
    render(<CitizenDashboardPage />);

    fireEvent.click(screen.getByRole("button", { name: "Buat laporan" }));

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Kategori laporan" }),
    ).toHaveProperty("value", "");
  });

  it("opens the form with Lingkungan selected from its quick action", () => {
    render(<CitizenDashboardPage />);

    fireEvent.click(
      screen.getByRole("button", { name: "Buat laporan kategori Lingkungan" }),
    );

    expect(
      screen.getByRole("combobox", { name: "Kategori laporan" }),
    ).toHaveProperty("value", "Lingkungan");
  });
});
