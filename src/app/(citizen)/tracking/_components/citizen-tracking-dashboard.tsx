'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleCheck,
  Clock3,
  FileCheck2,
  FileText,
  Info,
  MessageCircle,
  Search,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { SourceBadge } from '@/components/source-badges/source-badge';
import { ServiceSpaceNavigation } from '@/components/service-space-navigation';
import { cn } from '@/lib/utils';
import {
  TRACKING_APPLICATIONS,
  TRACKING_NUMBER_PATTERN,
  type TrackingApplication,
  type TrackingCategory,
  type TrackingStatus,
} from './tracking-data';
import { formatDateTimeWib, getDaysUntilDeadline } from './tracking-format';

type StatusFilter = 'Semua status' | TrackingStatus;
type CategoryFilter = 'Semua kategori' | TrackingCategory;
type SortOrder = 'Terbaru' | 'Terlama';
type DialogName = 'upload' | 'contact' | null;

const CATEGORY_OPTIONS = [
  { value: 'Semua kategori', label: 'Semua kategori' },
  { value: 'Pengaduan', label: 'Pengaduan' },
  { value: 'Perizinan', label: 'Perizinan' },
  { value: 'Bantuan sosial', label: 'Bantuan sosial' },
] as const;

const STATUS_OPTIONS = [
  { value: 'Semua status', label: 'Semua status' },
  { value: 'Sedang diproses', label: 'Sedang diproses' },
  { value: 'Perlu dokumen', label: 'Perlu dokumen' },
  { value: 'Diverifikasi', label: 'Diverifikasi' },
  { value: 'Selesai', label: 'Selesai' },
] as const;

const SORT_OPTIONS = [
  { value: 'Terbaru', label: 'Terbaru' },
  { value: 'Terlama', label: 'Terlama' },
] as const;

const ACTION_REQUIRED_APPLICATION = TRACKING_APPLICATIONS.find(
  (application) => application.status === 'Perlu dokumen',
);

function getStatusStyle(status: TrackingStatus): string {
  switch (status) {
    case 'Sedang diproses':
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300';
    case 'Perlu dokumen':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300';
    case 'Diverifikasi':
      return 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/50 dark:text-sky-300';
    case 'Selesai':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300';
  }
}

function StatusBadge({ status }: { status: TrackingStatus }) {
  const StatusIcon =
    status === 'Selesai'
      ? CircleCheck
      : status === 'Perlu dokumen'
        ? FileText
        : status === 'Diverifikasi'
          ? ShieldCheck
          : Clock3;

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        getStatusStyle(status),
      )}
    >
      <StatusIcon className="size-3.5" aria-hidden="true" />
      {status}
    </span>
  );
}

function SummaryCards() {
  const inProgressCount = TRACKING_APPLICATIONS.filter(
    (application) =>
      application.status === 'Sedang diproses' || application.status === 'Diverifikasi',
  ).length;
  const needsActionCount = TRACKING_APPLICATIONS.filter(
    (application) => application.status === 'Perlu dokumen',
  ).length;
  const completedCount = TRACKING_APPLICATIONS.filter(
    (application) => application.status === 'Selesai',
  ).length;
  const summaries = [
    {
      label: 'Total pengajuan',
      value: TRACKING_APPLICATIONS.length,
      description: 'Seluruh layanan Anda',
      Icon: FileText,
      color: 'text-blue-700 dark:text-blue-300',
    },
    {
      label: 'Sedang diproses',
      value: inProgressCount,
      description: 'Ditangani oleh instansi',
      Icon: Clock3,
      color: 'text-sky-700 dark:text-sky-300',
    },
    {
      label: 'Perlu tindakan',
      value: needsActionCount,
      description: 'Lengkapi dokumen izin',
      Icon: AlertCircle,
      color: 'text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Selesai',
      value: completedCount,
      description: 'Lihat hasil tindak lanjut',
      Icon: CheckCircle2,
      color: 'text-emerald-700 dark:text-emerald-300',
    },
  ];

  return (
    <section aria-labelledby="summary-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="summary-heading" className="text-lg font-semibold tracking-tight">
          Ringkasan pengajuan Anda
        </h2>
        <SourceBadge source="SIMULATED" label="Data simulasi" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {summaries.map(({ label, value, description, Icon, color }) => (
          <Card key={label} className="gap-3 rounded-xl p-4 shadow-sm">
            <CardContent className="space-y-2 p-0">
              <div className="flex items-center justify-between gap-2">
                <Icon className={cn('size-4', color)} aria-hidden="true" />
                <SourceBadge
                  source="SIMULATED"
                  label="Simulasi"
                  withIcon={false}
                  className="px-1.5 py-0.5 text-[10px]"
                />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none tracking-tight">{value}</p>
                <p className="mt-1 text-sm font-semibold">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function getDeadlineCopy(daysRemaining: number): string {
  if (daysRemaining < 0) return `Terlambat ${Math.abs(daysRemaining)} hari`;
  if (daysRemaining === 0) return 'Batas waktu hari ini';
  return `${daysRemaining} hari lagi`;
}

function useDeadlineDays(deadline: string | undefined): number | null {
  const [daysRemaining, setDaysRemaining] = React.useState<number | null>(null);

  React.useEffect(() => {
    setDaysRemaining(deadline ? getDaysUntilDeadline(deadline) : null);
  }, [deadline]);

  return daysRemaining;
}

function ApplicationList({
  applications,
  selectedId,
  onSelect,
  category,
  onCategoryChange,
  status,
  onStatusChange,
  sortOrder,
  onSortOrderChange,
  trackingNumber,
  onTrackingNumberChange,
  onTrackingSearch,
  searchError,
  searchMessage,
}: {
  applications: readonly TrackingApplication[];
  selectedId: string;
  onSelect: (application: TrackingApplication) => void;
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
  trackingNumber: string;
  onTrackingNumberChange: (value: string) => void;
  onTrackingSearch: (event: React.FormEvent<HTMLFormElement>) => void;
  searchError: string;
  searchMessage: string;
}) {
  return (
    <Card className="gap-0 overflow-hidden rounded-xl shadow-sm">
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Pengajuan saya</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              4 pengajuan · 3 kategori layanan · data contoh milik akun Anda
            </p>
          </div>
          <SourceBadge source="SIMULATED" label="Data simulasi" />
        </div>

        <form onSubmit={onTrackingSearch} noValidate className="space-y-2">
          <label htmlFor="tracking-number" className="block text-xs font-medium">
            Cari nomor pelacakan
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="tracking-number"
                name="trackingNumber"
                value={trackingNumber}
                onChange={(event) => onTrackingNumberChange(event.target.value)}
                placeholder="Contoh: PGD-261012-00128"
                aria-invalid={Boolean(searchError)}
                aria-describedby={searchError ? 'tracking-error' : 'tracking-hint'}
                className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" className="h-10 shrink-0 bg-blue-700 text-white hover:bg-blue-800">
              <Search className="size-4" aria-hidden="true" />
              Lacak layanan
            </Button>
          </div>
          {searchError ? (
            <p id="tracking-error" role="alert" className="text-xs text-destructive">
              {searchError}
            </p>
          ) : (
            <p id="tracking-hint" className="text-xs text-muted-foreground">
              Format: 2–3 huruf, 6 angka, lalu 5 angka.
            </p>
          )}
          {searchMessage ? (
            <p role="status" className="text-xs text-blue-700 dark:text-blue-300">
              {searchMessage}
            </p>
          ) : null}
        </form>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs font-medium">
            Kategori layanan
            <Select
              aria-label="Kategori layanan"
              value={category}
              onChange={(event) => onCategoryChange(event.target.value as CategoryFilter)}
              options={CATEGORY_OPTIONS}
              className="h-10 text-sm"
            />
          </label>
          <label className="space-y-1.5 text-xs font-medium">
            Status pengajuan
            <Select
              aria-label="Status pengajuan"
              value={status}
              onChange={(event) => onStatusChange(event.target.value as StatusFilter)}
              options={STATUS_OPTIONS}
              className="h-10 text-sm"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <p aria-live="polite" className="text-muted-foreground">
            {applications.length} pengajuan ditampilkan
          </p>
          <label className="flex items-center gap-2 font-medium">
            <ArrowDownWideNarrow className="size-3.5 text-muted-foreground" aria-hidden="true" />
            Urutkan
            <Select
              aria-label="Urutkan pengajuan"
              value={sortOrder}
              onChange={(event) => onSortOrderChange(event.target.value as SortOrder)}
              options={SORT_OPTIONS}
              className="h-8 w-32 text-xs"
            />
          </label>
        </div>
      </div>

      {applications.length ? (
        <div className="overflow-x-auto border-t border-border">
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <caption className="sr-only">Daftar pengajuan layanan warga</caption>
            <thead className="bg-muted/50 text-[11px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Layanan / nomor pelacakan
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Status
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Target
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((application) => (
                <tr
                  key={application.id}
                  onClick={() => onSelect(application)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect(application);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`Pilih pengajuan ${application.serviceName}, ${application.trackingNumber}`}
                  className={cn(
                    'cursor-pointer align-top transition-colors hover:bg-blue-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-600 dark:hover:bg-blue-950/30',
                    selectedId === application.id && 'bg-blue-50 dark:bg-blue-950/40',
                  )}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{application.serviceName}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                      {application.trackingNumber}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{application.category}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={application.status} />
                    <p className="mt-1.5 text-xs text-blue-700 dark:text-blue-300">
                      Lihat detail <ChevronRightIcon />
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDateTimeWib(application.targetAt).split(' pukul ')[0]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border-t border-border px-5 py-10 text-center">
          <Info className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
          <p className="mt-2 font-medium">Tidak ada pengajuan yang cocok</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ubah kategori atau status untuk melihat pengajuan lainnya.
          </p>
        </div>
      )}
    </Card>
  );
}

function ChevronRightIcon() {
  return <ArrowRight className="inline size-3" aria-hidden="true" />;
}

function ApplicationDetails({
  application,
  onContact,
}: {
  application: TrackingApplication;
  onContact: () => void;
}) {
  const steps = ['Diterima', 'Verifikasi', 'Diproses', 'Selesai'];
  const timelineHeadingId = React.useId();
  const deadlineDaysRemaining = useDeadlineDays(application.deadlineAt);

  return (
    <Card
      aria-label="Detail Pengajuan Terpilih"
      className="gap-0 rounded-xl border-blue-300 shadow-sm dark:border-blue-900"
    >
      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
            Detail pengajuan terpilih
          </p>
          <SourceBadge source="SIMULATED" label="Data simulasi" />
        </div>

        <div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {application.category}
          </p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">
            {application.serviceName}
          </h2>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {application.trackingNumber}
          </p>
        </div>

        <section
          aria-label={`Progres ${application.progressLabel}, tahap ${application.currentStep} dari 4`}
          className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/40"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StatusBadge status={application.status} />
            <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
              Tahap {application.currentStep} dari 4
            </span>
          </div>
          <ol className="mt-4 grid grid-cols-4 gap-2" aria-label="Tahapan layanan">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const completed = stepNumber < application.currentStep;
              const current = stepNumber === application.currentStep;
              return (
                <li key={step} className="space-y-1.5">
                  <span
                    className={cn(
                      'block h-1 rounded-full',
                      completed || current
                        ? 'bg-blue-700 dark:bg-blue-300'
                        : 'bg-blue-200 dark:bg-blue-900',
                    )}
                  />
                  <span
                    className={cn(
                      'block text-[10px]',
                      current ? 'font-semibold text-blue-800 dark:text-blue-200' : 'text-muted-foreground',
                    )}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs leading-5 text-muted-foreground">
            {application.progressDescription}
          </p>
        </section>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
          <div>
            <dt className="text-muted-foreground">Instansi penanggung jawab</dt>
            <dd className="mt-1 font-medium">{application.agency}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tanggal pengajuan</dt>
            <dd className="mt-1 font-medium">{formatDateTimeWib(application.submittedAt)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tim yang ditugaskan</dt>
            <dd className="mt-1 font-medium">{application.team}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Target penyelesaian</dt>
            <dd className="mt-1 font-medium">{formatDateTimeWib(application.targetAt)}</dd>
          </div>
        </dl>

        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Target mengikuti standar layanan instansi. Perubahan jadwal dicatat dalam riwayat.
        </p>

        {application.status === 'Perlu dokumen' ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/40">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              Lengkapi dokumen yang diminta
            </p>
            <p className="mt-1 text-amber-800 dark:text-amber-300">
              Batas waktu {formatDateTimeWib(application.deadlineAt ?? application.targetAt)} ·{' '}
              {deadlineDaysRemaining === null
                ? 'Menghitung sisa waktu…'
                : getDeadlineCopy(deadlineDaysRemaining)}
            </p>
          </div>
        ) : null}

        <section aria-labelledby={timelineHeadingId} className="border-t border-border pt-4">
          <h3 id={timelineHeadingId} className="text-base font-semibold">
            Riwayat progres
          </h3>
          <ol className="mt-3 space-y-0">
            {application.timeline.map((item, index) => (
              <li key={`${item.title}-${item.occurredAt}`} className="relative flex gap-3 pb-4 last:pb-0">
                {index < application.timeline.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[9px] top-5 h-[calc(100%-0.5rem)] w-px bg-border"
                  />
                ) : null}
                <span
                  className={cn(
                    'relative z-10 mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full',
                    item.completed
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-blue-700 text-white dark:bg-blue-400 dark:text-blue-950',
                  )}
                >
                  {item.completed ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : (
                    <Clock3 className="size-3" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground">
                    {formatDateTimeWib(item.occurredAt)}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="border-t border-border pt-4">
          <Button
            onClick={onContact}
            className="h-10 w-full bg-blue-700 text-white hover:bg-blue-800"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Hubungi instansi
          </Button>
          <p className="mt-2 text-center text-[11px] leading-5 text-muted-foreground">
            Estimasi respons {application.responseEstimate}. Hindari mengirim nomor identitas atau
            dokumen pribadi melalui pesan.
          </p>
        </div>
      </div>
    </Card>
  );
}

function EducationSection() {
  const tips = [
    {
      title: 'Pahami status layanan',
      description:
        'Diterima: tercatat. Diverifikasi: diperiksa. Diproses: ditindaklanjuti. Selesai: hasil tersedia.',
      Icon: FileCheck2,
    },
    {
      title: 'Ajukan, lalu pantau',
      description:
        'Simpan nomor pelacakan. Izin dan bantuan sosial ditinjau sesuai persyaratan; tidak otomatis disetujui.',
      Icon: Clock3,
    },
    {
      title: 'Data Anda terlindungi',
      description:
        'Jangan bagikan NIK atau dokumen pribadi di pesan publik. Gunakan jalur dokumen yang aman.',
      Icon: ShieldCheck,
    },
  ];

  return (
    <section aria-labelledby="education-heading" className="space-y-4">
      <h2 id="education-heading" className="text-lg font-semibold tracking-tight">
        Layanan jelas, langkah lebih mudah
      </h2>
      <div className="grid gap-3 md:grid-cols-3">
        {tips.map(({ title, description, Icon }) => (
          <Card key={title} className="gap-3 rounded-xl border-transparent bg-sky-50 p-4 shadow-none dark:bg-sky-950/30">
            <CardContent className="space-y-2 p-0">
              <Icon className="size-4 text-blue-700 dark:text-blue-300" aria-hidden="true" />
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-xs leading-5 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function CitizenTrackingDashboard() {
  const [selectedId, setSelectedId] = React.useState(TRACKING_APPLICATIONS[0].id);
  const [category, setCategory] = React.useState<CategoryFilter>('Semua kategori');
  const [status, setStatus] = React.useState<StatusFilter>('Semua status');
  const [sortOrder, setSortOrder] = React.useState<SortOrder>('Terbaru');
  const [trackingNumber, setTrackingNumber] = React.useState('');
  const [searchError, setSearchError] = React.useState('');
  const [searchMessage, setSearchMessage] = React.useState('');
  const [isMobileDetailOpen, setIsMobileDetailOpen] = React.useState(false);
  const [activeDialog, setActiveDialog] = React.useState<DialogName>(null);
  const [uploadFile, setUploadFile] = React.useState<File | null>(null);
  const [uploadError, setUploadError] = React.useState('');
  const [contactMessage, setContactMessage] = React.useState('');
  const [interactionNotice, setInteractionNotice] = React.useState('');

  const selectedApplication =
    TRACKING_APPLICATIONS.find((application) => application.id === selectedId) ??
    TRACKING_APPLICATIONS[0];
  const alertDeadlineDaysRemaining = useDeadlineDays(
    ACTION_REQUIRED_APPLICATION?.deadlineAt,
  );

  const filteredApplications = React.useMemo(() => {
    const filtered = TRACKING_APPLICATIONS.filter((application) => {
      const matchesCategory = category === 'Semua kategori' || application.category === category;
      const matchesStatus = status === 'Semua status' || application.status === status;
      return matchesCategory && matchesStatus;
    });
    return filtered.sort((first, second) => {
      const difference =
        new Date(second.submittedAt).getTime() - new Date(first.submittedAt).getTime();
      return sortOrder === 'Terbaru' ? difference : -difference;
    });
  }, [category, sortOrder, status]);

  function selectApplication(application: TrackingApplication) {
    setSelectedId(application.id);
    setInteractionNotice('');
    setIsMobileDetailOpen(true);
  }

  function handleTrackingSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedTrackingNumber = trackingNumber.trim().toUpperCase();
    setSearchMessage('');

    if (!TRACKING_NUMBER_PATTERN.test(normalizedTrackingNumber)) {
      setSearchError('Format nomor tidak sesuai. Gunakan contoh PGD-261012-00128.');
      return;
    }

    const match = TRACKING_APPLICATIONS.find(
      (application) => application.trackingNumber === normalizedTrackingNumber,
    );
    setSearchError('');
    if (!match) {
      setSearchMessage('Nomor pelacakan tidak ditemukan pada data simulasi akun ini.');
      return;
    }

    setCategory('Semua kategori');
    setStatus('Semua status');
    setSelectedId(match.id);
    setSearchMessage(`Pengajuan ${match.trackingNumber} ditemukan.`);
    setIsMobileDetailOpen(true);
  }

  function openUploadDialog(application: TrackingApplication) {
    setSelectedId(application.id);
    setUploadFile(null);
    setUploadError('');
    setInteractionNotice('');
    setActiveDialog('upload');
  }

  function handleUploadChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setUploadError('');
    if (!file) {
      setUploadFile(null);
      return;
    }
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setUploadFile(null);
      setUploadError('Pilih dokumen PDF, JPG, atau PNG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadFile(null);
      setUploadError('Ukuran dokumen maksimal 10 MB.');
      return;
    }
    setUploadFile(file);
  }

  function handleUploadSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!uploadFile) {
      setUploadError('Pilih dokumen terlebih dahulu.');
      return;
    }
    setActiveDialog(null);
    setUploadFile(null);
    setInteractionNotice(
      'Dokumen dipilih untuk simulasi. Berkas belum dikirim atau disimpan karena layanan unggah belum terhubung.',
    );
  }

  function handleContactSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contactMessage.trim()) return;
    setActiveDialog(null);
    setContactMessage('');
    setInteractionNotice(
      'Pesan simulasi tidak dikirim ke instansi. Integrasi pesan aman belum tersedia.',
    );
  }

  return (
    <div className="pb-12">
      <section className="border-b border-border bg-sky-50 dark:bg-sky-950/30">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            Beranda &gt; Layanan Publik &gt; Pelacakan
          </nav>
          <div className="mt-3 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ruang Warga
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Pantau pengaduan, perizinan, dan bantuan sosial. Setiap langkahnya lebih jelas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <SourceBadge source="SIMULATED" label="Contoh data warga" />
              <Button asChild>
                <Link href="/citizen/apply">
                  Ajukan layanan <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
          <ServiceSpaceNavigation
            activeSpace="citizen"
            statisticsHref="/tracking/stat"
          />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <SummaryCards />

        <section aria-label="Daftar dan detail pengajuan" className="space-y-4">
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(350px,0.95fr)]">
            <ApplicationList
              applications={filteredApplications}
              selectedId={selectedId}
              onSelect={selectApplication}
              category={category}
              onCategoryChange={setCategory}
              status={status}
              onStatusChange={setStatus}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
              trackingNumber={trackingNumber}
              onTrackingNumberChange={setTrackingNumber}
              onTrackingSearch={handleTrackingSearch}
              searchError={searchError}
              searchMessage={searchMessage}
            />
            <aside className="hidden lg:block">
              <ApplicationDetails
                application={selectedApplication}
                onContact={() => {
                  setContactMessage('');
                  setInteractionNotice('');
                  setActiveDialog('contact');
                }}
              />
            </aside>
          </div>

          {ACTION_REQUIRED_APPLICATION ? (
            <Card className="gap-0 rounded-xl border-amber-200 bg-amber-50 shadow-none dark:border-amber-900 dark:bg-amber-950/30">
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                    <AlertCircle className="size-4" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="font-semibold">Satu pengajuan perlu Anda lengkapi</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ACTION_REQUIRED_APPLICATION.trackingNumber} · Bukti alamat usaha diminta.
                      Batas pengiriman{' '}
                      {formatDateTimeWib(
                        ACTION_REQUIRED_APPLICATION.deadlineAt ??
                          ACTION_REQUIRED_APPLICATION.targetAt,
                      )}
                      .
                    </p>
                    <p className="mt-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                      Tenggat{' '}
                      {alertDeadlineDaysRemaining === null
                        ? 'Menghitung sisa waktu…'
                        : getDeadlineCopy(alertDeadlineDaysRemaining)}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => openUploadDialog(ACTION_REQUIRED_APPLICATION)}
                  className="shrink-0 bg-amber-800 text-white hover:bg-amber-900 dark:bg-amber-700 dark:hover:bg-amber-600"
                >
                  Buka &amp; lengkapi dokumen
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </Card>
          ) : null}

          {interactionNotice ? (
            <p
              role="status"
              className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
            >
              {interactionNotice}
            </p>
          ) : null}
        </section>

        <EducationSection />

        <div className="flex flex-col gap-2 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Semua pengajuan, angka, dan instansi di halaman ini adalah ilustrasi untuk layanan.</p>
          <a
            href="#education-heading"
            className="inline-flex items-center gap-1 font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            Panduan pelacakan <ArrowRight className="size-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

      <Modal
        open={isMobileDetailOpen}
        onOpenChange={setIsMobileDetailOpen}
        title={selectedApplication.serviceName}
        contentClassName="inset-x-0 bottom-0 top-auto max-h-[92dvh] max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-t-2xl p-4 sm:left-1/2 sm:top-1/2 sm:bottom-auto sm:max-h-[85dvh] sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg sm:p-6 lg:hidden"
      >
        <div className="pb-1">
          <ApplicationDetails
            application={selectedApplication}
            onContact={() => {
              setIsMobileDetailOpen(false);
              setContactMessage('');
              setActiveDialog('contact');
            }}
          />
        </div>
      </Modal>

      <Modal
        open={activeDialog === 'upload'}
        onOpenChange={(open) => {
          setActiveDialog(open ? 'upload' : null);
          if (!open) {
            setUploadFile(null);
            setUploadError('');
          }
        }}
        title="Lengkapi dokumen"
        description={`Permintaan untuk ${selectedApplication.trackingNumber} · ${selectedApplication.serviceName}`}
        footer={
          <Button
            form="upload-document-form"
            type="submit"
            disabled={!uploadFile}
            className="bg-blue-700 text-white hover:bg-blue-800"
          >
            <Upload className="size-4" aria-hidden="true" />
            Simpan pilihan (simulasi)
          </Button>
        }
      >
        <form id="upload-document-form" onSubmit={handleUploadSubmit} className="space-y-4">
          <p className="text-muted-foreground">
            Pilih bukti alamat dalam format PDF, JPG, atau PNG (maks. 10 MB). Berkas hanya dipilih
            di perangkat ini dan tidak akan dikirim.
          </p>
          <label className="block space-y-2 text-sm font-medium">
            Dokumen pendukung
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
              onChange={handleUploadChange}
              aria-describedby={uploadError ? 'upload-error' : 'upload-hint'}
              className="block w-full rounded-md border border-input bg-background p-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-2 file:text-xs"
            />
          </label>
          {uploadError ? (
            <p id="upload-error" role="alert" className="text-xs text-destructive">
              {uploadError}
            </p>
          ) : (
            <p id="upload-hint" className="text-xs text-muted-foreground">
              {uploadFile ? 'Dokumen dipilih untuk pratinjau lokal.' : 'Belum ada dokumen dipilih.'}
            </p>
          )}
          <p className="flex gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            Jangan pilih berkas yang berisi informasi yang tidak diminta. Integrasi unggah resmi
            belum tersedia.
          </p>
        </form>
      </Modal>

      <Modal
        open={activeDialog === 'contact'}
        onOpenChange={(open) => {
          setActiveDialog(open ? 'contact' : null);
          if (!open) setContactMessage('');
        }}
        title="Hubungi instansi"
        description={`${selectedApplication.agency} · Estimasi respons ${selectedApplication.responseEstimate}`}
        footer={
          <Button
            form="contact-agency-form"
            type="submit"
            disabled={!contactMessage.trim()}
            className="bg-blue-700 text-white hover:bg-blue-800"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Kirim pesan (simulasi)
          </Button>
        }
      >
        <form id="contact-agency-form" onSubmit={handleContactSubmit} className="space-y-3">
          <label htmlFor="agency-message" className="block font-medium">
            Pesan untuk instansi
          </label>
          <textarea
            id="agency-message"
            value={contactMessage}
            onChange={(event) => setContactMessage(event.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Tuliskan pertanyaan terkait pengajuan ini..."
            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs leading-5 text-muted-foreground">
            Jangan sertakan NIK, alamat lengkap, kata sandi, atau dokumen pribadi. Pesan tidak
            dikirim pada demo ini.
          </p>
        </form>
      </Modal>
    </div>
  );
}
