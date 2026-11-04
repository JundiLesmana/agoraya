// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  maskEmail,
  maskNik,
  formatFileSize,
  INSPECTION_STATUS_OPTIONS,
} from "@/lib/kyc-presentation";

describe("maskNik", () => {
  it("menampilkan 4 digit pertama dan 4 digit terakhir, sisa disamarkan", () => {
    expect(maskNik("3171000000000008")).toBe("3171••••••••0008");
  });

  it("menyamarkan seluruh NIK yang terlalu pendek", () => {
    expect(maskNik("1234")).toBe("••••");
    expect(maskNik("12")).toBe("••");
  });

  it("mengembalikan string kosong untuk NIK kosong", () => {
    expect(maskNik("")).toBe("");
  });
});

describe("maskEmail", () => {
  it("menampilkan 1 karakter awal dan domain utuh, tengah disamarkan", () => {
    expect(maskEmail("budi.santoso@email.com")).toBe("b***@email.com");
  });

  it("mengembalikan placeholder untuk email tanpa @", () => {
    expect(maskEmail("budiemail.com")).toBe("••••");
    expect(maskEmail("")).toBe("••••");
  });
});

describe("formatFileSize", () => {
  it("mengformat byte ke KB, MB, GB", () => {
    expect(formatFileSize(500)).toBe("500 B");
    expect(formatFileSize(1500)).toBe("1 KB");
    expect(formatFileSize(1_400_000)).toBe("1.3 MB");
    expect(formatFileSize(2_100_000)).toBe("2.0 MB");
    expect(formatFileSize(1_500_000_000)).toBe("1.4 GB");
  });

  it("mengembalikan '-' untuk nilai tidak valid", () => {
    expect(formatFileSize(-1)).toBe("-");
    expect(formatFileSize(NaN)).toBe("-");
    expect(formatFileSize(Infinity)).toBe("-");
  });
});

describe("INSPECTION_STATUS_OPTIONS", () => {
  it("memiliki tiga opsi status bagian pemeriksaan", () => {
    expect(INSPECTION_STATUS_OPTIONS).toHaveLength(3);
    expect(INSPECTION_STATUS_OPTIONS.map((o) => o.value)).toEqual([
      "belum",
      "perbaikan",
      "sesuai",
    ]);
    expect(INSPECTION_STATUS_OPTIONS.map((o) => o.label)).toEqual([
      "Belum diperiksa",
      "Perlu perbaikan",
      "Sesuai",
    ]);
  });
});
