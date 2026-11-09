import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  PauseCircle,
} from "lucide-react";
import { notFound } from "next/navigation";
import { ServiceSpaceNavigation } from "@/components/service-space-navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guards";
import {
  PROCESSING_STATUS,
  getSubmissionProcessingDetail,
  type SubmissionProcessingDetail,
} from "@/lib/service-applications/processing";
import { cn } from "@/lib/utils";
import { formatDateTimeWib } from "@/app/(citizen)/citizen/service/_components/tracking-format";
import { SubmissionProcessingForms } from "../../dashboard/_components/submission-processing-forms";

export const dynamic = "force-dynamic";

function statusLabel(status: SubmissionProcessingDetail["status"]): string {
  switch (status) {
    case PROCESSING_STATUS.processing:
      return "Diproses";
    case PROCESSING_STATUS.waitingForCitizen:
      return "Menunggu Warga";
    case PROCESSING_STATUS.completed:
      return "Selesai";
    default:
      return "Diterima";
  }
}

function statusClassName(status: SubmissionProcessingDetail["status"]): string {
  switch (status) {
    case PROCESSING_STATUS.processing:
      return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200";
    case PROCESSING_STATUS.waitingForCitizen:
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
    case PROCESSING_STATUS.completed:
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
    default:
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200";
  }
}

function slaToneClassName(state: SubmissionProcessingDetail["sla"]["state"]): string {
  switch (state) {
    case "overdue":
      return "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
    default:
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
  }
}

function slaLabel(detail: SubmissionProcessingDetail): string {
  if (detail.sla.paused) return "SLA dijeda";
  if (detail.sla.state === "overdue") return "SLA terlewati";
  if (detail.sla.state === "warning") return "SLA mendekati batas";
  return "SLA aman";
}

function formatMinutes(totalMinutes: number): string {
  const absoluteMinutes = Math.max(0, Math.abs(totalMinutes));
  const days = Math.floor(absoluteMinutes / 1_440);
  const hours = Math.floor((absoluteMinutes % 1_440) / 60);
  const minutes = absoluteMinutes % 60;
  const segments: string[] = [];

  if (days > 0) segments.push(`${days}h`);
  if (hours > 0) segments.push(`${hours}j`);
  if (minutes > 0 || segments.length === 0) segments.push(`${minutes}m`);

  return segments.join(" ");
}

function formatFieldLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function stringifyFieldValue(value: unknown): string | null {
  if (typeof value === "string") {
    return value.trim() || null;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => stringifyFieldValue(item))
      .filter((item): item is string => Boolean(item));
    return parts.length > 0 ? parts.join(", ") : null;
  }
  return null;
}

function extractApplicantFields(
  payload: Record<string, unknown>,
): { label: string; value: string }[] {
  const data = payload.data;
  if (!data || typeof data !== "object") {
    return [];
  }

  return Object.entries(data as Record<string, unknown>)
    .flatMap(([key, value]) => {
      if (value && typeof value === "object") {
        return [];
      }
      const formattedValue = stringifyFieldValue(value);
      if (!formattedValue) {
        return [];
      }
      return [{ label: formatFieldLabel(key), value: formattedValue }];
    })
    .slice(0, 12);
}

function summaryValue(
  label: string,
  fallback: string,
  fields: { label: string; value: string }[],
): string {
  return fields.find((field) => field.label === label)?.value ?? fallback;
}

export default async function SubmissionWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });
  const { id } = await params;

  const detail = await getSubmissionProcessingDetail(id, session);
  if (!detail) {
    notFound();
  }

  const applicantFields = extractApplicantFields(detail.payload);
  const applicantSummary = [
    {
      label: "Pemohon",
      value: detail.applicantName,
      description: detail.contactEmail,
    },
    {
      label: "Layanan",
      value: detail.serviceName,
      description: detail.routeKey,
    },
    {
      label: "Tanggal Masuk",
      value: formatDateTimeWib(detail.submittedAt),
      description: detail.agency,
    },
    {
      label: "Assignee",
      value: detail.assigneeId ?? "Belum ditugaskan",
      description: `Status ${statusLabel(detail.status)}`,
    },
  ];
  const completedChecklistCount = detail.checklist.filter(
    (item) => item.completed,
  ).length;
  const validDocumentsCount = detail.documents.filter(
    (item) => item.verificationStatus === "valid",
  ).length;
  const invalidDocumentsCount = detail.documents.filter(
    (item) => item.verificationStatus === "invalid",
  ).length;

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-primary text-xs font-medium tracking-wide uppercase">
              Layanan publik
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Penanganan Pengajuan
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Workspace petugas ASN untuk memverifikasi dokumen, mengelola
              progres, dan menerbitkan hasil layanan dari data dashboard
              instansi.
            </p>
          </div>
          <Link
            href="/asn/queue"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Kembali ke antrean
          </Link>
        </div>
        <ServiceSpaceNavigation activeSpace="agency" />
        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/asn/dashboard" className="hover:text-foreground">
            Ruang Instansi
          </Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="text-foreground">Layanan Publik</span>
          <ChevronRight className="size-4" aria-hidden="true" />
          <Link href="/asn/queue" className="hover:text-foreground">
            Antrean Pengajuan
          </Link>
          <ChevronRight className="size-4" aria-hidden="true" />
          <span className="font-medium text-foreground">
            Penanganan Pengajuan
          </span>
        </nav>
      </header>

      <section className="rounded-3xl border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.24em]">
              Nomor Pengajuan
            </p>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {detail.trackingNumber}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base">
                {detail.serviceName} · {detail.agency}
              </p>
              <p className="text-muted-foreground text-sm">
                Diajukan {formatDateTimeWib(detail.submittedAt)} oleh{" "}
                {detail.applicantName}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <Badge variant="outline" className={statusClassName(detail.status)}>
              {statusLabel(detail.status)}
            </Badge>
            <Badge
              variant="outline"
              className={cn("gap-1", slaToneClassName(detail.sla.state))}
            >
              {detail.sla.paused ? (
                <PauseCircle className="size-3.5" aria-hidden="true" />
              ) : detail.sla.state === "overdue" ? (
                <AlertCircle className="size-3.5" aria-hidden="true" />
              ) : detail.sla.state === "warning" ? (
                <Clock3 className="size-3.5" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="size-3.5" aria-hidden="true" />
              )}
              {slaLabel(detail)}
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {applicantSummary.map((item) => (
            <Card key={item.label} className="gap-2 border-dashed p-4 shadow-none">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-base leading-snug">{item.value}</CardTitle>
              <p className="text-muted-foreground text-sm">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Formulir pengajuan warga</CardTitle>
              <CardDescription>
                Data asli yang dikirim warga pada saat pengajuan. Gunakan untuk
                verifikasi kesesuaian dokumen dan kebutuhan tindak lanjut.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              {applicantFields.length > 0 ? (
                applicantFields.map((field) => (
                  <div key={field.label} className="rounded-2xl border bg-muted/20 p-4">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                      {field.label}
                    </p>
                    <p className="mt-2 text-sm font-medium break-words">
                      {field.value}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground sm:col-span-2">
                  Data formulir warga tidak tersedia dalam format yang dapat
                  diringkas.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checklist operasional</CardTitle>
              <CardDescription>
                {completedChecklistCount} dari {detail.checklist.length} langkah
                sudah diselesaikan. Pastikan seluruh langkah wajib selesai
                sebelum layanan diterbitkan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-2xl border p-4"
                >
                  <span
                    className={cn(
                      "mt-0.5 rounded-full border p-1",
                      item.completed
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                        : "border-muted bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {item.completed ? (
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    ) : (
                      <Clock3 className="size-4" aria-hidden="true" />
                    )}
                  </span>
                    <div className="space-y-1">
                      <p className="font-medium">{item.label}</p>
                      <p className="text-muted-foreground text-sm">
                        {item.required ? "Langkah wajib sebelum layanan diterbitkan." : "Langkah opsional."}
                      </p>
                    </div>

                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status verifikasi dokumen</CardTitle>
              <CardDescription>
                {validDocumentsCount} valid · {invalidDocumentsCount} perlu
                perbaikan · {detail.documents.length - validDocumentsCount - invalidDocumentsCount} menunggu verifikasi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {detail.documents.length > 0 ? (
                detail.documents.map((document) => (
                  <div
                    key={document.id}
                    className="space-y-2 rounded-2xl border p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{document.label}</p>
                        <p className="text-muted-foreground text-sm">
                          {document.citizenDocument?.fileName ?? "Dokumen warga belum terhubung"}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          document.verificationStatus === "valid"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200"
                            : document.verificationStatus === "invalid"
                              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-200"
                              : "border-muted bg-muted/40 text-muted-foreground",
                        )}
                      >
                        {document.verificationStatus === "valid"
                          ? "Valid"
                          : document.verificationStatus === "invalid"
                            ? "Perlu revisi"
                            : "Menunggu verifikasi"}
                      </Badge>
                    </div>
                    {document.verificationNote ? (
                      <p className="text-sm text-muted-foreground">
                        {document.verificationNote}
                      </p>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
                  Belum ada dokumen yang diunggah pada pengajuan ini.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan SLA</CardTitle>
              <CardDescription>
                {slaLabel(detail)} · target {formatMinutes(detail.sla.targetMinutes)}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Waktu berjalan
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {formatMinutes(detail.sla.elapsedMinutes)}
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Sisa / selisih
                </p>
                <p className="mt-2 text-lg font-semibold">
                  {detail.sla.remainingMinutes >= 0
                    ? `${formatMinutes(detail.sla.remainingMinutes)} tersisa`
                    : `${formatMinutes(detail.sla.remainingMinutes)} terlewati`}
                </p>
              </div>
              <div className="rounded-2xl border bg-muted/20 p-4 sm:col-span-2">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                  Prioritas ringkas
                </p>
                <p className="mt-2 text-sm">
                  {summaryValue(
                    "Prioritas",
                    detail.sla.state === "overdue"
                      ? "Tindak lanjut segera diperlukan"
                      : "Pantau sesuai antrean",
                    applicantFields,
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <SubmissionProcessingForms detail={detail} />
    </main>
  );
}
