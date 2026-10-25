// @vitest-environment jsdom
import type { ReactNode } from "react";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

import { ProjectRegionalStats } from "@/app/(public)/data/_components/project-regional-stats";

describe("ProjectRegionalStats", () => {
  it("shows the project status counts, calculated percentages, and delay note", () => {
    render(<ProjectRegionalStats />);

    const breakdown = screen.getByRole("table", {
      name: "Rincian status dari 240 proyek",
    });
    expect(within(breakdown).getByText("156")).toBeTruthy();
    expect(within(breakdown).getByText("65%")).toBeTruthy();
    expect(within(breakdown).getByText("72")).toBeTruthy();
    expect(within(breakdown).getByText("30%")).toBeTruthy();
    expect(within(breakdown).getByText("12")).toBeTruthy();
    expect(within(breakdown).getByText("5%")).toBeTruthy();
    expect(
      screen.getByTestId("project-status-donut").querySelectorAll("circle"),
    ).toHaveLength(3);
    expect(
      screen.getByText(
        "12 proyek tertunda memerlukan progres fisik dan data proyek.",
      ),
    ).toBeTruthy();
  });

  it("links the project CTA to the visible status table", () => {
    render(<ProjectRegionalStats />);

    const link = screen.getByRole("link", { name: "Jelajahi proyek" });
    expect(link.getAttribute("href")).toBe("#project-status-breakdown");
    expect(document.getElementById("project-status-breakdown")).toBeTruthy();
  });

  it("shows four simulated indicators with explicit 2024 and 2025 comparisons", () => {
    render(<ProjectRegionalStats />);

    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByText("+0,6 juta dari 2024")).toBeTruthy();
    expect(screen.getByText("+0,6 poin dari 2024")).toBeTruthy();
    expect(screen.getByText("+0,3 poin dari 2024")).toBeTruthy();
    expect(screen.getByText("+0,4 poin dari 2024")).toBeTruthy();
    expect(screen.getByText("2024: 74,6 · Skala 0–100")).toBeTruthy();
    expect(
      screen.getByRole("article", {
        name: "Pengangguran terbuka: 6,8% pada 2025, 6,4% pada 2024",
      }).textContent,
    ).toContain("10,7 juta orang");
    expect(screen.getAllByText("Simulasi").length).toBeGreaterThan(0);
  });

  it("stacks on small screens and uses two columns on desktop", () => {
    render(<ProjectRegionalStats />);

    const layout = screen.getByRole("heading", {
      name: "Progres proyek & Statistik daerah",
    }).parentElement?.nextElementSibling;
    expect(layout?.className).toContain("lg:grid-cols-");

    const indicators = screen.getByRole("article", {
      name: "Jumlah penduduk: 50,4 juta pada 2025, 49,8 juta pada 2024",
    }).parentElement;
    expect(indicators?.className).toContain("sm:grid-cols-2");
  });
});
