export type ChartDatum = Record<string, string | number | Date | null | undefined>;

export interface ChartSeries {
  key: string;
  name: string;
  color?: string;
}

export type ChartDimension = number | `${number}%`;

export interface BaseChartProps {
  data: ChartDatum[];
  xKey: string;
  series: ChartSeries[];
  width?: ChartDimension;
  height?: ChartDimension;
  className?: string;
  ariaLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

export const DEFAULT_CHART_PALETTE = [
  '#2563eb',
  '#f97316',
  '#0891b2',
  '#7c3aed',
  '#059669',
  '#dc2626',
  '#d97706',
  '#db2777',
] as const;

export function resolveSeriesColor<T extends ChartSeries>(
  series: readonly T[],
  index: number,
): string {
  const palette = DEFAULT_CHART_PALETTE;
  return series[index]?.color ?? palette[index % palette.length];
}

export type { ChartDatum as ChartData };