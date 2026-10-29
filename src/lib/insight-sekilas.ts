/**
 * Data dan formatter untuk halaman "Sekilas, apa yang berubah?" — 3 kartu KPI
 * yang menyajikan perubahan kunci dengan konteks dalam hitungan detik.
 *
 * Kontrak API: GET /api/insight/sekilas mengembalikan daftar 3 item dengan
 * struktur { label, sublabel, value, interpretation, delta, context }.
 *
 * Semua data di bawah ini masih simulasi (TODO #76: ganti dengan data nyata).
 */

import { z } from "zod";

export const sekilasItemSchema = z.object({
  label: z.string().min(1),
  sublabel: z.string().min(1),
  value: z.string().min(1),
  interpretation: z.string().min(1),
  delta: z.string().min(1),
  context: z.string().min(1),
});

export type SekilasItem = z.infer<typeof sekilasItemSchema>;

export const sekilasItemsSchema = z.array(sekilasItemSchema);

export interface SekilasFilters {
  wilayah?: string | null;
  fokus?: string | null;
  periode?: string | null;
}

export interface FormatNumberOptions {
  /** Jumlah angka desimal. Jika tidak diisi: 0 untuk bulat, 1 untuk desimal. */
  decimals?: number;
  /** Awalan tanda "+" untuk nilai positif. Default tidak ada awalan. */
  sign?: "none" | "plus";
  /** Satuan yang disisipkan di akhir, misal "%". Default "%". */
  unit?: string;
}

/**
 * Format angka menurut locale Indonesia (koma sebagai desimal, titik ribuan)
 * dan menyisipkan satuan, misal formatNumber(88) → "88%",
 * formatNumber(3.8) → "3,8%", formatNumber(50, { sign: 'plus' }) → "+50%".
 * Mengembalikan "-" untuk null/undefined/NaN agar ukuran kartu stabil.
 */
export function formatNumber(
  value: number | null | undefined,
  options: FormatNumberOptions = {},
): string {
  const { decimals, sign = "none", unit = "%" } = options;

  if (value == null || !Number.isFinite(value)) {
    return "-";
  }

  const abs = Math.abs(value);
  const fractionDigits = decimals ?? (Number.isInteger(abs) ? 0 : 1);
  const formatted = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(abs);

  let prefix = "";
  if (sign === "plus" && value > 0) {
    prefix = "+";
  }

  return `${prefix}${formatted}${unit}`;
}

export interface FormatDeltaOptions {
  labelPos?: string;
  labelNeg?: string;
  labelZero?: string;
  decimals?: number;
}

/**
 * Format delta perubahan, misal:
 * formatDelta(13, "poin persentase") → "Unggul 13 poin persentase"
 * formatDelta(-0.2, "poin persentase") → "Turun 0,2 poin persentase"
 * formatDelta(0, "poin persentase") → "Tidak ada perubahan"
 */
export function formatDelta(
  value: number | null | undefined,
  unit: string,
  options: FormatDeltaOptions = {},
): string {
  const {
    labelPos = "Unggul",
    labelNeg = "Turun",
    labelZero = "Tidak ada perubahan",
    decimals,
  } = options;

  if (value == null || !Number.isFinite(value)) {
    return "-";
  }

  const abs = Math.abs(value);
  const numberText = formatNumber(abs, { decimals, sign: "none", unit: "" });

  if (value > 0) {
    return `${labelPos} ${numberText} ${unit}`;
  }
  if (value < 0) {
    return `${labelNeg} ${numberText} ${unit}`;
  }
  return labelZero;
}

const SATUAN = [
  "",
  "satu",
  "dua",
  "tiga",
  "empat",
  "lima",
  "enam",
  "tujuh",
  "delapan",
  "sembilan",
];

function parseIdNumber(text: string): number | null {
  const cleaned = text.replace(",", ".");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function terbilangBulat(n: number): string {
  if (n === 0) {
    return "";
  }
  if (n < 10) {
    return SATUAN[n];
  }
  if (n === 10) {
    return "sepuluh";
  }
  if (n === 11) {
    return "sebelas";
  }
  if (n < 20) {
    return `${SATUAN[n - 10]} belas`;
  }
  if (n < 100) {
    const puluh = Math.floor(n / 10);
    const satuan = n % 10;
    return `${SATUAN[puluh]} puluh${satuan ? ` ${SATUAN[satuan]}` : ""}`;
  }
  if (n < 1000) {
    const ratus = Math.floor(n / 100);
    const sisa = n % 100;
    const head = ratus === 1 ? "seratus" : `${SATUAN[ratus]} ratus`;
    return sisa ? `${head} ${terbilangBulat(sisa)}` : head;
  }

  const groups = [
    { divisor: 1_000_000_000_000, label: "triliun" },
    { divisor: 1_000_000_000, label: "miliar" },
    { divisor: 1_000_000, label: "juta" },
    { divisor: 1_000, label: "ribu" },
  ];

  for (const { divisor, label } of groups) {
    if (n >= divisor) {
      const depan = Math.floor(n / divisor);
      const belakang = n % divisor;
      const depanText =
        divisor === 1_000 && depan === 1
          ? "seribu"
          : `${terbilangBulat(depan)} ${label}`;
      return belakang ? `${depanText} ${terbilangBulat(belakang)}` : depanText;
    }
  }

  return String(n);
}

/**
 * Ubah angka ke kata-kata Indonesia untuk label aksesibilitas layar,
 * misal terbilang(88) → "delapan puluh delapan",
 * terbilang(3.8) → "tiga koma delapan", terbilang(0) → "nol".
 */
export function terbilang(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }
  if (value < 0) {
    return `minus ${terbilang(-value)}`;
  }

  const bulat = Math.trunc(value);
  const desimal = value - bulat;
  let result = terbilangBulat(bulat);

  if (desimal > 0) {
    const digits = desimal.toFixed(3).slice(2).replace(/0+$/, "");
    const bacaDesimal = digits
      .split("")
      .map((d) => SATUAN[+d] ?? "nol")
      .join(" ");
    result = result
      ? `${result} koma ${bacaDesimal}`
      : `nol koma ${bacaDesimal}`;
  }

  return result || "nol";
}

/**
 * Ganti token angka dalam teks dengan bacaan Indonesia, sambil mempertahankan
 * satuan "%", misal "88%" → "delapan puluh delapan persen",
 * "Rp1,8 triliun" → "Rp satu koma delapan triliun".
 */
export function spellOutNumberWithUnit(text: string): string {
  return text
    .replace(/^[+-]+/, "")
    .replace(/\bRp([\d.,]+)\b/g, (_match, angka) => {
      const parsed = parseIdNumber(angka);
      return parsed == null ? _match : `Rp ${terbilang(parsed)}`;
    })
    .replace(/([\d.,]+)(%)?/g, (_match, angka, satuan) => {
      const parsed = parseIdNumber(angka);
      return parsed == null
        ? _match
        : `${terbilang(parsed)}${satuan ? " persen" : ""}`;
    });
}

/**
 * Ubah teks delta menjadi bacaan layar yang ramah, misal:
 * "Unggul 13 poin persentase" → "unggul tiga belas poin persentase"
 * "Lebih rendah = lebih baik" → "lebih rendah = lebih baik"
 */
export function spellDelta(delta: string): string {
  return delta
    .replace(
      /^([A-Za-z]+)\s+([\d.,]+)%?(?:\s+(.*))?$/,
      (_match, kataAwal, angka, sisa) => {
        const parsed = parseIdNumber(angka);
        const kataAngka = parsed == null ? angka : terbilang(parsed);
        const tail = sisa ? ` ${sisa}` : "";
        return `${kataAwal.toLowerCase()} ${kataAngka}${tail}`;
      },
    )
    .replace(/([\d.,]+)%?/g, (match, angka) => {
      const parsed = parseIdNumber(angka);
      return parsed == null ? match : `${terbilang(parsed)}`;
    })
    .toLowerCase();
}

/**
 * Susun aria-label deskriptif untuk kartu KPI, contoh:
 * "Layanan Tepat waktu. delapan puluh delapan persen. unggul tiga belas poin
 * persentase. penyelesaian perizinan."
 */
export function buildSekilasAriaLabel(item: SekilasItem): string {
  const head = [item.label, item.sublabel].filter(Boolean).join(" ");
  const valuePart = spellOutNumberWithUnit(item.value);
  const deltaPart = spellDelta(item.delta);
  const interpretationPart = spellOutNumberWithUnit(
    item.interpretation,
  ).toLowerCase();

  return `${head}. ${valuePart}. ${deltaPart}. ${interpretationPart}`;
}

/**
 * Data contoh untuk 3 kartu KPI "Sekilas, apa yang berubah?".
 * Sesuai kriteria terima: Layanan 88%, Realisasi +50%, Penduduk miskin 3,8%.
 */
export const MOCK_SEKILAS_INSIGHTS: SekilasItem[] = [
  {
    label: "Layanan",
    sublabel: "Tepat waktu",
    value: "88%",
    interpretation: "penyelesaian perizinan",
    delta: "Unggul 13 poin persentase",
    context: "Kota Bandung · 2024 · Data contoh",
  },
  {
    label: "Realisasi",
    sublabel: "Anggaran",
    value: "+50%",
    interpretation: "Naik dari Rp1,8 triliun menjadi Rp2,7 triliun",
    delta: "90% anggaran terealisasi pada 2024",
    context: "Kota Bandung · 2020-2024 · Data contoh",
  },
  {
    label: "Penduduk miskin",
    sublabel: "(%)",
    value: "3,8%",
    interpretation: "Turun 0,2 poin persentase",
    delta: "Lebih rendah = lebih baik",
    context: "Kota Bandung · 2024 · Data contoh",
  },
];

/**
 * Ambil data 3 kartu sekilas. Sekarang masih mengembalikan data simulasi;
 * filter disimpan untuk kompatibilitas dengan frontend saat data nyala dipasang.
 *
 * TODO(#76): ganti dengan pemanggilan data nyata (BPS / sistem layanan daerah)
 * berdasarkan filter wilayah, fokus, dan periode.
 */
export function getSekilasInsights(
  filters: SekilasFilters = {},
): SekilasItem[] {
  const { wilayah, fokus, periode } = filters;
  void wilayah;
  void fokus;
  void periode;
  return MOCK_SEKILAS_INSIGHTS;
}
