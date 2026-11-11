"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectDetail } from "@/modules/project-progress/types";
import type { ProgressReport } from "@/lib/progress";

interface ProjectSummaryCardProps {
  readonly project: ProjectDetail;
  readonly lastPhysical: number | null;
  readonly lastKeuangan: number | null;
  readonly history: readonly ProgressReport[];
}

function coordinatesFor(
  values: readonly number[],
): { readonly x: number; readonly y: number }[] {
  const width = 400;
  const height = 130;
  const padding = 12;
  return values
    .map((value, index) => {
      const x =
        values.length === 1
          ? width / 2
          : padding + (index * (width - padding * 2)) / (values.length - 1);
      const y =
        height -
        padding -
        (Math.min(100, Math.max(0, value)) / 100) * (height - padding * 2);
      return { x, y };
    })
}

function pointsFor(values: readonly number[]): string {
  return coordinatesFor(values)
    .map(({ x, y }) => `${x},${y}`)
    .join(" ");
}

export function ProjectSummaryCard({
  project,
  lastPhysical,
  lastKeuangan,
  history,
}: ProjectSummaryCardProps) {
  const progressReports = history
    .filter(
      (report) =>
        report.status === "submitted" &&
        report.periodeTahun === project.tahunAnggaran,
    )
    .slice()
    .sort(
      (first, second) =>
        first.periodeTahun - second.periodeTahun ||
        first.periodeBulan - second.periodeBulan,
    )
    .slice(-6);
  const physicalValues =
    progressReports.length > 0
      ? progressReports.map((report) => report.progresFisik)
      : [project.progresFisik];
  const financialValues =
    progressReports.length > 0
      ? progressReports.map((report) => report.progresKeuangan)
      : [project.progresKeuangan];
  const periodLabels =
    progressReports.length > 0
      ? progressReports.map((report) =>
          new Date(
            Date.UTC(report.periodeTahun, report.periodeBulan - 1, 1),
          ).toLocaleDateString("id-ID", {
            month: "short",
            year: "2-digit",
            timeZone: "UTC",
          }),
        )
      : ["Data awal"];
  const physicalPoints = coordinatesFor(physicalValues);
  const financialPoints = coordinatesFor(financialValues);
  const latestPhysical = physicalValues[physicalValues.length - 1];
  const latestFinancial = financialValues[financialValues.length - 1];

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{project.namaPaket}</CardTitle>
            <p className="text-muted-foreground text-xs">
              {project.instansi} · {project.lokasi} · {project.sektor}
            </p>
          </div>
          <Badge
            variant={project.status === "Selesai" ? "default" : "secondary"}
          >
            {project.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Nilai kontrak",
              value: `Rp ${new Intl.NumberFormat("id-ID").format(project.nilaiKontrak)}`,
            },
            { label: "Tahun anggaran", value: String(project.tahunAnggaran) },
            { label: "Penyedia", value: project.penyedia },
            {
              label: "Periode kontrak",
              value: `${project.tanggalMulai} – ${project.tanggalSelesai}`,
            },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-muted-foreground text-xs">{item.label}</dt>
              <dd className="mt-1 font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {[
              {
                label: "Progres fisik",
                value: lastPhysical ?? project.progresFisik,
                color: "bg-blue-600",
              },
              {
                label: "Progres keuangan",
                value: lastKeuangan ?? project.progresKeuangan,
                color: "bg-emerald-600",
              },
            ].map((metric) => (
              <div key={metric.label} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-semibold tabular-nums">
                    {metric.value.toFixed(2)}%
                  </span>
                </div>
                <div
                  className="bg-secondary mt-2 h-2 overflow-hidden rounded-full"
                  role="progressbar"
                  aria-label={metric.label}
                  aria-valuenow={metric.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className={`${metric.color} h-full rounded-full`}
                    style={{
                      width: `${Math.min(100, Math.max(0, metric.value))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold">Tren progres proyek</h3>
              <div className="text-muted-foreground flex gap-3 text-xs">
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-blue-600" />
                  Fisik
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="size-2 rounded-full bg-emerald-600" />
                  Keuangan
                </span>
              </div>
            </div>
            <svg
              viewBox="0 0 400 140"
              role="img"
              aria-label={`Tren progres fisik dan keuangan: ${latestPhysical.toFixed(2)} persen fisik dan ${latestFinancial.toFixed(2)} persen keuangan`}
              className="mt-2 h-32 w-full overflow-visible"
              preserveAspectRatio="none"
            >
              {[12, 70, 128].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="400"
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeDasharray="4 5"
                />
              ))}
              <polyline
                points={pointsFor(physicalValues)}
                fill="none"
                className="stroke-blue-600"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={pointsFor(financialValues)}
                fill="none"
                className="stroke-emerald-600"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {physicalValues.map((value, index) => {
                const point = physicalPoints[index];
                return (
                  <circle
                    key={`physical-${periodLabels[index]}`}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    className="fill-blue-600"
                  >
                    <title>
                      {periodLabels[index]} · fisik {value.toFixed(2)}%
                    </title>
                  </circle>
                );
              })}
              {financialValues.map((value, index) => {
                const point = financialPoints[index];
                return (
                  <circle
                    key={`financial-${periodLabels[index]}`}
                    cx={point.x}
                    cy={point.y}
                    r="3.5"
                    className="fill-emerald-600"
                  >
                    <title>
                      {periodLabels[index]} · keuangan {value.toFixed(2)}%
                    </title>
                  </circle>
                );
              })}
            </svg>
            <div className="text-muted-foreground flex justify-between text-[10px]">
              <span>{periodLabels[0]}</span>
              {periodLabels.length > 1 ? (
                <span>{periodLabels[periodLabels.length - 1]}</span>
              ) : null}
            </div>
            {progressReports.length === 0 ? (
              <p className="text-muted-foreground mt-2 text-xs">
                Belum ada laporan terkirim. Grafik menggunakan data awal proyek.
              </p>
            ) : null}
          </div>
        </section>

        {lastPhysical != null ? (
          <p className="text-muted-foreground text-xs">
            Nilai progres mengikuti laporan terakhir yang diserahkan.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
