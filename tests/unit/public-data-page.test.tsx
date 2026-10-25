// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/image", () => ({
  default: (props: { alt: string; src: string }) => (
    <img alt={props.alt} src={props.src} />
  ),
}));

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

import PublicDataPage from "@/app/(public)/data/page";

describe("PublicDataPage", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/data");
  });

  it("renders the requested page header, summary CTA, and key statistics", () => {
    render(<PublicDataPage />);

    expect(
      screen.getByRole("heading", { name: "Data Pemerintah" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Pantau anggaran, proyek, dan jelajahi statistik daerah dalam satu dashboard terbuka",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /jelajahi data/i }).getAttribute("href"),
    ).toBe("#data-visualizations");
    expect(
      screen.getByRole("button", { name: /unduh ringkasan/i }),
    ).toBeTruthy();
    expect(screen.getByText("+10.000")).toBeTruthy();
    expect(screen.getByText("34")).toBeTruthy();
    expect(screen.getByText("514")).toBeTruthy();
    expect(screen.getAllByText("100%").length).toBeGreaterThan(0);
  });

  it("starts with the requested default filter values", async () => {
    render(<PublicDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Wilayah" })).toHaveProperty(
        "value",
        "jawa-barat",
      );
      expect(
        screen.getByRole("combobox", { name: "Tahun anggaran" }),
      ).toHaveProperty("value", "2025");
      expect(
        screen.getByRole("combobox", { name: "Periode kumulatif" }),
      ).toHaveProperty("value", "q3");
    });
    expect(
      screen.getAllByText(/Provinsi Jawa Barat · 2025 · s\.d\. Triwulan III/)
        .length,
    ).toBeGreaterThan(1);
  });

  it("applies all selected filters and synchronizes them with shareable URL parameters", async () => {
    const user = userEvent.setup();
    render(<PublicDataPage />);

    expect(screen.getByRole('heading', { name: 'Ringkasan Anggaran dan Pembangunan' })).toBeTruthy();
    expect(screen.getByText('Rp80T')).toBeTruthy();
    expect(screen.getByText('Rp60T')).toBeTruthy();
    expect(screen.getByText('75% dari total anggaran')).toBeTruthy();
    expect(screen.getByText('156 / 240')).toBeTruthy();
    expect(screen.getByText('65% dari seluruh proyek')).toBeTruthy();
    expect(screen.getByText('27 daerah')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Progres proyek & Statistik daerah' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Jelajahi proyek' }).getAttribute('href')).toBe('#project-status-breakdown');
    expect(screen.getByRole('heading', { name: /akses data, pahami kondisi, lihat bukti nyata/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /jelajahi semua data/i }).getAttribute('href')).toBe('#katalog-data');
    expect(screen.getByText('+10.000')).toBeTruthy();
    expect(screen.getByText('34')).toBeTruthy();
    expect(screen.getByText('514')).toBeTruthy();
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
  });

  it("renders the dashboard mockup preview without relying on a missing image asset", () => {
    render(<PublicDataPage />);

    expect(
      screen.getByRole("img", {
        name: /pratinjau dashboard publik menampilkan total anggaran dan realisasi/i,
      }),
    ).toBeTruthy();
    expect(
      document.querySelector('img[src="/dashboard-public-preview.png"]'),
    ).toBeNull();
  });

  it("keeps the image layout responsive and legible on mobile", () => {
    render(<PublicDataPage />);

    const section = screen
      .getByRole("heading", { name: "Data Pemerintah" })
      .closest("section");
    expect(section?.querySelector(".flex")?.className).toContain("md:flex-row");
    expect(
      screen
        .getByRole("button", { name: /atur filter/i })
        .getAttribute("aria-haspopup"),
    ).toBe("dialog");
    expect(
      screen.getByRole("img", {
        name: /pratinjau dashboard publik menampilkan total anggaran dan realisasi/i,
      }),
    ).toBeTruthy();
  });

  it("uses compact source badges on small screens and restores readable sizing at larger breakpoints", () => {
    render(<PublicDataPage />);

    const statBadge = document.querySelector(
      '[data-source="SIMULATED"].shrink-0',
    );
    expect(statBadge?.className).toContain("text-[10px]");
    expect(statBadge?.className).toContain("sm:text-xs");
  });
});
