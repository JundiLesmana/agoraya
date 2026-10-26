"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SourceBadge } from "@/components/source-badges";

export interface SectorProjectCount {
  sector: string;
  completed: number;
  total: number;
}

export interface SectorCompletionDatum extends SectorProjectCount {
  percent: number;
}

// TODO: Replace with aggregated sector data when the dashboard API provides it.
const SECTOR_PROJECT_COUNTS: SectorProjectCount[] = [
  { sector: "Infrastruktur", completed: 52, total: 80 },
  { sector: "Pendidikan", completed: 39, total: 60 },
  { sector: "Kesehatan", completed: 39, total: 60 },
  { sector: "Sektor lainnya", completed: 26, total: 40 },
];

export function buildSectorCompletionData(
  sectors: readonly SectorProjectCount[],
): SectorCompletionDatum[] {
  return sectors.map((sector) => ({
    ...sector,
    percent:
      sector.total === 0
        ? 0
        : Math.round((sector.completed / sector.total) * 100),
  }));
}

export function SectorCompletionChart() {
  const data = buildSectorCompletionData(SECTOR_PROJECT_COUNTS);
  const [activeSector, setActiveSector] = React.useState<string | null>(null);

  return (
    <Card className="gap-4">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-xl">Penyelesaian per sektor</CardTitle>
            <CardDescription>
              Jumlah proyek selesai dibanding total di tiap sektor
            </CardDescription>
          </div>
          <SourceBadge source="SIMULATED" />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="sr-only">
          <table>
            <caption>Penyelesaian proyek per sektor</caption>
            <thead>
              <tr>
                <th scope="col">Sektor</th>
                <th scope="col">Proyek selesai</th>
                <th scope="col">Total proyek</th>
                <th scope="col">Persentase selesai</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item) => (
                <tr key={item.sector}>
                  <th scope="row">{item.sector}</th>
                  <td>{item.completed}</td>
                  <td>{item.total}</td>
                  <td>{item.percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul
          aria-label="Grafik penyelesaian proyek per sektor"
          className="space-y-4"
        >
          {data.map((item) => {
            const isActive = activeSector === item.sector;
            const tooltipId = `sector-tooltip-${item.sector.toLowerCase().replaceAll(" ", "-")}`;

            return (
              <li key={item.sector} className="space-y-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                  <span className="text-foreground font-medium">
                    {item.sector}
                  </span>
                  <span className="text-muted-foreground">
                    {item.completed} / {item.total} proyek
                  </span>
                </div>
                <div
                  aria-describedby={isActive ? tooltipId : undefined}
                  aria-label={`${item.sector}: ${item.completed} dari ${item.total} proyek selesai, ${item.percent}%`}
                  aria-valuemax={100}
                  aria-valuemin={0}
                  aria-valuenow={item.percent}
                  aria-valuetext={`${item.completed} dari ${item.total} proyek selesai`}
                  className="group bg-muted focus-visible:ring-ring relative h-2 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  role="progressbar"
                  tabIndex={0}
                  onBlur={() => setActiveSector(null)}
                  onFocus={() => setActiveSector(item.sector)}
                  onMouseEnter={() => setActiveSector(item.sector)}
                  onMouseLeave={() => setActiveSector(null)}
                >
                  <div
                    aria-hidden="true"
                    className="bg-primary h-full rounded-full transition-[width]"
                    style={{ width: `${item.percent}%` }}
                  />
                  {isActive ? (
                    <div
                      className="bg-background text-foreground absolute bottom-full left-0 z-10 mb-2 rounded-md border px-3 py-2 text-sm whitespace-nowrap shadow-md"
                      id={tooltipId}
                      role="tooltip"
                    >
                      {item.completed} dari {item.total} proyek selesai (
                      {item.percent}%)
                    </div>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
        <div
          aria-label="Keterangan grafik"
          className="text-muted-foreground flex flex-wrap gap-x-5 gap-y-2 text-xs"
        >
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="bg-primary size-2 rounded-sm" />
            Selesai
          </span>
          <span className="flex items-center gap-2">
            <span aria-hidden="true" className="bg-muted size-2 rounded-sm" />
            Total proyek
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
