/** @vitest-environment jsdom */

import { act, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mapLibreMock = vi.hoisted(() => {
  let removeHandler: (() => void) | undefined;
  const handlers: Record<string, (event: unknown) => void> = {};
  const map = {
    addControl: vi.fn(),
    easeTo: vi.fn(),
    on: vi.fn((event: string, handler: (event: unknown) => void) => {
      handlers[event] = handler;
    }),
    once: vi.fn((event: string, handler: () => void) => {
      if (event === "remove") removeHandler = handler;
    }),
    remove: vi.fn(() => removeHandler?.()),
    resize: vi.fn(),
  };
  return {
    map,
    handlers,
    setWorkerUrl: vi.fn(),
    Map: vi.fn(() => map),
    NavigationControl: vi.fn(),
  };
});

vi.mock("maplibre-gl", () => mapLibreMock);

import { Map } from "@/components/map/map";

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe("Map", () => {
  it("configures the local MapLibre worker before creating the map", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as WebGL2RenderingContext,
    );
    const { unmount } = render(<Map />);

    await waitFor(() => {
      expect(mapLibreMock.setWorkerUrl).toHaveBeenCalledWith(
        "/maplibre-gl-worker.mjs",
      );
      expect(mapLibreMock.Map).toHaveBeenCalled();
    });

    unmount();
  });

  it("shows a raster map when WebGL2 is unavailable", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    render(
      <Map
        markers={[
          {
            id: "report-1",
            longitude: 106.8456,
            latitude: -6.2088,
            title: "Laporan Jakarta",
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(
        document.querySelector('[data-testid="raster-map-fallback"]'),
      ).toBeTruthy();
    });
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "WebGL2 tidak tersedia",
    );
    expect(mapLibreMock.Map).not.toHaveBeenCalled();
  });

  it("uses the raster renderer when explicitly selected", () => {
    render(
      <Map
        renderer="raster"
        markers={[
          {
            id: "report-1",
            longitude: 106.8456,
            latitude: -6.2088,
            title: "Laporan Jakarta",
          },
        ]}
      />,
    );

    expect(
      document.querySelector('[data-testid="raster-map-fallback"]'),
    ).toBeTruthy();
    expect(
      document.querySelector('button[aria-label="Laporan Jakarta"]'),
    ).toBeTruthy();
    expect(mapLibreMock.Map).not.toHaveBeenCalled();
  });

  it("falls back to raster tiles when the map worker fails", async () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as WebGL2RenderingContext,
    );
    render(<Map />);

    await waitFor(() => {
      expect(mapLibreMock.Map).toHaveBeenCalled();
    });
    act(() => {
      mapLibreMock.handlers.error?.({
        error: new Error(
          "Worker failed to load. Check that the worker URL is correct.",
        ),
      });
    });

    expect(
      document.querySelector('[data-testid="raster-map-fallback"]'),
    ).toBeTruthy();
    expect(document.querySelector('[role="status"]')?.textContent).toContain(
      "mode kompatibilitas",
    );
  });
});