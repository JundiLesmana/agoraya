"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProjectDetail } from "@/modules/project-progress/types";

interface ProjectSummaryCardProps {
  readonly project: ProjectDetail;
  readonly lastPhysical: number | null;
  readonly lastKeuangan: number | null;
}

export function ProjectSummaryCard({
  project,
  lastPhysical,
  lastKeuangan,
}: ProjectSummaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kartu Ringkasan Proyek</CardTitle>
        <p className="text-muted-foreground text-xs">
          Detail kontrak proyek yang menjadi tanggung jawab Anda.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-muted-foreground text-xs">Nama Paket</dt>
            <dd className="m-0 font-medium">{project.namaPaket}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Instansi</dt>
            <dd className="m-0 font-medium">{project.instansi}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">
              Penyedia / Kontraktor
            </dt>
            <dd className="m-0 font-medium">{project.penyedia}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Lokasi</dt>
            <dd className="m-0 font-medium">{project.lokasi}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Sektor</dt>
            <dd className="m-0 font-medium">{project.sektor}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Nilai Kontrak</dt>
            <dd className="m-0 font-medium">
              Rp {new Intl.NumberFormat("id-ID").format(project.nilaiKontrak)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">
              Tanggal Mulai &amp; Selesai
            </dt>
            <dd className="m-0 font-medium">
              {project.tanggalMulai} – {project.tanggalSelesai}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Tahun Anggaran</dt>
            <dd className="m-0 font-medium">{project.tahunAnggaran}</dd>
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-1">
            <dt className="text-muted-foreground text-xs">Status Kontrak</dt>
            <dd className="m-0">
              <Badge
                variant={project.status === "Selesai" ? "default" : "secondary"}
              >
                {project.status}
              </Badge>
            </dd>
          </div>
        </div>

        <section className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground text-sm">
              Progres Keseluruhan Saat Ini
            </span>
            <span className="font-medium tabular-nums">
              {project.progresFisik.toFixed(2)}%
            </span>
          </div>
          <div className="bg-secondary border-border dark:border-secondary/50 h-2.5 w-full overflow-hidden rounded-full border">
            <div
              className="bg-primary h-2.5 rounded-full"
              style={{
                width: `${Math.min(100, Math.max(0, project.progresFisik))}%`,
              }}
              role="progressbar"
              aria-valuenow={project.progresFisik}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progres fisik ${project.progresFisik.toFixed(2)} persen`}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="flex flex-col">
              <span className="text-muted-foreground">Fisik</span>
              <span className="font-medium">
                {project.progresFisik.toFixed(2)}%
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground">Keuangan</span>
              <span className="font-medium">
                {project.progresKeuangan.toFixed(2)}%
              </span>
            </div>
          </div>
        </section>

        {lastPhysical != null && (
          <p className="text-muted-foreground text-xs">
            Pelaporan terakhir: fisik {lastPhysical.toFixed(2)}% · keuangan{" "}
            {lastKeuangan?.toFixed(2) ?? "-"}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
