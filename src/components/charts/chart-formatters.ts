export function formatTrillion(value: number): string {
  return `Rp${value.toLocaleString('id-ID')} T`;
}

export function formatChartValue(value: number | string | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  return formatTrillion(value);
}

