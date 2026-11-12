"use client";

import * as React from "react";
import type * as MapLibreGL from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { configureMapLibreWorker } from "@/lib/maplibre-worker";

/** A geographic point rendered as a map marker. */
export interface MapPoint {
  id: string;
  /** WGS84 longitude (x). */
  longitude: number;
  /** WGS84 latitude (y). */
  latitude: number;
  /** Marker pop-up title. */
  title?: string;
  /** Marker pop-up description. */
  description?: string;
}

export interface MapProps {
  /** Select the raster renderer for environments where WebGL rendering is unreliable. */
  renderer?: "auto" | "raster";
  /** Initial center as [longitude, latitude]. Defaults to Jakarta. */
  center?: [number, number];
  /** Initial zoom level. */
  zoom?: number;
  /** Markers rendered after the map loads. */
  markers?: readonly MapPoint[];
  /** Container height. */
  height?: number | string;
  /** Allow scroll-wheel zoom on the map. */
  scrollZoom?: boolean;
  /** Extra classes for the map container. */
  className?: string;
  /** Accessible name for the map region. */
  ariaLabel?: string;
  /** Called when the map finishes loading. Receives the map instance. */
  onLoad?: (map: MapLibreGL.Map) => (() => void) | undefined;
  /** Called when a marker is clicked. */
  onMarkerClick?: (id: string) => void;
  /** Marker color. */
  markerColor?: string;
  /** Highlighted marker id. */
  selectedMarkerId?: string | null;
}

/** Default center for Indonesian context (Jakarta). */
export const DEFAULT_MAP_CENTER: [number, number] = [106.8456, -6.2088];
export const DEFAULT_MARKER_COLOR = "#2563eb";

type MapLibreModule = typeof MapLibreGL;

function loadMapLibre(): Promise<MapLibreModule> {
  return import("maplibre-gl");
}

function supportsWebGL2(): boolean {
  try {
    return Boolean(document.createElement("canvas").getContext("webgl2"));
  } catch {
    return false;
  }
}

function getTilePosition(
  longitude: number,
  latitude: number,
  zoom: number,
): [number, number] {
  const scale = 2 ** zoom;
  const latitudeRadians =
    (Math.max(-85.051129, Math.min(85.051129, latitude)) * Math.PI) / 180;
  return [
    ((longitude + 180) / 360) * scale * 256,
    ((1 - Math.asinh(Math.tan(latitudeRadians)) / Math.PI) / 2) * scale * 256,
  ];
}

function RasterFallback({
  center,
  zoom,
  markers,
  selectedMarkerId,
  onMarkerClick,
}: {
  center: [number, number];
  zoom: number;
  markers: readonly MapPoint[];
  selectedMarkerId: string | null;
  onMarkerClick?: (id: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState({ width: 0, height: 0 });
  const [tileError, setTileError] = React.useState(false);
  const [view, setView] = React.useState({ center, zoom });
  const dragRef = React.useRef<{
    pointerId: number;
    x: number;
    y: number;
    centerX: number;
    centerY: number;
  } | null>(null);
  const safeZoom = Math.max(0, Math.min(19, Math.floor(view.zoom)));
  const [centerX, centerY] = getTilePosition(
    view.center[0],
    view.center[1],
    safeZoom,
  );
  const originX = centerX - size.width / 2;
  const originY = centerY - size.height / 2;
  const firstTileX = Math.floor(originX / 256);
  const firstTileY = Math.floor(originY / 256);
  const tileCountX = Math.ceil(size.width / 256) + 2;
  const tileCountY = Math.ceil(size.height / 256) + 2;
  const worldTileCount = 2 ** safeZoom;

  React.useEffect(() => {
    setView({ center, zoom });
  }, [center, zoom]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateSize = () => {
      setSize({
        width: container.clientWidth,
        height: container.clientHeight,
      });
    };
    updateSize();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(updateSize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const zoomBy = (amount: number) => {
    setView((current) => ({
      ...current,
      zoom: Math.max(1, Math.min(18, current.zoom + amount)),
    }));
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button, a")) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      centerX,
      centerY,
    };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const nextCenterX = drag.centerX - (event.clientX - drag.x);
    const nextCenterY = drag.centerY - (event.clientY - drag.y);
    const scale = 2 ** safeZoom * 256;
    const longitude = (nextCenterX / scale) * 360 - 180;
    const mercator = Math.PI * (1 - (2 * nextCenterY) / scale);
    const latitude = (Math.atan(Math.sinh(mercator)) * 180) / Math.PI;
    setView((current) => ({
      ...current,
      center: [longitude, latitude],
    }));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab touch-none overflow-hidden bg-sky-100 active:cursor-grabbing dark:bg-slate-800"
      data-testid="raster-map-fallback"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {size.width > 0 &&
        Array.from({ length: tileCountY }, (_, row) =>
          Array.from({ length: tileCountX }, (_, column) => {
            const tileX = firstTileX + column;
            const tileY = firstTileY + row;
            if (tileY < 0 || tileY >= worldTileCount) return null;
            const wrappedTileX =
              ((tileX % worldTileCount) + worldTileCount) % worldTileCount;
            const subdomain = ["a", "b", "c"][(wrappedTileX + tileY) % 3];
            return (
              <img
                key={`${tileX}-${tileY}`}
                src={`https://${subdomain}.tile.openstreetmap.org/${safeZoom}/${wrappedTileX}/${tileY}.png`}
                alt=""
                aria-hidden="true"
                draggable={false}
                className="pointer-events-none absolute size-64 max-w-none"
                onError={() => setTileError(true)}
                style={{
                  left: tileX * 256 - originX,
                  top: tileY * 256 - originY,
                }}
              />
            );
          }),
        )}
      {markers.map((marker) => {
        const [markerX, markerY] = getTilePosition(
          marker.longitude,
          marker.latitude,
          safeZoom,
        );
        const left = markerX - originX;
        const top = markerY - originY;
        if (
          left < -32 ||
          top < -32 ||
          left > size.width + 32 ||
          top > size.height + 32
        ) {
          return null;
        }
        return (
          <React.Fragment key={marker.id}>
            <button
              type="button"
              aria-label={marker.title ?? `Laporan ${marker.id}`}
              onClick={() => onMarkerClick?.(marker.id)}
              className={`absolute z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg ${
                selectedMarkerId === marker.id ? "bg-red-600" : "bg-blue-600"
              }`}
              style={{ left, top }}
            />
            {selectedMarkerId === marker.id ? (
              <div
                role="status"
                className="absolute z-20 max-w-64 -translate-x-1/2 -translate-y-full rounded-md bg-white px-3 py-2 text-xs text-slate-900 shadow-lg"
                style={{ left, top: top - 8 }}
              >
                <strong>{marker.title ?? marker.id}</strong>
                {marker.description ? <p>{marker.description}</p> : null}
              </div>
            ) : null}
          </React.Fragment>
        );
      })}
      {tileError ? (
        <p
          role="alert"
          className="absolute right-3 bottom-8 left-3 z-20 rounded-md border bg-white/95 px-3 py-2 text-xs text-slate-800 shadow"
        >
          Peta dasar tidak dapat dimuat. Periksa koneksi internet lalu muat
          ulang halaman.
        </p>
      ) : null}
      <div className="absolute top-3 right-3 z-20 flex flex-col overflow-hidden rounded-md border bg-white shadow">
        <button
          type="button"
          aria-label="Perbesar peta"
          onClick={() => zoomBy(1)}
          className="size-9 border-b text-lg font-semibold text-slate-800 hover:bg-slate-100"
        >
          +
        </button>
        <button
          type="button"
          aria-label="Perkecil peta"
          onClick={() => zoomBy(-1)}
          className="size-9 text-lg font-semibold text-slate-800 hover:bg-slate-100"
        >
          −
        </button>
      </div>
      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noreferrer"
        className="absolute right-1 bottom-1 z-20 rounded bg-white/90 px-1 text-[10px] text-slate-700"
      >
        © OpenStreetMap contributors
      </a>
    </div>
  );
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

export function Map({
  renderer = "auto",
  center = DEFAULT_MAP_CENTER,
  zoom = 5,
  markers = [],
  height = 400,
  scrollZoom = true,
  className,
  ariaLabel = "Peta",
  onLoad,
  onMarkerClick,
  markerColor = DEFAULT_MARKER_COLOR,
  selectedMarkerId = null,
}: MapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapLibreGL.Map | null>(null);
  const maplibreRef = React.useRef<MapLibreModule | null>(null);
  const markersRef = React.useRef<MapLibreGL.Marker[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fallbackReason, setFallbackReason] = React.useState<string | null>(
    null,
  );
  const useRaster = renderer === "raster" || fallbackReason !== null;
  const loadedRef = React.useRef(false);
  const onLoadRef = React.useRef(onLoad);
  const loadCleanupsRef = React.useRef<(() => void)[]>([]);
  const onMarkerClickRef = React.useRef(onMarkerClick);
  const selectedRef = React.useRef(selectedMarkerId);
  const centerRef = React.useRef(center);
  const zoomRef = React.useRef(zoom);

  React.useEffect(() => {
    onMarkerClickRef.current = onMarkerClick;
  }, [onMarkerClick]);
  React.useEffect(() => {
    selectedRef.current = selectedMarkerId;
  }, [selectedMarkerId]);

  React.useEffect(() => {
    onLoadRef.current = onLoad;
    const currentMap = mapRef.current;
    if (currentMap && loaded && onLoad) {
      const cleanup = onLoadRef.current?.(currentMap);
      if (cleanup) loadCleanupsRef.current.push(cleanup);
    }
  }, [onLoad, loaded]);
  React.useEffect(() => {
    centerRef.current = center;
  }, [center]);
  React.useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);

  React.useEffect(() => {
    let disposed = false;
    let map: MapLibreGL.Map | null = null;
    let failTimeout: number | undefined;

    if (renderer === "raster") {
      setFallbackReason(null);
      return () => {
        disposed = true;
      };
    }
    setFallbackReason(null);

    const activateRasterFallback = (reason: string) => {
      if (disposed) return;
      setFallbackReason(reason);
      setError(null);
      loadedRef.current = false;
      setLoaded(false);
      if (map) {
        map.remove();
        map = null;
      }
      mapRef.current = null;
    };

    void (async () => {
      try {
        if (!supportsWebGL2()) {
          activateRasterFallback(
            "WebGL2 tidak tersedia; peta ditampilkan dalam mode kompatibilitas.",
          );
          return;
        }

        const maplibregl = await loadMapLibre();
        if (disposed || !containerRef.current) return;

        configureMapLibreWorker(maplibregl);
        maplibreRef.current = maplibregl;
        map = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              openstreetmap: {
                type: "raster",
                tiles: [
                  "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                  "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
                ],
                tileSize: 256,
                attribution: "© OpenStreetMap contributors",
                maxzoom: 19,
              },
            },
            layers: [
              {
                id: "openstreetmap",
                type: "raster",
                source: "openstreetmap",
                minzoom: 0,
                maxzoom: 19,
              },
            ],
          },
          center: centerRef.current,
          zoom: zoomRef.current,
          scrollZoom,
          attributionControl: {},
        });
        mapRef.current = map;

        map.addControl(new maplibregl.NavigationControl(), "top-right");

        failTimeout = window.setTimeout(() => {
          if (!disposed && !loadedRef.current)
            activateRasterFallback(
              "Peta interaktif tidak merespons; mode kompatibilitas ditampilkan.",
            );
        }, 15000);

        map.on("error", (event: unknown) => {
          if (disposed) return;
          const mapError =
            event && typeof event === "object" && "error" in event
              ? (event as { error?: unknown }).error
              : null;
          const message =
            mapError instanceof Error
              ? mapError.message
              : String(mapError ?? "Gagal memuat peta.");
          if (/webgl2|worker failed to load/i.test(message)) {
            activateRasterFallback(
              "Peta interaktif tidak dapat dijalankan; mode kompatibilitas ditampilkan.",
            );
          } else if (/token|style|source|worker|script/i.test(message)) {
            setError(message);
          }
        });

        map.on("load", () => {
          if (disposed) return;
          if (failTimeout !== undefined) window.clearTimeout(failTimeout);
          loadedRef.current = true;
          setError(null);
          setLoaded(true);
          if (map) {
            const cleanup = onLoadRef.current?.(map);
            if (cleanup) loadCleanupsRef.current.push(cleanup);
          }
          try {
            map?.resize();
          } catch {
            // Ignore.
          }
        });

        map.once("remove", () => {
          if (failTimeout !== undefined) window.clearTimeout(failTimeout);
        });
      } catch {
        if (disposed) return;
        activateRasterFallback(
          "Peta interaktif tidak dapat dimuat; mode kompatibilitas ditampilkan.",
        );
      }
    })();

    return () => {
      disposed = true;
      loadedRef.current = false;
      setLoaded(false);
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch {
          // Ignore.
        }
      });
      markersRef.current = [];
      maplibreRef.current = null;
      loadCleanupsRef.current.forEach((fn) => {
        try {
          fn();
        } catch {
          // Ignore.
        }
      });
      loadCleanupsRef.current = [];
      if (map) {
        try {
          map.remove();
        } catch {
          // Ignore.
        }
      }
      mapRef.current = null;
      if (failTimeout !== undefined) window.clearTimeout(failTimeout);
    };
  }, [renderer, scrollZoom]);

  React.useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container || !loaded) return;
    const observer = new ResizeObserver(() => {
      try {
        map.resize();
      } catch {
        // Ignore.
      }
    });
    observer.observe(container);
    try {
      map.resize();
    } catch {
      // Ignore.
    }
    return () => observer.disconnect();
  }, [loaded]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    const maplibregl = maplibreRef.current;
    if (!maplibregl) return;

    markersRef.current.forEach((marker) => {
      try {
        marker.remove();
      } catch {
        // Ignore.
      }
    });

    const created = markers.map((point) => {
      const isSelected = selectedRef.current === point.id;
      const marker = new maplibregl.Marker({
        color: isSelected ? "#dc2626" : markerColor,
      }).setLngLat([point.longitude, point.latitude]);

      if (point.title || point.description) {
        const title = point.title
          ? `<strong>${escapeHtml(point.title)}</strong>`
          : "";
        const description = point.description
          ? `<p>${escapeHtml(point.description)}</p>`
          : "";
        marker.setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(
            `${title}${description}`,
          ),
        );
      }

      const element = marker.getElement();
      if (element) {
        element.style.cursor = "pointer";
        element.setAttribute(
          "aria-label",
          point.title ?? `Laporan ${point.id}`,
        );
        element.addEventListener("click", () => {
          onMarkerClickRef.current?.(point.id);
        });
      }

      marker.addTo(map);
      return marker;
    });
    markersRef.current = created;

    return () => {
      created.forEach((marker) => {
        try {
          marker.remove();
        } catch {
          // Ignore.
        }
      });
      markersRef.current = [];
    };
  }, [loaded, markers, markerColor, selectedMarkerId]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !loaded) return;
    if (center && zoom) {
      try {
        map.easeTo({ center, zoom, duration: 400 });
      } catch {
        // Ignore.
      }
    }
  }, [center, zoom, loaded]);

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "bg-muted/20 relative w-full overflow-hidden rounded-md border",
        className,
      )}
      style={{ height }}
    >
      {useRaster ? (
        <>
          <RasterFallback
            center={center}
            zoom={zoom}
            markers={markers}
            selectedMarkerId={selectedMarkerId}
            onMarkerClick={onMarkerClick}
          />
          {fallbackReason ? (
            <p
              role="status"
              className="bg-background/90 text-foreground absolute top-3 left-3 z-30 rounded-md border px-3 py-2 text-xs"
            >
              {fallbackReason}
            </p>
          ) : null}
        </>
      ) : (
        <div
          ref={containerRef}
          data-testid="map-container"
          className="absolute inset-0"
        />
      )}
      {!useRaster && !loaded && !error ? (
        <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
          Memuat peta…
        </div>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="bg-background/90 text-foreground absolute inset-x-3 bottom-3 rounded-md border px-3 py-2 text-xs"
        >
          Peta tidak dapat dimuat: {error}
        </div>
      ) : null}
    </div>
  );
}
