'use client';

import * as React from 'react';
import { CalendarClock, FileText, Mail, MessageCircle, ShieldCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type {
  TrackingApplication,
  TrackingEvidenceItem,
  TrackingStatus,
  TrackingTimelineItem,
} from '../_components/tracking-data';
import { formatDateTimeWib } from '../_components/tracking-format';

type SubmissionDetailClientProps = {
  initialApplication: TrackingApplication;
};

type DetailDialogName = 'accept-review' | 'request-revision' | null;

function getStatusTone(status: TrackingStatus) {
  switch (status) {
    case 'Menunggu Tinjauan Warga':
      return 'border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300';
    case 'Selesai (Ditutup)':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300';
    case 'Perlu dokumen':
      return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300';
    case 'Ditolak':
      return 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300';
  }
}

export function SubmissionDetailClient({ initialApplication }: SubmissionDetailClientProps) {
  const [application, setApplication] = React.useState(initialApplication);
  const [activeDialog, setActiveDialog] = React.useState<DetailDialogName>(null);
  const [interactionNotice, setInteractionNotice] = React.useState('');
  const [reviewRating, setReviewRating] = React.useState(5);
  const [reviewComment, setReviewComment] = React.useState('');
  const [revisionReason, setRevisionReason] = React.useState('');

  const statusTone = getStatusTone(application.status);
  const isReviewEligible = application.status === 'Menunggu Tinjauan Warga';

  function openAcceptReview() {
    if (!isReviewEligible) return;
    setReviewRating(5);
    setReviewComment('');
    setInteractionNotice('');
    setActiveDialog('accept-review');
  }

  function openRevisionRequest() {
    if (!isReviewEligible) return;
    setRevisionReason('');
    setInteractionNotice('');
    setActiveDialog('request-revision');
  }

  function handleAcceptReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isReviewEligible) return;

    const submittedAt = new Date().toISOString();
    const trimmedComment = reviewComment.trim();
    setApplication((current: TrackingApplication) => ({
      ...current,
      status: 'Selesai (Ditutup)',
      progressLabel: 'Selesai (Ditutup)',
      progressDescription: 'Resolusi telah diterima warga dan pengajuan ditutup.',
      citizenReviewState: 'accepted',
      citizenReviewResult: {
        action: 'accepted',
        rating: reviewRating,
        comment: trimmedComment || undefined,
        submittedAt,
      },
      timeline: [
        ...current.timeline,
        {
          title: 'Warga menerima resolusi',
          description: trimmedComment
            ? `Rating ${reviewRating}/5. Umpan balik: ${trimmedComment}`
            : `Rating ${reviewRating}/5 tanpa komentar tambahan.`,
          occurredAt: submittedAt,
          completed: true,
        },
      ],
    }));
    setActiveDialog(null);
    setReviewComment('');
    setInteractionNotice('Resolusi diterima. Pengajuan ditutup dan ringkasan umpan balik disimpan.');
  }

  function handleRevisionRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = revisionReason.trim();
    if (!isReviewEligible || !reason) return;

    const submittedAt = new Date().toISOString();
    setApplication((current: TrackingApplication) => ({
      ...current,
      citizenReviewState: 'revision_requested',
      citizenReviewResult: {
        action: 'revision_requested',
        reason,
        submittedAt,
      },
      timeline: [
        ...current.timeline,
        {
          title: 'Warga meminta revisi',
          description: `Alasan revisi: ${reason}`,
          occurredAt: submittedAt,
          completed: false,
        },
      ],
    }));
    setActiveDialog(null);
    setRevisionReason('');
    setInteractionNotice('Permintaan revisi dicatat pada timeline pengajuan.');
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{application.serviceName}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Instansi</p>
              <p className="text-sm">{application.agency}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Dikirim pada</p>
              <p className="text-sm">{formatDateTimeWib(application.submittedAt)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Kategori</p>
              <p className="text-sm">{application.category}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Status pengajuan</p>
              <p className="text-sm">{application.status}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permintaan Asli</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm leading-6 text-foreground">
              {application.originalRequest}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resolusi Instansi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-border p-4">
              <p className="text-sm leading-6">
                {application.resolutionDetails?.officialNote ?? 'Instansi belum mengirim catatan resmi.'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium text-muted-foreground">Petugas</p>
                <p className="mt-1 text-sm">{application.resolutionDetails?.officerName ?? 'Belum tersedia'}</p>
              </div>
              <div className="rounded-lg border border-border p-4">
                <p className="text-xs font-medium text-muted-foreground">Diselesaikan pada</p>
                <p className="mt-1 text-sm">
                  {application.resolutionDetails?.completedAt
                    ? formatDateTimeWib(application.resolutionDetails.completedAt)
                    : 'Belum tersedia'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bukti Tindak Lanjut</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {application.resolutionDetails?.evidence.length ? (
              application.resolutionDetails.evidence.map((evidence: TrackingEvidenceItem) => (
                <div key={evidence.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-4 text-muted-foreground" aria-hidden="true" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{evidence.title}</p>
                      <p className="text-xs text-muted-foreground">{evidence.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        Preview {evidence.fileType === 'pdf' ? 'PDF' : 'gambar'} · {evidence.safePreviewLabel}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                Belum ada bukti tindak lanjut yang dapat ditampilkan.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 bg-background/80 p-4 shadow-sm dark:border-blue-950/60">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Nomor pelacakan</p>
            <p className="font-mono text-sm">{application.trackingNumber}</p>
          </div>
          <Badge className={statusTone}>{application.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Pemohon</p>
              <p className="mt-1 text-sm">{application.applicantName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Kontak email</p>
              <p className="mt-1 text-sm">{application.contactEmail}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium text-muted-foreground">Pembaruan terakhir</p>
              <p className="mt-1 text-sm">{formatDateTimeWib(application.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Area Aksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {interactionNotice ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                {interactionNotice}
              </div>
            ) : null}
            <div className="rounded-lg border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
              {isReviewEligible
                ? 'Status saat ini memungkinkan Anda menerima resolusi atau meminta revisi.'
                : 'Aksi review hanya tersedia ketika status pengajuan adalah Menunggu Tinjauan Warga.'}
            </div>
            {application.citizenReviewState === 'eligible' ? (
              <div className="grid gap-3">
                <Button onClick={openAcceptReview}>
                  <Star className="size-4" aria-hidden="true" />
                  Terima & Beri Umpan Balik
                </Button>
                <Button variant="outline" onClick={openRevisionRequest}>
                  <MessageCircle className="size-4" aria-hidden="true" />
                  Tolak & Minta Revisi
                </Button>
              </div>
            ) : null}
            {application.citizenReviewState === 'accepted' && application.citizenReviewResult ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                <p className="font-semibold">Selesai (Ditutup)</p>
                <p className="mt-1">Warga menerima resolusi dan menutup pengajuan.</p>
                <p className="mt-1">
                  Rating: {application.citizenReviewResult.rating ?? '-'} / 5
                  {application.citizenReviewResult.comment
                    ? ` · Umpan balik: ${application.citizenReviewResult.comment}`
                    : ' · Tanpa komentar tambahan.'}
                </p>
                <p className="mt-2 text-[11px] leading-5">
                  Aksi tolak dinonaktifkan permanen setelah resolusi diterima.
                </p>
              </div>
            ) : null}
            {application.citizenReviewState === 'revision_requested' && application.citizenReviewResult ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <p className="font-semibold">Revisi telah diminta</p>
                <p className="mt-1">Alasan warga: {application.citizenReviewResult.reason}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              {application.timeline.map((item: TrackingTimelineItem) => (
                <li key={`${item.title}-${item.occurredAt}`} className="flex gap-3">
                  <ShieldCheck
                    className={`mt-0.5 size-4 ${item.completed ? 'text-emerald-600' : 'text-blue-600 dark:text-blue-300'}`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeWib(item.occurredAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Keamanan Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3 rounded-lg border border-border p-4">
              <ShieldCheck className="mt-0.5 size-4 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              <p>Detail ini hanya dimuat bila tenant, pemilik akun, dan ID pengajuan cocok.</p>
            </div>
            <div className="flex gap-3 rounded-lg border border-border p-4">
              <Mail className="mt-0.5 size-4 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              <p>Kontak pribadi tetap terbatas pada pengajuan milik Anda sendiri.</p>
            </div>
            <div className="flex gap-3 rounded-lg border border-border p-4">
              <CalendarClock className="mt-0.5 size-4 text-blue-600 dark:text-blue-300" aria-hidden="true" />
              <p>Pratinjau bukti tindak lanjut hanya ditampilkan sebagai label aman, bukan URL publik.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Modal
        open={activeDialog === 'accept-review'}
        onOpenChange={(open) => setActiveDialog(open ? 'accept-review' : null)}
        title="Terima & Beri Umpan Balik"
        description="Rating 1–5 wajib diisi. Komentar opsional dan jangan sertakan data sensitif."
        footer={
          <Button form="accept-review-form" type="submit">
            Simpan penerimaan
          </Button>
        }
        modal={false}
      >
        <form id="accept-review-form" onSubmit={handleAcceptReview} className="space-y-4">
          <label className="block text-sm font-medium" htmlFor="review-rating">
            Rating layanan
          </label>
          <Select
            aria-label="Rating layanan"
            value={String(reviewRating)}
            onChange={(event) => setReviewRating(Number(event.target.value))}
            options={[
              { value: '1', label: '1 - Sangat buruk' },
              { value: '2', label: '2 - Buruk' },
              { value: '3', label: '3 - Cukup' },
              { value: '4', label: '4 - Baik' },
              { value: '5', label: '5 - Sangat baik' },
            ]}
            className="h-10"
          />
          <label className="block text-sm font-medium" htmlFor="review-comment">
            Komentar (opsional)
          </label>
          <Textarea
            id="review-comment"
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            placeholder="Tuliskan umpan balik Anda tanpa data pribadi sensitif."
            rows={4}
            maxLength={500}
          />
        </form>
      </Modal>

      <Modal
        open={activeDialog === 'request-revision'}
        onOpenChange={(open) => setActiveDialog(open ? 'request-revision' : null)}
        title="Tolak & Minta Revisi"
        description="Alasan revisi wajib diisi agar instansi tahu tindak lanjut yang dibutuhkan."
        footer={
          <Button
            form="request-revision-form"
            type="submit"
            variant="outline"
            disabled={!revisionReason.trim()}
          >
            Kirim permintaan revisi
          </Button>
        }
        modal={false}
      >
        <form id="request-revision-form" onSubmit={handleRevisionRequest} className="space-y-3">
          <label className="block text-sm font-medium" htmlFor="revision-reason">
            Alasan revisi
          </label>
          <Textarea
            id="revision-reason"
            value={revisionReason}
            onChange={(event) => setRevisionReason(event.target.value)}
            placeholder="Jelaskan bagian resolusi yang masih perlu diperbaiki."
            rows={4}
            required
            maxLength={500}
          />
        </form>
      </Modal>
    </div>
  );
}
