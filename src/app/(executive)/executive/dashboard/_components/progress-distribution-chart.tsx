'use client';

import * as React from 'react';
import {
  Cell,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
} from 'recharts';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import type { ProjectSummary } from '@/lib/summary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SourceBadge } from '@/components/source-badges';

type DistributionDatum = {
  name: 'Selesai' | 'Berjalan' | 'Tertunda';
  value: number;
  percent: number;
  color: string;
};

const CHART_COLORS = {
  selesai: '#2fb58b',
  berjalan: '#3b82f6',
  tertunda: '#f59e0b',
} as const;

export function buildProgressDistributionData(summary: ProjectSummary): DistributionDatum[] {
  const total = summary.totalProyek || summary.selesai + summary.berjalan + summary.tertunda;
  const entries: DistributionDatum[] = [
    {
      name: 'Selesai',
      value: summary.selesai,
      percent: Math.round((summary.selesai / total) * 100),
      color: CHART_COLORS.selesai,
    },
    {
      name: 'Berjalan',
      value: summary.berjalan,
      percent: Math.round((summary.berjalan / total) * 100),
      color: CHART_COLORS.berjalan,
    },
    {
      name: 'Tertunda',
      value: summary.tertunda,
      percent: Math.round((summary.tertunda / total) * 100),
      color: CHART_COLORS.tertunda,
    },
  ];

  return entries;
}

function DistributionTooltip({ active, payload }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const datum = payload[0]?.payload as DistributionDatum | undefined;
  if (!datum) return null;

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="font-medium text-foreground">{datum.name}</p>
      <p className="text-sm text-muted-foreground">
        {datum.value} proyek · {datum.percent}%
      </p>
    </div>
  );
}

export function ProgressDistributionChart({ summary }: { summary: ProjectSummary }) {
  const data = buildProgressDistributionData(summary);

  return (
    <Card className="gap-4">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Progres penyelesaian</CardTitle>
            <CardDescription>240 proyek · status per 30 September 2025</CardDescription>
          </div>
          <SourceBadge source="SIMULATED" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-h-[260px] min-w-0">
            <div className="sr-only">
              <table>
                <caption>Distribusi status proyek</caption>
                <thead>
                  <tr>
                    <th scope="col">Status</th>
                    <th scope="col">Jumlah proyek</th>
                    <th scope="col">Persentase</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item) => (
                    <tr key={item.name}>
                      <th scope="row">{item.name}</th>
                      <td>{item.value}</td>
                      <td>{item.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="relative h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Tooltip content={DistributionTooltip} />
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="68%"
                    outerRadius="88%"
                    paddingAngle={2}
                    stroke="transparent"
                    isAnimationActive={false}
                  >
                    {data.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                <div>
                  <p className="text-3xl font-semibold tracking-tight text-foreground">240 proyek</p>
                  <p className="text-sm text-muted-foreground">status per 30 September 2025</p>
                </div>
              </div>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground lg:flex-col lg:items-start">
              {data.map((entry) => (
                <li key={entry.name} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span>
                    {entry.name} · {entry.percent}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
          12 proyek tertunda memerlukan perhatian. Periksa progres fisik.
        </div>
        <p className="text-sm text-muted-foreground">
          Persentase berdasarkan jumlah proyek, bukan rata-rata progres fisik.
        </p>
      </CardContent>
    </Card>
  );
}
