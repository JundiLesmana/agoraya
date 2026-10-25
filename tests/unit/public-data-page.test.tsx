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

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Wilayah" }),
      "dki-jakarta",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tahun anggaran" }),
      "2024",
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Periode kumulatif" }),
      "q2",
    );
    await user.click(screen.getByRole("button", { name: "Terapkan filter" }));

    expect(new URLSearchParams(window.location.search).get("wilayah")).toBe(
      "dki-jakarta",
    );
    expect(new URLSearchParams(window.location.search).get("tahun")).toBe(
      "2024",
    );
    expect(new URLSearchParams(window.location.search).get("periode")).toBe(
      "q2",
    );
    expect(
      screen.getAllByText(/Provinsi DKI Jakarta · 2024 · s\.d\. Triwulan II/)
        .length,
    ).toBeGreaterThan(1);
  });

  it("restores filter values from URL query parameters", async () => {
    window.history.replaceState(
      {},
      "",
      "/data?wilayah=banten&tahun=2026&periode=q1",
    );
    render(<PublicDataPage />);

    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "Wilayah" })).toHaveProperty(
        "value",
        "banten",
      );
      expect(
        screen.getByRole("combobox", { name: "Tahun anggaran" }),
      ).toHaveProperty("value", "2026");
      expect(
        screen.getByRole("combobox", { name: "Periode kumulatif" }),
      ).toHaveProperty("value", "q1");
    });
  });

  it("opens the mobile filter drawer and applies its selections", async () => {
    const user = userEvent.setup();
    render(<PublicDataPage />);

    await user.click(screen.getByRole("button", { name: /atur filter/i }));
    const drawer = screen.getByRole("dialog", {
      name: "Filter data pemerintah",
    });
    await user.selectOptions(
      within(drawer).getByRole("combobox", { name: "Wilayah" }),
      "jawa-timur",
    );
    await user.click(
      within(drawer).getByRole("button", { name: "Terapkan filter" }),
    );

    expect(new URLSearchParams(window.location.search).get("wilayah")).toBe(
      "jawa-timur",
    );
    expect(
      screen.getAllByText(/Provinsi Jawa Timur · 2025 · s\.d\. Triwulan III/)
        .length,
    ).toBeGreaterThan(1);
    expect(screen.queryByRole("dialog")).toBeNull();
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
