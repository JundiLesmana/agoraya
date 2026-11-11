import { describe, expect, it } from "vitest";

import {
  BpsResponseError,
  parseBpsIndicatorSelectors,
  parseBpsResponse,
  parseLatestBpsYear,
} from "@/modules/integrations/bps";

const selector = {
  domain: "0000",
  indicatorId: "413",
  turvarId: "0",
  turtahunId: "0",
};

const yearList = {
  status: "OK",
  data: [
    { page: 1, pages: 2, per_page: 10, count: 10, total: 15 },
    [
      { th_id: 123, th: "2023", var_id: 413, var_name: "IPM" },
      { th_id: 124, th: "2024", var_id: 413, var_name: "IPM" },
    ],
  ],
};

const bpsResponse = {
  status: "OK",
  "data-availability": "available",
  var: [
    {
      val: 413,
      label: "Indeks Pembangunan Manusia",
      unit: "Indeks",
      note: "metadata yang tidak disimpan",
    },
  ],
  tahun: [{ val: 124, label: "2024" }],
  turvar: [{ val: "0", label: "Tidak ada" }],
  turtahun: [{ val: 0, label: "Tahunan" }],
  vervar: [
    { val: 1100, label: "ACEH" },
    { val: 1101, label: "Simeulue" },
  ],
  datacontent: {
    "110041301240": 74.03,
    "110141301240": "69.01",
    ignored: 999,
  },
};

describe("BPS parser", () => {
  it("mengurai konfigurasi indikator dan menolak entri invalid atau duplikat", () => {
    expect(parseBpsIndicatorSelectors("0000:413:0:0")).toEqual([selector]);
    expect(() => parseBpsIndicatorSelectors("../../../key")).toThrow(
      BpsResponseError,
    );
    expect(() =>
      parseBpsIndicatorSelectors("0000:413:0:0,0000:413:0:0"),
    ).toThrow(BpsResponseError);
  });

  it("memilih tahun terbaru dari metadata BPS, bukan urutan payload", () => {
    expect(parseLatestBpsYear(yearList)).toEqual({ yearId: "124", year: 2024 });
    expect(() => parseLatestBpsYear({ status: "error" })).toThrow(
      BpsResponseError,
    );
  });

  it("memvalidasi respons native dan hanya mengekstrak agregat terpilih", () => {
    expect(parseBpsResponse(bpsResponse, selector, "124", 2024)).toEqual([
      {
        indicatorCode: "bps:0000:413:0:0",
        regionCode: "1100",
        value: 74.03,
        year: 2024,
        unit: "Indeks",
      },
      {
        indicatorCode: "bps:0000:413:0:0",
        regionCode: "1101",
        value: 69.01,
        year: 2024,
        unit: "Indeks",
      },
    ]);
  });

  it("menerima unit bernilai null dari API BPS resmi dan menggunakan fallback", () => {
    const responseWithNullUnit = {
      ...bpsResponse,
      var: [
        {
          val: 413,
          label: "Indeks Pembangunan Manusia",
          unit: null,
        },
      ],
    };
    const parsed = parseBpsResponse(
      responseWithNullUnit,
      selector,
      "124",
      2024,
    );
    expect(parsed[0].unit).toBe("Tidak Ada Satuan");
  });

  it("menolak respons rusak dan dimensi indikator yang tidak cocok", () => {
    expect(() =>
      parseBpsResponse({ status: "error" }, selector, "124", 2024),
    ).toThrow(BpsResponseError);
    expect(() =>
      parseBpsResponse(
        bpsResponse,
        { ...selector, turtahunId: "99" },
        "124",
        2024,
      ),
    ).toThrow(BpsResponseError);
    expect(() =>
      parseBpsResponse(
        {
          ...bpsResponse,
          datacontent: { "110041301240": "bukan-angka" },
        },
        selector,
        "124",
        2024,
      ),
    ).toThrow(BpsResponseError);
  });

  it("menolak payload agregat yang melampaui batas sinkronisasi", () => {
    const regions = Array.from({ length: 2_001 }, (_, index) => ({
      val: index + 1,
      label: `wilayah ${index + 1}`,
    }));
    const values = Object.fromEntries(
      regions.map((region) => [`${region.val}41301240`, 10]),
    );

    expect(() =>
      parseBpsResponse(
        { ...bpsResponse, vervar: regions, datacontent: values },
        selector,
        "124",
        2024,
      ),
    ).toThrow(BpsResponseError);
  });
});
