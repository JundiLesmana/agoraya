"use client";

import { useState } from "react";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Download,
  Flag,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { SourceBadge } from "@/components/source-badges/source-badge";

const PROJECT = {
  name: "Rehabilitasi 12 sekolah",
  location: "Kab. Bogor",
  sector: "Pendidikan",
  agency: "Dinas Pendidikan",
  description:
    "Perbaikan ruang kelas dan sanitasi pada 12 sekolah di Kabupaten Bogor. Target penerima manfaat: 3.000 siswa",
  physicalProgress: 75,
  budget: 80_000_000_000,
  realization: 60_000_000_000,
  updatedAt: "30 September 2025",
} as const;

const MILESTONES = [
  {
    title: "Perencanaan selesai",
    date: "31 Jan 2025",
    dateTime: "2025-01-31",
    detail: "Rencana dan lingkup disetujui",
    Icon: CheckCircle2,
  },
  {
    title: "9 dari 12 sekolah selesai",
    date: "30 Sep 2025",
    dateTime: "2025-09-30",
    detail: "3 sekolah masih dikerjakan",
    Icon: LoaderCircle,
  },
  {
    title: "Target selesai",
    date: "31 Des 2025",
    dateTime: "2025-12-31",
    detail: "Penyelesaian seluruh sekolah",
    Icon: Flag,
  },
] as const;

const CURRENCY_FORMATTER = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  notation: "compact",
  maximumFractionDigits: 0,
});

export function formatRupiahCompact(amount: number): string {
  return CURRENCY_FORMATTER.format(amount)
    .replace(/^Rp\s*/, "Rp")
    .replace(/\u00a0/g, " ");
}

export function getRealizationPercentage(
  realization: number,
  budget: number,
): number {
  return Math.round((realization / budget) * 100);
}

function csvField(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function buildFeaturedProjectReport(): string {
  const headers = [
    "nama_proyek",
    "lokasi",
    "sektor",
    "instansi",
    "deskripsi",
    "target_penerima_manfaat",
    "progres_fisik",
    "anggaran",
    "realisasi",
    "persentase_realisasi",
    "status",
    "diperbarui",
    "tahapan",
    "tanggal",
    "catatan",
  ];
  const projectFields = [
    PROJECT.name,
    PROJECT.location,
    PROJECT.sector,
    PROJECT.agency,
    PROJECT.description,
    "3.000 siswa",
    PROJECT.physicalProgress,
    PROJECT.budget,
    PROJECT.realization,
    getRealizationPercentage(PROJECT.realization, PROJECT.budget),
    "Berjalan",
    PROJECT.updatedAt,
  ];
  const rows = MILESTONES.map((milestone) =>
    [...projectFields, milestone.title, milestone.date, milestone.detail]
      .map(csvField)
      .join(","),
  );

  return `${headers.map(csvField).join(",")}\n${rows.join("\n")}\n`;
}

export function downloadFeaturedProjectReport(): void {
  const blob = new Blob([`\uFEFF${buildFeaturedProjectReport()}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "laporan-rehabilitasi-12-sekolah.csv";
  anchor.style.display = "none";
  document.body.appendChild(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}

function ProjectTimeline({ headingId }: { headingId: string }) {
  return (
    <section
      aria-labelledby={headingId}
      className="border-border border-t pt-5"
    >
      <h3 id={headingId} className="text-foreground text-sm font-semibold">
        Tahapan pelaksanaan · Januari-Desember 2025
      </h3>
      <ol
        tabIndex={0}
        aria-label="Timeline tahapan pelaksanaan proyek"
        className="focus-visible:ring-primary mt-4 grid gap-5 rounded-md focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:grid-cols-3 md:gap-0"
      >
        {MILESTONES.map(({ title, date, dateTime, detail, Icon }, index) => (
          <li
            key={title}
            className="relative flex gap-3 md:block md:pt-9 md:pr-6"
          >
            {index < MILESTONES.length - 1 ? (
              <span
                aria-hidden="true"
                className="bg-border md:after:bg-border absolute top-7 bottom-[-1.25rem] left-[0.7rem] w-px md:top-3 md:right-0 md:bottom-auto md:left-3 md:h-px md:w-auto md:translate-x-0 md:translate-y-0 md:after:absolute md:after:top-0 md:after:right-[-1.5rem] md:after:h-px md:after:w-6"
              />
            ) : null}
            <span className="bg-background relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full text-emerald-600 md:absolute md:top-0 md:left-0">
              <Icon
                aria-hidden="true"
                className={`size-4 ${index === 1 ? "text-primary" : index === 2 ? "text-muted-foreground" : ""}`}
              />
            </span>
            <div className="pb-1">
              <h4 className="text-foreground text-xs font-semibold">{title}</h4>
              <time
                dateTime={dateTime}
                className="text-muted-foreground mt-1 block text-xs"
              >
                {date}
              </time>
              <p className="text-muted-foreground mt-1 text-xs leading-5">
                {detail}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function FeaturedProject() {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const realizationPercentage = getRealizationPercentage(
    PROJECT.realization,
    PROJECT.budget,
  );

  return (
    <>
      <article
        aria-labelledby="featured-project-title"
        className="border-border bg-card my-8 rounded-xl border p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-primary inline-flex items-center gap-2 text-xs font-semibold">
            <Building2 aria-hidden="true" className="size-4" />
            SOROTAN PROYEK
          </p>
          <div className="flex items-center gap-2">
            <SourceBadge source="SIMULATED" />
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
              Berjalan
            </span>
          </div>
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.55fr)] lg:items-start">
          <div>
            <h2
              id="featured-project-title"
              className="text-foreground text-xl font-semibold tracking-tight"
            >
              {PROJECT.name}
            </h2>
            <p className="text-muted-foreground mt-1 inline-flex flex-wrap items-center gap-1 text-sm">
              <MapPin aria-hidden="true" className="size-3.5" />
              {PROJECT.location} - {PROJECT.sector} - {PROJECT.agency}
            </p>
            <p className="text-muted-foreground mt-3 text-sm leading-6">
              {PROJECT.description}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between gap-4 text-xs font-semibold">
              <span className="text-foreground">Progres fisik</span>
              <span className="text-emerald-700 dark:text-emerald-400">
                Sesuai jadwal
              </span>
            </div>
            <div className="text-foreground mt-3 flex items-center justify-between text-sm font-semibold">
              <span>{PROJECT.physicalProgress}%</span>
            </div>
            <div
              role="progressbar"
              aria-label="Progres fisik proyek"
              aria-valuenow={PROJECT.physicalProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full"
            >
              <div
                className="bg-primary h-full rounded-full"
                style={{ width: `${PROJECT.physicalProgress}%` }}
              />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <dt className="text-muted-foreground text-xs">Anggaran</dt>
                <dd className="text-foreground mt-0.5 text-sm font-semibold">
                  {formatRupiahCompact(PROJECT.budget)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">
                  Realisasi keuangan
                </dt>
                <dd className="text-foreground mt-0.5 text-sm font-semibold">
                  {formatRupiahCompact(PROJECT.realization)} ·{" "}
                  {realizationPercentage}%
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-5">
          <ProjectTimeline headingId="featured-project-timeline-title" />
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button onClick={() => setDetailsOpen(true)}>
            <ArrowRight aria-hidden="true" className="size-4" />
            Lihat detail proyek
          </Button>
          <Button variant="outline" onClick={downloadFeaturedProjectReport}>
            <Download aria-hidden="true" className="size-4" />
            Unduh laporan
          </Button>
        </div>

        <p className="text-muted-foreground mt-4 text-xs">
          Pembaruan {PROJECT.updatedAt}
        </p>
      </article>

      <Modal
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title={PROJECT.name}
        description={`${PROJECT.location} - ${PROJECT.sector} - ${PROJECT.agency}`}
        contentClassName="max-h-[90vh] overflow-y-auto"
      >
        <div className="space-y-5">
          <p className="text-muted-foreground leading-6">
            {PROJECT.description}
          </p>
          <dl className="bg-muted/50 grid grid-cols-2 gap-4 rounded-lg p-4">
            <div>
              <dt className="text-muted-foreground text-xs">Anggaran</dt>
              <dd className="text-foreground mt-1 font-semibold">
                {formatRupiahCompact(PROJECT.budget)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground text-xs">Realisasi</dt>
              <dd className="text-foreground mt-1 font-semibold">
                {formatRupiahCompact(PROJECT.realization)} ·{" "}
                {realizationPercentage}%
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted-foreground text-xs">
                Target penerima manfaat
              </dt>
              <dd className="text-foreground mt-1 font-semibold">
                3.000 siswa
              </dd>
            </div>
          </dl>
          <ProjectTimeline headingId="featured-project-details-timeline-title" />
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <MapPin aria-hidden="true" className="size-4" />
            Lokasi proyek: Kabupaten Bogor
          </div>
          <Button variant="outline" onClick={downloadFeaturedProjectReport}>
            <Download aria-hidden="true" className="size-4" />
            Unduh laporan
          </Button>
        </div>
      </Modal>
    </>
  );
}
