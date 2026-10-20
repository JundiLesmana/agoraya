'use client';

import * as React from 'react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { AccessibleChartTable } from './shared';
import type { ChartDatum } from './types';
import { DEFAULT_CHART_PALETTE } from './types';

export interface PieDatum {
  name: string;
  value: number;
}

export interface PieChartProps {
  data: readonly PieDatum[];
  /** Per-slice color palette (defaults to the shared chart palette). */
  colors?: readonly string[];
  width?: number | string;
  height?: number | string;
  className?: string;
  ariaLabel?: string;
  showLegend?: boolean;
  showTooltip?: boolean;
  /** Inner radius for a donut style. */
  innerRadius?: number | `${number}%`;
  outerRadius?: number | `${number}%`;
}

/**
 * Pie / donut chart for share-of-total data.
 */
export function PieChart({
  data,
  colors = DEFAULT_CHART_PALETTE,
  width = 600,
  height = 300,
  className,
  ariaLabel,
  showLegend = true,
  showTooltip = true,
  innerRadius = '50%',
  outerRadius = '80%',
}: PieChartProps) {
  const label = ariaLabel ?? 'Grafik pie';

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

  const tableData: ChartDatum[] = data.map((d) => ({ name: d.name, value: d.value }));

  return (
    <div className={cn('min-w-0', className)}>
      <AccessibleChartTable
        data={tableData}
        xKey="name"
        series={[{ key: 'value', name: 'Nilai' }]}
        caption={label}
      />
      <div aria-hidden="true" className="min-w-0">
        <ResponsiveContainer width={width as number | `${number}%`} height={height as number | `${number}%`}>
          <RechartsPieChart>
            <Pie
              data={data as unknown as PieDatum[]}
              dataKey="value"
              nameKey="name"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              strokeWidth={1}
            >
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip ? <Tooltip /> : null}
            {showLegend ? <Legend /> : null}
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}