import { describe, expect, it } from "vitest";

import { bpsRegionCodesForAssignment } from "@/modules/asn-datasets/region-code";

describe("BPS region mapping for dataset assignments", () => {
  it("maps a named province assignment to its BPS aggregate code", () => {
    expect(bpsRegionCodesForAssignment("jawa-barat", "Jawa Barat")).toEqual([
      "3200",
    ]);
    expect(bpsRegionCodesForAssignment("jawa-barat", "")).toEqual(["3200"]);
  });

  it("uses explicit BPS codes without guessing a region", () => {
    expect(bpsRegionCodesForAssignment("3204", "Kabupaten Bandung")).toEqual([
      "3204",
    ]);
    expect(bpsRegionCodesForAssignment("32", "Provinsi Jawa Barat")).toEqual([
      "3200",
    ]);
  });

  it("does not map unknown region slugs", () => {
    expect(
      bpsRegionCodesForAssignment("kabupaten-contoh", "Kabupaten Contoh"),
    ).toEqual([]);
  });
});