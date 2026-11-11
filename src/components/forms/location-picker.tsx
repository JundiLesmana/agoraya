"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker, Popup as MapLibrePopup } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Search, X, RefreshCw, Target, CheckCircle2, MapPin as MapPinIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface LocationData {
  province: string;
  city: string;
  kecamatan: string;
  kelurahan: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface NominatimAddress {
  state?: string;
  province?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  district?: string;
  county?: string;
  suburb?: string;
  road?: string;
  neighbourhood?: string;
  postcode?: string;
}

interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  address?: NominatimAddress;
}

const DEFAULT_CENTER: [number, number] = [106.8456, -6.2088];
const DEFAULT_ZOOM = 5;
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

function escapeHtml(value: string): string {
  const entities: Record<string, string> = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': '"',
    "'": "'",
  };
  return value.replace(/[&<>"']/g, (char) => entities[char] ?? char);
}

function extractLocationData(data: NominatimResponse): LocationData {
  const address = data.address ?? {};
  const province = address.province ?? address.state ?? "";
  const city = address.city ?? address.town ?? address.village ?? address.district ?? address.county ?? "";
  const kecamatan = address.district ?? address.suburb ?? address.county ?? "";
  const kelurahan = address.village ?? address.hamlet ?? address.neighbourhood ?? "";
  const road = address.road ?? "";
  const neighbourhood = address.neighbourhood ?? "";
  const suburb = address.suburb ?? "";
  const village = address.village ?? "";
  const hamlet = address.hamlet ?? "";

  const addressParts = [road, neighbourhood, suburb, village, hamlet].filter(Boolean);
  const formattedAddress = addressParts.join(", ") || data.display_name;

  return {
    province,
    city,
    kecamatan,
    kelurahan,
    address: formattedAddress,
    latitude: parseFloat(data.lat),
    longitude: parseFloat(data.lon),
  };
}

async function reverseGeocode(lat: number, lon: number): Promise<LocationData | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=id`,
      {
        headers: {
          "User-Agent": "Agoraya/1.0 (https://agoraya.id)",
        },
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as NominatimResponse;
    return extractLocationData(data);
  } catch {
    return null;
  }
}

async function searchLocation(query: string): Promise<LocationData | null> {
  try {
    const response = await fetch(
      `${NOMINATIM_URL}/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1&accept-language=id&countrycodes=id`,
      {
        headers: {
          "User-Agent": "Agoraya/1.0 (https://agoraya.id)",
        },
      }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as NominatimResponse[];
    if (!data.length) return null;
    return extractLocationData(data[0]);
  } catch {
    return null;
  }
}

export function LocationPicker({
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel = "Pilih lokasi di peta",
}: {
  value: LocationData | null;
  onChange: (value: LocationData | null) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const maplibreRef = useRef<{ Marker: typeof MapLibreMarker; Popup: typeof MapLibrePopup } | null>(null);
  const markerRef = useRef<MapLibreMarker | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let map: MapLibreMap | null = null;

    void (async () => {
      const maplibregl = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;
      maplibreRef.current = maplibregl;

      map = new maplibregl.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            "openstreetmap": {
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
        center: value ? [value.longitude, value.latitude] : DEFAULT_CENTER,
        zoom: value ? 15 : DEFAULT_ZOOM,
        scrollZoom: true,
        attributionControl: {},
      });
      mapRef.current = map;

      map.on("load", () => {
        if (disposed) return;
        setLoaded(true);
      });

      map.on("click", async (event) => {
        if (disabled) return;
        const { lng, lat } = event.lngLat;
        const location = await reverseGeocode(lat, lng);
        if (location) {
          onChange(location);
          updateMarker(location);
        }
      });
    })();

    return () => {
      disposed = true;
      setLoaded(false);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (map) map.remove();
      mapRef.current = null;
      maplibreRef.current = null;
    };
  }, [disabled, onChange, value]);

  const updateMarker = useCallback(
    (location: LocationData) => {
      const map = mapRef.current;
      const maplibregl = maplibreRef.current;
      if (!map || !maplibregl) return;

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const marker = new maplibregl.Marker({ color: "#2563eb" }).setLngLat([location.longitude, location.latitude]);
      const title = location.province || location.city ? `<strong>${escapeHtml(location.province || location.city)}</strong>` : "";
      const kecamatanHtml = location.kecamatan ? `<p>Kecamatan: ${escapeHtml(location.kecamatan)}</p>` : "";
      const kelurahanHtml = location.kelurahan ? `<p>Kelurahan/Desa: ${escapeHtml(location.kelurahan)}</p>` : "";
      const description = location.address ? `<p>${escapeHtml(location.address)}</p>` : "";
      if (title || kecamatanHtml || kelurahanHtml || description) {
        marker.setPopup(new maplibregl.Popup({ offset: 25 }).setHTML(`${title}${kecamatanHtml}${kelurahanHtml}${description}`));
      }
      marker.addTo(map);
      markerRef.current = marker;

      map.flyTo({ center: [location.longitude, location.latitude], zoom: 15, essential: true });
    },
    []
  );

  useEffect(() => {
    if (loaded && value) {
      updateMarker(value);
    }
  }, [loaded, value, updateMarker]);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const result = await searchLocation(searchQuery.trim());
    setSearching(false);
    if (result) {
      setSearchResults([result]);
      setShowSearchResults(true);
      onChange(result);
      updateMarker(result);
    } else {
      setSearchResults([]);
      setShowSearchResults(true);
    }
  }, [searchQuery, onChange, updateMarker]);

  const handleSearchSelect = useCallback(
    (result: LocationData) => {
      onChange(result);
      updateMarker(result);
      setSearchQuery("");
      setShowSearchResults(false);
      setSearchResults([]);
    },
    [onChange, updateMarker]
  );

  const handleCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      alert("Geolocation tidak didukung oleh browser ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const location = await reverseGeocode(latitude, longitude);
        if (location) {
          onChange(location);
          updateMarker(location);
        } else {
          alert("Gagal mendapatkan alamat dari koordinat lokasi.");
        }
      },
      (error) => {
        alert("Gagal mendapatkan lokasi saat ini: " + error.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [onChange, updateMarker]);

  const handleClear = useCallback(() => {
    onChange(null);
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
  }, [onChange]);

  const displayValue = value
    ? `${value.province || ""}${value.province && value.city ? ", " : ""}${value.city || ""}${value.kecamatan ? `, ${value.kecamatan}` : ""}${value.kelurahan ? `, ${value.kelurahan}` : ""}${value.address ? ` - ${value.address}` : ""}`
    : "";

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative">
        <Label htmlFor="location-search" className="sr-only">
          Cari lokasi
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" aria-hidden="true" />
          <Input
            id="location-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            onFocus={() => setShowSearchResults(searchResults.length > 0)}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            placeholder="Cari alamat, kelurahan, atau patokan..."
            disabled={disabled}
            className="pl-10 pr-10"
            aria-autocomplete="list"
            aria-controls="location-search-results"
            aria-expanded={showSearchResults && searchResults.length > 0}
          />
          {searching && <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4 animate-spin" aria-hidden="true" />}
        </div>

        {showSearchResults && searchResults.length > 0 && (
          <div
            ref={searchResultsRef}
            id="location-search-results"
            role="listbox"
            className="absolute z-50 w-full mt-1 rounded-md border bg-popover p-1 shadow-lg max-h-60 overflow-auto"
          >
            {searchResults.map((result, index) => (
              <button
                key={index}
                role="option"
                type="button"
                onClick={() => handleSearchSelect(result)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded"
              >
                <div className="font-medium">{result.province || result.city || "Lokasi"}</div>
                {result.kecamatan && <div className="text-muted-foreground text-xs">Kec: {result.kecamatan}</div>}
                {result.kelurahan && <div className="text-muted-foreground text-xs">Kel/Desa: {result.kelurahan}</div>}
                <div className="text-muted-foreground truncate">{result.address}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        ref={containerRef}
        className={cn("relative w-full rounded-lg border overflow-hidden", !loaded && "bg-muted")}
        style={{ height: 300 }}
        role="region"
        aria-label={ariaLabel}
      >
        <div data-testid="map-container" className="absolute inset-0" />
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <div className="text-center text-muted-foreground">
              <div className="animate-pulse mb-2">Memuat peta...</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCurrentLocation}
          disabled={disabled}
          className="gap-1"
        >
          <Target className="size-4" aria-hidden="true" />
          Gunakan lokasi saya
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="gap-1"
          >
            <X className="size-4" aria-hidden="true" />
            Hapus lokasi
          </Button>
        )}
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <p>Klik pada peta untuk memilih lokasi, atau gunakan pencarian di atas.</p>
        {value && (
          <div className="bg-muted/50 rounded p-3 text-xs">
            <p className="font-medium text-foreground flex items-center gap-1">
              <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />
              Lokasi terpilih:
            </p>
            <p>
              <strong>Provinsi:</strong> {value.province || "-"}
            </p>
            <p>
              <strong>Kabupaten/Kota:</strong> {value.city || "-"}
            </p>
            <p>
              <strong>Kecamatan:</strong> {value.kecamatan || "-"}
            </p>
            <p>
              <strong>Kelurahan / Desa:</strong> {value.kelurahan || "-"}
            </p>
            <p>
              <strong>Alamat/Patokan:</strong> {value.address}
            </p>
            <p>
              <strong>Koordinat:</strong> {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </p>
            <p className="text-emerald-600 mt-1">Lokasi valid - Anda bisa melanjutkan pengisian form</p>
          </div>
        )}
        {searchQuery.trim() && !value && (
          <p className="text-amber-600">Tekan Enter atau pilih hasil pencarian untuk menetapkan lokasi</p>
        )}
      </div>
    </div>
  );
}