/** @vitest-environment jsdom */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
const { mapComponentMock } = vi.hoisted(() => ({
  mapComponentMock: vi.fn(
    (props: {
      renderer?: string;
      center?: [number, number];
      zoom?: number;
      markers?: {
        id: string;
        latitude: number;
        longitude: number;
        title?: string;
      }[];
      onMarkerClick?: (id: string) => void;
    }) => (
      <>
        {props.markers?.map((marker) => (
          <button
            key={marker.id}
            type="button"
            aria-label={`Peta: ${marker.title ?? marker.id}`}
            onClick={() => props.onMarkerClick?.(marker.id)}
          />
        ))}
      </>
    ),
  ),
}));
vi.mock("@/components/map/map", () => ({ Map: mapComponentMock }));

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
  vi.clearAllMocks();
});

describe("PublicReportMap", () => {
  it("renders geocoded public reports as markers in the raster map", async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      if (String(input).includes("/provenance")) {
        return Promise.resolve(
          Response.json({
            source: "ACTUAL",
            validationTimeline: [],
            aiConfidence: null,
            aiConfidenceNote: "Tidak ada confidence klasifikasi AI.",
          }),
        );
      }
      return Promise.resolve(
        Response.json({
          reports: [
            {
              ...publicReport,
              status: "submitted",
              latitude: -6.5947097,
              longitude: 106.7838036,
            },
          ],
          total: 1,
          limit: 100,
          offset: 0,
          hasMore: false,
        }),
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<PublicReportMap />);
    expect(
      await screen.findByText(/1 laporan dengan koordinat ditampilkan di peta/),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("combobox", {
          name: "Filter tindak lanjut",
        }) as HTMLSelectElement
      ).value,
    ).toBe("unhandled");
    expect(
      fetchMock.mock.calls.some(([input]) =>
        String(input).includes("followUp=unhandled"),
      ),
    ).toBe(true);

    const mapProps = mapComponentMock.mock.lastCall?.[0];
    expect(mapProps?.renderer).toBe("raster");
    expect(mapProps?.center).toEqual([110, -7.3]);
    expect(mapProps?.zoom).toBe(7);
    expect(mapProps?.markers).toEqual([
      expect.objectContaining({
        id: publicReport.reportNumber,
        latitude: -6.5947097,
        longitude: 106.7838036,
      }),
    ]);

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Peta: LP-20261111-ABCDEF012345/,
      }),
    );
    const ticketCard = await screen.findByTestId("map-ticket-card");
    expect(mapComponentMock.mock.lastCall?.[0].center).toEqual([
      106.7838036, -6.5947097,
    ]);
    expect(mapComponentMock.mock.lastCall?.[0].zoom).toBe(12);
    expect(ticketCard.textContent).toContain("Jalan berlubang di Jalan Melati");
    expect(ticketCard.textContent).toContain("Kota Bandung, Jawa Barat");
    expect(ticketCard.textContent).toContain("Diterima");
    expect(
      ticketCard.querySelector('[data-testid="provenance-badge"]'),
    ).toBeNull();
    expect(ticketCard.textContent).not.toContain("AKTUAL");
    expect(
      screen.queryByText(
        "Peta raster digunakan untuk memastikan tampilan konsisten di semua browser.",
      ),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Tutup kartu tiket laporan" }),
    );
    expect(screen.queryByTestId("map-ticket-card")).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: /^Peta: LP-20261111-ABCDEF012345/,
      }),
    );
    expect(
      await screen.findByRole("button", {
        name: "Lihat riwayat & detail tiket",
      }),
    ).toBeTruthy();

    fireEvent.change(
      screen.getByRole("combobox", { name: "Filter tindak lanjut" }),
      { target: { value: "all" } },
    );
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(([input]) =>
          String(input).includes("followUp=all"),
        ),
      ).toBe(true),
    );
  });

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
    expect(
      screen.getByRole("region", { name: "Peta sebaran laporan" }),
    ).toBeTruthy();
    expect(mapComponentMock).toHaveBeenCalled();
    expect(await screen.findAllByText("Kota Bandung, Jawa Barat")).toHaveLength(
      2,
    );
    expect(screen.getByText(/Belum ada laporan dengan koordinat/)).toBeTruthy();
    expect(
      screen.getByText(
        /Kelompok ini menunjukkan jumlah laporan per wilayah, bukan koordinat atau batas geografis/,
      ),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByRole("button", {
        name: /LP-20261111-ABCDEF012345/,
      }),
    );
    expect(await screen.findByTestId("provenance-section")).toBeTruthy();
    expect(screen.queryByText("AKTUAL")).toBeNull();
    expect(await screen.findByText(/Peran: CHECKER/)).toBeTruthy();
    expect(
      screen.getByText("Tidak ada confidence klasifikasi AI."),
    ).toBeTruthy();
    expect(screen.queryByText("Budi")).toBeNull();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByTestId("provenance-section")).toBeNull();
  });

  it.each([
    ["SIMULATED", "SIMULASI", "border-amber-200"],
    ["BPS_API", "BPS_API", "border-blue-200"],
    ["AGGREGATE", "AGREGAT", "border-border"],
  ] as const)(
    "uses the expected provenance style for %s",
    async (source, label, style) => {
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
      const badges = await screen.findAllByTestId("provenance-badge");
      const badge = badges[0];
      expect(badge.textContent).toBe(label);
      expect(badge.className).toContain(style);
    },
  );
});