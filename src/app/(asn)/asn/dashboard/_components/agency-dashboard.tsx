"use client";

import Link from "next/link";
import * as React from "react";
import {
  CheckCircle2,
  Clock3,
  Inbox,
  RefreshCw,
  Search,
  UserRound,
  Workflow,
} from "lucide-react";
import {
  formatDateTimeWib,
  getDaysUntilDeadline,
} from "@/app/(citizen)/citizen/service/_components/tracking-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  agencyDashboardResponseSchema,
  maskApplicantName,
  maskPhone,
  serviceApplicationsResponseSchema,
  toAgencyApplication,
  toAgencyApplicationFromService,
  type AgencyApplication,
  type AgencyApplicationStatus,
} from "./agency-dashboard-data";

const STATUS_OPTIONS: readonly AgencyApplicationStatus[] = [
  "Diterima",
  "Diproses",
  "Perlu Dokumen",
  "Selesai",
];

function statusClassName(status: AgencyApplicationStatus): string {
  switch (status) {
    case "Diterima":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200";
    case "Diproses":
      return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-200";
    case "Perlu Dokumen":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200";
    case "Selesai":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200";
  }
}

function StatusBadge({ status }: { status: AgencyApplicationStatus }) {
  return (
    <Badge variant="outline" className={statusClassName(status)}>
      {status}
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Inbox;
}) {
  return (
    <Card className="gap-3 p-4 shadow-none sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className="bg-muted rounded-lg p-2">
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
    </Card>
  );
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function AgencyDashboard() {
  const [applications, setApplications] = React.useState<AgencyApplication[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [serviceFilter, setServiceFilter] = React.useState("all");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const loadReports = React.useCallback(async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    try {
      const [reportsResponse, servicesResponse] = await Promise.all([
        fetch("/api/reports", { cache: "no-store" }),
        fetch("/api/asn/service-applications", { cache: "no-store" }),
      ]);
      const reportsPayload = await readJson(reportsResponse);
      if (!reportsResponse.ok) {
        const message =
          typeof reportsPayload === "object" &&
          reportsPayload !== null &&
          "error" in reportsPayload &&
          typeof (reportsPayload as { error?: unknown }).error === "string"
            ? (reportsPayload as { error: string }).error
            : "Gagal memuat laporan.";
        throw new Error(message);
      }
      const parsedReports = agencyDashboardResponseSchema.safeParse(
        reportsPayload,
      );
      if (!parsedReports.success) throw new Error("Respons laporan tidak valid.");
      const reportItems = parsedReports.data.reports.map(toAgencyApplication);

      const servicesPayload = await readJson(servicesResponse);
      if (!servicesResponse.ok) {
        const message =
          typeof servicesPayload === "object" &&
          servicesPayload !== null &&
          "error" in servicesPayload &&
          typeof (servicesPayload as { error?: unknown }).error === "string"
            ? (servicesPayload as { error: string }).error
            : "Gagal memuat pengajuan layanan.";
        throw new Error(message);
      }
      const parsedServices =
        serviceApplicationsResponseSchema.safeParse(servicesPayload);
      if (!parsedServices.success) {
        throw new Error("Respons pengajuan layanan tidak valid.");
      }
      const serviceItems = parsedServices.data.applications.map(
        toAgencyApplicationFromService,
      );

      const merged = [...reportItems, ...serviceItems].sort((a, b) =>
        b.submittedAt.localeCompare(a.submittedAt),
      );
      setApplications(merged);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Gagal memuat laporan dari server.",
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadReports(true);
    const intervalId = window.setInterval(() => {
      void loadReports(false);
    }, 10_000);
    return () => window.clearInterval(intervalId);
  }, [loadReports]);

  const serviceOptions = React.useMemo(
    () => [...new Set(applications.map((application) => application.category))],
    [applications],
  );
  const filteredApplications = applications.filter((application) => {
    const normalizedQuery = searchQuery.trim().toLocaleLowerCase("id-ID");
    const matchesSearch =
      normalizedQuery.length === 0 ||
      application.trackingNumber
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery) ||
      application.serviceName
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery) ||
      application.applicantName
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" || application.status === statusFilter;
    const matchesService =
      serviceFilter === "all" || application.category === serviceFilter;
    return matchesSearch && matchesStatus && matchesService;
  });

  const inProgressCount = applications.filter(
    (application) => application.status === "Diproses",
  ).length;
  const completedCount = applications.filter(
    (application) => application.status === "Selesai",
  ).length;
  const needsActionCount = applications.filter((application) => {
    if (application.status === "Selesai") return false;
    if (!application.targetAt || application.targetAt === application.submittedAt) {
      return application.status === "Perlu Dokumen";
    }
    const daysRemaining = getDaysUntilDeadline(application.targetAt);
    return daysRemaining >= 0 && daysRemaining <= 2;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          Data laporan dan pengajuan layanan diperbarui otomatis setiap 10 detik.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadReports(true)}
          disabled={loading}
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          Perbarui
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <section
        aria-label="Ringkasan laporan"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label="Total laporan masuk"
          value={applications.length}
          icon={Inbox}
        />
        <SummaryCard
          label="Sedang diproses"
          value={inProgressCount}
          icon={Workflow}
        />
        <SummaryCard
          label="Perlu tindakan"
          value={needsActionCount}
          icon={Clock3}
        />
        <SummaryCard
          label="Selesai"
          value={completedCount}
          icon={CheckCircle2}
        />
      </section>

      <section aria-labelledby="report-list-title" className="space-y-4">
        <div>
          <h2 id="report-list-title" className="text-lg font-semibold">
            Daftar laporan warga
          </h2>
          <p className="text-muted-foreground text-sm">
            {filteredApplications.length} dari {applications.length} laporan
            ditampilkan
          </p>
        </div>

        <div className="bg-card grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,2fr)_minmax(12rem,1fr)_minmax(12rem,1fr)]">
          <label className="space-y-1.5 text-sm font-medium">
            Cari laporan
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                aria-label="Cari nomor laporan atau judul"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nomor laporan atau judul"
                className="pl-9"
              />
            </span>
          </label>
          <label className="space-y-1.5 text-sm font-medium">
            Status
            <Select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              options={[
                { value: "all", label: "Semua status" },
                ...STATUS_OPTIONS.map((status) => ({
                  value: status,
                  label: status,
                })),
              ]}
              className="bg-background"
            />
          </label>
          <label className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-1">
            Kategori
            <Select
              aria-label="Filter kategori"
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              options={[
                { value: "all", label: "Semua kategori" },
                ...serviceOptions.map((category) => ({
                  value: category,
                  label: category,
                })),
              ]}
              className="bg-background"
            />
          </label>
        </div>

        <div className="bg-card overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[780px] text-left text-sm"
              aria-label="Daftar laporan tersimpan"
            >
              <thead className="bg-muted/60 text-muted-foreground text-xs tracking-wide uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Nomor laporan
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Laporan
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Pelapor
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Tanggal masuk
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredApplications.map((application) => (
                  <tr
                    key={application.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-4 font-mono text-xs font-medium whitespace-nowrap">
                      {application.trackingNumber}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">{application.serviceName}</p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {application.category} · {application.subcategory}
                        {application.kind === "service_application"
                          ? " · Pengajuan layanan"
                          : ""}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {maskApplicantName(application.applicantName)}
                      {application.kind === "service_application" ? (
                        <p className="text-muted-foreground mt-1 font-mono text-xs">
                          {maskPhone(application.phone)}
                        </p>
                      ) : null}
                    </td>
                    <td className="text-muted-foreground px-4 py-4 whitespace-nowrap">
                      {formatDateTimeWib(application.submittedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/asn/management/review?kind=${application.kind}&id=${application.id}`}
                          aria-label={`Lihat detail ${application.trackingNumber}`}
                        >
                          Detail
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {!loading && filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Search
                        aria-hidden="true"
                        className="text-muted-foreground mx-auto size-6"
                      />
                      <p className="mt-2 font-medium">
                        {applications.length
                          ? "Laporan tidak ditemukan"
                          : "Belum ada laporan"}
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {applications.length
                          ? "Coba ubah kata kunci atau filter yang dipilih."
                          : "Laporan/pengajuan yang dikirim melalui laman layanan akan muncul di sini."}
                      </p>
                    </td>
                  </tr>
                ) : null}
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-muted-foreground px-4 py-12 text-center"
                    >
                      Memuat laporan dari basis data…
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 border-t px-4 py-3 text-xs">
            <UserRound aria-hidden="true" className="size-3.5 shrink-0" />
            Informasi kontak disamarkan pada daftar dan hanya ditampilkan
            setelah dibuka.
          </div>
        </div>
      </section>

    </div>
  );
}