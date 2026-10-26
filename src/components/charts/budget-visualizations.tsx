'use client';

import * as React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type LegendPayload,
  type TooltipContentProps,
} from 'recharts';
import { Maximize2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AccessibleChartTable } from './shared';
import { DEFAULT_CHART_PALETTE, resolveSeriesColor } from './types';
import { formatChartValue, formatTrillion } from './chart-formatters';

export interface BudgetTrendDatum {
  month: string;
  target: number;
  realisasi: number;
}

export interface SectorAllocationDatum {
  sector: string;
  pagu: number;
  realisasi: number;
}

export function transformTrendData(data: readonly BudgetTrendDatum[]) {
  return data.map((item) => ({
    month: item.month,
    target: item.target,
    realisasi: item.realisasi,
  }));
}

export function transformSectorAllocationData(data: readonly SectorAllocationDatum[]) {
  return data.map((item) => ({
    sector: item.sector,
    pagu: item.pagu,
    realisasi: item.realisasi,
  }));
}

type TrendSeriesKey = 'target' | 'realisasi';

function CustomTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{String(label)}</p>
      <div className="mt-1 space-y-1 text-muted-foreground">
        {payload.map((entry) => (
          <p key={entry.name} style={{ color: entry.color ?? undefined }}>
            {entry.name}: {formatTrillion(Number(entry.value ?? 0))}
          </p>
        ))}
      </div>
    </div>
  );
}

function PieTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{String(entry.name)}</p>
      <p className="text-muted-foreground">{formatTrillion(Number(entry.value ?? 0))}</p>
    </div>
  );
}

function LegendContent({ payload }: { payload?: readonly LegendPayload[] }) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function BudgetVisualizations() {
  const trendData = React.useMemo(
    () =>
      transformTrendData([
        { month: 'Jan', target: 4, realisasi: 3 },
        { month: 'Feb', target: 8, realisasi: 6.5 },
        { month: 'Mar', target: 16, realisasi: 12 },
        { month: 'Apr', target: 22, realisasi: 18 },
        { month: 'Mei', target: 28, realisasi: 22 },
        { month: 'Jun', target: 34, realisasi: 27 },
        { month: 'Jul', target: 41, realisasi: 33 },
        { month: 'Agu', target: 54, realisasi: 44 },
        { month: 'Sep', target: 64, realisasi: 60 },
      ]),
    [],
  );

  const sectorData = React.useMemo(
    () =>
      transformSectorAllocationData([
        { sector: 'Pendidikan', pagu: 32, realisasi: 24 },
        { sector: 'Kesehatan', pagu: 20, realisasi: 15 },
        { sector: 'Infrastruktur', pagu: 16, realisasi: 12 },
        { sector: 'Lainnya', pagu: 12, realisasi: 9 },
      ]),
    [],
  );

  const [hiddenSeries, setHiddenSeries] = React.useState<Record<TrendSeriesKey, boolean>>({
    target: false,
    realisasi: false,
  });

  const toggleSeries = React.useCallback((key: TrendSeriesKey) => {
    setHiddenSeries((current) =>
      key === 'target'
        ? { ...current, target: !current.target }
        : { ...current, realisasi: !current.realisasi },
    );
  }, []);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Tren realisasi anggaran</CardTitle>
          <CardDescription>Kumulatif Januari–September 2025 · triliun rupiah</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex gap-4">
              {([
                { key: 'target', name: 'Target realisasi' },
                { key: 'realisasi', name: 'Realisasi' },
              ] satisfies { key: TrendSeriesKey; name: string }[]).map((series, index) => (
                <button
                  key={series.key}
                  type="button"
                  onClick={() => toggleSeries(series.key)}
                  className="flex items-center gap-2"
                >
                  <span className="h-0.5 w-4" style={{ backgroundColor: resolveSeriesColor([{ key: series.key, name: series.name }], index) }} />
                  <span className={hiddenSeries[series.key] ? 'line-through' : ''}>{series.name}</span>
                </button>
              ))}
            </div>
            <Maximize2 className="size-4" aria-hidden="true" />
          </div>
          <div aria-label="Grafik tren realisasi anggaran">
            <ResponsiveContainer width="100%" height={280}>
              <RechartsLineChart data={trendData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} className="fill-muted-foreground text-xs" />
                <YAxis tickFormatter={(value) => formatChartValue(Number(value)).replace('Rp', '').replace(' T', '')} tickLine={false} axisLine={false} />
                <Tooltip content={CustomTooltip} />
                <Legend content={<LegendContent />} />
                {!hiddenSeries.target && <Line type="monotone" dataKey="target" name="Target realisasi" stroke="#2563eb" strokeWidth={2} dot={false} />}
                {!hiddenSeries.realisasi && <Line type="monotone" dataKey="realisasi" name="Realisasi" stroke="#059669" strokeWidth={2} dot={false} />}
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
          <AccessibleChartTable data={trendData} xKey="month" series={[{ key: 'target', name: 'Target realisasi' }, { key: 'realisasi', name: 'Realisasi' }]} caption="Grafik tren realisasi anggaran" />
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Alokasi per sektor</CardTitle>
          <CardDescription>Pagu dan realisasi · triliun rupiah</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /> Pagu anggaran</span>
            <span className="flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500" /> Realisasi</span>
          </div>
          <div className="space-y-4">
            {sectorData.map((item) => (
              <div key={item.sector}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{item.sector}</span>
                  <span className="text-muted-foreground">{formatTrillion(item.realisasi)} / {formatTrillion(item.pagu)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(item.pagu / 32) * 100}%` }} />
                  <div className="mt-1 h-2 rounded-full bg-emerald-500" style={{ width: `${(item.realisasi / 32) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div aria-label="Grafik alokasi per sektor">
            <ResponsiveContainer width="100%" height={260}>
              <RechartsPieChart>
                <Pie data={sectorData.map((item) => ({ name: item.sector, value: item.realisasi }))} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={2} strokeWidth={1}>
                  {sectorData.map((entry, index) => (
                    <Cell key={entry.sector} fill={DEFAULT_CHART_PALETTE[index % DEFAULT_CHART_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip content={PieTooltip} />
                <Legend content={<LegendContent />} />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <AccessibleChartTable data={sectorData.map((item) => ({ sector: item.sector, pagu: item.pagu, realisasi: item.realisasi }))} xKey="sector" series={[{ key: 'pagu', name: 'Pagu anggaran' }, { key: 'realisasi', name: 'Realisasi' }]} caption="Grafik alokasi per sektor" />
        </CardContent>
      </Card>
    </section>
  );
}
