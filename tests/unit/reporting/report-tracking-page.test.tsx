/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ReportTrackingPage } from "@/app/(public)/report/tracking/report-tracking-page";

describe("ReportTrackingPage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads the submitted report details using the public report number", async () => {
    const reportNumber = "LP-20261105-BC7AEEF0-E1C";
    const report = {
      reportNumber,
      title: "Laporan uji publik",
      description: "Deskripsi laporan dari formulir warga.",
      category: "Infrastruktur",
      status: "submitted",
      submittedAt: "2026-11-05T18:31:49.823Z",
      responseDueAt: "2026-11-08T18:31:49.823Z",
      firstRespondedAt: null,
      resolvedAt: null,
      closedAt: null,
      subcategory: "Jalan rusak",
      province: "Jawa Barat",
      city: "Cianjur",
      address: "Jl. Cianjur 10",
      reporterName: null,
      identityVisible: false,
      attachmentNames: ["bukti.jpg"],
    } as const;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          report,
        }),
      )
      .mockResolvedValueOnce(
        Response.json({ reports: [report], hasMore: false }),
      );
    vi.stubGlobal("fetch", fetchMock);

    render(<ReportTrackingPage initialReportNumber={reportNumber} />);

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Laporan uji publik");
    expect(dialog.textContent).toContain(
      "Deskripsi laporan dari formulir warga.",
    );
    expect(dialog.textContent).toContain("Jalan rusak");
    expect(dialog.textContent).toContain("Jawa Barat");
    expect(dialog.textContent).toContain("Cianjur");
    expect(dialog.textContent).toContain("Jl. Cianjur 10");
    expect(dialog.textContent).toContain("bukti.jpg");
    expect(
      screen.getByRole("heading", { name: "Semua laporan publik" }),
    ).toBeTruthy();
    expect(dialog.textContent).not.toContain("Pelapor Rahasia");
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/reports/track?reportNumber=${encodeURIComponent(reportNumber)}`,
      { cache: "no-store" },
    );
    expect(
      screen.getByRole("button", { name: /Laporan uji publik/ }),
    ).toBeTruthy();
  });

  it("opens report details only after the user selects a public report card", async () => {
    const report = {
      reportNumber: "LP-20261105-BC7AEEF0-E1C",
      title: "Laporan kartu",
      description: "Deskripsi detail laporan.",
      category: "Lingkungan",
      status: "verified",
      submittedAt: "2026-11-05T18:31:49.823Z",
      responseDueAt: null,
      firstRespondedAt: null,
      resolvedAt: null,
      closedAt: null,
      subcategory: "Sampah menumpuk",
      province: "Jawa Barat",
      city: "Cianjur",
      address: "Lokasi laporan",
      reporterName: null,
      identityVisible: false,
      attachmentNames: [],
    };
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ reports: [report], hasMore: false }),
        ),
    );

    render(<ReportTrackingPage initialReportNumber="" />);

    const card = await screen.findByRole("button", {
      name: /Laporan kartu/,
    });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(card.textContent).toContain("Lingkungan");
    expect(card.textContent).toContain("Terverifikasi");
    expect(card.textContent).toContain("Detail");

    fireEvent.click(card);

    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Deskripsi detail laporan.");
    expect(dialog.textContent).toContain("Sampah menumpuk");
  });
});
