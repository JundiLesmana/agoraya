import type { HTMLAttributes } from 'react';
import type { ChartDatum, ChartSeries } from './types';

/**
 * Visually-hidden data table that mirrors the chart. Screen-reader
 * users get the full dataset instead of a pixel graphic.
 */
export function AccessibleChartTable({
  data,
  xKey,
  series,
  caption,
  ...rest
}: {
  data: readonly ChartDatum[];
  xKey: string;
  series: readonly ChartSeries[];
  caption: string;
} & HTMLAttributes<HTMLTableElement>) {
  return (
    <table className="sr-only" {...rest}>
      <caption>{caption}</caption>
      <thead>
        <tr>
          <th scope="col">{xKey}</th>
          {series.map((s) => (
            <th key={s.key} scope="col">
              {s.name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={`${xKey}-${rowIndex}`}>
            <th scope="row">{String(row[xKey] ?? '')}</th>
            {series.map((s) => (
              <td key={s.key}>{String(row[s.key] ?? '')}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}