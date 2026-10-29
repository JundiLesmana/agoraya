/** @vitest-environment jsdom */

import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/v1/stats/tracking-summary/route";
import TrackingStatisticsPage from "@/app/(public)/tracking/stat/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockStatisticsFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) =>
    GET(new Request(new URL(String(input), "http://localhost"))),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("TrackingStatisticsPage", () => {
  it("renders public aggregate analytics with linked breadcrumb and exactly four trend KPIs", async () => {
    mockStatisticsFetch();
    render(<TrackingStatisticsPage />);

    expect(
      await screen.findByRole("heading", { name: "Analitik laporan" }),
    ).toBeTruthy();
    const breadcrumb = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(breadcrumb.textContent).toContain(
      "Beranda > Layanan Publik > Pelacakan > Statistik",
    );
    expect(
      within(breadcrumb)
        .getByRole("link", { name: "Beranda" })
        .getAttribute("href"),
    ).toBe("/");
    expect(
      within(breadcrumb)
        .getByRole("link", { name: "Pelacakan" })
        .getAttribute("href"),
    ).toBe("/tracking");
    expect(
      screen.getAllByLabelText(/dibanding periode sebelumnya/),
    ).toHaveLength(4);
    expect(screen.getByText("Total pengaduan")).toBeTruthy();
    expect(screen.getByText("Tingkat kepuasan")).toBeTruthy();
    expect(screen.getByText("Distribusi layanan")).toBeTruthy();
    expect(screen.getByText("5 wilayah teratas")).toBeTruthy();
    expect(screen.getByText("Kinerja penyelesaian")).toBeTruthy();
    expect(screen.getByText("Sentimen warga")).toBeTruthy();
    expect(
      screen.getByRole("table", {
        name: "Layanan yang paling lama diselesaikan, terurut menurun",
      }),
    ).toBeTruthy();
    expect(screen.getByText("Pratinjau data simulasi")).toBeTruthy();
  });

  it("updates API aggregates for period and region filters without navigation", async () => {
    const fetchMock = mockStatisticsFetch();
    render(<TrackingStatisticsPage />);
    expect(await screen.findByText("383.400")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Periode" }), {
      target: { value: "this-month" },
    });
    expect(await screen.findByText("31.950")).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "Wilayah" }), {
      target: { value: "jabar" },
    });
    expect(await screen.findByText("7.017")).toBeTruthy();
    expect(
      screen.getAllByText(/Bulan ini · Jawa Barat/).length,
    ).toBeGreaterThan(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    const selectedUrl = String(fetchMock.mock.calls[2]?.[0]);
    expect(selectedUrl).toContain("period=this-month");
    expect(selectedUrl).toContain("region=jabar");
  });

  it("validates custom dates and requests valid custom aggregate data", async () => {
    const fetchMock = mockStatisticsFetch();
    render(<TrackingStatisticsPage />);

    fireEvent.change(screen.getByRole("combobox", { name: "Periode" }), {
      target: { value: "custom" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal mulai"), {
      target: { value: "2026-10-28" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal akhir"), {
      target: { value: "2026-10-27" },
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "Tanggal awal harus sama dengan atau sebelum tanggal akhir",
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);

    fireEvent.change(screen.getByLabelText("Tanggal mulai"), {
      target: { value: "2026-10-01" },
    });
    expect(
      (await screen.findAllByText(/2026-10-01 — 2026-10-27/)).length,
    ).toBeGreaterThan(0);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[3]?.[0])).toContain(
      "startDate=2026-10-01",
    );
    expect(String(fetchMock.mock.calls[3]?.[0])).toContain(
      "endDate=2026-10-27",
    );
  });

  it("renders long-resolution services sorted from longest to shortest", async () => {
    mockStatisticsFetch();
    render(<TrackingStatisticsPage />);

    const table = await screen.findByRole("table", {
      name: "Layanan yang paling lama diselesaikan, terurut menurun",
    });
    const rows = within(table)
      .getAllByRole("row")
      .slice(1)
      .map((row) => {
        const cells = within(row).getAllByRole("cell");
        return Number(
          cells[2]?.textContent?.replace(/[^\d,]/g, "").replace(",", "."),
        );
      });

    expect(rows.length).toBeGreaterThan(1);
    expect(rows).toEqual([...rows].sort((a, b) => b - a));
  });

  it("supports toggling aggregate chart series from the legend", async () => {
    mockStatisticsFetch();
    render(<TrackingStatisticsPage />);
    const legend = await screen.findByRole("list", {
      name: "Legenda tren layanan",
    });
    const reportsToggle = within(legend).getByRole("button", {
      name: "Total pengajuan",
    });
    expect(reportsToggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(reportsToggle);
    expect(reportsToggle.getAttribute("aria-pressed")).toBe("false");
  });

  it("shows loading and error states when the aggregate request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
    render(<TrackingStatisticsPage />);

    expect(screen.getByRole("status").textContent).toContain(
      "Statistik sedang dimuat",
    );
    expect(
      await screen.findByRole("heading", {
        name: "Statistik belum dapat dimuat",
      }),
    ).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("offline");
  });
});
