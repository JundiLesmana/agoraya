import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Mail,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { reviewActivities, serviceApplications } from "@/lib/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { resolveReportingTenantId } from "@/lib/tenancy/reporting";
import { formatDateTimeWib, getDaysUntilDeadline } from "../_components/tracking-format";
import { mapStoredServiceApplication, type TrackingApplication, type TrackingStatus } from "../_components/tracking-data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail pengajuan warga | Agoraya",
  description: "Lihat detail aman pengajuan layanan yang terhubung ke akun Anda.",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function getStatusTone(status: TrackingStatus): string {
  switch (status) {
    case "Diterima":
    case "Sedang diproses":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300";
    case "Perlu dokumen":
      return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300";
    case "Diverifikasi":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300";
    case "Selesai":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "Selesai (Ditutup)":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300";
    case "Menunggu Tinjauan Warga":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300";
    case "Ditolak":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300";
    case "Status lain":
      return "border-border bg-muted text-muted-foreground";
  }
}

function StatusBadge({ status }: { status: TrackingStatus }) {
  return (
    <Badge variant="outline" className={getStatusTone(status)}>
      {status}
    </Badge>
  );
}

function getDeadlineCopy(daysRemaining: number): string {
  if (daysRemaining < 0) return `Terlambat ${Math.abs(daysRemaining)} hari`;
  if (daysRemaining === 0) return "Batas waktu hari ini";
  return `${daysRemaining} hari lagi`;
}

async function getCitizenApplicationDetail(id: string, tenantId: string, userId: string) {
  const reportingTenantId = await resolveReportingTenantId();
  const tenantIds = [
    ...new Set(
      [tenantId, reportingTenantId].filter(
        (candidate): candidate is string => candidate !== null,
      ),
    ),
  ];
  const [application] = await db()
    .select({
      id: serviceApplications.id,
      tenantId: serviceApplications.tenantId,
      trackingNumber: serviceApplications.trackingNumber,
      category: serviceApplications.category,
      serviceType: serviceApplications.serviceType,
      serviceId: serviceApplications.serviceId,
      routeKey: serviceApplications.routeKey,
      serviceName: serviceApplications.serviceName,
      agency: serviceApplications.agency,
      status: serviceApplications.status,
      applicantName: serviceApplications.applicantName,
      contactEmail: serviceApplications.contactEmail,
      payload: serviceApplications.payload,
      submittedAt: serviceApplications.submittedAt,
      updatedAt: serviceApplications.updatedAt,
    })
    .from(serviceApplications)
    .where(
      and(
        eq(serviceApplications.id, id),
        inArray(serviceApplications.tenantId, tenantIds),
        eq(serviceApplications.applicantUserId, userId),
      ),
    )
    .limit(1);

  if (!application) {
    notFound();
  }

  const publicUpdates = await db()
    .select({
      status: reviewActivities.status,
      message: reviewActivities.message,
      createdAt: reviewActivities.createdAt,
    })
    .from(reviewActivities)
    .where(
      and(
        eq(reviewActivities.tenantId, application.tenantId),
        eq(reviewActivities.itemType, "service_application"),
        eq(reviewActivities.itemId, id),
        eq(reviewActivities.activityType, "public_update"),
      ),
    )
    .orderBy(asc(reviewActivities.createdAt));

  return mapStoredServiceApplication({
    ...application,
    submittedAt: application.submittedAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  }, publicUpdates.map((update) => ({
    ...update,
    createdAt: update.createdAt.toISOString(),
  })));
}

function DetailHero({ application }: { application: TrackingApplication }) {
  return (
    <section className="border-b border-border bg-sky-50 dark:bg-sky-950/30">
      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-primary">
                Beranda
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">{" > "}</li>
            <li>
              <Link href="/citizen/service" className="hover:text-primary">
                Ruang Warga
              </Link>
            </li>
            <li aria-hidden="true" className="select-none">{" > "}</li>
            <li aria-current="page" className="font-medium text-primary">
              Detail pengajuan
            </li>
          </ol>
        </nav>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <SourceBadge source="CITIZEN_UNVERIFIED" label="Pengajuan akun Anda" />
            <StatusBadge status={application.status} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{application.serviceName}</h1>
            <p className="font-mono text-sm text-muted-foreground">{application.trackingNumber}</p>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Halaman ini hanya menampilkan detail pengajuan yang terhubung ke akun Anda. Jangan bagikan tautan ini untuk meminta orang lain memeriksa pengajuan karena akses tetap dibatasi oleh sesi login.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/citizen/service">
                <ArrowLeft className="size-4" aria-hidden="true" />
                Kembali ke daftar pengajuan
              </Link>
            </Button>
            <Button asChild>
              <Link href="/citizen/apply">
                Ajukan layanan baru
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewCards({ application }: { application: TrackingApplication }) {
  const responseDeadlineAt = application.deadlineAt ?? application.targetAt;
  const daysRemaining = responseDeadlineAt ? getDaysUntilDeadline(responseDeadlineAt) : null;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card className="gap-3 rounded-xl p-4 shadow-sm">
        <CardContent className="space-y-1 p-0">
          <p className="text-xs text-muted-foreground">Kategori</p>
          <p className="text-base font-semibold">{application.category}</p>
          <p className="text-xs text-muted-foreground">Instansi: {application.agency}</p>
        </CardContent>
      </Card>
      <Card className="gap-3 rounded-xl p-4 shadow-sm">
        <CardContent className="space-y-1 p-0">
          <p className="text-xs text-muted-foreground">Tanggal pengajuan</p>
          <p className="text-base font-semibold">{formatDateTimeWib(application.submittedAt)}</p>
          <p className="text-xs text-muted-foreground">Pembaruan terakhir {formatDateTimeWib(application.updatedAt)}</p>
        </CardContent>
      </Card>
      <Card className="gap-3 rounded-xl p-4 shadow-sm">
        <CardContent className="space-y-1 p-0">
          <p className="text-xs text-muted-foreground">Progress saat ini</p>
          <p className="text-base font-semibold">Tahap {application.currentStep} dari 4</p>
          <p className="text-xs text-muted-foreground">{application.progressDescription}</p>
        </CardContent>
      </Card>
      <Card className="gap-3 rounded-xl p-4 shadow-sm">
        <CardContent className="space-y-1 p-0">
          <p className="text-xs text-muted-foreground">Batas respons</p>
          <p className="text-base font-semibold">
            {responseDeadlineAt ? formatDateTimeWib(responseDeadlineAt) : "Belum ditentukan"}
          </p>
          <p className="text-xs text-muted-foreground">
            {daysRemaining === null ? "Menunggu jadwal dari instansi" : getDeadlineCopy(daysRemaining)}
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

function ProgressSection({ application }: { application: TrackingApplication }) {
  const steps = ["Diterima", "Verifikasi", "Diproses", "Selesai"];

  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Progress layanan</CardTitle>
        <CardDescription>{application.progressLabel}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/40">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={application.status} />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Tahap {application.currentStep} dari 4
            </span>
          </div>
          <ol className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Tahapan layanan">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const active = stepNumber <= application.currentStep;
              const current = stepNumber === application.currentStep;
              return (
                <li key={step} className="space-y-2">
                  <span
                    className={[
                      "block h-1 rounded-full",
                      active ? "bg-blue-700 dark:bg-blue-300" : "bg-blue-200 dark:bg-blue-900",
                    ].join(" ")}
                  />
                  <span className={current ? "text-xs font-semibold text-blue-800 dark:text-blue-200" : "text-xs text-muted-foreground"}>
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{application.progressDescription}</p>
        </div>

        {application.status === "Perlu dokumen" ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/40">
            <p className="font-semibold text-amber-900 dark:text-amber-200">Dokumen tambahan masih diperlukan</p>
            <p className="mt-1 leading-6 text-amber-800 dark:text-amber-300">
              Siapkan berkas sesuai permintaan instansi. Pengiriman dokumen aman belum tersedia pada demo ini, jadi jangan unggah dokumen sensitif di luar kanal resmi.
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TimelineSection({ application }: { application: TrackingApplication }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Riwayat progres</CardTitle>
        <CardDescription>Setiap perubahan status pada pengajuan akun Anda dicatat di sini.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {application.timeline.map((item, index) => (
            <li key={`${item.title}-${item.occurredAt}`} className="relative flex gap-3 pb-4 last:pb-0">
              {index < application.timeline.length - 1 ? (
                <span aria-hidden="true" className="absolute left-[9px] top-5 h-[calc(100%-0.5rem)] w-px bg-border" />
              ) : null}
              <span className={item.completed ? "relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-700 text-white dark:bg-blue-400 dark:text-blue-950"}>
                {item.completed ? <Check className="size-3" aria-hidden="true" /> : <Clock3 className="size-3" aria-hidden="true" />}
              </span>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{formatDateTimeWib(item.occurredAt)}</p>
                <p className="mt-0.5 text-sm font-semibold">{item.title}</p>
                <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ApplicantSection({ application }: { application: TrackingApplication }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader>
        <CardTitle>Data pemohon</CardTitle>
        <CardDescription>Hanya terlihat oleh akun pemilik pengajuan yang sedang login.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <UserRound className="size-4" aria-hidden="true" />
            <span className="text-xs font-medium">Nama pemohon</span>
          </div>
          <p className="mt-2 text-sm font-semibold">{application.applicantName}</p>
        </div>
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4" aria-hidden="true" />
            <span className="text-xs font-medium">Kontak notifikasi</span>
          </div>
          <p className="mt-2 break-all text-sm font-semibold">{application.contactEmail}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function NoticeSection() {
  return (
    <Card className="rounded-xl border-blue-200 bg-blue-50 shadow-sm dark:border-blue-900 dark:bg-blue-950/30">
      <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
            <ShieldCheck className="size-4" aria-hidden="true" />
            <p className="text-sm font-semibold">Keamanan dan tindak lanjut</p>
          </div>
          <p className="text-sm leading-6 text-blue-900 dark:text-blue-100">
            Jangan kirim NIK, kata sandi, atau dokumen sensitif lewat pesan biasa. Gunakan kanal resmi instansi bila diminta melengkapi berkas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href="/citizen/service">
              <CalendarClock className="size-4" aria-hidden="true" />
              Lihat semua pengajuan
            </Link>
          </Button>
          <Button variant="outline" disabled>
            <MessageCircle className="size-4" aria-hidden="true" />
            Hubungi instansi (belum tersedia)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function CitizenSubmissionDetailPage({ params }: PageProps) {
  const session = await requireAuth();
  const { id } = await params;
  const application = await getCitizenApplicationDetail(id, session.tenantId, session.userId);

  return (
    <div className="pb-12">
      <DetailHero application={application} />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <OverviewCards application={application} />
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <ProgressSection application={application} />
            <TimelineSection application={application} />
          </div>
          <div className="space-y-6">
            <ApplicantSection application={application} />
            <NoticeSection />
          </div>
        </div>
      </div>
    </div>
  );
}
