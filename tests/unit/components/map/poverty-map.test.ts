import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/map/map", () => ({
  Map: () => null,
}));

import type {
  ProvinceFeatureCollection,
  ProvinceStat,
} from "@/components/map/poverty-map";
import { buildMapFeatures, makeValueColors } from "@/components/map/poverty-map";

const GEOJSON: ProvinceFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "31",
      properties: { region_code: "31", province: "DKI Jakarta" },
      geometry: { type: "Polygon", coordinates: [[[106, -6], [107, -6], [107, -5], [106, -5], [106, -6]]] },
    },
    {
      type: "Feature",
      id: "32",
      properties: { region_code: "32", province: "Jawa Barat" },
      geometry: { type: "Polygon", coordinates: [[[107, -7], [108, -7], [108, -6], [107, -6], [107, -7]]] },
    },
  ],
};

describe("makeValueColors", () => {
  it("mengembalikan warna netral ketika tidak ada nilai", () => {
    const color = makeValueColors([]);
    expect(color(null)).toBe("#e5e7eb");
    expect(color(5)).toBe("#e5e7eb");
  });

  it("menginterpolasi warna antara minimum dan maksimum", () => {
    const color = makeValueColors([0, 100]);
    expect(color(0)).toBe("rgb(239, 246, 255)");
    expect(color(100)).toBe("rgb(29, 78, 216)");
    expect(color(null)).toBe("#e5e7eb");
    expect(color(50)).not.toBe(color(0));
    expect(color(50)).not.toBe(color(100));
  });
});

describe("buildMapFeatures", () => {
  it("mencocokkan statistik dengan fitur GeoJSON berdasarkan region_code", () => {
    const stats: ProvinceStat[] = [
      { regionCode: "31", value: 11.04, year: 2021 },
      { regionCode: "31", value: 8.7, year: 2025 },
      { regionCode: "99", value: 50, year: 2024 },
    ];

    const result = buildMapFeatures(GEOJSON, stats);

    expect(result.features).toHaveLength(2);
    const dki = result.features.find((f) => f.id === "31");
    expect(dki).toBeTruthy();
    expect(dki?.properties.region_code).toBe("31");
    expect(dki?.properties.value).toBe(8.7);
    expect(dki?.properties.year).toBe(2025);
    expect(dki?.id).toBe("31");
    expect(dki?.properties.color).not.toBe("#e5e7eb");

    const jabar = result.features.find((f) => f.id === "32");
    expect(jabar?.properties.value).toBeNull();
    expect(jabar?.properties.year).toBeNull();
    expect(jabar?.properties.color).toBe("#e5e7eb");
  });
});
