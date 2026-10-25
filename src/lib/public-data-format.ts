const rupiahShortFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 1,
});

const rupiahFullFormatter = new Intl.NumberFormat("id-ID", {
  maximumFractionDigits: 0,
});

export function formatRupiah(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError("Nilai Rupiah harus berupa angka yang valid.");
  }

  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absoluteValue >= 1_000_000_000_000) {
    return `${sign}Rp${rupiahShortFormatter.format(absoluteValue / 1_000_000_000_000)}T`;
  }

  if (absoluteValue >= 1_000_000_000) {
    return `${sign}Rp${rupiahShortFormatter.format(absoluteValue / 1_000_000_000)}M`;
  }

  return `${sign}Rp${rupiahFullFormatter.format(absoluteValue)}`;
}

export function formatRupiahForScreenReader(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError("Nilai Rupiah harus berupa angka yang valid.");
  }

  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "minus " : "";

  if (absoluteValue >= 1_000_000_000_000) {
    return `${sign}${rupiahShortFormatter.format(absoluteValue / 1_000_000_000_000)} triliun rupiah`;
  }

  if (absoluteValue >= 1_000_000_000) {
    return `${sign}${rupiahShortFormatter.format(absoluteValue / 1_000_000_000)} miliar rupiah`;
  }

  return `${sign}${rupiahFullFormatter.format(absoluteValue)} rupiah`;
}

export function formatPersentase(value: number): string {
  if (!Number.isFinite(value)) {
    throw new RangeError("Nilai persentase harus berupa angka yang valid.");
  }

  return `${Math.round(value * 100)}%`;
}
