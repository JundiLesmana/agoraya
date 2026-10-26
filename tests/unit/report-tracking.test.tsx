/** @vitest-environment jsdom */

import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ReportTrackingSection } from "@/app/(public)/_components/report-tracking-section";
import {
  determineActiveTrackingNode,
  formatTrackingDate,
  getTrackingNodeState,
} from "@/app/(public)/_components/report-tracking";

describe("report tracking helpers", () => {
  it("formats report dates using Indonesian abbreviated months", () => {
    expect(formatTrackingDate(new Date("2026-10-12T00:00:00.000Z"))).toBe(
      "12 Okt 2026",
    );
  });

  it.each([
    ["submitted", 0],
    ["verified", 1],
    ["in_progress", 2],
    ["resolved", 3],
    ["closed", 3],
  ] as const)("maps %s to tracking node %i", (status, expectedIndex) => {
    expect(determineActiveTrackingNode(status)).toBe(expectedIndex);
  });

  it("marks nodes before, at, and after the active node correctly", () => {
    expect(getTrackingNodeState(0, 2)).toBe("completed");
    expect(getTrackingNodeState(2, 2)).toBe("active");
    expect(getTrackingNodeState(3, 2)).toBe("upcoming");
  });
});

describe("ReportTrackingSection", () => {
  it("renders the illustrative report and accessible four-step timeline", () => {
    const { container } = render(<ReportTrackingSection />);

    expect(
      screen.getByRole("heading", {
        name: "Laporan terkirim, tindak lanjut terlihat",
      }),
    ).toBeTruthy();
    expect(
      screen.getByText("Pantau progres laporan Anda dari awal hingga penyelesaian"),
    ).toBeTruthy();
    expect(screen.getByText("Jalan berlubang di Jl. Melati")).toBeTruthy();
    expect(screen.getByText("#LP-2026-007064-01")).toBeTruthy();
    expect(screen.getAllByText("12 Okt 2026")).toHaveLength(2);
    expect(screen.getByText("Dinas Bina Marga")).toBeTruthy();
    expect(
      screen.getByText(/ilustrasi, bukan data aktual/i),
    ).toBeTruthy();

    const timeline = screen.getByRole("list", {
      name: "Progres laporan dari diterima hingga penyelesaian",
    });
    const steps = within(timeline).getAllByRole("listitem");
    expect(steps).toHaveLength(4);
    expect(within(timeline).getByText("Diterima")).toBeTruthy();
    expect(within(timeline).getByText("Terverifikasi")).toBeTruthy();
    expect(within(timeline).getByText("Dalam tindak lanjut")).toBeTruthy();
    expect(within(timeline).getByText("Penyelesaian")).toBeTruthy();
    expect(container.querySelector('[aria-current="step"]')).toBe(steps[2]);

    const nodeClasses = steps.map(
      (step) => step.querySelector("[data-state]")?.className,
    );
    expect(nodeClasses[0]).toContain("bg-emerald-50");
    expect(nodeClasses[2]).toContain("bg-primary");
    expect(nodeClasses[3]).toContain("border-border");

    expect(
      screen.getByRole("link", { name: "Lihat contoh laporan" }).getAttribute("href"),
    ).toBe("/reports/LP-2026-007064-01");
    expect(
      screen.getByRole("link", { name: "Buat laporan baru" }).getAttribute("href"),
    ).toBe("/citizen/reporting");
  });
});
