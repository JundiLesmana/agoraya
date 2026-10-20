/** A single row of chart data (one category/value per key). */
export type ChartDatum = Record<string, string | number | Date | null | undefined>;

/** A series to plot against a chart. */
export interface ChartSeries {
  /** Data key inside each datum. */
  key: string;
  /** Human-readable label shown in legend/tooltip/table. */
  name: string;
  /** Optional explicit color; otherwise the shared palette is used. */
  color?: string;
}

/** Responsive width, fixed pixel width, or a percentage string. */
export type ChartDimension = number | `${number}%`;

export interface BaseChartProps {
  data: ChartDatum[];
  /** Key used for the categorical (x) axis. */
  xKey: string;
  series: ChartSeries[];
  /** Chart width. Pass `'100%'` for responsive usage. */
  width?: ChartDimension;
  /** Chart height in pixels. */
  height?: ChartDimension;
  /** Extra classes for the chart wrapper. */
  className?: string;
  /** Accessible description (used as the sr-only table caption). */
  ariaLabel?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

/** Default categorical palette shared across chart components. */
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

/** Resolve the color for a series at the given index. */
export function resolveSeriesColor<T extends ChartSeries>(
  series: readonly T[],
  index: number,
): string {
  const palette = DEFAULT_CHART_PALETTE;
  return series[index]?.color ?? palette[index % palette.length];
}

export type { ChartDatum as ChartData };