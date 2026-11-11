// @vitest-environment jsdom
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import StatisticsPage from "@/app/(public)/data/statistik/page";

const publishedEntries = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    regionId: "region-jabar",
    regionName: "Jawa Barat",
    sectorId: "social",
    indicatorId: "poverty",
    indicatorName: "Tingkat kemiskinan",
    unit: "%",
    referenceYear: 2025,
    sourceName: "BPS",
    methodology: "Survei sosial ekonomi",
    publishedAt: "2026-01-15T00:00:00.000Z",
    values: [
      { periodValue: "2024", value: 9.1 },
      { periodValue: "2025", value: 8.7 },
    ],
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002",
    regionId: "region-jateng",
    regionName: "Jawa Tengah",
    sectorId: "social",
    indicatorId: "population",
    indicatorName: "Jumlah penduduk",
    unit: "juta jiwa",
    referenceYear: 2024,
    sourceName: "BPS",
    methodology: "Sensus penduduk",
    publishedAt: "2025-01-15T00:00:00.000Z",
    values: [{ periodValue: "2024", value: 37.9 }],
  },
];

function mockPublishedStatistics(entries = publishedEntries) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const body = String(input).includes("/api/v1/statistics/published")
      ? { entries }
      : {};
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  window.history.replaceState(null, "", window.location.pathname);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("regional statistics page", () => {
  it("renders published statistics and the active public-data tab", async () => {
    const fetchMock = mockPublishedStatistics();
    render(<StatisticsPage />);

    const title = screen.getByRole("heading", {
      level: 1,
      name: "Statistik Daerah",
    });
    expect(title.className).toContain("sm:text-4xl");
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }),
    ).toBeTruthy();
    const tabs = screen.getByRole("navigation", {
      name: "Kategori data pemerintah",
    });
    expect(
      within(tabs)
        .getByRole("link", { name: "Statistik daerah" })
        .getAttribute("aria-current"),
    ).toBe("location");

    expect(
      await screen.findByRole("heading", { name: "Indikator terpublikasi" }),
    ).toBeTruthy();
    expect(screen.getAllByText("Tingkat kemiskinan").length).toBeGreaterThan(0);
    expect(screen.getAllByText("8,7").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("table", { name: "Rincian publikasi statistik" }),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/statistics/published",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("filters published cards and table by selected region and year", async () => {
    mockPublishedStatistics();
    render(<StatisticsPage />);
    await screen.findByRole("heading", { name: "Indikator terpublikasi" });

    fireEvent.change(screen.getByRole("combobox", { name: "Wilayah statistik" }), {
      target: { value: "region-jateng" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Tahun statistik" }), {
      target: { value: "2024" },
    });

    const table = screen.getByRole("table", {
      name: "Rincian publikasi statistik",
    });
    expect(within(table).getByText("Jawa Tengah")).toBeTruthy();
    expect(within(table).getByText("Jumlah penduduk")).toBeTruthy();
    expect(within(table).queryByText("Jawa Barat")).toBeNull();
    expect(screen.queryByText("Tingkat kemiskinan")).toBeNull();
  });

  it("updates the indicator trend from the selected publication", async () => {
    mockPublishedStatistics();
    render(<StatisticsPage />);
    await screen.findByRole("heading", { name: "Indikator terpublikasi" });

    fireEvent.change(screen.getByRole("combobox", { name: "Pilih indikator tren" }), {
      target: { value: "poverty" },
    });

    expect(
      screen.getByRole("img", {
        name: "Tingkat kemiskinan, 2024: 9.1 %",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("img", {
        name: "Tingkat kemiskinan, 2025: 8.7 %",
      }),
    ).toBeTruthy();
  });

  it("shows an explicit empty state when no statistics have been published", async () => {
    mockPublishedStatistics([]);
    render(<StatisticsPage />);

    expect(
      await screen.findByText(
        "Belum ada data statistik ASN yang dipublikasikan untuk filter ini. Data draf tidak ditampilkan.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Unduh CSV" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("downloads the filtered published dataset as CSV", async () => {
    mockPublishedStatistics();
    const createObjectURL = vi.fn(() => "blob:statistics");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    render(<StatisticsPage />);
    await screen.findByRole("heading", { name: "Indikator terpublikasi" });

    fireEvent.click(screen.getByRole("button", { name: "Unduh CSV" }));

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledOnce();
    expect(anchorClick).toHaveBeenCalledOnce();
  });
});
