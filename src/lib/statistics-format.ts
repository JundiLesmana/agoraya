export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
    .format(value)
    .replace(/\u00a0/g, " ")
    .replace("jt", "Jt");
}

export function calculateTrendPercent(
  current: number,
  previous: number,
): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous < 0) {
    throw new RangeError("Trend values must be finite and non-negative");
  }
  if (previous === 0) return current === 0 ? 0 : null;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}
