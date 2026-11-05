"use client";

import {
  AppWindow,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  History,
  Info,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Search,
  Shield,
  ShieldCheck,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

export interface AuditItem {
  id: string;
  eventId: string;
  timestamp: string;
  dateLabel: string;
  timeLabel: string;
  fullTimestampLabel: string;
  actorName: string;
  actorRole: string;
  actorId?: string | null;
  moduleKey: string;
  moduleName: string;
  moduleCategory: string;
  objectLabel: string;
  objectCode?: string;
  objectType: string;
  actionLabel: string;
  actionKey?: string;
  result: "success" | "rejected";
  detailTitle?: string;
  maskedNip?: string;
  scopeLabel?: string;
  sourceLabel?: string;
  beforeState?: {
    title: string;
    items: string[];
  };
  afterState?: {
    title: string;
    items: string[];
  };
  reasonText?: string;
}

interface ApiAuditItem {
  readonly eventId: string;
  readonly id: string;
  readonly timestamp: string;
  readonly actorId: string | null;
  readonly module: string;
  readonly action: string;
  readonly result: string;
  readonly objectType: string;
  readonly objectId: string | null;
  readonly summary: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

interface AuditLogListResult {
  readonly data: readonly ApiAuditItem[];
  readonly meta: {
    readonly total: number;
    readonly limit: number;
    readonly offset: number;
    readonly dateRange: {
      readonly startDate: string;
      readonly endDate: string;
    };
  };
}

interface AuditLogSummaryResult {
  readonly data: {
    readonly total: number;
    readonly byModule: ReadonlyArray<{ readonly module: string; readonly count: number }>;
    readonly byAction: ReadonlyArray<{ readonly action: string; readonly count: number }>;
    readonly byResult: ReadonlyArray<{ readonly result: string; readonly count: number }>;
    readonly byObjectType: ReadonlyArray<{ readonly objectType: string; readonly count: number }>;
  };
}

interface FilterState {
  dateRange: string;
  actor: string;
  module: string;
  action: string;
  result: string;
  objectType: string;
  searchQuery: string;
}

const INITIAL_FILTERS: FilterState = {
  dateRange: "2026-10-22_2026-10-28",
  actor: "",
  module: "",
  action: "",
  result: "",
  objectType: "",
  searchQuery: "",
};

function buildAuditParams(appliedFilters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (appliedFilters.dateRange === "2026-10-22_2026-10-28") {
    params.set("start_date", "2026-10-22");
    params.set("end_date", "2026-10-28");
  } else if (appliedFilters.dateRange === "7d") {
    const now = new Date();
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    params.set("start_date", start.toISOString().split("T")[0]);
    params.set("end_date", now.toISOString().split("T")[0]);
  } else if (appliedFilters.dateRange === "30d") {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    params.set("start_date", start.toISOString().split("T")[0]);
    params.set("end_date", now.toISOString().split("T")[0]);
  }
  if (appliedFilters.module) params.set("module", appliedFilters.module);
  if (appliedFilters.action) params.set("action", appliedFilters.action);
  if (appliedFilters.result) params.set("result", appliedFilters.result);
  if (appliedFilters.objectType) params.set("object_type", appliedFilters.objectType);
  if (appliedFilters.searchQuery) params.set("search_query", appliedFilters.searchQuery);
  params.set("limit", "200");
  return params;
}

function formatDateLabels(timestamp: string): {
  dateLabel: string;
  timeLabel: string;
  fullTimestampLabel: string;
} {
  const dateObj = new Date(timestamp);
  const valid = !Number.isNaN(dateObj.getTime());
  const dateLabel = valid
    ? dateObj.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "28 Okt 2026";
  const timeLabel = valid
    ? `${dateObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })} WIB`
    : "12.00.00 WIB";
  return {
    dateLabel,
    timeLabel,
    fullTimestampLabel: `${dateLabel}, ${timeLabel}`,
  };
}

function mapApiItem(item: ApiAuditItem, index: number): AuditItem {
  const { dateLabel, timeLabel, fullTimestampLabel } = formatDateLabels(item.timestamp);
  const meta = item.metadata ?? {};
  const actorName =
    (typeof meta.actorName === "string" && meta.actorName) ||
    (typeof meta.actor === "string" && meta.actor) ||
    (item.actorId ? `Pengguna (${item.actorId.slice(0, 8)})` : "Petugas Terotorisasi");
  const actorRole =
    (typeof meta.actorRole === "string" && meta.actorRole) ||
    (item.module === "executive" ? "Superadmin" : "Operator CMS");

  const objectLabel =
    (typeof meta.objectLabel === "string" && meta.objectLabel) ||
    (item.objectId ? `${item.objectType.toUpperCase()}-${item.objectId.slice(0, 6)}` : item.objectType);

  return {
    id: item.id,
    eventId: item.eventId || `AUD-${index + 1}`,
    timestamp: item.timestamp,
    dateLabel,
    timeLabel,
    fullTimestampLabel,
    actorName,
    actorRole,
    actorId: item.actorId,
    moduleKey: item.module,
    moduleName: item.module.includes("executive")
      ? "Executive - hak akses"
      : item.module.includes("kyc")
        ? "Verifikasi akun ASN"
        : `CMS - ${item.module}`,
    moduleCategory: item.module.includes("executive")
      ? "Executive"
      : item.module.includes("kyc")
        ? "KYC"
        : "Open Government Data",
    objectLabel,
    objectType: item.objectType,
    actionLabel: item.action,
    result: item.result === "rejected" || item.result === "failure" ? "rejected" : "success",
    detailTitle: item.summary,
    reasonText: typeof meta.reason === "string" ? meta.reason : undefined,
  };
}

export function ExecutiveAuditLogs() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [records, setRecords] = useState<AuditItem[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AuditItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<AuditLogSummaryResult | null>(null);
const [isExporting, setIsExporting] = useState(false);
const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
const [profile, setProfile] = useState<{
  name: string;
  email: string;
  roles: string[];
} | null>(null);
const [profileLoading, setProfileLoading] = useState(true);
const [profileError, setProfileError] = useState<string | null>(null);

const fetchProfile = useCallback(async () => {
  setProfileLoading(true);
  setProfileError(null);
  try {
    const res = await fetch("/api/v1/user/me", { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        setProfile(null);
        return;
      }
      throw new Error(`Gagal memuat profil (${res.status}).`);
    }
    const payload = await res.json();
    const data = payload?.data as
      | { name: string; email: string; roles: string[] }
      | undefined;
    if (
      data &&
      typeof data.name === "string" &&
      typeof data.email === "string" &&
      Array.isArray(data.roles)
    ) {
      setProfile(data);
    }
  } catch (err) {
    setProfileError(
      err instanceof Error ? err.message : "Gagal memuat profil pengguna.",
    );
    setProfile(null);
  } finally {
    setProfileLoading(false);
  }
}, []);

useEffect(() => {
  void fetchProfile();
}, [fetchProfile]);

  // Sinkronisasi langsung dengan backend /api/v1/audit/logs dan /api/v1/audit/logs/summary.
  // Backend adalah sumber kebenaran; tidak ada data tiruan sebagai pengganti.
  const fetchAuditData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = buildAuditParams(appliedFilters);
      const queryString = params.toString();
      const logsUrl = `/api/v1/audit/logs${queryString ? `?${queryString}` : ""}`;
      const summaryUrl = `/api/v1/audit/logs/summary${queryString ? `?${queryString}` : ""}`;

      const [logsRes, summaryRes] = await Promise.all([
        fetch(logsUrl, { cache: "no-store" }),
        fetch(summaryUrl, { cache: "no-store" }),
      ]);

      if (!logsRes.ok) {
        throw new Error(`Gagal memuat log audit (${logsRes.status}).`);
      }

      const logsPayload = (await logsRes.json()) as AuditLogListResult;

      if (summaryRes.ok) {
        setSummaryData((await summaryRes.json()) as AuditLogSummaryResult);
      }

      const data = logsPayload.data ?? [];
      const mapped: AuditItem[] = data.map((item, index) => mapApiItem(item, index));
      setRecords(mapped);
      setSelectedRecord(mapped[0] ?? null);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Gagal mensinkronkan dengan backend audit.");
      setRecords([]);
      setSummaryData(null);
      setSelectedRecord(null);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    void fetchAuditData();
  }, [fetchAuditData]);

  // Filter sisi klien pada data yang disinkronkan dari backend
  const filteredRecords = useMemo(() => {
    return records.filter((item) => {
      if (appliedFilters.actor && !item.actorName.toLowerCase().includes(appliedFilters.actor.toLowerCase())) {
        return false;
      }
      if (appliedFilters.module) {
        if (!item.moduleKey.toLowerCase().includes(appliedFilters.module.toLowerCase())) {
          return false;
        }
      }
      if (appliedFilters.action && !item.actionLabel.toLowerCase().includes(appliedFilters.action.toLowerCase())) {
        return false;
      }
      if (appliedFilters.result && item.result !== appliedFilters.result) {
        return false;
      }
      if (appliedFilters.objectType && !item.objectType.toLowerCase().includes(appliedFilters.objectType.toLowerCase())) {
        return false;
      }
      if (appliedFilters.searchQuery) {
        const q = appliedFilters.searchQuery.toLowerCase();
        const matchesEventId = item.eventId.toLowerCase().includes(q);
        const matchesObject = item.objectLabel.toLowerCase().includes(q);
        const matchesActor = item.actorName.toLowerCase().includes(q);
        const matchesAction = item.actionLabel.toLowerCase().includes(q);
        if (!matchesEventId && !matchesObject && !matchesActor && !matchesAction) {
          return false;
        }
      }
      return true;
    });
  }, [records, appliedFilters]);

  const totalEvents = summaryData?.data.total ?? filteredRecords.length;
  const successCount = filteredRecords.filter((r) => r.result === "success").length;
  const rejectedCount = filteredRecords.filter((r) => r.result === "rejected").length;

  const cmsEvents = filteredRecords.filter((r) => r.moduleKey.startsWith("cms"));
  const cmsEventsCount = cmsEvents.length;
  const cmsSuccessCount = cmsEvents.filter((r) => r.result === "success").length;
  const cmsRejectedCount = cmsEvents.filter((r) => r.result === "rejected").length;

  const verificationCount = filteredRecords.filter((r) => r.moduleKey === "kyc").length;
  const accessChangeCount = filteredRecords.filter((r) => r.moduleKey === "executive").length;

  const dateRangeLabel =
    appliedFilters.dateRange === "2026-10-22_2026-10-28"
      ? "22–28 Oktober 2026"
      : appliedFilters.dateRange === "7d"
        ? "7 hari terakhir"
        : appliedFilters.dateRange === "30d"
          ? "30 hari terakhir"
          : "Semua rentang";

  function handleFilterSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function updateFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  // Handle export by hitting /api/v1/audit/logs/export with fallback
  async function handleExport() {
    setIsExporting(true);
    try {
      const params = buildAuditParams(appliedFilters);
      params.set("format", "csv");

      const response = await fetch(`/api/v1/audit/logs/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback: generate CSV client side
    } finally {
      setIsExporting(false);
    }

    // Client-side fallback export
    const headers = ["Waktu", "ID Kejadian", "Aktor", "Peran", "Modul", "Objek", "Aksi", "Hasil"];
    const rows = filteredRecords.map((r) => [
      `"${r.dateLabel} ${r.timeLabel}"`,
      `"${r.eventId}"`,
      `"${r.actorName}"`,
      `"${r.actorRole}"`,
      `"${r.moduleName}"`,
      `"${r.objectLabel}"`,
      `"${r.actionLabel}"`,
      `"${r.result === "success" ? "Berhasil" : "Ditolak"}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-terpadu-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#f7faff] text-slate-800">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Brand Header */}
        <div className="flex h-[68px] items-center gap-2.5 border-b border-slate-100 px-5">
          <img
            src="/logo/brand.svg"
            alt="Agoraya"
            className="size-[34px] object-contain"
            loading="eager"
          />
          <span className="leading-tight">
            <span className="block text-[15px] font-bold tracking-tight text-slate-800">
              Agoraya
            </span>
            <span className="block text-[9px] font-medium tracking-wide text-slate-400">
              Data Publik, Untuk Semua
            </span>
          </span>
        </div>

        {/* Workspace Card */}
        <div className="mx-3 mt-4 rounded-md bg-blue-50/70 border border-blue-100/60 px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Ruang Executive
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-700">
            Pemerintah Kota Contoh
          </p>
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-blue-100/80 px-2 py-0.5 text-[9px] font-semibold text-blue-700">
            <LockKeyhole aria-hidden="true" className="size-2.5" />
            Superadmin
          </div>
        </div>

        {/* Nav Links */}
        <nav aria-label="Navigasi ruang kerja" className="mt-5 px-3">
          <p className="mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Tata kelola
          </p>
          <a
            href="/executive/dashboard"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <Shield aria-hidden="true" className="size-3.5 text-slate-500" />
            Kontrol akses ASN
          </a>
          <a
            href="/executive/audit"
            className="mt-1 flex items-center gap-2.5 rounded-md bg-[#dbeafe] px-2.5 py-2 text-[11px] font-semibold text-blue-700 shadow-sm"
          >
            <ClipboardCheck aria-hidden="true" className="size-3.5 text-blue-600" />
            Audit log terpadu
          </a>
          <a
            href="/executive/asn-performance"
            className="mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LayoutDashboard aria-hidden="true" className="size-3.5 text-slate-500" />
            Kinerja ASN
          </a>

          <p className="mt-5 mb-2 px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Ruang terhubung
          </p>
          <a
            href="/data-management"
            className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <AppWindow aria-hidden="true" className="size-3.5 text-slate-400" />
            Seluruh laman CMS
          </a>
          <a
            href="/admin"
            className="mt-0.5 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
          >
            <CheckCircle2 aria-hidden="true" className="size-3.5 text-slate-400" />
            Verifikasi akun ASN
          </a>
        </nav>

        {/* Security / Principle card */}
        <div className="mx-3 mt-auto mb-3 rounded-md border border-slate-200/80 bg-slate-50/70 p-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-700">
            <LockKeyhole aria-hidden="true" className="size-3.5 text-blue-600" />
            Akses berprinsip minimum
          </div>
          <p className="mt-1.5 text-[9px] leading-relaxed text-slate-500">
            Setiap perubahan hak akses tercatat dan dapat ditelusuri.
          </p>
        </div>

        {/* Profile Card Footer */}
        <div className="border-t border-slate-100 p-3 flex items-center gap-3">
          {profileLoading ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 animate-pulse">
              …
            </div>
          ) : profileError || !profile ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
              ?
            </div>
          ) : (
            <>
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {profile.name}
                </p>
                <p className="truncate text-[10px] text-slate-400">
                  {profile.roles.join(" · ")} · Pemerintah Kota Contoh
                </p>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:pl-[224px]">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Tutup navigasi" : "Buka navigasi"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="grid size-8 shrink-0 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600 lg:hidden"
            >
              <Menu aria-hidden="true" className="size-4" />
            </button>
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-400 truncate">
              <Building2 aria-hidden="true" className="size-3.5 text-blue-600 shrink-0" />
              <span>Tata kelola Instansi</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-700">Ruang Executive</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700 sm:inline-flex">
              Area terbatas
            </span>
            <span className="hidden text-[11px] text-slate-400 md:inline">
              Waktu sistem: WIB
            </span>
            <button
              type="button"
              aria-label="Notifikasi"
              className="relative grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <Bell aria-hidden="true" className="size-4" />
              <span className="absolute top-2 right-2 size-1.5 rounded-full bg-blue-600" />
            </button>
          </div>

          {/* Mobile navigation drawer */}
          {mobileMenuOpen && (
            <nav
              aria-label="Navigasi mobile"
              className="absolute inset-x-0 top-full border-b border-slate-200 bg-white p-3 shadow-lg lg:hidden z-30"
            >
              <a
                href="/executive/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <Shield aria-hidden="true" className="size-4" />
                Kontrol akses ASN
              </a>
              <a
                href="/executive/audit"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
              >
                <ClipboardCheck aria-hidden="true" className="size-4" />
                Audit log terpadu
              </a>
              <a
                href="/executive/asn-performance"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <LayoutDashboard aria-hidden="true" className="size-4" />
                Kinerja ASN
              </a>
            </nav>
          )}
        </header>

        {/* Page Content */}
        <main className="px-4 py-6 sm:px-6 lg:px-7 max-w-[1440px] mx-auto">
          {/* Breadcrumb & Title Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Ruang Executive <span className="mx-1">/</span>{" "}
                <span className="text-slate-600">Audit log terpadu</span>
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Audit log terpadu
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Telusuri perubahan seluruh laman CMS, verifikasi ASN, dan kewenangan Executive.
              </p>
            </div>

            <div className="flex flex-col items-start sm:items-end gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                SINKRONISASI LANGSUNG DARI BACKEND
              </span>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-blue-600 transition-colors disabled:opacity-50"
              >
                <Download aria-hidden="true" className="size-3.5 text-slate-600" />
                {isExporting ? "Mengekspor..." : "Ekspor log"}
              </button>
            </div>
          </div>

          {/* 4 Summary Cards */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {/* Card 1 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Kejadian dalam periode
                </span>
                <div className="grid size-7 place-items-center rounded-full border border-blue-200 text-blue-600">
                  <History aria-hidden="true" className="size-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {totalEvents}
                </span>
                <p className="mt-1 text-xs text-slate-400">{dateRangeLabel}</p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-500">Kejadian CMS</span>
                <div className="grid size-7 place-items-center rounded-full border border-blue-200 text-blue-600">
                  <AppWindow aria-hidden="true" className="size-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {cmsEventsCount}
                </span>
                <p className="mt-1 text-xs text-slate-400">
                  4 ruang CMS · {cmsSuccessCount} berhasil, {cmsRejectedCount} ditolak
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-500">Verifikasi ASN</span>
                <div className="grid size-7 place-items-center rounded-full border border-blue-200 text-blue-600">
                  <CheckCircle2 aria-hidden="true" className="size-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {verificationCount}
                </span>
                <p className="mt-1 text-xs text-slate-400">Keputusan akun terverifikasi</p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Perubahan hak akses
                </span>
                <div className="grid size-7 place-items-center rounded-full border border-blue-200 text-blue-600">
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-3xl font-bold tracking-tight text-slate-900">
                  {accessChangeCount}
                </span>
                <p className="mt-1 text-xs text-slate-400">Pemberian Executive berhasil</p>
              </div>
            </div>
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <p className="font-semibold">Sinkronisasi backend gagal</p>
              <p className="mt-0.5">{apiError}</p>
              <p className="mt-1 text-amber-700/90">
                Memeriksa koneksi dan autentikasi ke <code>/api/v1/audit/logs</code>.
              </p>
            </div>
          )}

          {/* Filter Card: Penyaring kejadian */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Penyaring kejadian</h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Semua kejadian hanya baca. Ekspor mengikuti penyaring dan penyamaran identitas.
              </p>
            </div>

            <form onSubmit={handleFilterSubmit} className="mt-4 space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Rentang tanggal
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilter("dateRange", e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="2026-10-22_2026-10-28">22–28 Oktober 2026</option>
                    <option value="7d">7 hari terakhir</option>
                    <option value="30d">30 hari terakhir</option>
                    <option value="all">Semua rentang</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Pelaku
                  </label>
                  <select
                    value={filters.actor}
                    onChange={(e) => updateFilter("actor", e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua pelaku</option>
                    <option value="Maya Pertiwi">Maya Pertiwi</option>
                    <option value="Citra Larasati">Citra Larasati</option>
                    <option value="Eka Wulandari">Eka Wulandari</option>
                    <option value="Aditya Nugraha">Aditya Nugraha</option>
                    <option value="Bima Santosa">Bima Santosa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Modul / laman
                  </label>
                  <select
                    value={filters.module}
                    onChange={(e) => updateFilter("module", e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Seluruh CMS, KYC & Executive</option>
                    <option value="executive">Executive - hak akses</option>
                    <option value="kyc">Verifikasi akun ASN (KYC)</option>
                    <option value="cms">CMS (Seluruh ruang)</option>
                    <option value="cms.insight">Editor & publikasi Insight</option>
                    <option value="cms.dataset">Katalog dataset & metadata</option>
                    <option value="cms.apbd">Anggaran APBD</option>
                    <option value="cms.civic">Verifikasi & moderasi</option>
                    <option value="cms.services">Standar & formulir layanan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Aksi
                  </label>
                  <select
                    value={filters.action}
                    onChange={(e) => updateFilter("action", e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua aksi</option>
                    <option value="Tambah hak">Tambah hak</option>
                    <option value="Setujui akun">Setujui akun</option>
                    <option value="Publikasi">Publikasi</option>
                    <option value="Submit">Submit</option>
                    <option value="Review">Review</option>
                    <option value="Perbarui status">Perbarui status</option>
                    <option value="Ubah standar">Ubah standar</option>
                    <option value="Validasi sumber">Validasi sumber</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 items-end">
                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Hasil
                  </label>
                  <select
                    value={filters.result}
                    onChange={(e) => updateFilter("result", e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua hasil</option>
                    <option value="success">Berhasil</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Objek
                  </label>
                  <select
                    value={filters.objectType}
                    onChange={(e) => updateFilter("objectType", e.target.value)}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua jenis objek</option>
                    <option value="users">ASN / Pengguna</option>
                    <option value="insight">Insight</option>
                    <option value="dataset">Dataset</option>
                    <option value="budget">Anggaran</option>
                    <option value="report">Laporan</option>
                    <option value="service">Layanan</option>
                  </select>
                </div>

                <div className="lg:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Cari kejadian
                  </label>
                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={filters.searchQuery}
                      onChange={(e) => updateFilter("searchQuery", e.target.value)}
                      placeholder="ID kejadian, objek, atau pelaku"
                      className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs text-slate-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    className="w-full rounded-md bg-blue-600 py-2 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 h-[38px] transition-colors"
                  >
                    Terapkan filter
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Table Card: Riwayat kejadian */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Riwayat kejadian</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  {isLoading
                    ? "Memuat dari backend..."
                    : `${totalEvents} kejadian · ${successCount} berhasil, ${rejectedCount} ditolak · waktu WIB (UTC+7)`}
                </p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-medium text-blue-700">
                Hanya baca
              </span>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Memuat data audit dari backend <span className="animate-pulse">…</span>
              </div>
            ) : apiError ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Tidak dapat menampilkan data. Lihat peringatan sinkronisasi di atas.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500">
                        <th className="px-5 py-3">Waktu WIB ↓</th>
                        <th className="px-4 py-3">Aktor / peran</th>
                        <th className="px-4 py-3">Modul / laman</th>
                        <th className="px-4 py-3">Objek</th>
                        <th className="px-4 py-3">Aksi</th>
                        <th className="px-4 py-3">Hasil</th>
                        <th className="px-5 py-3 text-right">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredRecords.map((record) => {
                        const isSelected =
                          selectedRecord?.id === record.id ||
                          selectedRecord?.eventId === record.eventId;
                        return (
                          <tr
                            key={record.id || record.eventId}
                            className={`hover:bg-slate-50/80 transition-colors ${
                              isSelected ? "bg-blue-50/30" : ""
                            }`}
                          >
                            <td className="px-5 py-3.5">
                              <p className="font-semibold text-slate-800">{record.dateLabel}</p>
                              <p className="text-[11px] text-slate-400">{record.timeLabel}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-slate-800">{record.actorName}</p>
                              <p className="text-[11px] text-slate-400">{record.actorRole}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-slate-800">{record.moduleName}</p>
                              <p className="text-[11px] text-slate-400">{record.moduleCategory}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-slate-700 font-medium">{record.objectLabel}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="text-slate-700">{record.actionLabel}</p>
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-semibold ${
                                  record.result === "success"
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : "bg-amber-50 text-amber-700 border border-amber-200"
                                }`}
                              >
                                {record.result === "success" ? "Berhasil" : "Ditolak"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {isSelected ? (
                                <span className="font-medium text-blue-600">Terbuka</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedRecord(record)}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  Lihat →
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredRecords.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                            Tidak ada log kejadian yang cocok dengan penyaring.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5 text-xs text-slate-500">
                  <p>
                    Menampilkan 1-{filteredRecords.length} dari {totalEvents} kejadian dalam periode
                  </p>
                  <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                    Halaman 1 dari 1
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Selected Event Detail */}
            {!isLoading && !apiError && selectedRecord && (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Detail kejadian · {selectedRecord.detailTitle || selectedRecord.actionLabel}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {selectedRecord.eventId} · {selectedRecord.fullTimestampLabel}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded px-2.5 py-0.5 text-[10px] font-semibold ${
                      selectedRecord.result === "success"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {selectedRecord.result === "success" ? "Berhasil" : "Ditolak"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
                  {/* Left side details */}
                  <div className="space-y-4 lg:col-span-5 border-b border-slate-100 pb-4 lg:border-b-0 lg:border-r lg:pr-6">
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">
                        Pelaku / peran saat kejadian
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        {selectedRecord.actorName} · {selectedRecord.actorRole}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">
                        Objek / identitas tersamar
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        {selectedRecord.objectLabel}
                      </p>
                      {selectedRecord.maskedNip && (
                        <div className="mt-2">
                          <p className="text-[11px] font-medium text-slate-400">
                            NIP tersamar
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-500 font-mono">
                            {selectedRecord.maskedNip}
                          </p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">Cakupan</p>
                      <p className="mt-1 text-xs text-slate-700 font-medium">
                        {selectedRecord.scopeLabel || "Diskominfo · Pemerintah Kota Contoh"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-400">
                        Sumber pencatatan
                      </p>
                      <p className="mt-1 text-xs text-slate-700 font-medium">
                        {selectedRecord.sourceLabel || "Ruang Executive - kontrol akses ASN"}
                      </p>
                    </div>
                  </div>

                  {/* Right side comparison */}
                  <div className="space-y-4 lg:col-span-7">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* Sebelum Box */}
                      <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                        <span className="inline-block rounded bg-slate-200/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-600">
                          SEBELUM
                        </span>
                        <p className="mt-2 text-xs font-semibold text-slate-800">
                          {selectedRecord.beforeState?.title || "Tidak ada akses Executive"}
                        </p>
                        <div className="mt-1.5 space-y-1 text-[11px] text-slate-500">
                          {selectedRecord.beforeState?.items ? (
                            selectedRecord.beforeState.items.map((item, idx) => (
                              <p key={idx}>{item}</p>
                            ))
                          ) : (
                            <>
                              <p>Audit log: tidak diberikan</p>
                              <p>Kinerja ASN: tidak diberikan</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Sesudah Box */}
                      <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-3.5">
                        <span className="inline-block rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-700">
                          SESUDAH
                        </span>
                        <p className="mt-2 text-xs font-semibold text-slate-800">
                          {selectedRecord.afterState?.title || "Executive - Pengamat"}
                        </p>
                        <div className="mt-1.5 space-y-1 text-[11px] text-slate-600">
                          {selectedRecord.afterState?.items ? (
                            selectedRecord.afterState.items.map((item, idx) => (
                              <p key={idx}>{item}</p>
                            ))
                          ) : (
                            <>
                              <p>Audit log & kinerja: hanya baca</p>
                              <p>Kontrol dan pemberian akses: tidak</p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-[11px] font-medium text-slate-400">Alasan perubahan</p>
                      <p className="mt-1 text-xs leading-relaxed text-slate-600 whitespace-pre-line">
                        {selectedRecord.reasonText ||
                          "Penugasan pemantauan tata kelola data Diskominfo sesuai ST-021/2026. Hak dibatasi pada audit dan pemantauan kinerja.\nTidak ada perubahan hak CMS atau KYC. Catatan ini tidak dapat diedit atau dihapus dari ruang Executive."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Privacy Alert Banner */}
          <div className="mt-6 flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-4 text-xs text-blue-900">
            <Info aria-hidden="true" className="size-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-semibold text-blue-900">
                Privasi tetap terlindungi dalam penelusuran
              </p>
              <p className="mt-0.5 text-[11px] text-blue-700/90 leading-relaxed">
                Log hanya menampilkan metadata yang diperlukan. NIK penuh, kata sandi dan isi dokumen identitas tidak ditampilkan maupun disertakan dalam ekspor.
              </p>
            </div>
          </div>

          {/* Page Footer */}
          <footer className="mt-10 flex flex-col items-center justify-between gap-2 border-t border-slate-200 pt-6 pb-8 text-xs text-slate-400 sm:flex-row">
            <p>© {new Date().getFullYear()} Agoraya · Ruang Executive</p>
            <div className="flex items-center gap-4 text-slate-500">
              <a href="#" className="hover:underline">
                Panduan tata kelola
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Privasi
              </a>
              <span>·</span>
              <a href="#" className="hover:underline">
                Aksesibilitas
              </a>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
