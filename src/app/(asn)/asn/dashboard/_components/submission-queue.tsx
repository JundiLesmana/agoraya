"use client";

import * as React from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FolderKanban,
  RefreshCw,
  Search,
  UserCheck,
  UserRoundPlus,
  Workflow,
} from "lucide-react";
import { formatDateTimeWib } from "@/app/(citizen)/citizen/service/_components/tracking-format";
import { saveReviewAssignment, type ReviewActionState } from "@/app/(asn)/review/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  formatWaitingTime,
  getAverageWaitingTimeMinutes,
  getSlaTone,
  serviceApplicationsResponseSchema,
  toSubmissionQueueItem,
  type SubmissionQueueItem,
  type SubmissionQueueStatus,
} from "./agency-dashboard-data";

type StaffOption = {
  id: string;
  name: string;
  opdName?: string | null;
  unitName?: string | null;
};

type SubmissionQueueProps = {
  initialItems: SubmissionQueueItem[];
  staff: readonly StaffOption[];
};

type DateFilter = "all" | "today" | "last_7_days" | "last_30_days";

type QueueStats = {
  total: number;
  unassigned: number;
  active: number;
  completed: number;
  averageWaitingTimeMinutes: number;
};

const initialActionState: ReviewActionState = { error: null, success: null };
const STATUS_OPTIONS: readonly { value: SubmissionQueueStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua status" },
  { value: "Menunggu Asignasi", label: "Menunggu Asignasi" },
  { value: "Sedang Ditangani", label: "Sedang Ditangani" },
  { value: "Menunggu Warga", label: "Menunggu Warga" },
  { value: "Selesai", label: "Selesai" },
];
const DATE_OPTIONS: readonly { value: DateFilter; label: string }[] = [
  { value: "all", label: "Semua tanggal" },
  { value: "today", label: "Hari ini" },
  { value: "last_7_days", label: "7 hari terakhir" },
  { value: "last_30_days", label: "30 hari terakhir" },
];
const PAGE_SIZE = 10;

type SummaryTone = "blue" | "amber" | "indigo" | "emerald";

type AssignmentRecommendation = {
  staffId: string;
  reason: string;
};

function getSummaryCardToneClassName(tone: SummaryTone): string {
  switch (tone) {
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100";
    case "indigo":
      return "border-indigo-200 bg-indigo-50 text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
    default:
      return "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100";
  }
}

function getSummaryAccentClassName(tone: SummaryTone): string {
  switch (tone) {
    case "amber":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200";
    case "indigo":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-200";
    case "emerald":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200";
    default:
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-200";
  }
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  helper,
  alert,
}: {
  label: string;
  value: string | number;
  icon: typeof FolderKanban;
  tone: SummaryTone;
  helper: string;
  alert?: string | null;
}) {
  return (
    <Card className={cn("gap-3 border p-4 shadow-none sm:p-5", getSummaryCardToneClassName(tone))}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={cn("rounded-lg p-2", getSummaryAccentClassName(tone))}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="text-sm/6 opacity-90">{helper}</p>
      {alert ? (
        <div className="flex items-start gap-2 rounded-lg border border-current/15 bg-white/60 px-3 py-2 text-xs font-medium dark:bg-slate-950/20">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{alert}</p>
        </div>
      ) : (
        <div className="flex items-start gap-2 rounded-lg border border-current/15 bg-white/60 px-3 py-2 text-xs font-medium dark:bg-slate-950/20">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>Nilai KPI berada dalam rentang yang aman untuk dipantau.</p>
        </div>
      )}
    </Card>
  );
}

function queueStatusClassName(status: SubmissionQueueStatus): string {
  switch (status) {
    case "Sedang Ditangani":
      return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200";
    case "Menunggu Warga":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Selesai":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200";
  }
}

function slaToneClassName(tone: ReturnType<typeof getSlaTone>): string {
  switch (tone) {
    case "red":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200";
    case "yellow":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  }
}

function matchesDateFilter(value: string, filter: DateFilter): boolean {
  if (filter === "all") return true;
  const submittedAt = new Date(value);
  if (Number.isNaN(submittedAt.getTime())) return false;

  const now = new Date();
  if (filter === "today") {
    return submittedAt.toDateString() === now.toDateString();
  }

  const maxAgeDays = filter === "last_7_days" ? 7 : 30;
  const earliest = new Date(now);
  earliest.setDate(now.getDate() - maxAgeDays);
  return submittedAt >= earliest;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function buildQueueStats(items: readonly SubmissionQueueItem[]): QueueStats {
  return {
    total: items.length,
    unassigned: items.filter((item) => item.queueStatus === "Menunggu Asignasi").length,
    active: items.filter((item) => item.queueStatus === "Sedang Ditangani").length,
    completed: items.filter((item) => item.queueStatus === "Selesai").length,
    averageWaitingTimeMinutes: getAverageWaitingTimeMinutes(items),
  };
}

function buildKpiAlert(stats: QueueStats): {
  totalAlert: string | null;
  unassignedAlert: string | null;
  activeAlert: string | null;
  waitingAlert: string | null;
} {
  const totalAlert =
    stats.total >= 25
      ? "Antrean sudah tinggi. Pertimbangkan redistribusi petugas agar backlog tidak bertambah."
      : null;
  const unassignedAlert =
    stats.unassigned >= 5
      ? "Masih ada banyak pengajuan tanpa petugas. Prioritaskan asignasi untuk antrean terlama."
      : stats.unassigned === stats.total && stats.total > 0
        ? "Seluruh antrean belum memiliki petugas penanggung jawab."
        : null;
  const activeAlert =
    stats.active === 0 && stats.total > 0
      ? "Belum ada pengajuan yang sedang ditangani. Tinjau distribusi kerja petugas."
      : null;
  const waitingAlert =
    stats.averageWaitingTimeMinutes >= 240
      ? "Rata-rata waktu tunggu melewati 4 jam. Perlu percepatan penanganan antrean."
      : null;

  return { totalAlert, unassignedAlert, activeAlert, waitingAlert };
}

function getAssignmentRecommendation(
  item: SubmissionQueueItem,
  staff: readonly StaffOption[],
): AssignmentRecommendation | null {
  if (staff.length === 0) {
    return null;
  }

  const normalizedAgency = item.agency.trim().toLocaleLowerCase("id-ID");
  const normalizedCategory = item.category.trim().toLocaleLowerCase("id-ID");
  const normalizedService = item.serviceName.trim().toLocaleLowerCase("id-ID");

  const scopedMatch = staff.find((member) => {
    const opdName = member.opdName?.trim().toLocaleLowerCase("id-ID") ?? "";
    const unitName = member.unitName?.trim().toLocaleLowerCase("id-ID") ?? "";
    return (
      (normalizedAgency.length > 0 && opdName.includes(normalizedAgency)) ||
      (normalizedCategory.length > 0 && unitName.includes(normalizedCategory)) ||
      (normalizedService.length > 0 && unitName.includes(normalizedService))
    );
  });

  if (scopedMatch) {
    const scopeLabel = scopedMatch.unitName || scopedMatch.opdName;
    return {
      staffId: scopedMatch.id,
      reason: scopeLabel
        ? `Direkomendasikan karena profil petugas terkait ${scopeLabel}.`
        : "Direkomendasikan karena profil petugas paling sesuai dengan ajuan ini.",
    };
  }

  return {
    staffId: staff[0]?.id ?? "",
    reason: "Belum ada kecocokan unit yang spesifik, gunakan petugas aktif teratas sebagai rekomendasi awal.",
  };
}

function AssignmentModal({
  item,
  open,
  onOpenChange,
  staff,
  recommendation,
  onSubmitted,
}: {
  item: SubmissionQueueItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staff: readonly StaffOption[];
  recommendation: AssignmentRecommendation | null;
  onSubmitted: () => Promise<void>;
}) {
  const [state, action, pending] = useActionState(
    saveReviewAssignment,
    initialActionState,
  );
  const formRef = React.useRef<HTMLFormElement | null>(null);

  React.useEffect(() => {
    if (state.success) {
      onSubmitted();
      onOpenChange(false);
    }
  }, [onOpenChange, onSubmitted, state.success]);

  React.useEffect(() => {
    if (!open) {
      formRef.current?.reset();
    }
  }, [open, item]);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={item ? `Asignasikan ${item.trackingNumber}` : "Asignasikan pengajuan"}
      description="Pilih petugas ASN aktif untuk menangani pengajuan ini."
      contentClassName="max-w-md"
    >
      {item ? (
        <form ref={formRef} action={action} className="space-y-4">
          <input type="hidden" name="itemType" value="service_application" />
          <input type="hidden" name="itemId" value={item.id} />
          <label className="block space-y-2">
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Petugas
            </span>
            <Select
              name="assigneeId"
              defaultValue={recommendation?.staffId ?? item.assigneeId ?? ""}
              aria-label="Pilih petugas"
              options={[
                { value: "", label: "Belum ditugaskan" },
                ...staff.map((member) => ({
                  value: member.id,
                  label:
                    member.unitName || member.opdName
                      ? `${member.name} — ${member.unitName ?? member.opdName}`
                      : member.name,
                })),
              ]}
            />
          </label>
          {recommendation ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-100">
              <p className="font-medium">Rekomendasi asignasi tersedia.</p>
              <p className="mt-1">{recommendation.reason}</p>
            </div>
          ) : null}
          {state.error ? (
            <p role="alert" className="text-sm text-red-700 dark:text-red-300">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
              {state.success}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              <UserRoundPlus className="size-4" aria-hidden="true" />
              {pending ? "Menyimpan..." : "Simpan asignasi"}
            </Button>
          </div>
        </form>
      ) : null}
    </Modal>
  );
}

export function SubmissionQueue({ initialItems, staff }: SubmissionQueueProps) {
  const [items, setItems] = React.useState(initialItems);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<(typeof STATUS_OPTIONS)[number]["value"]>("all");
  const [serviceFilter, setServiceFilter] = React.useState("all");
  const [dateFilter, setDateFilter] = React.useState<DateFilter>("all");
  const [selectedItem, setSelectedItem] = React.useState<SubmissionQueueItem | null>(null);
  const [assignmentOpen, setAssignmentOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const loadQueueRequestIdRef = React.useRef(0);

  const loadQueue = React.useCallback(async () => {
    const requestId = loadQueueRequestIdRef.current + 1;
    loadQueueRequestIdRef.current = requestId;
    setLoading(true);
    try {
      const response = await fetch("/api/asn/service-applications", {
        cache: "no-store",
      });
      const payload = await readJson(response);
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof (payload as { error?: unknown }).error === "string"
            ? (payload as { error: string }).error
            : "Gagal memuat antrean pengajuan.";
        throw new Error(message);
      }
      const parsed = serviceApplicationsResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Respons antrean pengajuan tidak valid.");
      }
      if (requestId !== loadQueueRequestIdRef.current) {
        return;
      }
      const nextItems = parsed.data.applications.map(toSubmissionQueueItem);
      setItems(nextItems);
      setSearchQuery("");
      setStatusFilter("all");
      setServiceFilter("all");
      setDateFilter("all");
      setPage(1);
      setSelectedItem((currentItem) =>
        currentItem ? nextItems.find((item) => item.id === currentItem.id) ?? null : null,
      );
      setError("");
    } catch (loadError) {
      if (requestId !== loadQueueRequestIdRef.current) {
        return;
      }
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat antrean pengajuan.",
      );
    } finally {
      if (requestId === loadQueueRequestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const serviceOptions = React.useMemo(
    () => [
      { value: "all", label: "Semua layanan" },
      ...[...new Set(items.map((item) => item.category))].map((category) => ({
        value: category,
        label: category,
      })),
    ],
    [items],
  );

  const filteredItems = React.useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
    return items.filter((item) => {
      const matchesSearch =
        normalizedQuery.length === 0 ||
        item.trackingNumber.toLocaleLowerCase("id-ID").includes(normalizedQuery) ||
        item.serviceName.toLocaleLowerCase("id-ID").includes(normalizedQuery) ||
        item.applicantName.toLocaleLowerCase("id-ID").includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" || item.queueStatus === statusFilter;
      const matchesService =
        serviceFilter === "all" || item.category === serviceFilter;
      const matchesDate = matchesDateFilter(item.submittedAt, dateFilter);
      return matchesSearch && matchesStatus && matchesService && matchesDate;
    });
  }, [dateFilter, items, searchQuery, serviceFilter, statusFilter]);

  const stats = React.useMemo(() => buildQueueStats(items), [items]);
  const kpiAlerts = React.useMemo(() => buildKpiAlert(stats), [stats]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedItems = React.useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, filteredItems]);
  const currentRecommendation = React.useMemo(
    () => (selectedItem ? getAssignmentRecommendation(selectedItem, staff) : null),
    [selectedItem, staff],
  );

  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, serviceFilter, dateFilter]);

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openAssignment = React.useCallback((item: SubmissionQueueItem) => {
    setSelectedItem(item);
    setAssignmentOpen(true);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Pantau antrean pengajuan tertua lebih dulu, lalu ambil atau asignasikan petugas tanpa memuat ulang halaman.
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadQueue()} disabled={loading}>
          <RefreshCw className={cn("size-4", loading ? "animate-spin" : "")} aria-hidden="true" />
          Segarkan Antrean
        </Button>
      </div>

      {error ? (
        <p role="alert" className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm">
          {error}
        </p>
      ) : null}

      <section aria-label="Ringkasan antrean pengajuan" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total Antrean"
          value={stats.total}
          icon={FolderKanban}
          tone="blue"
          helper="Jumlah seluruh pengajuan yang sedang berada di antrean saat ini."
          alert={kpiAlerts.totalAlert}
        />
        <SummaryCard
          label="Menunggu Asignasi"
          value={stats.unassigned}
          icon={UserRoundPlus}
          tone="amber"
          helper="Pengajuan belum memiliki petugas penanggung jawab."
          alert={kpiAlerts.unassignedAlert}
        />
        <SummaryCard
          label="Sedang Ditangani"
          value={stats.active}
          icon={Workflow}
          tone="indigo"
          helper="Pengajuan yang sudah diverifikasi dan sedang diproses petugas."
          alert={kpiAlerts.activeAlert}
        />
        <SummaryCard
          label="Rata-rata Waktu Tunggu"
          value={formatWaitingTime(stats.averageWaitingTimeMinutes)}
          icon={Clock3}
          tone="emerald"
          helper={`Pengajuan selesai saat ini: ${stats.completed} item.`}
          alert={kpiAlerts.waitingAlert}
        />
      </section>

      <section className="space-y-4" aria-labelledby="submission-queue-title">
        <div>
          <h2 id="submission-queue-title" className="text-lg font-semibold">
            Antrean Pengajuan
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Urutan default menampilkan pengajuan paling lama lebih dulu.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <label className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium">Cari nomor atau pemohon</span>
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" aria-hidden="true" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  aria-label="Cari nomor pengajuan atau pemohon"
                  placeholder="Cari nomor pengajuan, layanan, atau pemohon"
                  className="bg-background pl-9"
                />
              </div>
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium">Status Antrean</span>
              <Select
                aria-label="Filter status antrean"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as (typeof STATUS_OPTIONS)[number]["value"])}
                options={STATUS_OPTIONS}
              />
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium">Jenis Layanan</span>
              <Select
                aria-label="Filter jenis layanan"
                value={serviceFilter}
                onChange={(event) => setServiceFilter(event.target.value)}
                options={serviceOptions}
              />
            </label>
            <label className="space-y-1">
              <span className="text-muted-foreground text-sm font-medium">Tanggal Masuk</span>
              <Select
                aria-label="Filter tanggal masuk"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                options={DATE_OPTIONS}
              />
            </label>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              Menampilkan {filteredItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredItems.length)} dari {filteredItems.length} pengajuan.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                Sebelumnya
              </Button>
              <span className="text-muted-foreground text-xs font-medium">
                Halaman {currentPage} / {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={currentPage >= totalPages}
              >
                Berikutnya
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm" aria-label="Tabel antrean pengajuan">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Nomor Pengajuan</th>
                  <th className="px-4 py-3 font-medium">Jenis Layanan</th>
                  <th className="px-4 py-3 font-medium">Pemohon</th>
                  <th className="px-4 py-3 font-medium">Waktu Masuk</th>
                  <th className="px-4 py-3 font-medium">Waktu Tunggu</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-muted-foreground px-4 py-8 text-center">
                      Tidak ada pengajuan yang cocok dengan filter saat ini.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((item) => {
                    const canTake = item.assigneeId === null && item.queueStatus === "Menunggu Asignasi";
                    const slaTone = getSlaTone(item.waitingTimeMinutes);
                    const recommendation = getAssignmentRecommendation(item, staff);
                    return (
                      <tr key={item.id} className="border-t align-top">
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium">{item.trackingNumber}</p>
                            <p className="text-muted-foreground text-xs">{item.agency}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium">{item.serviceName}</p>
                            <p className="text-muted-foreground text-xs">{item.category}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <p>{item.applicantLabel}</p>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">{formatDateTimeWib(item.submittedAt)}</td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={slaToneClassName(slaTone)}>
                            {formatWaitingTime(item.waitingTimeMinutes)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className={queueStatusClassName(item.queueStatus)}>
                            {item.queueStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {canTake ? (
                              <QuickAssignButton itemId={item.id} onSubmitted={loadQueue} />
                            ) : null}
                            <Button type="button" variant="outline" size="sm" onClick={() => openAssignment(item)}>
                              <UserRoundPlus className="size-4" aria-hidden="true" />
                              {recommendation ? "Asignasikan (disarankan)" : "Asignasikan"}
                            </Button>
                            <Button asChild variant="ghost" size="sm">
                              <Link href={`/asn/submission/${item.id}`}>Buka</Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <AssignmentModal
        item={selectedItem}
        open={assignmentOpen}
        onOpenChange={setAssignmentOpen}
        staff={staff}
        recommendation={currentRecommendation}
        onSubmitted={loadQueue}
      />
    </div>
  );
}

function QuickAssignButton({
  itemId,
  onSubmitted,
}: {
  itemId: string;
  onSubmitted: () => Promise<void>;
}) {
  const [state, action, pending] = useActionState(
    saveReviewAssignment,
    initialActionState,
  );

  React.useEffect(() => {
    if (state.success) {
      void onSubmitted();
    }
  }, [onSubmitted, state.success]);

  React.useEffect(() => {
    void onSubmitted();
  }, [onSubmitted]);

  return (
    <form action={action}>
      <input type="hidden" name="itemType" value="service_application" />
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="assigneeId" value="self" />
      <Button type="submit" size="sm" disabled={pending}>
        <UserCheck className="size-4" aria-hidden="true" />
        {pending ? "Mengambil..." : "Ambil"}
      </Button>
    </form>
  );
}
