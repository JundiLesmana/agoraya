/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { PublicReportMap } from "@/app/(public)/map/_components/public-report-map";

const publicReport = {
  reportNumber: "LP-20261111-ABCDEF012345",
  title: "Jalan berlubang di Jalan Melati",
  category: "Infrastruktur",
  status: "verified" as const,
  submittedAt: "2026-11-10T09:00:00.000Z",
  city: "Kota Bandung",
  province: "Jawa Barat",
  source: "ACTUAL" as const,
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PublicReportMap", () => {
  it("shows grouped public reports and privacy-safe provenance timeline", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("/provenance")) {
          return Promise.resolve(
            Response.json({
              source: "ACTUAL",
              validationTimeline: [
                {
                  stage: "Dikirim",
                  role: "WARGA",
                  status: "submitted",
                  timestamp: publicReport.submittedAt,
                },
                {
                  stage: "Diverifikasi",
                  role: "CHECKER",
                  status: "verified",
                  timestamp: "2026-11-10T10:00:00.000Z",
                },
              ],
              aiConfidence: null,
              aiConfidenceNote: "Tidak ada confidence klasifikasi AI.",
            }),
          );
        }
        return Promise.resolve(
          Response.json({
            reports: [publicReport],
            total: 1,
            limit: 100,
            offset: 0,
            hasMore: false,
          }),
        );
      }),
    );

    render(<PublicReportMap />);
    expect(await screen.findAllByText("Kota Bandung, Jawa Barat")).toHaveLength(
      2,
    );
    expect(
      screen.getByText("Kelompok ini menunjukkan jumlah laporan per wilayah, bukan koordinat atau batas geografis."),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: /LP-20261111-ABCDEF012345/,
      }),
    );
    expect(await screen.findByTestId("provenance-section")).toBeTruthy();
    expect(screen.getByText("AKTUAL")).toBeTruthy();
    expect(screen.getByText("CHECKER")).toBeTruthy();
    expect(screen.getByText("Tidak ada confidence klasifikasi AI.")).toBeTruthy();
    expect(screen.queryByText("Budi")).toBeNull();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("provenance-section")).toBeNull();
  });

  it.each([
    ["SIMULATED", "SIMULASI", "border-amber-200"],
    ["BPS_API", "BPS_API", "border-blue-200"],
    ["AGGREGATE", "AGREGAT", "border-border"],
  ] as const)("uses the expected provenance style for %s", async (source, label, style) => {
    vi.stubGlobal(
      "fetch",
      vi.fn((input: RequestInfo | URL) => {
        if (String(input).includes("/provenance")) {
          return Promise.resolve(
            Response.json({
              source,
              validationTimeline: [],
              aiConfidence: null,
              aiConfidenceNote: "Tidak ada confidence klasifikasi AI.",
            }),
          );
        }
        return Promise.resolve(
          Response.json({
            reports: [{ ...publicReport, source }],
            total: 1,
            limit: 100,
            offset: 0,
            hasMore: false,
          }),
        );
      }),
    );

    render(<PublicReportMap />);
    fireEvent.click(
      await screen.findByRole("button", {
        name: /LP-20261111-ABCDEF012345/,
      }),
    );
    const badge = await screen.findByTestId("provenance-badge");
    expect(badge.textContent).toBe(label);
    expect(badge.className).toContain(style);
  });
});