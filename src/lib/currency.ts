/**
 * Format nilai uang ke gaya rupiah ringkas, mis. 80 → "Rp80 T".
 *
 * Mengembalikan "-" untuk nilai null/undefined/NaN agar ukuran kartu tetap
 * stabil saat data dari mock API belum termuat (menghindari layout shift / CLS).
 *
 * @param trillions Nilai dalam satuan trilyun (contoh 80 = Rp80 trilyun).
 * @param options decimals (default 0) dan unit (default "T").
 */
export interface FormatCurrencyOptions {
  /** Jumlah angka desimal di belakang koma. Default 0 sesuai contoh "Rp80 T". */
  decimals?: number;
  /** Satuan yang ditampilkan di belakang angka. Default "T" = trilyun. */
  unit?: string;
}

export function formatCurrency(
  trillions: number | null | undefined,
  options: FormatCurrencyOptions = {},
): string {
  const { decimals = 0, unit = "T" } = options;
  if (trillions == null || !Number.isFinite(trillions)) {
    return "-";
  }
  const abs = Math.abs(trillions);
  const sign = trillions < 0 ? "−" : "";
  return `Rp${sign}${abs.toFixed(decimals)} ${unit}`;
}

/**
 * Format nilai ke persen, mis. 75 → "75%".
 *
 * Mengembalikan "-" untuk nilai null/undefined/NaN.
 *
 * @param value Nilai persen 0-100.
 * @param options decimals (default 0).
 */
export interface FormatPercentOptions {
  /** Jumlah angka desimal di belakang koma. Default 0 sesuai contoh "75%". */
  decimals?: number;
}

export function formatPercent(
  value: number | null | undefined,
  options: FormatPercentOptions = {},
): string {
  const { decimals = 0 } = options;
  if (value == null || !Number.isFinite(value)) {
    return "-";
  }
  return `${value.toFixed(decimals)}%`;
}
