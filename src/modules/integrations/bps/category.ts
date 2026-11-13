export type BpsIndicatorCategory =
  "Penduduk" | "Ekonomi" | "Kesejahteraan" | "Statistik";

const CATEGORY_PATTERNS: readonly [BpsIndicatorCategory, RegExp][] = [
  [
    "Kesejahteraan",
    /\b(kesejahteraan|ipm|indeks pembangunan manusia|harapan hidup|pendidikan|kesehatan|sanitasi|miskin|kemiskinan)\b/i,
  ],
  [
    "Penduduk",
    /\b(penduduk|populasi|demografi|kepadatan|kelahiran|migrasi)\b/i,
  ],
  [
    "Ekonomi",
    /\b(ekonomi|pengangguran|inflasi|pdrb|produk domestik|pertumbuhan ekonomi)\b/i,
  ],
];

export function categorizeBpsIndicator(
  indicatorName: string,
): BpsIndicatorCategory {
  return (
    CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(indicatorName))?.[0] ??
    "Statistik"
  );
}