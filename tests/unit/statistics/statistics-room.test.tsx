// @vitest-environment jsdom
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StatisticsRoom } from "@/app/(public)/data/statistik/_components/statistics-room";
import { getPublicStatistics } from "@/modules/analytics/public-statistics";
import { publicStatisticsQuerySchema } from "@/modules/analytics/public-statistics-contract";

vi.mock("@/components/charts/line-chart", () => ({
  LineChart: () => <div data-testid="trend-chart" />,
}));
vi.mock("@/components/charts/bar-chart", () => ({
  BarChart: () => <div data-testid="bar-chart" />,
}));
vi.mock("@/components/charts/pie-chart", () => ({
  PieChart: () => <div data-testid="pie-chart" />,
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockStatisticsFetch() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    const query = publicStatisticsQuerySchema.parse(
      Object.fromEntries(url.searchParams),
    );
    return new Response(JSON.stringify(getPublicStatistics(query)), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("StatisticsRoom", () => {
  it("loads the default dashboard and applies filters without page navigation", async () => {
    const fetchMock = mockStatisticsFetch();
    render(<StatisticsRoom />);

    expect(await screen.findByText("Tahun ini · Semua wilayah")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Ruang Statistik" }),
    ).toBeTruthy();
    expect(screen.getByText("1,2 rb")).toBeTruthy();
    expect(
      screen.getByRole("navigation", { name: "Breadcrumb" }).textContent,
    ).toContain("Layanan Publik");
    const spaceNavigation = screen.getByRole("navigation", {
      name: "Kategori layanan publik",
    });
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Statistik" })
        .getAttribute("aria-current"),
    ).toBe("page");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Warga" })
        .getAttribute("href"),
    ).toBe("/tracking");
    expect(
      within(spaceNavigation)
        .getByRole("link", { name: "Ruang Instansi" })
        .getAttribute("href"),
    ).toBe("/asn/reporting");

    fireEvent.change(
      screen.getByRole("combobox", { name: "Periode statistik" }),
      {
        target: { value: "this-quarter" },
      },
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Wilayah statistik" }),
      {
        target: { value: "jabar" },
      },
    );
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    expect(await screen.findByText("Kuartal ini · Jawa Barat")).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(
      "period=this-quarter&region=jabar",
    );
  });

  it("downloads the filtered aggregate summary as CSV", async () => {
    const createObjectURL = vi
      .fn<(blob: Blob) => string>()
      .mockReturnValue("blob:summary");
    const revokeObjectURL = vi.fn();
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    mockStatisticsFetch();
    render(<StatisticsRoom />);

    await screen.findByText("Tahun ini · Semua wilayah");
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    fireEvent.click(screen.getByRole("button", { name: "Unduh ringkasan" }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0]?.[0]).toBeInstanceOf(Blob);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:summary");
    anchorClick.mockRestore();
  });

  it("offers an interactive donut legend", async () => {
    mockStatisticsFetch();
    render(<StatisticsRoom />);

    await screen.findByText("Tahun ini · Semua wilayah");
    const serviceButton = screen.getByRole("button", {
      name: /Pengaduan warga/,
    });
    expect(serviceButton.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(serviceButton);
    await waitFor(() =>
      expect(serviceButton.getAttribute("aria-pressed")).toBe("false"),
    );
  });

  it("requires a valid custom date range before applying filters", async () => {
    const fetchMock = mockStatisticsFetch();
    render(<StatisticsRoom />);
    await screen.findByText("Tahun ini · Semua wilayah");

    fireEvent.change(
      screen.getByRole("combobox", { name: "Periode statistik" }),
      {
        target: { value: "custom" },
      },
    );
    fireEvent.change(screen.getByLabelText("Tanggal mulai"), {
      target: { value: "2026-04-01" },
    });
    fireEvent.change(screen.getByLabelText("Tanggal akhir"), {
      target: { value: "2026-03-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Terapkan filter" }));

    expect(
      screen.getByText("Tanggal mulai tidak boleh setelah tanggal akhir."),
    ).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
