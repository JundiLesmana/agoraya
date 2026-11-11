'use client';

import * as React from "react";
import type { IControl, Map as MapLibreMap } from "maplibre-gl";
import { cn } from "@/lib/utils";

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
  onLoad?: (map: MapLibreMap) => (() => void) | undefined;
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

const MAPLIBRE_VERSION = "4.7.1";
const SCRIPT_ID = "maplibre-gl-script";
const CSS_ID = "maplibre-gl-css";

type LngLatLike = [number, number];
interface PopupLike {
  setHTML(html: string): PopupLike;
}
interface MarkerLike {
  setLngLat(lngLat: LngLatLike): MarkerLike;
  setPopup(popup: PopupLike): MarkerLike;
  getElement(): HTMLElement;
  addTo(map: MapLike): MarkerLike;
  remove(): void;
}
interface MapLike {
  on(event: string, handler: (...args: unknown[]) => void): void;
  once(event: string, handler: (...args: unknown[]) => void): void;
  addControl(control: unknown, position?: string): void;
  resize(): void;
  easeTo(options: { center: LngLatLike; zoom: number; duration: number }): void;
  remove(): void;
}
type MapLibreGlobal = {
  Map: new (options: Record<string, unknown>) => MapLibreMap;
  Marker: new (options?: Record<string, unknown>) => MarkerLike;
  Popup: new (options?: Record<string, unknown>) => PopupLike;
  NavigationControl: new () => unknown;
};

function getMapLibre(): MapLibreGlobal | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { maplibregl?: MapLibreGlobal }).maplibregl ?? null;
}

function loadMapLibre(): Promise<MapLibreGlobal> {
  const existing = getMapLibre();
  if (existing) return Promise.resolve(existing);

  if (!document.getElementById(CSS_ID)) {
    const link = document.createElement("link");
    link.id = CSS_ID;
    link.rel = "stylesheet";
    link.href = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
    document.head.appendChild(link);
  }

  const scriptExisting = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (scriptExisting) {
    return new Promise((resolve, reject) => {
      scriptExisting.addEventListener("load", () => {
        const lib = getMapLibre();
        if (lib) resolve(lib);
        else reject(new Error("MapLibre gagal dimuat."));
      });
      scriptExisting.addEventListener("error", () =>
        reject(new Error("Gagal memuat skrip peta.")),
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
    script.async = true;
    script.onload = () => {
      const lib = getMapLibre();
      if (lib) resolve(lib);
      else reject(new Error("MapLibre gagal dimuat."));
    };
    script.onerror = () => reject(new Error("Gagal memuat skrip peta."));
    document.head.appendChild(script);
  });
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
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const markersRef = React.useRef<MarkerLike[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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
    let map: MapLibreMap | null = null;

    void (async () => {
      try {
        const maplibregl = await loadMapLibre();
        if (disposed || !containerRef.current) return;

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
          attributionControl: true,
        });
        mapRef.current = map;

        try {
          map.addControl(new maplibregl.NavigationControl() as IControl, "top-right");
        } catch {
          // Optional.
        }

        const failTimeout = window.setTimeout(() => {
          if (!disposed && !loadedRef.current)
            setError((prev) => prev ?? "Peta tidak merespons. Periksa koneksi internet.");
        }, 15000);

        map.on("error", (event: unknown) => {
          if (disposed) return;
          const message =
            event && typeof event === "object" && "error" in event
              ? String((event as { error?: unknown }).error ?? "Map error")
              : "Gagal memuat peta.";
          if (/token|style|source|worker|script/i.test(message)) setError(message);
        });

        map.on("load", () => {
          if (disposed) return;
          window.clearTimeout(failTimeout);
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

        map.once("remove", () => window.clearTimeout(failTimeout));
      } catch (e) {
        if (disposed) return;
        setError(e instanceof Error ? e.message : "Peta tidak dapat dimuat.");
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
    };
  }, [scrollZoom]);

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
    const maplibregl = getMapLibre();
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
        const title = point.title ? `<strong>${escapeHtml(point.title)}</strong>` : "";
        const description = point.description
          ? `<p>${escapeHtml(point.description)}</p>`
          : "";
        marker.setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`${title}${description}`),
        );
      }

      const element = marker.getElement();
      if (element) {
        element.style.cursor = "pointer";
        element.setAttribute("aria-label", point.title ?? `Laporan ${point.id}`);
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
      className={cn("relative w-full overflow-hidden rounded-md border bg-muted/20", className)}
      style={{ height }}
    >
      <div ref={containerRef} data-testid="map-container" className="absolute inset-0" />
      {!loaded && !error ? (
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
