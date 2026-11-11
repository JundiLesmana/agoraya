"use client";

import * as React from "react";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { Map as MapComponent } from "./map";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { cn } from "@/lib/utils";

const DEFAULT_INDICATOR = "IND_KEMISKINAN";
const GEOJSON_URL = "/data/indonesia-provinces.geojson";
const STATISTICS_URL = "/api/analytics/statistics";

interface StatisticsPayload {
  readonly source: "BPS_API" | "SIMULATED" | null;
  readonly data: readonly {
    readonly year: number;
    readonly value: number;
    readonly regionCode: string;
    readonly indicatorCode: string;
  }[];
}

export interface ProvinceStat {
  readonly regionCode: string;
  readonly value: number;
  readonly year: number;
}

interface PolygonGeometry {
  readonly type: "Polygon";
  readonly coordinates: number[][][];
}

interface MapFeature {
  readonly type: "Feature";
  readonly id: string;
  readonly properties: {
    readonly region_code: string;
    readonly province: string;
    readonly color?: string;
    readonly value?: number | null;
    readonly year?: number | null;
  };
  readonly geometry: PolygonGeometry;
}

export interface ProvinceFeatureCollection {
  readonly type: "FeatureCollection";
  readonly features: readonly MapFeature[];
}

interface PovertyMapProps {
  /** Kode indikator yang divisualisasikan (default kemiskinan). */
  indicator?: string;
  /** Tinggi peta. */
  height?: number | string;
  /** Kelas tambahan untuk container. */
  className?: string;
  /** ARIA label untuk region peta. */
  ariaLabel?: string;
}

function interpolateColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const c = hex.startsWith("#") ? hex.slice(1) : hex;
    return [
      parseInt(c.slice(0, 2), 16),
      parseInt(c.slice(2, 4), 16),
      parseInt(c.slice(4, 6), 16),
    ] as [number, number, number];
  };
  const [ra, ga, ba] = parse(a);
  const [rb, gb, bb] = parse(b);
  const r = Math.round(ra + (rb - ra) * t);
  const g = Math.round(ga + (gb - ga) * t);
  const blue = Math.round(ba + (bb - ba) * t);
  return `rgb(${r}, ${g}, ${blue})`;
}

export function makeValueColors(values: readonly number[]) {
  if (values.length === 0) return () => "#e5e7eb";
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (value: number | null) => {
    if (value === null) return "#e5e7eb";
    const t =
      max === min ? 0.5 : Math.max(0, Math.min(1, (value - min) / (max - min)));
    return interpolateColor("#eff6ff", "#1d4ed8", t);
  };
}

/**
 * Cocokkan baris statistik dengan fitur GeoJSON berdasarkan region_code, lalu
 * lampirkan warna choropleth ke setiap fitur. Fungsi murni (tanpa MapLibre)
 * agar mudah diuji secara terpisah.
 */
export function buildMapFeatures(
  geojson: ProvinceFeatureCollection,
  stats: readonly ProvinceStat[],
): ProvinceFeatureCollection {
  const statsMap = new Map(stats.map((item) => [item.regionCode, item]));
  const colorForValue = makeValueColors(stats.map((item) => item.value));
  return {
    type: "FeatureCollection",
    features: geojson.features.map((feature) => {
      const stat = statsMap.get(feature.properties.region_code);
      return {
        ...feature,
        id: feature.properties.region_code,
        properties: {
          ...feature.properties,
          color: stat ? colorForValue(stat.value) : "#e5e7eb",
          value: stat?.value ?? null,
          year: stat?.year ?? null,
        },
      };
    }),
  };
}

type MapFillEvent = MapMouseEvent & {
  features?: readonly { properties?: Record<string, unknown> }[];
};

export function PovertyMap({
  indicator = DEFAULT_INDICATOR,
  height = 400,
  className,
  ariaLabel = "Peta penyebaran kemiskinan per provinsi",
}: PovertyMapProps) {
  const [stats, setStats] = React.useState<ProvinceStat[]>([]);
  const [source, setSource] = React.useState<"BPS_API" | "SIMULATED" | null>(
    null,
  );
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [geojson, setGeojson] =
    React.useState<ProvinceFeatureCollection | null>(null);
  const [hovered, setHovered] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<{
    province: string;
    regionCode: string;
    value: number | null;
    year: number | null;
  } | null>(null);

  const layersSetupRef = React.useRef(false);

  React.useEffect(() => {
    let active = true;

    async function load() {
      setError(null);
      try {
        const [geoResponse, statsResponse] = await Promise.all([
          fetch(GEOJSON_URL),
          fetch(
            `${STATISTICS_URL}?indicator=${encodeURIComponent(indicator)}&latest=true`,
          ),
        ]);

        if (!geoResponse.ok)
          throw new Error("Peta wilayah tidak dapat dimuat.");
        if (!statsResponse.ok)
          throw new Error("Data statistik tidak dapat dimuat.");

        const geo = (await geoResponse.json()) as ProvinceFeatureCollection;
        const payload = (await statsResponse.json()) as StatisticsPayload;

        if (!active) return;
        setSource(payload.source);
        setGeojson(geo);
        setStats(
          payload.data.map((row) => ({
            regionCode: row.regionCode,
            value: row.value,
            year: row.year,
          })),
        );
      } catch (loadError) {
        if (!active) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Gagal memuat peta kemiskinan.",
        );
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [indicator]);

  const statsMap = React.useMemo(
    () => new Map(stats.map((item) => [item.regionCode, item])),
    [stats],
  );

  const layersReady = geojson !== null;

  const mapFeatures = layersReady ? buildMapFeatures(geojson, stats) : null;

  type AddLayerArg = Parameters<MapLibreMap["addLayer"]>[0];

  const hoveredStat = hovered ? statsMap.get(hovered) : null;

  const setupLayers = React.useCallback(
    (map: MapLibreMap) => {
      if (!layersReady || !mapFeatures) return;

      const fillLayer: AddLayerArg = {
        id: "poverty-fill",
        type: "fill" as const,
        source: "poverty-geojson",
        paint: {
          "fill-color": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            "#93c5fd",
            ["get", "color"],
          ],
          "fill-opacity": 0.75,
        },
      };

      const outlineLayer: AddLayerArg = {
        id: "poverty-outline",
        type: "line" as const,
        source: "poverty-geojson",
        paint: {
          "line-color": "#ffffff",
          "line-width": 1,
          "line-opacity": 0.7,
        },
      };

      const geoJSONSource = {
        type: "geojson" as const,
        data: mapFeatures,
      };

      if (map.getSource("poverty-geojson") === undefined) {
        map.addSource("poverty-geojson", geoJSONSource);
      }
      if (map.getLayer("poverty-fill") === undefined) {
        map.addLayer(fillLayer);
        map.addLayer(outlineLayer);
      }

      const onHover = (event: MapFillEvent) => {
        const region = event.features?.[0]?.properties?.region_code;
        if (region && region !== hovered) {
          setHovered(String(region));
          try {
            map.setFeatureState(
              { source: "poverty-geojson", id: String(region) },
              { hover: true },
            );
          } catch {
            // feature-state tidak didukung renderer ini; diabaikan aman
          }
        }
      };

      const onLeave = () => {
        if (hovered) {
          try {
            map.setFeatureState(
              { source: "poverty-geojson", id: String(hovered) },
              { hover: false },
            );
          } catch {
            // diabaikan
          }
        }
        setHovered(null);
      };

      const onClick = (event: MapFillEvent) => {
        const region = event.features?.[0]?.properties?.region_code;
        const province = event.features?.[0]?.properties?.province;
        if (region) {
          const stat = statsMap.get(String(region));
          setDetail({
            province: String(province ?? region),
            regionCode: String(region),
            value: stat?.value ?? null,
            year: stat?.year ?? null,
          });
        }
      };

      map.on("mousemove", "poverty-fill", onHover);
      map.on("mouseleave", "poverty-fill", onLeave);
      map.on("click", "poverty-fill", onClick);

      return () => {
        map.off("mousemove", "poverty-fill", onHover);
        map.off("mouseleave", "poverty-fill", onLeave);
        map.off("click", "poverty-fill", onClick);
      };
    },
    [layersReady, mapFeatures, hovered, statsMap],
  );

  const handleLoad = React.useCallback(
    (map: MapLibreMap): (() => void) | undefined => {
      if (layersSetupRef.current || !layersReady || !mapFeatures) return undefined;
      layersSetupRef.current = true;
      return setupLayers(map);
    },
    [setupLayers, layersReady, mapFeatures],
  );

  const hoveredLabel = hoveredStat
    ? `${hoveredStat.value.toLocaleString("id-ID")} (${hoveredStat.year})`
    : "Belum ada wilayah diarahi";

  return (
    <section
      aria-busy={loading}
      className={cn("rounded-lg border shadow-sm", className)}
    >
      <div className="bg-muted/50 dark:bg-muted/30 border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Peta Kemiskinan per Provinsi</h3>
        <p className="text-muted-foreground text-xs">
          Setiap provinsi diwarnai sesuai nilai indikator{" "}
          <strong>{indicator}</strong> terbaru. Warna semakin gelap, nilai
          semakin tinggi. Kode wilayah disesuaikan dengan GeoJSON statis di
          <code>/public</code>.
        </p>
      </div>
      <div className="relative p-4">
        {error ? (
          <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-center text-sm">
            {error}
          </div>
        ) : loading || !layersReady ? (
          <div className="space-y-3">
            <div className="bg-muted h-32 w-full animate-pulse rounded-xl" />
            <div className="bg-muted h-6 w-1/3 animate-pulse rounded-md" />
            <div className="bg-muted h-6 w-1/2 animate-pulse rounded-md" />
          </div>
        ) : (
          <>
            <MapComponent
              center={[115.0, -2.0]}
              zoom={3.6}
              height={height}
              scrollZoom={false}
              ariaLabel={ariaLabel}
              onLoad={handleLoad}
            />
            {stats.length === 0 && (
              <p
                role="status"
                className="text-muted-foreground mt-3 rounded-md border border-dashed p-3 text-center text-sm"
              >
                Belum ada data statistik untuk ditampilkan pada peta.
              </p>
            )}
          </>
        )}
        {hoveredStat && (
          <div
            aria-live="polite"
            className="absolute bottom-2 left-2 z-10 rounded-lg border border-blue-200 bg-white/90 px-3 py-2 text-xs text-blue-900 shadow-sm dark:border-blue-900 dark:bg-slate-900/90 dark:text-blue-100"
          >
            <span className="font-medium">{hovered}</span>{" "}
            <span className="text-muted-foreground dark:text-slate-400">·</span>{" "}
            <span className="font-semibold">{hoveredLabel}</span>
          </div>
        )}
        {detail && (
          <div className="absolute top-2 right-2 z-10">
            <button
              aria-label="Tutup detail wilayah"
              className="rounded-md border border-blue-200 bg-white/90 px-2.5 py-1.5 text-xs text-blue-900 transition-colors hover:bg-blue-50 dark:border-blue-900 dark:bg-slate-900 dark:text-blue-100 dark:hover:bg-blue-900/30"
              onClick={() => setDetail(null)}
            >
              Detail {detail.province}
            </button>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-2 border-t px-4 py-3 text-xs">
        {source && (
          <SourceBadge
            source={source}
            label={
              source === "BPS_API"
                ? "Sumber: BPS API"
                : "Sumber: Data Simulasi (Demo)"
            }
          />
        )}
        <span className="text-muted-foreground">
          Sumber peta wilayah: file statis di /public (bukan database).
        </span>
      </div>
    </section>
  );
}
