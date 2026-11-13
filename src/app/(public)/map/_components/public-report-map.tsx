"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Map as MapComponent, type MapPoint } from "@/components/map/map";
import { getPublicReportStatusPresentation } from "@/modules/reporting/public-reports";
import type { ReportStatus } from "@/modules/reporting/types";

type ProvenanceSource = "ACTUAL" | "SIMULATED" | "BPS_API" | "AGGREGATE";

interface PublicMapReport {
  reportNumber: string;
  title: string;
  category: string;
  status: ReportStatus;
  submittedAt: string;
  city: string;
  province: string;
  source: ProvenanceSource;
  latitude?: number;
  longitude?: number;
}

interface ReportMapResponse {
  reports?: PublicMapReport[];
  total?: number;
  hasMore?: boolean;
  error?: string;
}

interface ValidationEvent {
  stage: string;
  role: string;
  status: string;
  timestamp: string;
}

interface ProvenanceResponse {
  source?: ProvenanceSource;
  validationTimeline?: ValidationEvent[];
  aiConfidence?: number | null;
  aiConfidenceNote?: string;
  error?: string;
}

const PAGE_SIZE = 100;
const JAVA_MAP_CENTER: [number, number] = [110, -7.3];
const categories = ["Infrastruktur", "Dugaan korupsi", "Lingkungan"] as const;
const statuses: readonly ReportStatus[] = [
  "submitted",
  "verified",
  "in_progress",
  "resolved",
  "rejected",
  "closed",
];

function hasValidCoordinates(
  report: PublicMapReport,
): report is PublicMapReport & { latitude: number; longitude: number } {
  return (
    typeof report.latitude === "number" &&
    Number.isFinite(report.latitude) &&
    report.latitude >= -90 &&
    report.latitude <= 90 &&
    typeof report.longitude === "number" &&
    Number.isFinite(report.longitude) &&
    report.longitude >= -180 &&
    report.longitude <= 180
  );
}

const sourcePresentation: Record<
  ProvenanceSource,
  { label: string; className: string; description: string }
> = {
  ACTUAL: {
    label: "AKTUAL",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    description: "Berasal dari laporan warga yang dikirim ke Agoraya.",
  },
  SIMULATED: {
    label: "SIMULASI",
    className:
      "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
    description: "Data contoh atau simulasi, bukan laporan aktual.",
  },
  BPS_API: {
    label: "BPS_API",
    className:
      "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
    description: "Bersumber dari API Badan Pusat Statistik.",
  },
  AGGREGATE: {
    label: "AGREGAT",
    className: "border-border bg-muted text-muted-foreground",
    description: "Gabungan dari beberapa sumber data.",
  },
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function ProvenanceBadge({ source }: { source: ProvenanceSource }) {
  const presentation = sourcePresentation[source];
  return (
    <span
      data-testid="provenance-badge"
      title={presentation.description}
      aria-label={`Sumber data: ${presentation.label}. ${presentation.description}`}
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${presentation.className}`}
    >
      {presentation.label}
    </span>
  );
}

function PublicTicketCard({
  report,
  onClose,
  onViewDetails,
}: {
  report: PublicMapReport;
  onClose: () => void;
  onViewDetails: () => void;
}) {
  const status = getPublicReportStatusPresentation(report.status);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="selected-map-report-title"
      data-testid="map-ticket-card"
      className="border-border bg-card absolute inset-x-3 top-3 z-30 max-h-[calc(100%-1.5rem)] overflow-y-auto rounded-xl border p-4 shadow-xl sm:right-4 sm:left-auto sm:w-[min(22rem,calc(100%-2rem))]"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground min-w-0 truncate text-xs font-semibold">
          {report.reportNumber}
        </p>
        <button
          type="button"
          aria-label="Tutup kartu tiket laporan"
          onClick={onClose}
          className="text-muted-foreground hover:bg-muted -mt-1 -mr-1 flex size-8 shrink-0 items-center justify-center rounded-full"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
        >
          {status.label}
        </span>
      </div>
      <h2
        id="selected-map-report-title"
        className="text-foreground mt-3 text-lg leading-snug font-bold"
      >
        {report.title}
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">{report.category}</p>
      <div className="text-muted-foreground mt-3 space-y-2 text-xs">
        <p className="flex items-start gap-2">
          <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            Wilayah laporan
            <span className="text-foreground mt-0.5 block font-medium">
              {report.city}, {report.province}
            </span>
          </span>
        </p>
        <p className="flex items-start gap-2">
          <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>Dikirim {formatDate(report.submittedAt)}</span>
        </p>
      </div>
      <p className="text-muted-foreground mt-3 border-t pt-3 text-xs leading-5">
        Identitas pelapor dan lokasi rinci dirahasiakan.
      </p>
      <Button
        type="button"
        variant="outline"
        className="mt-3 w-full"
        onClick={onViewDetails}
      >
        Lihat riwayat &amp; detail tiket
      </Button>
    </aside>
  );
}

export function PublicReportMap() {
  const [reports, setReports] = useState<PublicMapReport[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<PublicMapReport | null>(null);
  const [provenance, setProvenance] = useState<ProvenanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [followUpFilter, setFollowUpFilter] = useState<"unhandled" | "all">(
    "unhandled",
  );
  const [city, setCity] = useState("");
  const selectedButtonRef = useRef<HTMLButtonElement | null>(null);
  const reportButtonsRef = useRef(new Map<string, HTMLButtonElement>());
  const detailPanelRef = useRef<HTMLDivElement | null>(null);

  const loadPage = useCallback(
    async (
      offset: number,
      append: boolean,
      signal?: AbortSignal,
    ): Promise<void> => {
      if (append) setLoadingMore(true);
      else {
        setLoading(true);
        setSelected(null);
        setCity("");
      }
      setError("");
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(offset),
        });
        params.set("followUp", followUpFilter);
        if (search.trim()) params.set("search", search.trim());
        if (category) params.set("category", category);
        if (status) params.set("status", status);

        const response = await fetch(`/api/reports/map?${params}`, { signal });
        const result = (await response.json()) as ReportMapResponse;
        const pageReports = result.reports;
        if (!response.ok || !pageReports) {
          throw new Error(result.error ?? "Gagal memuat laporan publik.");
        }
        setReports((current) =>
          append ? [...current, ...pageReports] : pageReports,
        );
        setTotal(result.total ?? 0);
        setHasMore(Boolean(result.hasMore));
      } catch (loadError) {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Data laporan tidak dapat dimuat. Coba kembali.",
        );
      } finally {
        if (!signal?.aborted) {
          if (append) setLoadingMore(false);
          else setLoading(false);
        }
      }
    },
    [category, followUpFilter, search, status],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(
      () => void loadPage(0, false, controller.signal),
      search.trim() ? 250 : 0,
    );
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [loadPage, search]);

  useEffect(() => {
    if (!selected) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
        setProvenance(null);
        selectedButtonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    if (!selected) {
      setProvenance(null);
      setDetailError("");
      return;
    }

    const controller = new AbortController();
    setProvenance(null);
    setDetailError("");
    void fetch(
      `/api/reports/${encodeURIComponent(selected.reportNumber)}/provenance`,
      { signal: controller.signal },
    )
      .then(async (response) => {
        const result = (await response.json()) as ProvenanceResponse;
        if (!response.ok) {
          throw new Error(result.error ?? "Riwayat laporan tidak tersedia.");
        }
        setProvenance(result);
      })
      .catch((loadError: unknown) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        ) {
          return;
        }
        setDetailError(
          loadError instanceof Error
            ? loadError.message
            : "Riwayat validasi tidak dapat dimuat.",
        );
      });
    return () => controller.abort();
  }, [selected]);

  const cityGroups = useMemo(() => {
    const groups = new Map<string, PublicMapReport[]>();
    for (const report of reports) {
      const key = `${report.city}, ${report.province}`;
      groups.set(key, [...(groups.get(key) ?? []), report]);
    }
    return [...groups.entries()].sort(
      (left, right) => right[1].length - left[1].length,
    );
  }, [reports]);
  const visibleReports = city
    ? reports.filter((report) => `${report.city}, ${report.province}` === city)
    : reports;

  const mapMarkers = useMemo((): MapPoint[] => {
    return reports.filter(hasValidCoordinates).map((r) => ({
      id: r.reportNumber,
      longitude: r.longitude,
      latitude: r.latitude,
      title: `${r.reportNumber} · ${r.title}`,
      description: `${r.category} · ${getPublicReportStatusPresentation(r.status).label} · ${r.city}, ${r.province}`,
    }));
  }, [reports]);

  const selectedMapCenter = useMemo<[number, number]>(() => {
    if (selected && hasValidCoordinates(selected)) {
      return [selected.longitude, selected.latitude];
    }
    return JAVA_MAP_CENTER;
  }, [selected]);

  function chooseReport(
    report: PublicMapReport,
    button?: HTMLButtonElement,
  ): void {
    if (button) selectedButtonRef.current = button;
    setSelected(report);
  }

  function openReport(reportNumber: string): void {
    const report = reports.find((item) => item.reportNumber === reportNumber);
    if (!report) return;
    chooseReport(report, reportButtonsRef.current.get(reportNumber));
  }

  return (
    <main className="bg-background text-foreground min-h-[calc(100vh-8rem)]">
      <header className="bg-sky-50 px-4 py-8 sm:px-6 lg:px-8 dark:bg-slate-950/70">
        <div className="mx-auto max-w-7xl">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground text-xs"
          >
            <Link
              href="/"
              className="hover:text-primary focus-visible:underline"
            >
              Beranda
            </Link>
            <span className="mx-2">›</span>
            <Link
              href="/reporting"
              className="hover:text-primary focus-visible:underline"
            >
              Lapor Warga
            </Link>
            <span className="mx-2">›</span>
            <span className="text-primary font-medium">Peta laporan</span>
          </nav>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                Peta Laporan Publik
              </h1>
              <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
                Jelajahi laporan warga yang dibagikan untuk publik. Laporan
                dengan koordinat ditampilkan sebagai penanda di peta.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/reporting">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Kembali ke Lapor Warga
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <section
        aria-label="Peta laporan publik"
        className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"
      >
        <div
          className="relative mb-6"
          role="region"
          aria-label="Peta sebaran laporan"
        >
          <MapComponent
            renderer="raster"
            markers={mapMarkers}
            center={selectedMapCenter}
            zoom={selected ? 12 : 7}
            height={420}
            ariaLabel="Peta sebaran laporan warga"
            selectedMarkerId={selected?.reportNumber ?? null}
            onMarkerClick={openReport}
          />
          {selected ? (
            <PublicTicketCard
              report={selected}
              onClose={() => {
                setSelected(null);
                setProvenance(null);
                selectedButtonRef.current?.focus();
              }}
              onViewDetails={() =>
                detailPanelRef.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                })
              }
            />
          ) : null}
          <p className="text-muted-foreground mt-2 text-center text-sm">
            {mapMarkers.length > 0 ? (
              <>
                {mapMarkers.length} laporan dengan koordinat ditampilkan di
                peta. Klik penanda untuk membuka kartu tiket laporan.
              </>
            ) : loading ? (
              "Memuat laporan untuk ditampilkan di peta…"
            ) : (
              "Belum ada laporan dengan koordinat. Peta berpusat di Pulau Jawa; laporan tetap tersedia di daftar."
            )}
          </p>
        </div>
      </section>

      <section
        aria-label="Filter laporan publik"
        className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"
      >
        <div className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_repeat(2,minmax(10rem,0.35fr))]">
          <label className="border-input bg-background flex h-11 items-center gap-2 rounded-lg border px-3">
            <Search
              aria-hidden="true"
              className="text-muted-foreground size-4"
            />
            <span className="sr-only">Cari nomor, judul, atau kota</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nomor laporan, judul, atau kota"
              className="text-foreground placeholder:text-muted-foreground min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
          </label>
          <label className="sr-only" htmlFor="map-category-filter">
            Filter kategori
          </label>
          <select
            id="map-category-filter"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="border-input bg-background text-foreground h-11 rounded-lg border px-3 text-sm"
          >
            <option value="">Semua kategori</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="map-status-filter">
            Filter status
          </label>
          <select
            id="map-follow-up-filter"
            value={followUpFilter}
            onChange={(event) =>
              setFollowUpFilter(event.target.value as "unhandled" | "all")
            }
            aria-label="Filter tindak lanjut"
            className="border-input bg-background text-foreground h-11 rounded-lg border px-3 text-sm"
          >
            <option value="unhandled">
              Belum ditanggapi
            </option>
            <option value="all">Semua laporan</option>
          </select>
          <select
            id="map-status-filter"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="border-input bg-background text-foreground h-11 rounded-lg border px-3 text-sm"
          >
            <option value="">Semua status</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {getPublicReportStatusPresentation(item).label}
              </option>
            ))}
          </select>
        </div>
        <p className="text-muted-foreground mt-3 text-sm" aria-live="polite">
          {loading
            ? "Memuat laporan…"
            : `${total} laporan tersedia untuk publik`}
          {city ? ` · Wilayah: ${city}` : ""}
        </p>

        {error ? (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 text-destructive mt-4 rounded-lg border p-4 text-sm"
          >
            {error}{" "}
            <button
              type="button"
              onClick={() => void loadPage(0, false)}
              className="font-semibold underline underline-offset-2"
            >
              Coba lagi
            </button>
          </div>
        ) : null}

        <div className="border-border bg-card mt-4 rounded-2xl border p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-foreground font-semibold">
                Sebaran berdasarkan kota
              </h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Kelompok ini menunjukkan jumlah laporan per wilayah, bukan
                koordinat atau batas geografis. Laporan dengan koordinat tetap
                ditampilkan sebagai penanda di peta.
              </p>
            </div>
            {city ? (
              <button
                type="button"
                onClick={() => setCity("")}
                className="text-primary text-sm font-medium underline-offset-4 hover:underline"
              >
                Tampilkan semua kota
              </button>
            ) : null}
          </div>
          {loading && reports.length === 0 ? (
            <div
              role="status"
              aria-label="Memuat sebaran laporan"
              className="mt-5 grid animate-pulse gap-3 sm:grid-cols-2 lg:grid-cols-3"
            >
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="bg-muted h-24 rounded-xl" />
              ))}
            </div>
          ) : cityGroups.length ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {cityGroups.map(([groupName, groupReports]) => (
                <button
                  key={groupName}
                  type="button"
                  aria-pressed={city === groupName}
                  onClick={() =>
                    setCity((current) =>
                      current === groupName ? "" : groupName,
                    )
                  }
                  className={`border-border bg-background focus-visible:ring-ring flex min-h-24 items-center justify-between gap-4 rounded-xl border p-4 text-left transition hover:border-blue-300 hover:shadow-sm focus-visible:ring-2 focus-visible:outline-none ${
                    city === groupName
                      ? "border-primary ring-primary ring-1"
                      : ""
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-full">
                      <MapPin aria-hidden="true" className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <span className="text-foreground block truncate text-sm font-semibold">
                        {groupName}
                      </span>
                      <span className="text-muted-foreground mt-1 block text-xs">
                        {groupReports.length} laporan dimuat
                      </span>
                    </span>
                  </span>
                  <span className="bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold">
                    {groupReports.length}
                  </span>
                </button>
              ))}
            </div>
          ) : !loading && !error ? (
            <p className="text-muted-foreground bg-muted/50 mt-5 rounded-lg p-5 text-sm">
              Belum ada laporan publik yang sesuai filter.
            </p>
          ) : null}
        </div>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,0.72fr)]">
          <section aria-labelledby="public-reports-title">
            <div className="flex items-center justify-between gap-3">
              <h2
                id="public-reports-title"
                className="text-foreground text-lg font-semibold"
              >
                Daftar laporan
              </h2>
              <span className="text-muted-foreground text-xs">
                {visibleReports.length} dari {total}
              </span>
            </div>
            <ul className="mt-3 space-y-3">
              {visibleReports.map((report) => {
                const statusPresentation = getPublicReportStatusPresentation(
                  report.status,
                );
                const isSelected =
                  selected?.reportNumber === report.reportNumber;
                return (
                  <li key={report.reportNumber}>
                    <button
                      type="button"
                      ref={(node) => {
                        if (node) {
                          reportButtonsRef.current.set(
                            report.reportNumber,
                            node,
                          );
                        } else {
                          reportButtonsRef.current.delete(report.reportNumber);
                        }
                        if (isSelected) selectedButtonRef.current = node;
                      }}
                      aria-pressed={isSelected}
                      onClick={(event) =>
                        chooseReport(report, event.currentTarget)
                      }
                      className={`border-border bg-card focus-visible:ring-ring w-full rounded-xl border p-4 text-left shadow-sm transition hover:border-blue-300 hover:shadow focus-visible:ring-2 focus-visible:outline-none ${
                        isSelected ? "border-primary ring-primary ring-1" : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-muted-foreground text-xs font-medium">
                          {report.reportNumber}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusPresentation.className}`}
                        >
                          {statusPresentation.label}
                        </span>
                      </div>
                      <h3 className="text-foreground mt-2 font-semibold">
                        {report.title}
                      </h3>
                      <div className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                        <span>{report.category}</span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin aria-hidden="true" className="size-3.5" />
                          {report.city}, {report.province}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays
                            aria-hidden="true"
                            className="size-3.5"
                          />
                          {formatDate(report.submittedAt)}
                        </span>
                        {typeof report.latitude === "number" &&
                        typeof report.longitude === "number" ? (
                          <span className="text-primary font-medium">
                            Ada titik peta
                          </span>
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
            {!loading && visibleReports.length === 0 && !error ? (
              <p className="text-muted-foreground border-border mt-3 rounded-xl border p-5 text-sm">
                Tidak ada laporan untuk filter ini.
              </p>
            ) : null}
            {hasMore ? (
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                disabled={loadingMore}
                onClick={() => void loadPage(reports.length, true)}
              >
                {loadingMore ? "Memuat…" : "Muat lebih banyak laporan"}
              </Button>
            ) : null}
          </section>

          {selected ? (
            <aside
              ref={detailPanelRef}
              data-testid="provenance-section"
              aria-labelledby="report-detail-title"
              aria-live="polite"
              className="border-border bg-card rounded-2xl border p-5 shadow-sm lg:sticky lg:top-24"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-muted-foreground text-xs font-semibold">
                    {selected.reportNumber}
                  </p>
                  <h2
                    id="report-detail-title"
                    className="text-foreground mt-2 text-lg leading-snug font-bold"
                  >
                    {selected.title}
                  </h2>
                </div>
                <button
                  type="button"
                  data-testid="provenance-close-button"
                  aria-label="Tutup detail dan sumber validasi"
                  onClick={() => {
                    setSelected(null);
                    setProvenance(null);
                  }}
                  className="text-muted-foreground hover:bg-muted focus-visible:ring-ring flex size-9 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
                >
                  <X aria-hidden="true" className="size-5" />
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {selected.source !== "ACTUAL" ? (
                  <ProvenanceBadge source={selected.source} />
                ) : null}
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPublicReportStatusPresentation(selected.status).className}`}
                >
                  {getPublicReportStatusPresentation(selected.status).label}
                </span>
                <span className="border-border text-muted-foreground inline-flex rounded-full border px-2.5 py-1 text-xs font-medium">
                  Kartu tiket laporan
                </span>
              </div>
              <p className="text-muted-foreground mt-3 text-sm">
                {selected.category} · {selected.city}, {selected.province}
              </p>
              {hasValidCoordinates(selected) && (
                <p className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                  <MapPin aria-hidden="true" className="size-3.5" />
                  Koordinat: {selected.latitude.toFixed(6)},{" "}
                  {selected.longitude.toFixed(6)}
                </p>
              )}
              <p className="text-muted-foreground mt-2 flex items-center gap-2 text-xs">
                <Clock3 aria-hidden="true" className="size-4 shrink-0" />
                Dikirim {formatDate(selected.submittedAt)}
              </p>

              <div className="border-border mt-5 border-t pt-4">
                <h3 className="text-foreground flex items-center gap-2 font-semibold">
                  <Shield aria-hidden="true" className="text-primary size-4" />
                  Sumber &amp; Validasi
                </h3>
                <p className="text-muted-foreground mt-2 text-xs leading-5">
                  Identitas pelapor dan petugas dirahasiakan. Jejak yang
                  ditampilkan hanya peran dan pembaruan publik yang tercatat.
                </p>
                {detailError ? (
                  <p role="alert" className="text-destructive mt-3 text-sm">
                    {detailError}
                  </p>
                ) : !provenance ? (
                  <p
                    role="status"
                    className="text-muted-foreground mt-3 text-sm"
                  >
                    Memuat riwayat validasi…
                  </p>
                ) : (
                  <>
                    <ol
                      data-testid="validation-timeline"
                      aria-label="Timeline validasi laporan"
                      className="mt-4 space-y-4"
                    >
                      {provenance.validationTimeline?.map((event, index) => (
                        <li
                          key={`${event.status}-${event.timestamp}-${index}`}
                          className="relative flex gap-3"
                        >
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2
                              aria-hidden="true"
                              className="size-4"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="text-foreground block text-sm font-medium">
                              {event.stage}
                            </span>
                            <span className="text-muted-foreground mt-1 block text-xs">
                              Peran: {event.role}
                            </span>
                            <time
                              className="text-muted-foreground mt-1 block text-xs"
                              dateTime={event.timestamp}
                            >
                              {formatDate(event.timestamp)}
                            </time>
                          </span>
                        </li>
                      ))}
                    </ol>
                    {provenance.validationTimeline?.length === 1 ? (
                      <p className="text-muted-foreground mt-3 text-xs leading-5">
                        Belum ada tahap validasi atau pembaruan publik lain yang
                        tercatat.
                      </p>
                    ) : null}
                    <p className="text-muted-foreground mt-4 text-xs leading-5">
                      {provenance.aiConfidence == null
                        ? provenance.aiConfidenceNote
                        : `Klasifikasi oleh AI — confidence ${Math.round(provenance.aiConfidence * 100)}%. AI hanya membantu penjelasan dan tidak menentukan status laporan.`}
                    </p>
                    {provenance.aiConfidence != null ? (
                      <div
                        role="progressbar"
                        aria-label="Confidence klasifikasi AI"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(
                          provenance.aiConfidence * 100,
                        )}
                        className="bg-muted mt-2 h-2 overflow-hidden rounded-full"
                      >
                        <span
                          className="bg-primary block h-full rounded-full"
                          style={{
                            width: `${Math.min(100, Math.max(0, provenance.aiConfidence * 100))}%`,
                          }}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
              <p className="text-muted-foreground border-border mt-5 border-t pt-4 text-xs leading-5">
                Laporan dengan koordinat ditampilkan sebagai penanda di peta.
                Nama pelapor, kontak, dan lokasi rinci tidak dipublikasikan di
                peta.
              </p>
            </aside>
          ) : (
            <aside className="border-border bg-card text-muted-foreground rounded-2xl border p-6 text-sm leading-6 lg:sticky lg:top-24">
              Pilih laporan pada daftar untuk melihat sumber data dan riwayat
              validasi. Tidak ada panel detail yang ditampilkan sebelum laporan
              dipilih.
            </aside>
          )}
        </div>
      </section>
    </main>
  );
}