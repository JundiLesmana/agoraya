import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SourceBadge } from "@/components/source-badges";
import {
  formatRecentReportDate,
  getPublicReportStatusPresentation,
  PUBLIC_REPORT_EXAMPLES,
} from "@/modules/reporting/public-reports";

export const metadata: Metadata = {
  title: "Detail laporan | Agoraya",
  description: "Detail laporan contoh yang ditampilkan secara publik.",
};

export default async function PublicReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const report = PUBLIC_REPORT_EXAMPLES.find(
    (item) => item.reportNumber === reportId,
  );

  if (!report) notFound();

  const status = getPublicReportStatusPresentation(report.status);

  return (
    <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="text-primary focus-visible:ring-ring text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
      >
        Kembali ke beranda
      </Link>
      <article className="border-border bg-card mt-6 rounded-2xl border p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-muted-foreground text-sm font-medium">
            #{report.reportNumber}
          </p>
          <span
            aria-label={`Status: ${status.label}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
          >
            {status.label}
          </span>
        </div>
        <h1 className="text-foreground mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          {report.title}
        </h1>
        <dl className="border-border mt-6 grid gap-4 border-y py-5 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Kategori</dt>
            <dd className="text-foreground mt-1 font-medium">
              {report.category}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Wilayah</dt>
            <dd className="text-foreground mt-1 font-medium">{report.city}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tanggal laporan</dt>
            <dd className="text-foreground mt-1 font-medium">
              {formatRecentReportDate(report.submittedAt)}
            </dd>
          </div>
        </dl>
        <SourceBadge
          source="SIMULATED"
          label="Data contoh, bukan laporan aktual"
          className="mt-5"
        />
      </article>
      <p className="text-muted-foreground mt-4 text-sm leading-6">
        Informasi pribadi warga tidak ditampilkan pada detail publik ini.
      </p>
    </section>
  );
}
