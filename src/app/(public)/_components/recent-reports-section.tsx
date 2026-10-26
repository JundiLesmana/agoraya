"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { SourceBadge } from "@/components/source-badges";
import {
  formatRecentReportDate,
  getPublicReportStatusPresentation,
  getRecentReportPattern,
  recentReportsPageSchema,
  type PublicReport,
} from "@/modules/reporting/public-reports";

const PAGE_SIZE = 5;

async function fetchRecentReports(offset: number, signal?: AbortSignal) {
  const response = await fetch(
    `/api/reports/recent?limit=${PAGE_SIZE}&offset=${offset}`,
    { signal },
  );

  if (!response.ok) {
    throw new Error("Recent reports request failed");
  }

  const result = recentReportsPageSchema.safeParse(await response.json());
  if (!result.success) {
    throw new Error("Recent reports response was invalid");
  }

  return result.data;
}

export function RecentReportsSection() {
  const [reports, setReports] = useState<PublicReport[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(false);

    void fetchRecentReports(0, controller.signal)
      .then((page) => {
        setReports(page.reports);
        setHasMore(page.hasMore);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [retryCount]);

  async function loadMoreReports() {
    setIsLoadingMore(true);
    setError(false);
    try {
      const page = await fetchRecentReports(reports.length);
      setReports((current) => [...current, ...page.reports]);
      setHasMore(page.hasMore);
    } catch {
      setError(true);
    } finally {
      setIsLoadingMore(false);
    }
  }

  const pattern = getRecentReportPattern(reports);

  return (
    <section
      id="recent-reports"
      aria-labelledby="recent-reports-title"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="mb-7 max-w-3xl">
        <p className="text-primary text-xs font-semibold tracking-[0.24em] uppercase">
          Transparansi dalam aksi
        </p>
        <h2
          id="recent-reports-title"
          className="text-foreground mt-2 text-2xl font-semibold tracking-tight sm:text-3xl"
        >
          Kenali laporan dan progresnya
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6 sm:text-base">
          Laporan terbaru dari warga lain
        </p>
      </div>

      {isLoading ? (
        <div
          aria-label="Memuat laporan terbaru"
          aria-busy="true"
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="border-border bg-muted/40 h-56 animate-pulse rounded-2xl border"
            />
          ))}
        </div>
      ) : error && reports.length === 0 ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-foreground rounded-xl border p-5 text-sm"
        >
          <p>Daftar laporan tidak dapat dimuat saat ini.</p>
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="text-primary focus-visible:ring-ring mt-3 font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:outline-none"
          >
            Coba lagi
          </button>
        </div>
      ) : reports.length === 0 ? (
        <p className="border-border bg-card text-muted-foreground rounded-xl border p-6 text-sm">
          Belum ada laporan yang dikirim
        </p>
      ) : (
        <>
          <ul
            aria-label="Laporan terbaru"
            className="grid list-none gap-4 p-0 md:grid-cols-2 xl:grid-cols-3"
          >
            {reports.map((report) => {
              const status = getPublicReportStatusPresentation(report.status);

              return (
                <li key={report.reportNumber}>
                  <article className="border-border bg-card flex h-full flex-col rounded-2xl border p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-muted-foreground text-xs font-medium">
                        {report.category}
                      </span>
                      <span
                        aria-label={`Status: ${status.label}`}
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <h3 className="text-foreground mt-4 text-lg leading-6 font-semibold">
                      {report.title}
                    </h3>
                    <p className="text-muted-foreground mt-2 flex items-center gap-1.5 text-sm">
                      <MapPin className="size-4 shrink-0" aria-hidden="true" />
                      {report.city}
                    </p>
                    <dl className="border-border mt-4 grid gap-3 border-t pt-4 text-sm">
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                        <dt className="text-muted-foreground">ID laporan</dt>
                        <dd className="text-foreground font-medium">
                          #{report.reportNumber}
                        </dd>
                      </div>
                      <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
                        <dt className="text-muted-foreground">Tanggal</dt>
                        <dd className="text-foreground font-medium">
                          {formatRecentReportDate(report.submittedAt)}
                        </dd>
                      </div>
                    </dl>
                    <div className="border-border mt-4 flex items-center justify-between gap-3 border-t pt-3">
                      <SourceBadge
                        source="SIMULATED"
                        label="Contoh"
                        withIcon={false}
                      />
                      <Link
                        href={`/reports/${encodeURIComponent(report.reportNumber)}`}
                        aria-label={`Lihat ${report.title}`}
                        className="text-primary focus-visible:ring-ring inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold transition hover:gap-3 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                      >
                        Lihat
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>

          {pattern ? (
            <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
              <span className="font-semibold">Pola pada contoh ini:</span>{" "}
              {pattern}
            </p>
          ) : null}

          {error ? (
            <p role="alert" className="text-destructive mt-4 text-sm">
              Laporan berikutnya tidak dapat dimuat. Coba lagi.
            </p>
          ) : null}

          {hasMore ? (
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={loadMoreReports}
                disabled={isLoadingMore}
                className="border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring inline-flex min-h-11 items-center justify-center rounded-md border px-5 py-2 text-sm font-semibold transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-wait disabled:opacity-60"
              >
                {isLoadingMore ? "Memuat laporan..." : "Lihat semua laporan"}
              </button>
            </div>
          ) : null}
        </>
      )}

      <p className="text-muted-foreground mt-5 text-xs leading-5">
        Data contoh untuk pratinjau, bukan laporan aktual. Nama pelapor dan
        informasi pribadi tidak ditampilkan.
      </p>
      <div className="mt-5">
        <Link
          href="/citizen/reporting"
          className="text-primary focus-visible:ring-ring inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          Buat laporan baru
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
