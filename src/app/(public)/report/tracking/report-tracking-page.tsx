"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Circle,
  Clock3,
  Construction,
  FileText,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  determineActiveTrackingNode,
  getTrackingNodeState,
  TRACKING_STEPS,
} from "@/app/(public)/_components/report-tracking";
import { getPublicReportStatusPresentation } from "@/modules/reporting/public-reports";
import type { ReportStatus } from "@/modules/reporting/types";

type TrackedReport = {
  reportNumber: string;
  title: string;
  description: string;
  category: string;
  status: ReportStatus;
  submittedAt: string | null;
  responseDueAt: string | null;
  firstRespondedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  subcategory: string;
  province: string;
  city: string;
  address: string;
  reporterName: string | null;
  identityVisible: boolean;
  attachmentNames: string[];
};

type TrackingResponse = {
  report?: TrackedReport;
  error?: string;
};

type ReportListResponse = {
  reports?: TrackedReport[];
  hasMore?: boolean;
  error?: string;
};

const REPORT_CATEGORIES = [
  "Infrastruktur",
  "Dugaan korupsi",
  "Lingkungan",
] as const;
const REPORT_STATUSES = [
  "submitted",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
  "closed",
] as const;
const REPORT_PAGE_SIZE = 12;

const TIMELINE_DATES = [
  (report: TrackedReport) => report.submittedAt,
  () => null,
  (report: TrackedReport) => report.firstRespondedAt,
  (report: TrackedReport) => report.resolvedAt ?? report.closedAt,
] as const;

function formatDateTime(value: string | null): string {
  if (!value) return "Menunggu pembaruan";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function ReportTrackingPage({
  initialReportNumber,
}: {
  initialReportNumber: string;
}) {
  const [reportNumber, setReportNumber] = useState(initialReportNumber);
  const [report, setReport] = useState<TrackedReport | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<TrackedReport[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [listSearch, setListSearch] = useState("");
  const [listError, setListError] = useState("");
  const [isListLoading, setIsListLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const lookup = useCallback(async (value: string) => {
    setIsLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch(
        `/api/reports/track?reportNumber=${encodeURIComponent(value)}`,
        { cache: "no-store" },
      );
      const result = (await response.json()) as TrackingResponse;
      if (!response.ok || !result.report) {
        setError(
          result.error ??
            "Laporan tidak ditemukan. Periksa nomor laporan Anda.",
        );
        return;
      }
      setReport(result.report);
      setIsDetailsOpen(true);
    } catch {
      setError("Layanan pelacakan tidak dapat dihubungi. Coba kembali.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadReports = useCallback(
    async (offset = 0, append = false) => {
      setIsListLoading(true);
      setListError("");
      try {
        const params = new URLSearchParams({
          limit: String(REPORT_PAGE_SIZE),
          offset: String(offset),
        });
        if (categoryFilter) params.set("category", categoryFilter);
        if (statusFilter) params.set("status", statusFilter);
        if (listSearch.trim()) params.set("search", listSearch.trim());

        const response = await fetch(`/api/reports/track?${params}`, {
          cache: "no-store",
        });
        const result = (await response.json()) as ReportListResponse;
        if (!response.ok || !result.reports) {
          setListError(
            result.error ?? "Gagal memuat daftar laporan publik. Coba kembali.",
          );
          return;
        }
        const nextReports = result.reports;
        setReports((current) =>
          append ? [...current, ...nextReports] : nextReports,
        );
        setReport((current) => current ?? nextReports[0] ?? null);
        setHasMore(Boolean(result.hasMore));
      } catch {
        setListError("Daftar laporan tidak dapat dimuat. Periksa koneksi.");
      } finally {
        setIsListLoading(false);
      }
    },
    [categoryFilter, listSearch, statusFilter],
  );

  useEffect(() => {
    const initial = initialReportNumber.trim().toUpperCase();
    setReportNumber(initialReportNumber);
    if (initial) void lookup(initial);
  }, [initialReportNumber, lookup]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = reportNumber.trim().toUpperCase();
    setReportNumber(normalized);
    window.history.replaceState(
      null,
      "",
      normalized
        ? `/report/tracking?reportNumber=${encodeURIComponent(normalized)}`
        : "/report/tracking",
    );
    if (!normalized) {
      setReport(null);
      setError("Masukkan nomor laporan untuk mulai melacak.");
      return;
    }
    void lookup(normalized);
  }

  function selectReport(selected: TrackedReport) {
    setReport(selected);
    setIsDetailsOpen(true);
    setReportNumber(selected.reportNumber);
    window.history.replaceState(
      null,
      "",
      `/report/tracking?reportNumber=${encodeURIComponent(selected.reportNumber)}`,
    );
    setError("");
  }

  const activeNode = report ? determineActiveTrackingNode(report.status) : -1;
  const status = report
    ? getPublicReportStatusPresentation(report.status)
    : null;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-12 dark:bg-slate-950/30">
      <section className="border-border border-b bg-sky-50 dark:bg-sky-950/30">
        <div className="hero-enter mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="text-muted-foreground mb-4 text-xs">
            <Link href="/" className="hover:text-primary">
              Beranda
            </Link>
            <span aria-hidden="true" className="mx-2">
              {" > "}
            </span>
            <Link href="/reporting" className="hover:text-primary">
              Lapor Warga
            </Link>
            <span aria-hidden="true" className="mx-2">
              {" > "}
            </span>
            <span aria-current="page" className="text-primary font-medium">
              Lacak laporan
            </span>
          </div>
          <div className="mt-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                Lacak laporan
              </h1>
              <p className="text-muted-foreground mt-4 max-w-2xl text-base leading-7">
                Pantau status dan detail laporan menggunakan nomor pelacakan
                yang diberikan setelah pengiriman.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild variant="outline">
                <Link href="/reporting">
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Buat laporan
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section
          aria-labelledby="tracking-search-title"
          className="bg-card rounded-2xl border p-5 shadow-sm sm:p-7"
        >
          <div className="flex items-start gap-3">
            <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Search className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 id="tracking-search-title" className="text-lg font-semibold">
                Nomor laporan
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Masukkan kode yang Anda terima setelah laporan berhasil
                disimpan.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="mt-5 flex flex-col gap-3 sm:flex-row"
          >
            <label className="sr-only" htmlFor="report-number">
              Nomor laporan
            </label>
            <input
              id="report-number"
              name="reportNumber"
              autoComplete="off"
              value={reportNumber}
              onChange={(event) => setReportNumber(event.target.value)}
              placeholder="Contoh: LP-20261105-BC7AEEF0-E1C"
              className="border-input bg-background focus-visible:ring-ring h-11 min-w-0 flex-1 rounded-md border px-3 text-sm uppercase outline-none focus-visible:ring-2"
            />
            <Button type="submit" disabled={isLoading} className="h-11">
              <Search className="size-4" aria-hidden="true" />
              {isLoading ? "Mencari…" : "Lacak laporan"}
            </Button>
          </form>
          <p className="text-muted-foreground mt-3 text-xs leading-5">
            Hanya laporan yang ditandai publik dapat dilacak di halaman ini.
            Email dan nomor telepon pelapor tidak ditampilkan.
          </p>
          {error ? (
            <p role="alert" className="text-destructive mt-3 text-sm">
              {error}
            </p>
          ) : null}
        </section>

        <section aria-labelledby="public-reports-title" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                Laporan warga
              </p>
              <h2
                id="public-reports-title"
                className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
              >
                Semua laporan publik
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Pilih kategori atau status untuk menemukan laporan. Buka kartu
                untuk melihat detail yang dibagikan secara publik.
              </p>
            </div>
            <span className="text-muted-foreground text-xs">
              Menampilkan laporan yang diizinkan untuk publik
            </span>
          </div>

          <div className="bg-card grid gap-3 rounded-2xl border p-4 shadow-sm sm:grid-cols-[minmax(0,1fr)_200px_200px_auto]">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setListSearch(searchInput);
              }}
            >
              <label className="sr-only" htmlFor="public-report-search">
                Cari nomor, judul, atau lokasi laporan
              </label>
              <input
                id="public-report-search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nomor, judul, atau lokasi"
                className="border-input bg-background focus-visible:ring-ring h-10 min-w-0 flex-1 rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              />
              <Button type="submit" variant="outline" className="h-10">
                <Search className="size-4" aria-hidden="true" />
                Cari
              </Button>
            </form>
            <label className="sr-only" htmlFor="report-category-filter">
              Filter kategori laporan
            </label>
            <select
              id="report-category-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Semua kategori</option>
              {REPORT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="report-status-filter">
              Filter status laporan
            </label>
            <select
              id="report-status-filter"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="border-input bg-background h-10 rounded-md border px-3 text-sm"
            >
              <option value="">Semua status</option>
              {REPORT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {getPublicReportStatusPresentation(value).label}
                </option>
              ))}
            </select>
            {(categoryFilter || statusFilter || listSearch) && (
              <Button
                type="button"
                variant="ghost"
                className="h-10"
                onClick={() => {
                  setCategoryFilter("");
                  setStatusFilter("");
                  setSearchInput("");
                  setListSearch("");
                }}
              >
                Hapus filter
              </Button>
            )}
          </div>

          {listError ? (
            <p role="alert" className="text-destructive text-sm">
              {listError}
            </p>
          ) : null}
          {isListLoading && reports.length === 0 ? (
            <p
              role="status"
              className="bg-card text-muted-foreground rounded-xl border p-6 text-sm"
            >
              Memuat daftar laporan…
            </p>
          ) : reports.length > 0 ? (
            <>
              <div className="space-y-3" aria-label="Kartu laporan publik">
                {reports.map((item) => {
                  const itemStatus = getPublicReportStatusPresentation(
                    item.status,
                  );
                  const Icon =
                    item.category === "Infrastruktur"
                      ? Construction
                      : item.category === "Dugaan korupsi"
                        ? CircleAlert
                        : Leaf;
                  const selected = report?.reportNumber === item.reportNumber;
                  return (
                    <button
                      key={item.reportNumber}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => selectReport(item)}
                      className={`bg-card hover:border-primary/50 focus-visible:ring-ring w-full rounded-xl border p-4 text-left shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:outline-none ${
                        selected
                          ? "border-primary ring-primary ring-1"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                          <Icon className="size-5" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold">
                            {item.title}
                          </span>
                          <span className="text-muted-foreground mt-2 block text-xs">
                            {item.category} · {item.subcategory}
                          </span>
                          <span className="text-muted-foreground mt-2 flex items-center gap-1 text-xs">
                            <MapPin className="size-3.5" aria-hidden="true" />
                            {item.city}, {item.province}
                          </span>
                          <span className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs">
                            <span className="font-mono font-medium">
                              {item.reportNumber}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDateTime(item.submittedAt)}
                            </span>
                          </span>
                          <span className="mt-3 flex items-center justify-end gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${itemStatus.className}`}
                            >
                              {itemStatus.label}
                            </span>
                            <span className="text-primary inline-flex items-center gap-1 text-xs font-semibold">
                              Detail
                              <ArrowRight
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </span>
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
              {hasMore ? (
                <div className="flex justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isListLoading}
                    onClick={() => void loadReports(reports.length, true)}
                  >
                    {isListLoading ? "Memuat…" : "Muat laporan lainnya"}
                  </Button>
                </div>
              ) : null}
            </>
          ) : !isListLoading ? (
            <p className="bg-card text-muted-foreground rounded-xl border p-6 text-sm">
              Tidak ada laporan publik yang sesuai dengan pencarian atau filter.
            </p>
          ) : null}
        </section>

        {report && status ? (
          <Modal
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            title="Detail laporan"
            description={`${report.reportNumber} · ${status.label}`}
            contentClassName="max-h-[90vh] max-w-4xl overflow-y-auto"
            modal={false}
          >
            <article
              aria-labelledby="tracked-report-title"
              className="bg-card overflow-hidden rounded-2xl border shadow-sm"
            >
              <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-7">
                <div>
                  <p className="text-muted-foreground text-xs font-medium">
                    NOMOR LAPORAN
                  </p>
                  <p className="mt-1 font-mono text-sm font-semibold">
                    {report.reportNumber}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}
                >
                  {status.label}
                </span>
              </div>

              <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
                <div>
                  <div className="text-primary flex items-center gap-2 text-sm font-medium">
                    <FileText className="size-4" aria-hidden="true" />
                    Detail laporan
                  </div>
                  <h2
                    id="tracked-report-title"
                    className="mt-3 text-2xl font-semibold tracking-tight"
                  >
                    {report.title}
                  </h2>
                  <p className="mt-5 text-sm leading-6 whitespace-pre-wrap">
                    {report.description}
                  </p>

                  <dl className="mt-6 grid gap-4 border-y py-5 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-muted-foreground">Kategori</dt>
                      <dd className="mt-1 font-medium">{report.category}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Subkategori</dt>
                      <dd className="mt-1 font-medium">{report.subcategory}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Provinsi</dt>
                      <dd className="mt-1 font-medium">{report.province}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">
                        Kota / kabupaten
                      </dt>
                      <dd className="mt-1 font-medium">{report.city}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="size-4" aria-hidden="true" />
                        Lokasi kejadian
                      </dt>
                      <dd className="mt-1 font-medium">{report.address}</dd>
                    </div>
                    {report.identityVisible && report.reporterName ? (
                      <div>
                        <dt className="text-muted-foreground">Nama pelapor</dt>
                        <dd className="mt-1 font-medium">
                          {report.reporterName}
                        </dd>
                      </div>
                    ) : null}
                    <div>
                      <dt className="text-muted-foreground">Lampiran</dt>
                      {report.attachmentNames.length > 0 ? (
                        <dd className="mt-1">
                          <ul className="list-inside list-disc space-y-1">
                            {report.attachmentNames.map((name) => (
                              <li key={name} className="font-medium break-all">
                                {name}
                              </li>
                            ))}
                          </ul>
                        </dd>
                      ) : (
                        <dd className="mt-1 font-medium">Tidak ada</dd>
                      )}
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Kontak pelapor</dt>
                      <dd className="mt-1 font-medium">
                        Disimpan secara privat untuk tindak lanjut
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Dikirim</dt>
                      <dd className="mt-1 font-medium">
                        {formatDateTime(report.submittedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Target respons</dt>
                      <dd className="mt-1 font-medium">
                        {formatDateTime(report.responseDueAt)}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-muted-foreground mt-4 flex items-start gap-2 text-xs leading-5">
                    <ShieldCheck
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    Email dan nomor telepon tidak ditampilkan. Laporan privat
                    hanya dapat dilihat oleh petugas berwenang.
                  </p>
                </div>

                <section
                  aria-labelledby="report-progress-title"
                  className="rounded-xl bg-sky-50/70 p-4 sm:p-5 dark:bg-sky-950/20"
                >
                  <h3 id="report-progress-title" className="font-semibold">
                    Perkembangan laporan
                  </h3>
                  <ol
                    aria-label="Progres laporan dari diterima hingga penyelesaian"
                    className="mt-5 space-y-0"
                  >
                    {TRACKING_STEPS.map((step, index) => {
                      const nodeState = getTrackingNodeState(index, activeNode);
                      const Icon =
                        index === 0 ? Check : index === 2 ? Wrench : Circle;
                      const date = TIMELINE_DATES[index]?.(report) ?? null;
                      return (
                        <li
                          key={step.status}
                          aria-current={
                            nodeState === "active" ? "step" : undefined
                          }
                          className="relative flex min-h-20 gap-3 pb-5 last:min-h-0 last:pb-0"
                        >
                          {index < TRACKING_STEPS.length - 1 ? (
                            <span
                              aria-hidden="true"
                              className={`absolute top-7 left-3 h-[calc(100%-1.25rem)] w-px ${
                                nodeState === "completed"
                                  ? "bg-emerald-500"
                                  : "bg-border"
                              }`}
                            />
                          ) : null}
                          <span
                            data-state={nodeState}
                            className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full ${
                              nodeState === "completed"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                : nodeState === "active"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background text-muted-foreground border"
                            }`}
                          >
                            <Icon className="size-3.5" aria-hidden="true" />
                          </span>
                          <div>
                            <p className="text-sm font-semibold">
                              {step.title}
                            </p>
                            <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                              <Clock3 className="size-3.5" aria-hidden="true" />
                              {formatDateTime(date)}
                            </p>
                            <p className="text-muted-foreground mt-1 text-xs leading-5">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                  <p className="text-muted-foreground mt-5 border-t pt-4 text-xs leading-5">
                    Status terakhir: <strong>{status.label}</strong>. Waktu
                    penanganan bergantung pada jenis masalah dan instansi
                    terkait.
                  </p>
                </section>
              </div>
            </article>
          </Modal>
        ) : null}

        <p className="text-muted-foreground flex items-start gap-2 text-xs leading-5">
          <ArrowRight className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Simpan nomor laporan Anda untuk melihat pembaruan berikutnya.
        </p>
      </main>
    </div>
  );
}
