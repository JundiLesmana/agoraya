import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import {
  ArrowLeft,
  Check,
  Clock3,
  Eye,
  FileText,
  LockKeyhole,
  MapPin,
  Shield,
  UserRound,
} from "lucide-react";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth/guards";
import type { Session } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  serviceApplications,
  reviewActivities,
  ticketEvidence,
  ticketSubmissionDetails,
  tickets,
  users,
} from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { listAssignableReviewStaff } from "@/modules/asn/assignable-review-staff";
import {
  maskApplicantName,
  maskEmail,
} from "@/app/(asn)/asn/dashboard/_components/agency-dashboard-data";
import {
  formatDateTimeWib,
  getDaysUntilDeadline,
} from "@/app/(citizen)/citizen/service/_components/tracking-format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { appendAuditEvent } from "@/modules/audit/service";
import {
  getNextReviewStatuses,
  getReviewStatusLabel,
} from "@/modules/review-workflow/status";
import {
  canManageServiceApplication,
  isServiceApplicationCategory,
} from "@/modules/service-applications/access";
import { ReviewWorkflowForms } from "./review-workflow-forms";

export const dynamic = "force-dynamic";

type ReviewKind = "report" | "service_application";

type SearchParamValue = string | string[] | undefined;

interface ReviewPageProps {
  searchParams: Promise<{
    kind?: SearchParamValue;
    id?: SearchParamValue;
  }>;
}

type StatusTone = "blue" | "indigo" | "amber" | "emerald";

type ReviewDetail = {
  kind: ReviewKind;
  id: string;
  trackingNumber: string;
  serviceName: string;
  description: string;
  category: string;
  subcategory: string;
  status: string;
  statusLabel: string;
  statusTone: StatusTone;
  submittedAt: string;
  targetAt: string | null;
  applicantName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  email: string;
  phone: string;
  address: string;
  agency: string | null;
  routeKey: string | null;
  serviceCategory?: string;
  isPublic: boolean;
  showIdentity: boolean;
  documents: { name: string; uploadedAt: string | null }[];
  rawPayload: Record<string, unknown> | null;
};

type ReviewActivity = {
  activityType: "internal_note" | "public_update" | "assignment";
  status: string | null;
  message: string;
  actorName: string;
  createdAt: string;
};

function firstValue(value: SearchParamValue): string | null {
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return typeof value[0] === "string" ? value[0] : null;
  return null;
}

function isReviewKind(value: string | null): value is ReviewKind {
  return value === "report" || value === "service_application";
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function categoryLabel(category: string): string {
  if (category === "permit") return "Perizinan";
  if (category === "education") return "Pendidikan";
  if (category === "social") return "Sosial";
  if (category === "health") return "Kesehatan";
  return category;
}

function getReviewStatus(
  status: string,
): Pick<ReviewDetail, "statusLabel" | "statusTone"> {
  if (status === "in_progress") {
    return { statusLabel: "Diproses", statusTone: "indigo" };
  }
  if (status === "verified") {
    return { statusLabel: "Diverifikasi", statusTone: "blue" };
  }
  if (status === "resolved" || status === "closed") {
    return { statusLabel: "Selesai", statusTone: "emerald" };
  }
  if (status === "rejected") {
    return { statusLabel: "Ditolak", statusTone: "amber" };
  }
  return { statusLabel: "Diterima", statusTone: "blue" };
}

function statusClassName(tone: StatusTone): string {
  switch (tone) {
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200";
    case "indigo":
      return "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-200";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
  }
}

function extractServiceDescription(payload: Record<string, unknown>): string {
  const data = payload.data;
  if (!data || typeof data !== "object") return "-";
  const record = data as Record<string, unknown>;
  return (
    asString(record.detailKebutuhan) ??
    asString(record.uraian) ??
    asString(record.tujuanIzin) ??
    "-"
  );
}

function extractServiceAddress(payload: Record<string, unknown>): string {
  const data = payload.data;
  if (!data || typeof data !== "object") return "-";
  const record = data as Record<string, unknown>;
  const parts = [
    asString(record.lokasiKejadian),
    asString(record.alamatUsaha),
    asString(record.lokasiKegiatan),
    asString(record.lokasiFasilitas),
    asString(record.kelurahan),
    asString(record.kecamatan),
  ].filter((part): part is string => Boolean(part));
  return parts.length ? [...new Set(parts)].join(", ") : "-";
}

async function getReportDetail(
  id: string,
  tenantId: string,
): Promise<ReviewDetail | null> {
  const [row] = await db()
    .select({
      id: tickets.id,
      trackingNumber: ticketSubmissionDetails.reportNumber,
      serviceName: tickets.title,
      description: tickets.description,
      category: tickets.category,
      subcategory: ticketSubmissionDetails.subcategory,
      status: tickets.status,
      submittedAt: tickets.submittedAt,
      targetAt: tickets.responseDueAt,
      applicantName: ticketSubmissionDetails.reporterName,
      assigneeId: tickets.assigneeId,
      assigneeName: users.name,
      address: ticketSubmissionDetails.address,
      city: ticketSubmissionDetails.city,
      province: ticketSubmissionDetails.province,
      isPublic: ticketSubmissionDetails.isPublic,
      showIdentity: ticketSubmissionDetails.showIdentity,
    })
    .from(tickets)
    .innerJoin(
      ticketSubmissionDetails,
      eq(ticketSubmissionDetails.ticketId, tickets.id),
    )
    .leftJoin(users, eq(tickets.assigneeId, users.id))
    .where(and(eq(tickets.id, id), eq(tickets.tenantId, tenantId)))
    .limit(1);

  if (!row) return null;

  const evidenceRows = await db()
    .select({
      name: ticketEvidence.storageKey,
      uploadedAt: ticketEvidence.createdAt,
    })
    .from(ticketEvidence)
    .where(
      and(
        eq(ticketEvidence.ticketId, id),
        eq(ticketEvidence.tenantId, tenantId),
      ),
    )
    .orderBy(desc(ticketEvidence.createdAt));

  const statusInfo = getReviewStatus(row.status);
  const submittedAt =
    row.submittedAt?.toISOString() ?? new Date(0).toISOString();

  return {
    kind: "report",
    id: row.id,
    trackingNumber: row.trackingNumber,
    serviceName: row.serviceName,
    description: row.description,
    category: row.category,
    subcategory: row.subcategory,
    status: row.status,
    statusLabel: statusInfo.statusLabel,
    statusTone: statusInfo.statusTone,
    submittedAt,
    targetAt: row.targetAt?.toISOString() ?? null,
    applicantName: row.applicantName ?? "Pelapor anonim",
    assigneeId: row.assigneeId,
    assigneeName: row.assigneeName,
    email: "",
    phone: "-",
    address: [row.address, row.city, row.province].filter(Boolean).join(", "),
    agency: null,
    routeKey: null,
    isPublic: row.isPublic,
    showIdentity: row.showIdentity,
    documents: evidenceRows.map((item) => ({
      name: item.name,
      uploadedAt: item.uploadedAt?.toISOString() ?? null,
    })),
    rawPayload: null,
  };
}

async function getServiceApplicationDetail(
  id: string,
  session: Session,
): Promise<ReviewDetail | null> {
  const [row] = await db()
    .select({
      id: serviceApplications.id,
      tenantId: serviceApplications.tenantId,
      trackingNumber: serviceApplications.trackingNumber,
      serviceName: serviceApplications.serviceName,
      category: serviceApplications.category,
      subcategory: serviceApplications.serviceType,
      status: serviceApplications.status,
      submittedAt: serviceApplications.submittedAt,
      applicantName: serviceApplications.applicantName,
      assigneeId: serviceApplications.assigneeId,
      assigneeName: users.name,
      email: serviceApplications.contactEmail,
      agency: serviceApplications.agency,
      routeKey: serviceApplications.routeKey,
      payload: serviceApplications.payload,
    })
    .from(serviceApplications)
    .leftJoin(users, eq(serviceApplications.assigneeId, users.id))
    .where(
      and(
        eq(serviceApplications.id, id),
        eq(serviceApplications.tenantId, session.tenantId),
      ),
    )
    .limit(1);

  if (!row) return null;
  if (
    !isServiceApplicationCategory(row.category) ||
    !(await canManageServiceApplication(session, row))
  ) {
    return null;
  }

  const payload = row.payload as Record<string, unknown>;
  const statusInfo = getReviewStatus(row.status);

  return {
    kind: "service_application",
    id: row.id,
    trackingNumber: row.trackingNumber,
    serviceName: row.serviceName,
    description: extractServiceDescription(payload),
    category: categoryLabel(row.category),
    subcategory: row.subcategory,
    status: row.status,
    statusLabel: statusInfo.statusLabel,
    statusTone: statusInfo.statusTone,
    submittedAt: row.submittedAt?.toISOString() ?? new Date(0).toISOString(),
    targetAt: null,
    applicantName: row.applicantName,
    assigneeId: row.assigneeId,
    assigneeName: row.assigneeName,
    email: row.email,
    phone: "-",
    address: extractServiceAddress(payload),
    agency: row.agency,
    routeKey: row.routeKey,
    serviceCategory: row.category,
    isPublic: false,
    showIdentity: true,
    documents: [],
    rawPayload: payload,
  };
}

async function getReviewDetail(
  kind: ReviewKind,
  id: string,
  session: Session,
): Promise<ReviewDetail | null> {
  if (kind === "report") {
    return getReportDetail(id, session.tenantId);
  }
  return getServiceApplicationDetail(id, session);
}

async function recordReviewOpen(
  detail: ReviewDetail,
  session: Awaited<ReturnType<typeof requireAuth>>,
): Promise<void> {
  await appendAuditEvent(db(), {
    actorId: session.userId,
    action: "review.open",
    targetTable: detail.kind === "report" ? "tickets" : "service_applications",
    targetId: detail.id,
    metadata: {
      tenantId: session.tenantId,
      actorRole: session.roles.join(","),
      result: "success",
      kind: detail.kind,
      trackingNumber: detail.trackingNumber,
      status: detail.status,
      routeKey: detail.routeKey,
    },
    occurredAt: new Date(),
  });
}

function DetailListItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        className={cn(
          "text-card-foreground mt-1 text-sm",
          mono && "font-mono text-xs",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

async function getReviewActivities(
  kind: ReviewKind,
  id: string,
  tenantId: string,
): Promise<ReviewActivity[]> {
  return db()
    .select({
      activityType: reviewActivities.activityType,
      status: reviewActivities.status,
      message: reviewActivities.message,
      actorName: users.name,
      createdAt: reviewActivities.createdAt,
    })
    .from(reviewActivities)
    .innerJoin(users, eq(reviewActivities.actorId, users.id))
    .where(
      and(
        eq(reviewActivities.itemType, kind),
        eq(reviewActivities.itemId, id),
        eq(reviewActivities.tenantId, tenantId),
      ),
    )
    .orderBy(desc(reviewActivities.createdAt))
    .then((rows) =>
      rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
    );
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });

  const params = await searchParams;
  const kind = firstValue(params.kind);
  const id = firstValue(params.id);

  if (!isReviewKind(kind) || !id) {
    notFound();
  }

  const detail = await getReviewDetail(kind, id, session);
  if (!detail) {
    notFound();
  }

  await recordReviewOpen(detail, session);

  const daysUntilDeadline = detail.targetAt
    ? getDaysUntilDeadline(detail.targetAt)
    : null;
  const maskedName = maskApplicantName(detail.applicantName);
  const maskedEmailAddress = maskEmail(detail.email);
  const [activities, staff] = await Promise.all([
    getReviewActivities(detail.kind, detail.id, session.tenantId),
    listAssignableReviewStaff(
      session.tenantId,
      detail.serviceCategory &&
        isServiceApplicationCategory(detail.serviceCategory)
        ? detail.serviceCategory
        : undefined,
    ),
  ]);
  const publicUpdates = activities
    .filter((activity) => activity.activityType === "public_update")
    .reverse();
  const internalNotes = activities.filter(
    (activity) => activity.activityType === "internal_note",
  );
  const assignmentEvents = activities.filter(
    (activity) => activity.activityType === "assignment",
  );
  const statusOptions = getNextReviewStatuses(detail.kind, detail.status).map(
    (status) => ({ value: status, label: getReviewStatusLabel(status) }),
  );

  return (
    <main className="bg-background text-foreground min-h-[calc(100vh-5rem)]">
      <section className="border-border border-y bg-sky-50 dark:bg-sky-950/30">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <Link
              href="/asn/dashboard"
              className="text-primary inline-flex items-center gap-1 hover:underline"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Kembali ke dashboard
            </Link>
            <span aria-hidden="true">/</span>
            <span>Review pengajuan</span>
          </div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {detail.serviceName}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {detail.trackingNumber} ·{" "}
                {detail.kind === "service_application"
                  ? "Pengajuan layanan"
                  : "Laporan warga"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={statusClassName(detail.statusTone)}
            >
              {detail.statusLabel}
            </Badge>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.8fr)_minmax(19rem,1fr)]">
          <div className="space-y-4">
            <Card className="bg-card text-card-foreground gap-0 rounded-xl py-0 shadow-sm">
              <CardHeader className="border-border border-b py-4">
                <CardTitle className="text-sm">Informasi pengajuan</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 py-4 sm:grid-cols-2">
                <DetailListItem
                  label="Nomor"
                  value={detail.trackingNumber}
                  mono
                />
                <DetailListItem
                  label="Kategori"
                  value={`${detail.category} · ${detail.subcategory}`}
                />
                <DetailListItem label="Pemohon" value={maskedName} />
                <DetailListItem
                  label="Tanggal pengajuan"
                  value={formatDateTimeWib(detail.submittedAt)}
                />
                <DetailListItem
                  label="Instansi penanggung jawab"
                  value={detail.agency ?? "Instansi terkait"}
                />
                <DetailListItem
                  label="Petugas yang ditugaskan"
                  value={detail.assigneeName ?? "Belum ditugaskan"}
                />
                <DetailListItem label="Lokasi" value={detail.address} />
                <DetailListItem
                  label="Batas respons"
                  value={
                    detail.targetAt
                      ? formatDateTimeWib(detail.targetAt)
                      : "Belum ditetapkan"
                  }
                />
              </CardContent>
              <div className="bg-muted text-muted-foreground mx-4 mb-4 flex items-start gap-2 rounded-lg p-3 text-xs leading-5">
                <Clock3
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
                <p>
                  {detail.targetAt
                    ? daysUntilDeadline !== null && daysUntilDeadline >= 0
                      ? `Standar layanan aktif. Sisa ${daysUntilDeadline} hari menuju batas respons.`
                      : "Batas respons terlewati. Catat perubahan jadwal dan alasan pada riwayat."
                    : "Belum ada target respons yang tersimpan untuk pengajuan ini."}
                </p>
              </div>
            </Card>

            <Card className="bg-card text-card-foreground gap-0 rounded-xl py-0 shadow-sm">
              <CardHeader className="border-border border-b py-4">
                <CardTitle className="text-sm">Uraian pengajuan</CardTitle>
                <CardDescription className="text-xs">
                  {detail.kind === "service_application"
                    ? "Deskripsi kebutuhan dari formulir layanan."
                    : "Deskripsi laporan yang dikirim warga."}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <p className="text-sm leading-6 whitespace-pre-wrap">
                  {detail.description}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground gap-0 rounded-xl py-0 shadow-sm">
              <CardHeader className="border-border border-b py-4">
                <CardTitle className="text-sm">Dokumen & bukti</CardTitle>
                <CardDescription className="text-xs">
                  {detail.kind === "service_application"
                    ? "Lampiran formulir layanan belum terintegrasi penyimpanannya."
                    : "Bukti yang tersimpan untuk tiket laporan ini."}
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                {detail.documents.length ? (
                  <ul className="space-y-3">
                    {detail.documents.map((document, index) => (
                      <li
                        key={`${document.name}-${document.uploadedAt ?? "na"}`}
                        className="border-border flex items-start gap-3 rounded-lg border p-3 text-sm"
                      >
                        <FileText
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            index === 0 ? "text-emerald-600" : "text-amber-600",
                          )}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-card-foreground font-medium break-all">
                            {document.name}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {document.uploadedAt
                              ? formatDateTimeWib(document.uploadedAt)
                              : "Waktu unggah tidak tersedia"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    Tidak ada lampiran.
                  </p>
                )}
                <p className="text-muted-foreground mt-4 flex items-start gap-2 text-xs leading-5">
                  <Shield
                    className="mt-0.5 size-3.5 shrink-0"
                    aria-hidden="true"
                  />
                  Lampiran pribadi hanya untuk petugas berwenang. Tidak ada
                  dokumen tambahan yang dibutuhkan dari warga.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground gap-0 rounded-xl py-0 shadow-sm">
              <CardHeader className="border-border border-b py-4">
                <CardTitle className="text-sm">Riwayat publik</CardTitle>
                <CardDescription className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-300">
                  <Eye className="size-3.5" aria-hidden="true" />
                  Pembaruan yang terlihat oleh pemohon
                </CardDescription>
              </CardHeader>
              <CardContent className="py-4">
                <ol className="space-y-4">
                  <li className="relative flex gap-3">
                    <span className="relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300">
                      <Check className="size-3" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-xs">
                        {formatDateTimeWib(detail.submittedAt)}
                      </p>
                      <p className="text-card-foreground mt-0.5 text-sm font-semibold">
                        Pengajuan diterima
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-xs leading-5">
                        Pengajuan tercatat dan menunggu tindak lanjut instansi.
                      </p>
                    </div>
                  </li>
                  {publicUpdates.map((activity) => (
                    <li
                      key={`${activity.createdAt}-${activity.message}`}
                      className="relative flex gap-3"
                    >
                      <span className="relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                        <Clock3 className="size-3" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-muted-foreground text-xs">
                          {formatDateTimeWib(activity.createdAt)}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
                          {activity.status
                            ? getReviewStatusLabel(activity.status)
                            : "Pembaruan"}
                        </p>
                        <p className="text-muted-foreground mt-0.5 text-xs leading-5 whitespace-pre-wrap">
                          {activity.message}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-4">
            <div className="flex justify-start">
              <Button
                asChild
                variant="outline"
                className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
              >
                <Link href="/asn/dashboard">
                  <h2 className="text-xl font-semibold">Kembali</h2>
                </Link>
              </Button>
            </div>

            <div>
              <h2 className="text-base font-semibold">Tindak lanjut petugas</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Akses petugas berwenang · semua perubahan tercatat
              </p>
            </div>
            <ReviewWorkflowForms
              itemType={detail.kind}
              itemId={detail.id}
              currentAssigneeId={detail.assigneeId}
              staff={staff}
              currentStatus={detail.status}
              canPublishPublicUpdate={
                detail.kind === "service_application" || detail.isPublic
              }
              statusOptions={statusOptions}
            />

            <Card className="bg-card text-card-foreground gap-0 rounded-xl py-0 shadow-sm">
              <CardHeader className="py-4">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <LockKeyhole
                    className="text-primary size-4"
                    aria-hidden="true"
                  />
                  Catatan internal tersimpan
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                {internalNotes.length ? (
                  <ul className="space-y-3">
                    {internalNotes.map((note) => (
                      <li
                        key={`${note.createdAt}-${note.message}`}
                        className="border-primary/30 border-l-2 pl-3"
                      >
                        <p className="text-card-foreground text-sm leading-5 whitespace-pre-wrap">
                          {note.message}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {note.actorName} · {formatDateTimeWib(note.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    Belum ada catatan internal.
                  </p>
                )}
              </CardContent>
            </Card>

            {assignmentEvents.length ? (
              <Card className="bg-card text-card-foreground gap-0 rounded-xl py-0 shadow-sm">
                <CardHeader className="py-4">
                  <CardTitle className="text-sm">Riwayat penugasan</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <ul className="space-y-3">
                    {assignmentEvents.map((event) => (
                      <li
                        key={`${event.createdAt}-${event.message}`}
                        className="border-border border-l-2 pl-3"
                      >
                        <p className="text-card-foreground text-sm leading-5">
                          {event.message}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {event.actorName} ·{" "}
                          {formatDateTimeWib(event.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ) : null}

            {detail.rawPayload ? (
              <details className="bg-card text-card-foreground border-border rounded-xl border p-4 shadow-sm">
                <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
                  <Shield className="text-primary size-4" aria-hidden="true" />
                  Payload formulir
                </summary>
                <p className="text-muted-foreground mt-2 text-xs">
                  Data mentah hanya untuk inspeksi petugas.
                </p>
                <pre className="bg-muted text-card-foreground mt-3 max-h-80 overflow-auto rounded-lg p-3 text-xs leading-5 break-words whitespace-pre-wrap">
                  {JSON.stringify(detail.rawPayload, null, 2)}
                </pre>
              </details>
            ) : null}
            <div className="text-card-foreground flex items-start gap-2 rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs leading-5 dark:border-sky-900 dark:bg-sky-950/30">
              {detail.kind === "report" ? (
                <UserRound
                  className="text-primary mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <MapPin
                  className="text-primary mt-0.5 size-4 shrink-0"
                  aria-hidden="true"
                />
              )}
              {detail.kind === "report"
                ? `Nama samaran pelapor: ${maskedName}. Kontak email dan nomor HP tidak dikumpulkan.`
                : `Lokasi: ${detail.address}. Kontak pemohon dibatasi, ${maskedEmailAddress}.`}
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
