'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { AccessibleChartTable } from './shared';
import { resolveSeriesColor } from './types';
import type { BaseChartProps } from './types';

export interface LineChartProps extends BaseChartProps {
  /** Render line dots at each data point. */
  showDots?: boolean;
}

/**
 * Line chart for time-series / comparison data.
 */
export function LineChart({
  data,
  xKey,
  series,
  width = 600,
  height = 300,
  className,
  ariaLabel,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  showDots = false,
}: LineChartProps) {
  const label =
    ariaLabel ?? `Grafik garis: ${series.map((s) => s.name).join(', ')}`;

  if (data.length === 0) {
    return (
      <div
        role="status"
        data-testid="chart-empty"
        className={cn(
          'flex min-h-16 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground',
          className,
        )}
      >
        Tidak ada data untuk ditampilkan.
      </div>
    );
  }

  return (
    <div className={cn('min-w-0', className)}>
      <AccessibleChartTable data={data} xKey={xKey} series={series} caption={label} />
      <div aria-hidden="true" className="min-w-0">
        <ResponsiveContainer width={width as number | `${number}%`} height={height as number | `${number}%`}>
          <RechartsLineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
            {showGrid ? <CartesianGrid strokeDasharray="3 3" className="stroke-border" /> : null}
            <XAxis dataKey={xKey} tickLine={false} axisLine={false} className="fill-muted-foreground text-xs" />
            <YAxis tickLine={false} axisLine={false} width={48} className="fill-muted-foreground text-xs" />
            {showTooltip ? <Tooltip /> : null}
            {showLegend ? <Legend /> : null}
            {series.map((s, index) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={resolveSeriesColor(series, index)}
                strokeWidth={2}
                dot={showDots}
                activeDot={{ r: 4 }}
              />
            ))}
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}