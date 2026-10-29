import { describe, expect, it } from "vitest";
import {
  buildSekilasAriaLabel,
  formatDelta,
  formatNumber,
  getSekilasInsights,
  sekilasItemSchema,
  spellDelta,
  spellOutNumberWithUnit,
  terbilang,
} from "@/lib/insight-sekilas";
import type { SekilasItem } from "@/lib/insight-sekilas";

describe("formatNumber", () => {
  it('mengformat 88 menjadi "88%"', () => {
    expect(formatNumber(88)).toBe("88%");
  });

  it('mengformat 3,8 dengan koma desimal Indonesia menjadi "3,8%"', () => {
    expect(formatNumber(3.8)).toBe("3,8%");
  });

  it('mengformat 50 dengan tanda plus menjadi "+50%"', () => {
    expect(formatNumber(50, { sign: "plus" })).toBe("+50%");
  });

  it("menggunakan koma sebagai pemisah desimal untuk 12,5", () => {
    expect(formatNumber(12.5)).toBe("12,5%");
  });

  it('mengembalikan "-" untuk null', () => {
    expect(formatNumber(null)).toBe("-");
  });

  it('mengembalikan "-" untuk undefined dan NaN', () => {
    expect(formatNumber(undefined)).toBe("-");
    expect(formatNumber(Number.NaN)).toBe("-");
  });
});

describe("formatDelta", () => {
  it('mengformat delta positif menjadi "Unggul 13 poin persentase"', () => {
    expect(formatDelta(13, "poin persentase")).toBe(
      "Unggul 13 poin persentase",
    );
  });

  it('mengformat delta negatif dengan koma menjadi "Turun 0,2 poin persentase"', () => {
    expect(formatDelta(-0.2, "poin persentase")).toBe(
      "Turun 0,2 poin persentase",
    );
  });

  it('mengformat nol menjadi "Tidak ada perubahan"', () => {
    expect(formatDelta(0, "poin persentase")).toBe("Tidak ada perubahan");
  });

  it('mengembalikan "-" untuk null', () => {
    expect(formatDelta(null, "poin persentase")).toBe("-");
  });
});

describe("terbilang", () => {
  it("membaca 88 menjadi delapan puluh delapan", () => {
    expect(terbilang(88)).toBe("delapan puluh delapan");
  });

  it("membaca 13 menjadi tiga belas", () => {
    expect(terbilang(13)).toBe("tiga belas");
  });

  it("membaca 11 menjadi sebelas", () => {
    expect(terbilang(11)).toBe("sebelas");
  });

  it("membaca 3,8 menjadi tiga koma delapan", () => {
    expect(terbilang(3.8)).toBe("tiga koma delapan");
  });

  it("membaca 0,2 menjadi nol koma dua", () => {
    expect(terbilang(0.2)).toBe("nol koma dua");
  });

  it("membaca 0 menjadi nol", () => {
    expect(terbilang(0)).toBe("nol");
  });

  it("membaca 2024 menjadi dua ribu dua puluh empat", () => {
    expect(terbilang(2024)).toBe("dua ribu dua puluh empat");
  });
});

describe("spellOutNumberWithUnit", () => {
  it('membaca "88%" menjadi "delapan puluh delapan persen"', () => {
    expect(spellOutNumberWithUnit("88%")).toBe("delapan puluh delapan persen");
  });

  it('membaca "+50%" menjadi "lima puluh persen"', () => {
    expect(spellOutNumberWithUnit("+50%")).toBe("lima puluh persen");
  });

  it('membaca "Rp1,8 triliun" menjadi "Rp satu koma delapan triliun"', () => {
    expect(spellOutNumberWithUnit("Rp1,8 triliun")).toBe(
      "Rp satu koma delapan triliun",
    );
  });
});

describe("spellDelta", () => {
  it('mengubah "Unggul 13 poin persentase" menjadi bacaan layar', () => {
    expect(spellDelta("Unggul 13 poin persentase")).toBe(
      "unggul tiga belas poin persentase",
    );
  });

  it('mengubah "Lebih rendah = lebih baik" menjadi huruf kecil', () => {
    expect(spellDelta("Lebih rendah = lebih baik")).toBe(
      "lebih rendah = lebih baik",
    );
  });
});

describe("buildSekilasAriaLabel", () => {
  it("menghasilkan aria-label deskriptif untuk kartu Layanan", () => {
    const item: SekilasItem = {
      label: "Layanan",
      sublabel: "Tepat waktu",
      value: "88%",
      interpretation: "penyelesaian perizinan",
      delta: "Unggul 13 poin persentase",
      context: "Kota Bandung · 2024 · Data contoh",
    };
    const label = buildSekilasAriaLabel(item);

    expect(label).toContain("Layanan Tepat waktu");
    expect(label).toContain("delapan puluh delapan persen");
    expect(label).toContain("unggul tiga belas poin persentase");
    expect(label).toContain("penyelesaian perizinan");
  });

  it("menghasilkan aria-label deskriptif untuk kartu Penduduk miskin", () => {
    const item: SekilasItem = {
      label: "Penduduk miskin",
      sublabel: "(%)",
      value: "3,8%",
      interpretation: "Turun 0,2 poin persentase",
      delta: "Lebih rendah = lebih baik",
      context: "Kota Bandung · 2024 · Data contoh",
    };
    const label = buildSekilasAriaLabel(item);

    expect(label).toContain("tiga koma delapan persen");
    expect(label).toContain("turun nol koma dua poin persentase");
    expect(label).toContain("lebih rendah = lebih baik");
  });
});

describe("getSekilasInsights", () => {
  it("mengembalikan 3 item sekilas dengan semua field wajib", () => {
    const items = getSekilasInsights();
    expect(items).toHaveLength(3);

    items.forEach((item) => {
      expect(sekilasItemSchema.safeParse(item).success).toBe(true);
      expect(item.label).toBeTruthy();
      expect(item.sublabel).toBeTruthy();
      expect(item.value).toBeTruthy();
      expect(item.interpretation).toBeTruthy();
      expect(item.delta).toBeTruthy();
      expect(item.context).toContain("Data contoh");
    });
  });

  it("mengembalikan data sesuai acceptance criteria", () => {
    const [layanan, realisasi, miskin] = getSekilasInsights();
    expect(layanan.label).toBe("Layanan");
    expect(layanan.value).toBe("88%");
    expect(layanan.delta).toBe("Unggul 13 poin persentase");
    expect(realisasi.label).toBe("Realisasi");
    expect(realisasi.value).toBe("+50%");
    expect(miskin.label).toBe("Penduduk miskin");
    expect(miskin.value).toBe("3,8%");
    expect(miskin.delta).toBe("Lebih rendah = lebih baik");
  });
});
