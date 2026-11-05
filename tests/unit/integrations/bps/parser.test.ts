import { describe, expect, it } from "vitest";

import {
  BpsResponseError,
  BpsResponseSchema,
  parseBpsResponse,
} from "@/modules/integrations/bps";

const bpsResponse = {
  status: 200,
  message: "OK",
  data: [
    {
      kode: "3171",
      nilai: "11.04",
      tahun: 2023,
      satuan_detail: "persen",
      last_updated: "2024-01-01",
      note: "coba",
    },
    { kode: "3172", nilai: "12.5", tahun: 2023, extra: { nested: true } },
    { kode: "3173", nilai: "13.75", tahun: 2022 },
  ],
};

describe("bps parser", () => {
  it("mengembalikan hanya field yang relevan dan mengonversi nilai string ke number", () => {
    const result = parseBpsResponse(bpsResponse);

    expect(result).toEqual([
      { regionCode: "3171", value: 11.04, year: 2023 },
      { regionCode: "3172", value: 12.5, year: 2023 },
      { regionCode: "3173", value: 13.75, year: 2022 },
    ]);
    expect(result).toHaveLength(3);
    for (const record of result) {
      expect(Object.keys(record)).toEqual(["regionCode", "value", "year"]);
      expect(typeof record.value).toBe("number");
      expect(typeof record.year).toBe("number");
    }
  });

  it("memvalidasi skema respons melalui BpsResponseSchema", () => {
    const parsed = BpsResponseSchema.parse(bpsResponse);
    expect(parsed.data).toHaveLength(3);
    expect(parsed.data[0]).toEqual({ kode: "3171", nilai: 11.04, tahun: 2023 });
  });

  it("melempar BpsResponseError yang mengandung ZodIssue untuk respons rusak", () => {
    expect(() => parseBpsResponse({ data: [] })).toThrow(BpsResponseError);

    try {
      parseBpsResponse({ data: [{ kode: "", nilai: "abc", tahun: 999 }] });
    } catch (error) {
      expect(error).toBeInstanceOf(BpsResponseError);
      const zodError = error as BpsResponseError;
      expect(zodError.issues.length).toBeGreaterThan(0);
      return;
    }
    expect.fail("harus melempar BpsResponseError");
  });

  it("menolak respons yang nilainya bukan angka valid", () => {
    expect(() =>
      parseBpsResponse({
        data: [{ kode: "3171", nilai: "tidak-angka", tahun: 2023 }],
      }),
    ).toThrow(BpsResponseError);
  });
});
