/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { RecentReportsSection } from "@/app/(public)/_components/recent-reports-section";
import {
  formatRecentReportDate,
  getPublicReportStatusPresentation,
  getRecentReportPattern,
  PUBLIC_REPORT_EXAMPLES,
} from "@/modules/reporting/public-reports";

describe("recent report helpers", () => {
  it("formats dates in Indonesian", () => {
    expect(formatRecentReportDate("2026-10-12T00:00:00.000Z")).toBe(
      "12 Okt 2026",
    );
  });

  it.each([
    ["submitted", "Diterima", "bg-yellow-50"],
    ["verified", "Terverifikasi", "bg-blue-50"],
    ["in_progress", "Dalam tindak lanjut", "bg-orange-50"],
    ["resolved", "Selesai", "bg-emerald-50"],
    ["closed", "Selesai", "bg-emerald-50"],
  ] as const)("maps %s to the expected badge", (status, label, color) => {
    const presentation = getPublicReportStatusPresentation(status);
    expect(presentation.label).toBe(label);
    expect(presentation.className).toContain(color);
  });

  it("summarizes repeated category and city combinations", () => {
    expect(getRecentReportPattern(PUBLIC_REPORT_EXAMPLES.slice(0, 5))).toBe(
      "3 laporan Infrastruktur di Kota Bandung pada daftar ini.",
    );
  });
});

describe("RecentReportsSection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the latest five reports, statuses, dates, and detail links", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          reports: PUBLIC_REPORT_EXAMPLES.slice(0, 5),
          total: 6,
          limit: 5,
          offset: 0,
          hasMore: true,
        }),
      ),
    );

    render(<RecentReportsSection />);

    expect(
      await screen.findByRole("heading", {
        name: "Kenali laporan dan progresnya",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Jalan berlubang di Jl. Melati")).toBeTruthy();
    expect(screen.getByText("#LP-2026-007064-01")).toBeTruthy();
    expect(screen.getByText("Dalam tindak lanjut")).toBeTruthy();
    expect(screen.getByText("12 Okt 2026")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Lihat Jalan berlubang di Jl. Melati" })
        .getAttribute("href"),
    ).toBe("/reports/LP-2026-007064-01");
    expect(
      screen.getByText(/3 laporan Infrastruktur di Kota Bandung/),
    ).toBeTruthy();
    expect(screen.queryByText(/Pelapor:/i)).toBeNull();
    expect(screen.getAllByText("Contoh")).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "Lihat semua laporan" }),
    ).toBeTruthy();
  });

  it("renders the empty state and the request error state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        Response.json({
          reports: [],
          total: 0,
          limit: 5,
          offset: 0,
          hasMore: false,
        }),
      ),
    );

    const { unmount } = render(<RecentReportsSection />);
    expect(
      await screen.findByText("Belum ada laporan yang dikirim"),
    ).toBeTruthy();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    unmount();
    render(<RecentReportsSection />);
    expect(await screen.findByRole("alert")).toBeTruthy();
  });

  it("loads the next page without showing more than five initially", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          reports: PUBLIC_REPORT_EXAMPLES.slice(0, 5),
          total: 6,
          limit: 5,
          offset: 0,
          hasMore: true,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          reports: PUBLIC_REPORT_EXAMPLES.slice(5),
          total: 6,
          limit: 5,
          offset: 5,
          hasMore: false,
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<RecentReportsSection />);
    const button = await screen.findByRole("button", {
      name: "Lihat semua laporan",
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(5);

    fireEvent.click(button);
    expect(await screen.findByText("Saluran air tersumbat")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/reports/recent?limit=5&offset=5",
      { signal: undefined },
    );
  });
});
