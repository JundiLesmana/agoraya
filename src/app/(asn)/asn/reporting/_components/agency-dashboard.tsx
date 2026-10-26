"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileText,
  Inbox,
  LockKeyhole,
  Search,
  ShieldAlert,
  UserRound,
  Workflow,
} from "lucide-react";
import {
  formatDateTimeWib,
  getDaysUntilDeadline,
} from "@/app/(citizen)/tracking/_components/tracking-format";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AGENCY_APPLICATIONS,
  AGENCY_NAME,
  type AgencyApplication,
  type AgencyApplicationStatus,
  type NoteVisibility,
  maskApplicantName,
  maskNik,
  maskPhone,
} from "./agency-dashboard-data";

const STATUS_OPTIONS: readonly AgencyApplicationStatus[] = [
  "Diterima",
  "Diproses",
  "Perlu Dokumen",
  "Selesai",
];

function isApplicationStatus(value: string): value is AgencyApplicationStatus {
  return STATUS_OPTIONS.some((status) => status === value);
}

function isNoteVisibility(value: string): value is NoteVisibility {
  return value === "internal" || value === "public";
}

function getStatusIcon(status: AgencyApplicationStatus) {
  if (status === "Selesai") return CheckCircle2;
  if (status === "Perlu Dokumen") return AlertCircle;
  if (status === "Diproses") return Workflow;
  return Inbox;
}

function getStatusClassName(status: AgencyApplicationStatus): string {
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
  const Icon = getStatusIcon(status);

  return (
    <Badge
      variant="outline"
      className={`gap-1.5 whitespace-nowrap ${getStatusClassName(status)}`}
    >
      <Icon aria-hidden="true" className="size-3.5" />
      {status}
    </Badge>
  );
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: number;
  description: string;
  icon: typeof Inbox;
  iconClassName: string;
}) {
  return (
    <Card className="gap-3 p-4 shadow-none sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm font-medium">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span className={`bg-muted rounded-lg p-2 ${iconClassName}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
      </div>
      <p className="text-muted-foreground text-xs">{description}</p>
      <SourceBadge
        source="SIMULATED"
        label="Simulasi"
        className="w-fit text-[10px]"
      />
    </Card>
  );
}

export function AgencyDashboard() {
  const [applications, setApplications] = React.useState<AgencyApplication[]>(
    () =>
      AGENCY_APPLICATIONS.map((application) => ({
        ...application,
        documents: [...application.documents],
        history: [...application.history],
      })),
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [serviceFilter, setServiceFilter] = React.useState("all");
  const [selectedApplication, setSelectedApplication] =
    React.useState<AgencyApplication | null>(null);
  const [showSensitiveDetails, setShowSensitiveDetails] = React.useState(false);
  const [nextStatus, setNextStatus] =
    React.useState<AgencyApplicationStatus>("Diterima");
  const [noteVisibility, setNoteVisibility] =
    React.useState<NoteVisibility>("internal");
  const [draftNote, setDraftNote] = React.useState("");
  const [feedback, setFeedback] = React.useState("");

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
      application.applicantName
        .toLocaleLowerCase("id-ID")
        .includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" || application.status === statusFilter;
    const matchesService =
      serviceFilter === "all" || application.category === serviceFilter;

    return matchesSearch && matchesStatus && matchesService;
  });

  function openDetails(application: AgencyApplication) {
    setSelectedApplication(application);
    setNextStatus(application.status);
    setShowSensitiveDetails(false);
    setDraftNote("");
    setFeedback("");
  }

  function saveUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const note = draftNote.trim();
    if (!selectedApplication || selectedApplication.status === "Selesai")
      return;
    if (!note) {
      setFeedback("Tambahkan catatan sebelum menyimpan pembaruan.");
      return;
    }

    const occurredAt = new Date().toISOString();
    const updated: AgencyApplication = {
      ...selectedApplication,
      status: nextStatus,
      history: [
        ...selectedApplication.history,
        {
          status: nextStatus,
          description:
            noteVisibility === "public"
              ? "Petugas menambahkan tanggapan untuk pemohon."
              : "Petugas menambahkan catatan internal.",
          occurredAt,
          actor: "Petugas Dinas Perhubungan (simulasi)",
          note,
          visibility: noteVisibility,
        },
      ],
    };

    setApplications((current) =>
      current.map((application) =>
        application.id === updated.id ? updated : application,
      ),
    );
    setSelectedApplication(updated);
    setDraftNote("");
    setFeedback(
      "Pembaruan tersimpan di pratinjau ini. Data belum dikirim ke server.",
    );
  }

  const inProgressCount = applications.filter(
    (application) => application.status === "Diproses",
  ).length;
  const completedCount = applications.filter(
    (application) => application.status === "Selesai",
  ).length;
  const needsActionCount = applications.filter((application) => {
    if (application.status === "Selesai") return false;
    const daysRemaining = getDaysUntilDeadline(application.targetAt);
    return daysRemaining >= 0 && daysRemaining <= 2;
  }).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-primary text-xs font-medium tracking-wide uppercase">
            Meja kerja layanan
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            Pantau pengajuan masuk
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ringkasan dan antrean pengajuan untuk instansi Anda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SourceBadge source="SIMULATED" label="Data ilustratif" />
          <span className="bg-background text-muted-foreground rounded-md border px-3 py-1.5 text-xs">
            {AGENCY_NAME}
          </span>
        </div>
      </div>

      <section
        aria-label="Ringkasan pengajuan"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryCard
          label="Total pengajuan masuk"
          value={applications.length}
          description="Seluruh pengajuan pada antrean instansi"
          icon={Inbox}
          iconClassName="text-blue-700 dark:text-blue-300"
        />
        <SummaryCard
          label="Sedang diproses"
          value={inProgressCount}
          description="Pengajuan yang sedang ditangani petugas"
          icon={Workflow}
          iconClassName="text-indigo-700 dark:text-indigo-300"
        />
        <SummaryCard
          label="Perlu tindakan"
          value={needsActionCount}
          description="Target penyelesaian dalam 2 hari"
          icon={Clock3}
          iconClassName="text-amber-700 dark:text-amber-300"
        />
        <SummaryCard
          label="Selesai"
          value={completedCount}
          description="Pengajuan yang telah ditindaklanjuti"
          icon={CheckCircle2}
          iconClassName="text-emerald-700 dark:text-emerald-300"
        />
      </section>

      <section
        aria-label="Pemberitahuan SLA"
        className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <ShieldAlert
          aria-hidden="true"
          className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-300"
        />
        <div>
          <p className="text-sm font-semibold">
            {needsActionCount} pengajuan mendekati target penyelesaian
          </p>
          <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-100/80">
            Prioritaskan pengajuan dengan tenggat terdekat. Data dan
            penghitungan pada halaman ini masih berupa simulasi.
          </p>
        </div>
      </section>

      <section aria-labelledby="application-list-title" className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="application-list-title" className="text-lg font-semibold">
              Daftar Pengajuan
            </h2>
            <p className="text-muted-foreground text-sm">
              {filteredApplications.length} dari {applications.length} pengajuan
              ditampilkan
            </p>
          </div>
        </div>

        <div className="bg-card grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-[minmax(16rem,2fr)_minmax(12rem,1fr)_minmax(12rem,1fr)]">
          <label className="space-y-1.5 text-sm font-medium">
            Cari pengajuan
            <span className="relative block">
              <Search
                aria-hidden="true"
                className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                aria-label="Cari nomor pelacakan atau nama pemohon"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nomor pelacakan atau nama pemohon"
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
            Jenis layanan
            <Select
              aria-label="Filter jenis layanan"
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
              options={[
                { value: "all", label: "Semua jenis layanan" },
                ...serviceOptions.map((service) => ({
                  value: service,
                  label: service,
                })),
              ]}
              className="bg-background"
            />
          </label>
        </div>

        <div className="bg-card overflow-hidden rounded-xl border">
          <div className="overflow-x-auto">
            <table
              className="w-full min-w-[850px] text-left text-sm"
              aria-label="Daftar pengajuan layanan instansi"
            >
              <thead className="bg-muted/60 text-muted-foreground text-xs tracking-wide uppercase">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Nomor pelacakan
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Jenis layanan
                  </th>
                  <th scope="col" className="px-4 py-3 font-medium">
                    Pemohon
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
                        {application.category}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium">
                        {maskApplicantName(application.applicantName)}
                      </p>
                      <p className="text-muted-foreground mt-1 font-mono text-xs">
                        NIK {maskNik(application.nik)}
                      </p>
                    </td>
                    <td className="text-muted-foreground px-4 py-4 whitespace-nowrap">
                      {formatDateTimeWib(application.submittedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Lihat detail ${application.trackingNumber}`}
                        onClick={() => openDetails(application)}
                      >
                        Detail
                        <ArrowUpRight aria-hidden="true" className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <Search
                        aria-hidden="true"
                        className="text-muted-foreground mx-auto size-6"
                      />
                      <p className="mt-2 font-medium">
                        Pengajuan tidak ditemukan
                      </p>
                      <p className="text-muted-foreground mt-1 text-sm">
                        Coba ubah kata kunci atau filter yang dipilih.
                      </p>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 border-t px-4 py-3 text-xs">
            <LockKeyhole aria-hidden="true" className="size-3.5 shrink-0" />
            Data pemohon pada daftar disamarkan. Contoh data simulasi untuk satu
            instansi.
          </div>
        </div>
      </section>

      <Modal
        open={selectedApplication !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedApplication(null);
        }}
        title="Detail pengajuan"
        description={
          selectedApplication
            ? `${selectedApplication.trackingNumber} · ${selectedApplication.serviceName}`
            : undefined
        }
        contentClassName="fixed inset-0 left-auto top-0 h-dvh w-full max-w-2xl translate-x-0 translate-y-0 gap-0 overflow-y-auto rounded-none border-l p-0 sm:inset-y-0 sm:right-0 sm:h-dvh sm:max-w-2xl sm:rounded-none"
      >
        {selectedApplication ? (
          <div className="space-y-6 px-5 pt-2 pb-6 sm:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedApplication.status} />
              <SourceBadge source="SIMULATED" label="Data simulasi" />
            </div>

            <section
              aria-labelledby="applicant-details-title"
              className="space-y-3"
            >
              <h3 id="applicant-details-title" className="font-semibold">
                Informasi pemohon
              </h3>
              <dl className="grid gap-x-4 gap-y-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs">Nama</dt>
                  <dd className="mt-1 font-medium">
                    {showSensitiveDetails
                      ? selectedApplication.applicantName
                      : maskApplicantName(selectedApplication.applicantName)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Nomor pelacakan
                  </dt>
                  <dd className="mt-1 font-mono text-xs">
                    {selectedApplication.trackingNumber}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">NIK</dt>
                  <dd className="mt-1 font-mono">
                    {showSensitiveDetails
                      ? selectedApplication.nik
                      : maskNik(selectedApplication.nik)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Nomor telepon
                  </dt>
                  <dd className="mt-1 font-mono">
                    {showSensitiveDetails
                      ? selectedApplication.phone
                      : maskPhone(selectedApplication.phone)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs">Alamat</dt>
                  <dd className="mt-1">
                    {showSensitiveDetails
                      ? selectedApplication.address
                      : "Alamat disamarkan. Tampilkan data pemohon untuk melihat alamat simulasi."}
                  </dd>
                </div>
              </dl>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSensitiveDetails((visible) => !visible)}
              >
                <UserRound aria-hidden="true" className="size-4" />
                {showSensitiveDetails
                  ? "Samarkan data pemohon"
                  : "Tampilkan data pemohon"}
              </Button>
              <p className="text-muted-foreground text-xs">
                Data yang ditampilkan adalah data sintetis dan tidak mewakili
                warga sungguhan.
              </p>
            </section>

            <section
              aria-labelledby="application-meta-title"
              className="space-y-3"
            >
              <h3 id="application-meta-title" className="font-semibold">
                Informasi layanan
              </h3>
              <dl className="grid gap-x-4 gap-y-3 rounded-lg border p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Jenis layanan
                  </dt>
                  <dd className="mt-1 font-medium">
                    {selectedApplication.category}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Tanggal masuk
                  </dt>
                  <dd className="mt-1">
                    {formatDateTimeWib(selectedApplication.submittedAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Instansi tujuan
                  </dt>
                  <dd className="mt-1">{selectedApplication.agency}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Target penyelesaian
                  </dt>
                  <dd className="mt-1">
                    {formatDateTimeWib(selectedApplication.targetAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Petugas / tim
                  </dt>
                  <dd className="mt-1">{selectedApplication.assignedTeam}</dd>
                </div>
              </dl>
            </section>

            <section
              aria-labelledby="application-documents-title"
              className="space-y-3"
            >
              <h3 id="application-documents-title" className="font-semibold">
                Dokumen dan bukti
              </h3>
              <ul className="space-y-2">
                {selectedApplication.documents.map((document) => (
                  <li
                    key={document.name}
                    className="flex items-start justify-between gap-3 rounded-lg border p-3"
                  >
                    <div className="flex min-w-0 gap-2.5">
                      <FileText
                        aria-hidden="true"
                        className="text-primary mt-0.5 size-4 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium break-words">
                          {document.name}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Diterima {formatDateTimeWib(document.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <span className="text-muted-foreground shrink-0 text-right text-xs">
                      {document.status}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground text-xs">
                Pratinjau ini tidak mengunduh atau membuka berkas asli.
              </p>
            </section>

            <section
              aria-labelledby="application-history-title"
              className="space-y-3"
            >
              <h3 id="application-history-title" className="font-semibold">
                Riwayat status
              </h3>
              <ol className="space-y-0">
                {selectedApplication.history.map((entry, index) => (
                  <li
                    key={`${entry.occurredAt}-${index}`}
                    className="relative flex gap-3 pb-5 last:pb-0"
                  >
                    <span className="relative flex w-5 shrink-0 justify-center">
                      {index < selectedApplication.history.length - 1 ? (
                        <span
                          aria-hidden="true"
                          className="bg-border absolute top-5 h-full w-px"
                        />
                      ) : null}
                      <span className="z-10 mt-0.5 rounded-full bg-emerald-100 p-1 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 aria-hidden="true" className="size-3" />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">{entry.status}</p>
                        <time
                          className="text-muted-foreground text-xs"
                          dateTime={entry.occurredAt}
                        >
                          {formatDateTimeWib(entry.occurredAt)}
                        </time>
                      </div>
                      <p className="text-muted-foreground mt-1 text-sm">
                        {entry.description}
                      </p>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {entry.actor}
                        {entry.visibility
                          ? ` · Catatan ${entry.visibility === "public" ? "publik" : "internal"}`
                          : ""}
                      </p>
                      {entry.note ? (
                        <p className="bg-muted mt-2 rounded-md p-2.5 text-sm">
                          {entry.note}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section
              aria-labelledby="update-application-title"
              className="space-y-3 border-t pt-5"
            >
              <div>
                <h3 id="update-application-title" className="font-semibold">
                  Tindak lanjut
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  Pembaruan hanya tersimpan sementara di pratinjau ini.
                </p>
              </div>
              {selectedApplication.status === "Selesai" ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
                  Pengajuan selesai dan tidak dapat diubah lagi pada simulasi
                  ini.
                </div>
              ) : (
                <form className="space-y-3" onSubmit={saveUpdate}>
                  <label className="block space-y-1.5 text-sm font-medium">
                    Status pengajuan
                    <Select
                      aria-label="Status pengajuan baru"
                      value={nextStatus}
                      onChange={(event) => {
                        if (isApplicationStatus(event.target.value)) {
                          setNextStatus(event.target.value);
                        }
                      }}
                      options={STATUS_OPTIONS.map((status) => ({
                        value: status,
                        label: status,
                      }))}
                      className="bg-background"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">
                    Visibilitas catatan
                    <Select
                      aria-label="Visibilitas catatan"
                      value={noteVisibility}
                      onChange={(event) => {
                        if (isNoteVisibility(event.target.value)) {
                          setNoteVisibility(event.target.value);
                        }
                      }}
                      options={[
                        {
                          value: "internal",
                          label: "Catatan internal — hanya untuk petugas",
                        },
                        {
                          value: "public",
                          label: "Tanggapan publik — terlihat oleh pemohon",
                        },
                      ]}
                      className="bg-background"
                    />
                  </label>
                  <label className="block space-y-1.5 text-sm font-medium">
                    Catatan tanggapan
                    <Textarea
                      aria-label="Catatan tanggapan"
                      value={draftNote}
                      onChange={(event) => setDraftNote(event.target.value)}
                      placeholder="Jelaskan tindak lanjut atau informasi yang diperlukan..."
                      rows={4}
                      maxLength={1000}
                    />
                  </label>
                  {feedback ? (
                    <p
                      role="status"
                      aria-live="polite"
                      className="text-primary text-sm"
                    >
                      {feedback}
                    </p>
                  ) : null}
                  <Button type="submit" disabled={!draftNote.trim()}>
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    Simpan pembaruan (simulasi)
                  </Button>
                </form>
              )}
            </section>
          </div>
        ) : null}
      </Modal>
    </main>
  );
}
