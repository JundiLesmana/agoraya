'use client';

import * as React from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker, Popup as MapLibrePopup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { cn } from '@/lib/utils';

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
  /** MapLibre style URL. Defaults to the MapLibre demo style. */
  style?: string;
  /** Initial center as [longitude, latitude]. Defaults to Jakarta. */
  center?: [number, number];
  /** Initial zoom level. */
  zoom?: number;
  /** Markers rendered after the map style loads. */
  markers?: readonly MapPoint[];
  /** Container height. */
  height?: number | string;
  /** Allow scroll-wheel zoom on the map. */
  scrollZoom?: boolean;
  /** Extra classes for the map container. */
  className?: string;
  /** Accessible name for the map region. */
  ariaLabel?: string;
  /** Called once with the underlying MapLibre map after it loads. */
  onLoad?: (map: MapLibreMap) => void;
  /** Marker color. */
  markerColor?: string;
}

/** Default center for Indonesian context (Jakarta). */
export const DEFAULT_MAP_CENTER: [number, number] = [106.8456, -6.2088];
export const DEFAULT_MARKER_COLOR = '#2563eb';

/** Escape untrusted strings before interpolating them into pop-up HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

/** Keep the latest prop values readable from a mount-once effect. */
function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = React.useRef(value);
  React.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/**
 * Interactive map built on MapLibre GL JS. The WebGL map is created on
 * the client only; the container renders an empty region on the server.
 */
export function Map({
  style = 'https://demotiles.maplibre.org/style.json',
  center = DEFAULT_MAP_CENTER,
  zoom = 5,
  markers = [],
  height = 400,
  scrollZoom = true,
  className,
  ariaLabel = 'Peta',
  onLoad,
  markerColor = DEFAULT_MARKER_COLOR,
}: MapProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);
  const maplibreRef = React.useRef<{ Marker: typeof MapLibreMarker; Popup: typeof MapLibrePopup } | null>(null);
  const markersRef = React.useRef<MapLibreMarker[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const latest = useLatest({ style, center, zoom, onLoad, markerColor });

  // Create the map once on mount. Prop changes that need re-configuration
  // read `latest.current` so we never recreate the WebGL context.
  React.useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | null = null;

    void (async () => {
      const maplibregl = await import('maplibre-gl');
      if (disposed || !containerRef.current) return;
      const current = latest.current;
      maplibreRef.current = maplibregl;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: current.style,
        center: current.center,
        zoom: current.zoom,
        scrollZoom,
        attributionControl: {},
      });
      mapRef.current = map;

      map.on('load', () => {
        if (disposed) return;
        setLoaded(true);
        if (mapRef.current) latest.current.onLoad?.(mapRef.current);
      });
    })();

    return () => {
      disposed = true;
      setLoaded(false);
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      if (map) map.remove();
      mapRef.current = null;
      maplibreRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (Re)render markers once the map has loaded or the marker set changes.
  React.useEffect(() => {
    const map = mapRef.current;
    const maplibregl = maplibreRef.current;
    if (!map || !maplibregl || !loaded) return;

    markersRef.current.forEach((marker) => marker.remove());

    const created = markers.map((point) => {
      const marker = new maplibregl.Marker({ color: markerColor }).setLngLat([
        point.longitude,
        point.latitude,
      ]);
      if (point.title || point.description) {
        const title = point.title ? `<strong>${escapeHtml(point.title)}</strong>` : '';
        const description = point.description
          ? `<p>${escapeHtml(point.description)}</p>`
          : '';
        marker.setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`${title}${description}`));
      }
      marker.addTo(map);
      return marker;
    });
    markersRef.current = created;

    return () => {
      created.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [loaded, markers, markerColor]);

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn('relative w-full overflow-hidden rounded-md border', className)}
      style={{ height }}
    >
      <div ref={containerRef} data-testid="map-container" className="absolute inset-0" />
    </div>
  );
}
