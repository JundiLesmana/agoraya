"use client";

import {
  AlertCircle,
  AppWindow,
  Bell,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Inbox,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  Shield,
  SlidersHorizontal,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";

type AsnPerformanceTaskType =
  | "layanan_kesehatan"
  | "layanan_pendidikan"
  | "layanan_sosial"
  | "laporan_warga"
  | "perizinan"
  | "submit_cms"
  | "review_cms"
  | "review_kyc";

const ALL_TASK_TYPES: readonly AsnPerformanceTaskType[] = [
  "layanan_kesehatan",
  "layanan_pendidikan",
  "layanan_sosial",
  "laporan_warga",
  "perizinan",
  "submit_cms",
  "review_cms",
  "review_kyc",
];

const TASK_TYPE_LABELS: Readonly<Record<AsnPerformanceTaskType, string>> = {
  layanan_kesehatan: "Layanan Kesehatan",
  layanan_pendidikan: "Layanan Pendidikan",
  layanan_sosial: "Layanan Sosial",
  laporan_warga: "Laporan Warga",
  perizinan: "Perizinan",
  submit_cms: "Submit CMS",
  review_cms: "Review CMS",
  review_kyc: "Review KYC",
};

const TASK_TYPE_COLORS: Readonly<Record<AsnPerformanceTaskType, string>> = {
  layanan_kesehatan: "#2563eb",
  layanan_pendidikan: "#0d9488",
  layanan_sosial: "#38bdf8",
  laporan_warga: "#7c3aed",
  perizinan: "#b91c1c",
  submit_cms: "#2563eb",
  review_cms: "#0d9488",
  review_kyc: "#38bdf8",
};

interface TaskBreakdown extends Record<AsnPerformanceTaskType, number> {
  layanan_kesehatan: number;
  layanan_pendidikan: number;
  layanan_sosial: number;
  laporan_warga: number;
  perizinan: number;
  submit_cms: number;
  review_cms: number;
  review_kyc: number;
}

interface AsnPerformanceRecord {
  id: string;
  name: string;
  position: string;
  opd: string;
  unit: string | null;
  email: string;
  nip: string | null;
  accessScope: string;
  assignedTasks: number;
  completedTasks: number;
  completionRate: number | null;
  taskBreakdown: TaskBreakdown;
  statusLabel: string;
}

interface TaskTypeSummary {
  assignedTasks: number;
  completedTasks: number;
  completionRate: number | null;
}

interface PerformanceSummaryData {
  asnCount: number;
  assignedTasks: number;
  completedTasks: number;
  completionRate: number | null;
  pendingTasks: number;
  withAssignmentCount: number;
  noAssignmentCount: number;
  byTaskType: Record<AsnPerformanceTaskType, TaskTypeSummary>;
}

interface TrendWeekData {
  label: string;
  taskCountLabel: string;
  taskBreakdown: TaskBreakdown;
  total: number;
}

interface LowestActivityData {
  shortName: string;
  fullName: string;
  email: string;
  opd: string | null;
  position: string | null;
  taskBreakdown: TaskBreakdown;
  completedTasks: number;
  assignedTasks: number;
}

interface FilterState {
  dateRange: string;
  opd: string;
  position: string;
  accessScope: string;
  taskTypeOption: string;
}

const INITIAL_FILTERS: FilterState = {
  dateRange: "2026-10-01:2026-10-28",
  opd: "",
  position: "",
  accessScope: "",
  taskTypeOption: "all",
};

function buildPerformanceParams(appliedFilters: FilterState): URLSearchParams {
  const params = new URLSearchParams();
  const [start, end] = appliedFilters.dateRange.split(":");
  if (start && end) {
    params.set("start_date", start);
    params.set("end_date", end);
  }
  if (appliedFilters.opd) params.set("opd", appliedFilters.opd);
  if (appliedFilters.position) params.set("position", appliedFilters.position);

  const taskType = appliedFilters.taskTypeOption;
  if (taskType !== "all" && ALL_TASK_TYPES.includes(taskType as AsnPerformanceTaskType)) {
    params.set("task_types", taskType);
  }

  return params;
}

function emptyTaskBreakdown(): TaskBreakdown {
  return {
    layanan_kesehatan: 0,
    layanan_pendidikan: 0,
    layanan_sosial: 0,
    laporan_warga: 0,
    perizinan: 0,
    submit_cms: 0,
    review_cms: 0,
    review_kyc: 0,
  };
}

function mapDetailItem(
  item: {
    userId: string;
    name: string;
    email: string;
    nip: string | null;
    opd: string | null;
    unit: string | null;
    position: string | null;
    assignedTasks: number;
    completedTasks: number;
    completionRate: number | null;
    taskBreakdown: Partial<TaskBreakdown>;
    statusLabel: string;
  },
): AsnPerformanceRecord {
  const breakdown: TaskBreakdown = { ...emptyTaskBreakdown(), ...item.taskBreakdown };
  const assigned = item.assignedTasks;
  const completed = item.completedTasks;
  return {
    id: item.userId,
    name: item.name,
    position: item.position ?? "—",
    opd: item.opd ?? "—",
    unit: item.unit ?? null,
    email: item.email,
    nip: item.nip,
    accessScope: "Kewenangan terdaftar",
    assignedTasks: assigned,
    completedTasks: completed,
    completionRate: item.completionRate,
    taskBreakdown: breakdown,
    statusLabel: item.statusLabel,
  };
}

export function ExecutiveAsnPerformance() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Filter selections
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(INITIAL_FILTERS);

  // Table sorting & filtering
  const [tableSortColumn, setTableSortColumn] = useState<string>("completedTasks");
  const [tableSortDirection, setTableSortDirection] = useState<"asc" | "desc">("asc");
  const [includeZero, setIncludeZero] = useState(true);

  // Lowest activity sort toggle
  const [lowestSortDirection, setLowestSortDirection] = useState<"asc" | "desc">("asc");

  // Live state connected to API
  const [summaryData, setSummaryData] = useState<PerformanceSummaryData | null>(null);
  const [trendsData, setTrendsData] = useState<TrendWeekData[]>([]);
  const [lowestData, setLowestData] = useState<LowestActivityData[]>([]);
  const [records, setRecords] = useState<AsnPerformanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Profile from backend
  const [profile, setProfile] = useState<{ name: string; email: string; roles: string[] } | null>(null);
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

  // Sync with /api/v1/asn-performance endpoints
  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const params = buildPerformanceParams(appliedFilters);
      const queryString = params.toString() ? `?${params.toString()}` : "";

      const [summaryRes, trendsRes, lowestRes, detailsRes] = await Promise.all([
        fetch(`/api/v1/asn-performance/summary${queryString}`, { cache: "no-store" }),
        fetch(
          `/api/v1/asn-performance/trends${queryString}&granularity=week`,
          { cache: "no-store" },
        ),
        fetch(
          `/api/v1/asn-performance/lowest-activity${queryString}&limit=5`,
          { cache: "no-store" },
        ),
        fetch(`/api/v1/asn-performance/details${queryString}&limit=50`, { cache: "no-store" }),
      ]);

      const responses = [summaryRes, trendsRes, lowestRes, detailsRes];
      const anyFailed = responses.some((r) => !r.ok);
      if (anyFailed) {
        const failed = responses.find((r) => !r.ok);
        throw new Error(
          `Gagal memuat data kinerja (${failed?.status ?? "tidak diketahui"}).`,
        );
      }

      const summaryJson = await summaryRes.json();
      if (summaryJson.data?.totals) {
        const totals = summaryJson.data.totals;
        const byType = summaryJson.data.byTaskType ?? {};
        const assigned = totals.assignedTasks ?? 0;
        const completed = totals.completedTasks ?? 0;
        const byTaskType: Record<AsnPerformanceTaskType, TaskTypeSummary> = {} as Record<
          AsnPerformanceTaskType,
          TaskTypeSummary
        >;
        for (const t of ALL_TASK_TYPES) {
          byTaskType[t] = {
            assignedTasks: byType[t]?.assignedTasks ?? 0,
            completedTasks: byType[t]?.completedTasks ?? 0,
            completionRate: byType[t]?.completionRate ?? null,
          };
        }
        setSummaryData({
          asnCount: totals.asnCount ?? 0,
          assignedTasks: assigned,
          completedTasks: completed,
          completionRate:
            totals.completionRate ?? (assigned > 0 ? completed / assigned : 0),
          pendingTasks: Math.max(0, assigned - completed),
          withAssignmentCount: totals.asnCount ?? 0,
          noAssignmentCount: 0,
          byTaskType,
        });
      }

      if (trendsJsonOk(trendsRes)) {
        const trendsJson = await trendsRes.json();
        const items = trendsJson.data?.items ?? [];
        const mappedTrends: TrendWeekData[] = items.map(
          (item: { periodStart: string; totalCompleted: number; taskBreakdown: Partial<TaskBreakdown> }, idx: number) => ({
            label: `Minggu ${idx + 1}`,
            taskCountLabel: `${item.totalCompleted} tugas`,
            taskBreakdown: { ...emptyTaskBreakdown(), ...item.taskBreakdown },
            total: item.totalCompleted,
          }),
        );
        setTrendsData(mappedTrends);
      }

      if (lowestJsonOk(lowestRes)) {
        const lowestJson = await lowestRes.json();
        const items = lowestJson.data?.items ?? [];
        const mappedLowest: LowestActivityData[] = items.map(
          (item: {
            name: string;
            email: string;
            opd: string | null;
            position: string | null;
            taskBreakdown: Partial<TaskBreakdown>;
            completedTasks: number;
            assignedTasks: number;
          }) => ({
            shortName: item.name.split(" ")[0] ?? item.name,
            fullName: item.name,
            email: item.email,
            opd: item.opd ?? null,
            position: item.position ?? null,
            taskBreakdown: { ...emptyTaskBreakdown(), ...item.taskBreakdown },
            completedTasks: item.completedTasks,
            assignedTasks: item.assignedTasks,
          }),
        );
        setLowestData(mappedLowest);
      }

      if (detailsJsonOk(detailsRes)) {
        const detailsJson = await detailsRes.json();
        const items = detailsJson.data?.items ?? [];
        const mappedDetails: AsnPerformanceRecord[] = items.map(mapDetailItem);
        setRecords(mappedDetails);
      }
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : "Gagal memuat data kinerja dari backend.",
      );
      setSummaryData(null);
      setTrendsData([]);
      setLowestData([]);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilters]);

  useEffect(() => {
    void fetchPerformanceData();
  }, [fetchPerformanceData]);

  function trendsJsonOk(res: Response): boolean {
    return res.ok;
  }

  function lowestJsonOk(res: Response): boolean {
    return res.ok;
  }

  function detailsJsonOk(res: Response): boolean {
    return res.ok;
  }

  // Handle Apply Filter
  function handleApplyFilters(e: React.FormEvent) {
    e.preventDefault();
    setAppliedFilters({ ...filters });
  }

  // Handle Reset Filter
  function handleResetFilters() {
    setFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setSummaryData(null);
    setTrendsData([]);
    setLowestData([]);
    setRecords([]);
    setApiError(null);
  }

  // Handle Export CSV
  async function handleExport() {
    setIsExporting(true);
    try {
      const params = buildPerformanceParams(appliedFilters);
      params.set("format", "csv");

      const response = await fetch(`/api/v1/asn-performance/export?${params.toString()}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `kinerja-asn-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback CSV generation
    } finally {
      setIsExporting(false);
    }

    // Client-side fallback export
    const headers = [
      "Nama",
      "Jabatan",
      "OPD",
      "Unit",
      "Email",
      "NIP",
      "Ditugaskan",
      "Selesai",
      ...ALL_TASK_TYPES.map((t) => TASK_TYPE_LABELS[t]),
      "Penyelesaian",
      "Status",
    ];
    const rows = records.map((r) => [
      `"${r.name}"`,
      `"${r.position}"`,
      `"${r.opd}"`,
      `"${r.unit ?? ""}"`,
      `"${r.email}"`,
      `"${r.nip ?? ""}"`,
      r.assignedTasks,
      r.completedTasks,
      ...ALL_TASK_TYPES.map((t) => r.taskBreakdown[t]),
      r.completionRate !== null ? `${(r.completionRate * 100).toFixed(1)}%` : "Tidak ada penugasan",
      `"${r.statusLabel}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kinerja-asn-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  // Filtered and sorted records
  const filteredAndSortedRecords = useMemo(() => {
    let result = [...records];

    if (appliedFilters.opd) {
      result = result.filter((item) =>
        item.opd.toLowerCase().includes(appliedFilters.opd.toLowerCase()),
      );
    }
    if (appliedFilters.position) {
      result = result.filter((item) =>
        item.position.toLowerCase().includes(appliedFilters.position.toLowerCase()),
      );
    }
    if (appliedFilters.accessScope) {
      result = result.filter((item) =>
        item.accessScope.toLowerCase().includes(appliedFilters.accessScope.toLowerCase()),
      );
    }

    if (!includeZero) {
      result = result.filter((item) => item.assignedTasks > 0);
    }

    result.sort((a, b) => {
      if (a.assignedTasks === 0 && b.assignedTasks > 0) return 1;
      if (b.assignedTasks === 0 && a.assignedTasks > 0) return -1;

      let valA = 0;
      let valB = 0;

      if (tableSortColumn === "completedTasks") {
        valA = a.completedTasks;
        valB = b.completedTasks;
      } else if (tableSortColumn === "submitCms") {
        valA = a.taskBreakdown.submit_cms;
        valB = b.taskBreakdown.submit_cms;
      } else if (tableSortColumn === "reviewCms") {
        valA = a.taskBreakdown.review_cms;
        valB = b.taskBreakdown.review_cms;
      } else if (tableSortColumn === "reviewKyc") {
        valA = a.taskBreakdown.review_kyc;
        valB = b.taskBreakdown.review_kyc;
      } else if (tableSortColumn === "layananKesehatan") {
        valA = a.taskBreakdown.layanan_kesehatan;
        valB = b.taskBreakdown.layanan_kesehatan;
      } else if (tableSortColumn === "layananPendidikan") {
        valA = a.taskBreakdown.layanan_pendidikan;
        valB = b.taskBreakdown.layanan_pendidikan;
      } else if (tableSortColumn === "layananSosial") {
        valA = a.taskBreakdown.layanan_sosial;
        valB = b.taskBreakdown.layanan_sosial;
      } else if (tableSortColumn === "laporanWarga") {
        valA = a.taskBreakdown.laporan_warga;
        valB = b.taskBreakdown.laporan_warga;
      } else if (tableSortColumn === "perizinan") {
        valA = a.taskBreakdown.perizinan;
        valB = b.taskBreakdown.perizinan;
      }

      if (valA !== valB) {
        return tableSortDirection === "asc" ? valA - valB : valB - valA;
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [
    records,
    appliedFilters,
    includeZero,
    tableSortColumn,
    tableSortDirection,
  ]);

  // Lowest activity sorted
  const sortedLowestData = useMemo(() => {
    const list = [...lowestData];
    list.sort((a, b) =>
      lowestSortDirection === "asc"
        ? a.completedTasks - b.completedTasks
        : b.completedTasks - a.completedTasks,
    );
    return list;
  }, [lowestData, lowestSortDirection]);

  // Action needed banner items
  const actionNeededItems = useMemo(() => {
    return records.filter(
      (r) => r.assignedTasks >= 5 && (r.completionRate ?? 1) < 0.75,
    );
  }, [records]);

  // Totals by task type across all records
  const totalsByTaskType = useMemo(() => {
    const result: Record<AsnPerformanceTaskType, number> = {} as Record<
      AsnPerformanceTaskType,
      number
    >;
    for (const t of ALL_TASK_TYPES) {
      result[t] = records.reduce((sum, r) => sum + r.taskBreakdown[t], 0);
    }
    return result;
  }, [records]);

  // Line chart SVG coordinates calculation
  const chartHeight = 160;
  const chartWidth = 520;
  const paddingLeft = 35;
  const paddingRight = 30;
  const paddingTop = 20;
  const paddingBottom = 40;

  const innerWidth = chartWidth - paddingLeft - paddingRight;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const maxY = 6;

  const getX = (idx: number) => {
    if (trendsData.length <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (idx / (trendsData.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.min(Math.max(val, 0), maxY);
    return paddingTop + innerHeight - (clamped / maxY) * innerHeight;
  };

  const makePath = (dataKey: AsnPerformanceTaskType) => {
    return trendsData
      .map((item, idx) => {
        const val = item.taskBreakdown[dataKey];
        return `${idx === 0 ? "M" : "L"} ${getX(idx)} ${getY(val)}`;
      })
      .join(" ");
  };

  const totalEvents = summaryData?.assignedTasks ?? 0;
  const successCount = summaryData?.completedTasks ?? 0;
  const pendingCount = summaryData?.pendingTasks ?? 0;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] flex-col border-r border-slate-200 bg-white lg:flex">
        {/* Brand */}
        <div className="flex h-[58px] items-center gap-2.5 border-b border-slate-100 px-5">
          <img
            src="/logo/brand.svg"
            alt="Agoraya"
            className="size-[34px] object-contain"
            loading="eager"
          />
          <div>
            <span className="text-sm font-bold tracking-tight text-slate-900">Agoraya</span>
            <span className="block text-[9px] font-medium text-slate-400">
              Data Publik, Untuk Semua
            </span>
          </div>
        </div>

        {/* Ruang Executive Card */}
        <div className="mx-3 mt-4 rounded-md bg-blue-50/70 border border-blue-100/60 px-3 py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Ruang Executive
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-700">Pemerintah Kota Contoh</p>
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
            className="mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <ClipboardCheck aria-hidden="true" className="size-3.5 text-slate-500" />
            Audit log terpadu
          </a>
          <a
            href="/executive/asn-performance"
            className="mt-1 flex items-center gap-2.5 rounded-md bg-[#dbeafe] px-2.5 py-2 text-[11px] font-semibold text-blue-700 shadow-xs"
          >
            <LayoutDashboard aria-hidden="true" className="size-3.5 text-blue-600" />
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
      <div className="lg:pl-[224px] flex-1 flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[58px] items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-7">
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
              <span>Tata kelola instansi</span>
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
                className="mt-1 flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <ClipboardCheck aria-hidden="true" className="size-4" />
                Audit log terpadu
              </a>
              <a
                href="/executive/asn-performance"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 flex items-center gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
              >
                <LayoutDashboard aria-hidden="true" className="size-4" />
                Kinerja ASN
              </a>
            </nav>
          )}
        </header>

        {/* Main Body */}
        <main className="px-4 py-6 sm:px-6 lg:px-7 max-w-[1440px] w-full mx-auto space-y-6">
          {/* Breadcrumb & Title Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-[11px] font-medium text-slate-400">
                Ruang Executive <span className="mx-1">/</span> Kinerja ASN
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                Kinerja ASN
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Pantau volume, penyelesaian dan beban kerja tanpa mengabaikan kewenangan petugas.
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-2 shrink-0">
              {isLoading ? (
                <span className="text-[10px] font-medium tracking-wider text-slate-400 animate-pulse">
                  Memuat dari backend…
                </span>
              ) : apiError ? (
                <span className="text-[10px] font-medium tracking-wider text-amber-600">
                  Sinkronisasi gagal: {apiError}
                </span>
              ) : (
                <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                  Data dari backend · identitas disamarkan
                </span>
              )}
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || isLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 active:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <Download aria-hidden="true" className="size-3.5 text-slate-500" />
                {isExporting ? "Mengekspor..." : "Ekspor ringkasan"}
              </button>
            </div>
          </div>

          {/* API Error Banner */}
          {apiError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <p className="font-semibold">Sinkronisasi backend gagal</p>
              <p className="mt-0.5">{apiError}</p>
              <p className="mt-1 text-amber-700/90">
                Memeriksa koneksi ke <code>/api/v1/asn-performance/*</code>.
              </p>
            </div>
          )}

          {/* Cakupan Analisis Filter Card */}
          <section
            aria-labelledby="filter-heading"
            className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
          >
            <div className="mb-4">
              <h2 id="filter-heading" className="text-sm font-bold text-slate-800">
                Cakupan analisis
              </h2>
              <p className="text-xs text-slate-400">
                Semua jenis tugas dari layanan publik, sosial, dan tata kelola ASN.
              </p>
            </div>

            <form onSubmit={handleApplyFilters} className="space-y-4">
              {/* Row 1 */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Rentang tanggal
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="2026-10-01:2026-10-28">1–28 Oktober 2026</option>
                    <option value="2026-10-22:2026-10-28">7 hari terakhir</option>
                    <option value="2026-09-28:2026-10-28">30 hari terakhir</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Instansi / OPD
                  </label>
                  <select
                    value={filters.opd}
                    onChange={(e) => setFilters((prev) => ({ ...prev, opd: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua OPD - Kota Contoh</option>
                    <option value="Diskominfo">Diskominfo</option>
                    <option value="BKPSDM">BKPSDM</option>
                    <option value="DPMPTSP">DPMPTSP</option>
                    <option value="Dinas Kesehatan">Dinas Kesehatan</option>
                    <option value="Dinas Pendidikan">Dinas Pendidikan</option>
                    <option value="Dinas Sosial">Dinas Sosial</option>
                    <option value="DPMPTSP Perizinan">DPMPTSP Perizinan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Jabatan kepegawaian
                  </label>
                  <select
                    value={filters.position}
                    onChange={(e) => setFilters((prev) => ({ ...prev, position: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua jabatan</option>
                    <option value="Pranata Komputer Ahli Muda">Pranata Komputer Ahli Muda</option>
                    <option value="Analis SDM Aparatur">Analis SDM Aparatur</option>
                    <option value="Statistisi Ahli Muda">Statistisi Ahli Muda</option>
                    <option value="Analis Pelayanan Publik">Analis Pelayanan Publik</option>
                    <option value="Penasihat Kesehatan">Penasihat Kesehatan</option>
                    <option value="Pendidik">Pendidik</option>
                    <option value="Pekerja Sosial">Pekerja Sosial</option>
                    <option value="Petugas Perizinan">Petugas Perizinan</option>
                  </select>
                </div>
              </div>

              {/* Row 2 */}
              <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-12">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Hak akses CMS / KYC
                  </label>
                  <select
                    value={filters.accessScope}
                    onChange={(e) => setFilters((prev) => ({ ...prev, accessScope: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Semua kewenangan</option>
                    <option value="Submit CMS">Submit CMS</option>
                    <option value="Review KYC">Review KYC</option>
                    <option value="Review CMS & KYC">Review CMS & KYC</option>
                    <option value="Submit & review CMS - KYC">Submit & review CMS - KYC</option>
                  </select>
                </div>

                <div className="md:col-span-5">
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Jenis tugas
                  </label>
                  <select
                    value={filters.taskTypeOption}
                    onChange={(e) => setFilters((prev) => ({ ...prev, taskTypeOption: e.target.value }))}
                    className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xs focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="all">Semua jenis tugas</option>
                    <option value="layanan_kesehatan">Layanan Kesehatan</option>
                    <option value="layanan_pendidikan">Layanan Pendidikan</option>
                    <option value="layanan_sosial">Layanan Sosial</option>
                    <option value="laporan_warga">Laporan Warga</option>
                    <option value="perizinan">Perizinan</option>
                    <option value="submit_cms">Submit CMS</option>
                    <option value="review_cms">Review CMS</option>
                    <option value="review_kyc">Review KYC</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 md:col-span-3 md:justify-end">
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 active:bg-blue-800 transition-colors"
                  >
                    Terapkan analisis
                  </button>
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="rounded-md px-2 py-2 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Atur ulang
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* 4 Metric Summary Cards */}
          <section
            aria-label="Ringkasan Metrik"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {isLoading ? (
              <div className="col-span-full p-8 text-center text-slate-500 text-xs animate-pulse">
                Memuat data kinerja dari backend…
              </div>
            ) : apiError ? (
              <div className="col-span-full p-8 text-center text-slate-500 text-xs">
                Tidak dapat menampilkan data. Lihat peringatan sinkronisasi di atas.
              </div>
            ) : (
              <>
                {/* Card 1 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Tugas ditugaskan</span>
                    <Inbox aria-hidden="true" className="size-4 text-blue-600" />
                  </div>
                  <div className="mt-3 text-[32px] font-bold tracking-tight text-slate-900 leading-none">
                    {summaryData?.assignedTasks ?? 0}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {summaryData?.withAssignmentCount ?? 0} ASN memiliki penugasan ·{" "}
                    {summaryData?.noAssignmentCount ?? 0} tanpa tugas
                  </p>
                </div>

                {/* Card 2 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Total selesai</span>
                    <CheckCircle2 aria-hidden="true" className="size-4 text-blue-600" />
                  </div>
                  <div className="mt-3 text-[32px] font-bold tracking-tight text-slate-900 leading-none">
                    {summaryData?.completedTasks ?? 0}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {totalsByTaskType.submit_cms} submit ·{" "}
                    {totalsByTaskType.review_cms} review CMS ·{" "}
                    {totalsByTaskType.review_kyc} review KYC
                  </p>
                </div>

                {/* Card 3 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Tingkat penyelesaian</span>
                    <Clock aria-hidden="true" className="size-4 text-blue-600" />
                  </div>
                  <div className="mt-3 text-[32px] font-bold tracking-tight text-slate-900 leading-none">
                    {summaryData?.completionRate !== null && summaryData?.completionRate !== undefined
                      ? `${((summaryData?.completionRate ?? 0) * 100).toFixed(1).replace(".", ",")}%`
                      : "0%"}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {successCount} selesai ÷ {totalEvents} ditugaskan × 100%
                  </p>
                </div>

                {/* Card 4 */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">Tugas tertunda</span>
                    <Clock aria-hidden="true" className="size-4 text-blue-600" />
                  </div>
                  <div className="mt-3 text-[32px] font-bold tracking-tight text-slate-900 leading-none">
                    {pendingCount}
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    Belum selesai pada akhir periode
                  </p>
                </div>
              </>
            )}
          </section>

          {/* Middle Row: Charts */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            {isLoading || apiError ? (
              <div className="lg:col-span-12 p-8 text-center text-slate-500 text-xs">
                {isLoading ? "Memuat data tren dan aktivitas dari backend…" : "Tidak dapat menampilkan chart."}
              </div>
            ) : (
              <>
                {/* Left Card: Tren penyelesaian tugas */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-7 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">
                          Tren penyelesaian tugas
                        </h2>
                        <p className="text-xs text-slate-400">
                          Jumlah tugas selesai per minggu · semua jenis layanan
                        </p>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="mt-4 flex flex-wrap items-center gap-4 text-[11px] text-slate-600">
                      {ALL_TASK_TYPES.map((t) => (
                        <div key={t} className="flex items-center gap-1.5">
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: TASK_TYPE_COLORS[t] }}
                          />
                          <span>{TASK_TYPE_LABELS[t]}</span>
                        </div>
                      ))}
                    </div>

                    {/* Line Chart Area */}
                    <div className="mt-6 w-full overflow-x-auto">
                      <svg
                        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                        className="w-full h-auto min-w-[340px]"
                      >
                        {/* Grid lines & Y-axis labels */}
                        {[0, 2, 4, 6].map((tick) => {
                          const y = getY(tick);
                          return (
                            <g key={tick}>
                              <text
                                x={paddingLeft - 10}
                                y={y + 3.5}
                                textAnchor="end"
                                fontSize="10"
                                fill="#94a3b8"
                              >
                                {tick}
                              </text>
                              <line
                                x1={paddingLeft}
                                y1={y}
                                x2={chartWidth - paddingRight}
                                y2={y}
                                stroke="#f1f5f9"
                                strokeWidth="1"
                              />
                            </g>
                          );
                        })}

                        {/* Chart lines */}
                        {ALL_TASK_TYPES.map((t) => (
                          <path
                            key={t}
                            d={makePath(t)}
                            fill="none"
                            stroke={TASK_TYPE_COLORS[t]}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            opacity={t === "submit_cms" || t === "review_cms" || t === "review_kyc" ? 1 : 0.6}
                          />
                        ))}

                        {/* Dots for primary task types */}
                        {trendsData.flatMap((item, idx) =>
                          (["submit_cms", "review_cms", "review_kyc"] as const).map((t) => {
                            const val = item.taskBreakdown[t as AsnPerformanceTaskType];
                            return val > 0 ? (
                              <circle
                                key={`${t}-${idx}`}
                                cx={getX(idx)}
                                cy={getY(val)}
                                r="3"
                                fill={TASK_TYPE_COLORS[t as AsnPerformanceTaskType]}
                              />
                            ) : null;
                          }),
                        )}

                        {/* X-axis labels */}
                        {trendsData.map((item, idx) => {
                          const x = getX(idx);
                          return (
                            <g key={`x-${idx}`}>
                              <text
                                x={x}
                                y={chartHeight - 18}
                                textAnchor="middle"
                                fontSize="10"
                                fontWeight="500"
                                fill="#64748b"
                              >
                                {item.label}
                              </text>
                              <text
                                x={x}
                                y={chartHeight - 5}
                                textAnchor="middle"
                                fontSize="9"
                                fontWeight="600"
                                fill="#334155"
                              >
                                {item.taskCountLabel}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                    Total {summaryData?.completedTasks ?? 0} tugas =
                    {ALL_TASK_TYPES.map((t) => totalsByTaskType[t]).join(" + ")}.
                  </div>
                </div>

                {/* Right Card: Aktivitas terendah */}
                <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">Aktivitas terendah</h2>
                        <p className="text-xs text-slate-400">
                          Total tugas paling sedikit · petugas dengan penugasan
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setLowestSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
                        }
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        {lowestSortDirection === "asc" ? "Menaik ↑" : "Menurun ↓"}
                      </button>
                    </div>

                    {/* Horizontal Stacked Bars */}
                    <div className="mt-5 space-y-3.5">
                      {sortedLowestData.map((item) => {
                        const maxScale = 20;
                        const segments = ALL_TASK_TYPES.map((t) => ({
                          type: t,
                          value: item.taskBreakdown[t],
                          color: TASK_TYPE_COLORS[t],
                          label: TASK_TYPE_LABELS[t],
                        })).filter((s) => s.value > 0);
                        const totalWidth = segments.reduce((sum, s) => sum + s.value, 0);

                        return (
                          <div key={item.shortName} className="flex items-center gap-3 text-xs">
                            <span className="w-12 shrink-0 font-medium text-slate-700 truncate">
                              {item.shortName}
                            </span>
                            <div className="relative h-4 flex-1 rounded-sm bg-slate-100 flex overflow-hidden">
                              {segments.map((seg, sIdx) => {
                                const pct = (seg.value / maxScale) * 100;
                                return (
                                  <div
                                    key={sIdx}
                                    style={{
                                      width: `${Math.max(pct, 2)}%`,
                                      backgroundColor: seg.color,
                                    }}
                                    className="h-full"
                                    title={`${seg.label}: ${seg.value}`}
                                  />
                                );
                              })}
                            </div>
                            <span className="w-10 text-right text-xs text-slate-500 shrink-0">
                              <strong className="text-slate-800">{item.completedTasks}</strong>{" "}
                              <span className="text-slate-400">/ {item.assignedTasks}</span>
                            </span>
                          </div>
                        );
                      })}

                      {/* Scale axis labels */}
                      <div className="flex justify-between pl-15 pr-13 pt-1 text-[10px] text-slate-400">
                        <span>0</span>
                        <span>5</span>
                        <span>10</span>
                        <span>15</span>
                        <span>20</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] leading-relaxed text-slate-400">
                      Angka kanan: selesai / ditugaskan. Bandingkan kembali dalam hak dan beban
                      tugas setara.
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>

          {/* Action Needed Banner */}
          {actionNeededItems.length > 0 && (
            <section
              aria-label="Pemberitahuan tindak lanjut"
              className="rounded-lg border border-amber-200/90 bg-[#fffbeb] p-3.5 flex items-start gap-3"
            >
              <AlertCircle aria-hidden="true" className="size-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-amber-900">
                  Perlu tindak lanjut · {actionNeededItems.length} ASN
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
                  {actionNeededItems
                    .map((item) => `${item.name.split(" ")[0]}: ${item.completedTasks} dari ${item.assignedTasks} tugas selesai`)
                    .join(". ")}
                  . Tinjau hambatan, distribusi tugas, dan cakupan kewenangan terlebih dahulu;
                  jumlah aktivitas bukan penilaian tunggal kinerja.
                </p>
              </div>
            </section>
          )}

          {/* Table Card: Rincian kinerja per ASN */}
          <section
            aria-labelledby="table-heading"
            className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 id="table-heading" className="text-sm font-bold text-slate-800">
                  Rincian kinerja per ASN
                </h2>
                <p className="text-xs text-slate-400">
                  Semua jenis tugas layanan publik, sosial, dan tata kelola. Diurutkan menurut
                  total submit / review paling sedikit; ASN tanpa tugas ditempatkan terpisah.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setTableSortColumn("completedTasks");
                  setTableSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 shadow-xs hover:bg-slate-50 transition-colors self-start sm:self-auto"
              >
                <SlidersHorizontal aria-hidden="true" className="size-3.5 text-blue-600" />
                Urutkan: aktivitas terendah
              </button>
            </div>

            {/* Filter Pills Row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
              <span className="text-[11px] text-slate-500 mr-1">Urutkan jumlah paling sedikit:</span>

              <button
                type="button"
                onClick={() => {
                  setTableSortColumn("completedTasks");
                  setTableSortDirection((prev) =>
                    tableSortColumn === "completedTasks" && prev === "asc" ? "desc" : "asc",
                  );
                }}
                className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                  tableSortColumn === "completedTasks"
                    ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                Total selesai {tableSortColumn === "completedTasks" ? (tableSortDirection === "asc" ? "↑" : "↓") : ""}
              </button>

              {ALL_TASK_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    const col = `taskBreakdown.${t}`;
                    setTableSortColumn(col);
                    setTableSortDirection((prev) =>
                      tableSortColumn === col && prev === "asc" ? "desc" : "asc",
                  );
                  }}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium border transition-colors ${
                    tableSortColumn === `taskBreakdown.${t}`
                      ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {TASK_TYPE_LABELS[t]}
                  {tableSortColumn === `taskBreakdown.${t}` ? (tableSortDirection === "asc" ? "↑" : "↓") : ""}
                </button>
              ))}

              <label className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeZero}
                  onChange={(e) => setIncludeZero(e.target.checked)}
                  className="size-3.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Termasuk nilai 0
              </label>
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] text-slate-400 font-medium">
                    <th className="py-2.5 pr-4 font-medium">ASN / jabatan</th>
                    <th className="py-2.5 px-3 font-medium">OPD / unit</th>
                    <th className="py-2.5 px-3 text-right font-medium">Ditugaskan</th>
                    {ALL_TASK_TYPES.map((t) => (
                      <th
                        key={t}
                        className="py-2.5 px-3 text-right font-medium"
                        style={{ color: TASK_TYPE_COLORS[t] }}
                      >
                        {t === "submit_cms" ? "Submit CMS" : t === "review_cms" ? "Review CMS" : t === "review_kyc" ? "Review KYC" : TASK_TYPE_LABELS[t]}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-right font-semibold text-blue-600">
                      Selesai {tableSortColumn === "completedTasks" ? (tableSortDirection === "asc" ? "↑" : "↓") : ""}
                    </th>
                    <th className="py-2.5 px-3 text-right font-medium">Tertunda</th>
                    <th className="py-2.5 px-3 font-medium min-w-[120px]">Penyelesaian</th>
                    <th className="py-2.5 pl-3 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredAndSortedRecords.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* ASN / Jabatan */}
                      <td className="py-3.5 pr-4">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <div className="text-[11px] text-slate-400">{item.position}</div>
                      </td>

                      {/* OPD / Unit */}
                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-800">{item.opd}</div>
                        <div className="text-[11px] text-slate-400">{item.unit ?? "—"}</div>
                      </td>

                      {/* Ditugaskan */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                        {item.assignedTasks}
                      </td>

                      {/* Task type columns */}
                      {ALL_TASK_TYPES.map((t) => (
                        <td
                          key={t}
                          className="py-3.5 px-3 text-right font-medium"
                          style={{ color: TASK_TYPE_COLORS[t] }}
                        >
                          {item.taskBreakdown[t]}
                        </td>
                      ))}

                      {/* Selesai */}
                      <td className="py-3.5 px-3 text-right font-bold text-blue-600">
                        {item.completedTasks}
                      </td>

                      {/* Tertunda */}
                      <td className="py-3.5 px-3 text-right font-medium text-slate-700">
                        {Math.max(0, item.assignedTasks - item.completedTasks)}
                      </td>

                      {/* Penyelesaian */}
                      <td className="py-3.5 px-3">
                        {item.completionRate !== null ? (
                          <div className="space-y-1">
                            <span className="font-semibold text-slate-800">
                              {(item.completionRate * 100).toFixed(1).replace(".0", "").replace(".", ",")}%
                            </span>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                style={{ width: `${Math.min(item.completionRate * 100, 100)}%` }}
                                className="h-full bg-blue-600 rounded-full"
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Tidak ada penugasan</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pl-3 text-right font-medium text-slate-600">
                        {item.statusLabel}
                      </td>
                    </tr>
                  ))}
                  {filteredAndSortedRecords.length === 0 && (
                    <tr>
                      <td colSpan={10 + ALL_TASK_TYPES.length} className="px-5 py-8 text-center text-slate-400">
                        Tidak ada data kinerja ASN yang cocok dengan filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
              <div>
                {records.length} ASN aktif · {summaryData?.withAssignmentCount ?? 0} dengan penugasan ·
                akun belum aktif tidak dihitung
              </div>
              <div className="font-semibold text-slate-700">
                Total: {totalEvents} tugas · {successCount} selesai · {pendingCount} tertunda
              </div>
            </div>
          </section>

          {/* Bottom Info Cards: 2 Columns */}
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Card 1 */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs text-xs space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">Cara membaca metrik</h3>
              <p className="leading-relaxed text-slate-500">
                Total selesai = jumlah semua jenis tugas (layanan kesehatan, pendidikan, sosial,
                laporan warga, perizinan, submit CMS, review CMS, review KYC). Satu tugas dihitung
                sekali setelah aksi selesai; bukan jumlah klik atau perubahan draf.
              </p>
              <p className="leading-relaxed text-slate-500">
                Penyelesaian = tugas selesai / tugas ditugaskan × 100%. Tertunda = ditugaskan −
                selesai. Status menilai keterlengkapan penugasan dalam periode.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs text-xs space-y-2">
              <h3 className="font-bold text-slate-800 text-sm">Bandingkan secara adil</h3>
              <p className="leading-relaxed text-slate-500">
                Volume bukan satu-satunya indikator kinerja. Perhatikan kompleksitas, kualitas
                review, kewenangan dan beban penugasan yang setara.
              </p>
              <p className="leading-relaxed text-slate-500">
                Filter jabatan dan jenis tugas sebelum membandingkan individu. Tanpa penugasan
                tidak diberi rasio 0% dan tidak dilabeli aktivitas rendah.
              </p>
            </div>
          </section>
        </main>

        {/* Page Footer */}
        <footer className="mt-10 border-t border-slate-200/80 bg-white px-4 py-4 sm:px-6 lg:px-7 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>© {new Date().getFullYear()} Agoraya · Ruang Executive</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-600 transition-colors">Panduan tata kelola</span>
            <span>·</span>
            <span className="hover:text-slate-600 transition-colors">Privasi</span>
            <span>·</span>
            <span className="hover:text-slate-600 transition-colors">Aksesibilitas</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
