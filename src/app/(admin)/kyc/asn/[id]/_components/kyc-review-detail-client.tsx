"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import type { KycReviewDetail } from "@/modules/kyc/review-detail-service";

interface KycReviewDetailClientProps {
  readonly initialDetail: KycReviewDetail;
}

type Decision = "approved" | "rejected";

const statusVariantMap: Record<KycReviewDetail["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  partially_approved: "secondary",
  verified: "default",
  rejected: "destructive",
  expired: "outline",
};

const statusLabelMap: Record<KycReviewDetail["status"], string> = {
  pending: "Menunggu review",
  partially_approved: "Menunggu persetujuan kedua",
  verified: "Terverifikasi",
  rejected: "Ditolak",
  expired: "Kedaluwarsa",
};

const decisionLabelMap: Record<Decision, string> = {
  approved: "Setujui",
  rejected: "Tolak",
};

export function KycReviewDetailClient({ initialDetail }: KycReviewDetailClientProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalDescription = useMemo(() => {
    if (selectedDecision === "approved") {
      return "Persetujuan akan mengisi slot review berikutnya dan memperbarui status KYC ASN bila memenuhi syarat dual approval.";
    }

    if (selectedDecision === "rejected") {
      return "Penolakan akan menghentikan proses review KYC ASN ini. Isi alasan agar petugas lain memahami keputusan ini.";
    }

    return undefined;
  }, [selectedDecision]);

  async function submitDecision() {
    if (!selectedDecision) return;

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/v1/kyc/asn/${detail.rosterId}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: selectedDecision,
          reason: reason.trim() ? reason.trim() : undefined,
        }),
      });

      const payload = (await response.json()) as {
        readonly data?: KycReviewDetail;
        readonly message?: string;
        readonly error?: string;
      };

      if (!response.ok || !payload.data) {
        setErrorMessage(payload.message ?? payload.error ?? "Gagal menyimpan keputusan review KYC.");
        return;
      }

      setDetail(payload.data);
      setSelectedDecision(null);
      setReason("");
    } catch {
      setErrorMessage("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl space-y-6 px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Link
            href="/admin"
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Kembali ke panel admin
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Detail review KYC ASN
            </h1>
            <Badge variant={statusVariantMap[detail.status]}>{statusLabelMap[detail.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Roster ID: <span className="font-mono text-foreground">{detail.rosterId}</span>
          </p>
        </div>
        {detail.canReview ? (
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={() => setSelectedDecision("rejected")}>
              Tolak
            </Button>
            <Button onClick={() => setSelectedDecision("approved")}>
              Setujui
            </Button>
          </div>
        ) : null}
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Informasi ASN</CardTitle>
            <CardDescription>Data akun dan profil ASN yang sedang direview.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Nama" value={detail.subject.name} />
            <DetailItem label="Email" value={detail.subject.email} />
            <DetailItem label="NIK" value={detail.subject.nik ?? "-"} mono />
            <DetailItem label="NIP" value={detail.subject.nip ?? "-"} mono />
            <DetailItem label="Status akun" value={detail.subject.userStatus} />
            <DetailItem label="OPD" value={detail.subject.opdName ?? "-"} />
            <DetailItem label="Unit" value={detail.subject.unitName ?? "-"} />
            <DetailItem label="Jabatan" value={detail.subject.positionName ?? "-"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan review</CardTitle>
            <CardDescription>Status proses verifikasi saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <DetailItem label="Aksi berikutnya" value={getNextActionLabel(detail.nextAction)} />
            <DetailItem label="Diajukan pada" value={formatDateTime(detail.submittedAt)} />
            <DetailItem label="Diperbarui pada" value={formatDateTime(detail.updatedAt)} />
            <DetailItem label="Berlaku sampai" value={detail.expiresAt ? formatDateTime(detail.expiresAt) : "-"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat persetujuan</CardTitle>
          <CardDescription>Slot dual approval yang sudah terisi.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {detail.approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Belum ada keputusan review yang tercatat.</p>
          ) : (
            detail.approvals.map((approval) => (
              <div key={approval.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={approval.decision === "approved" ? "default" : "destructive"}>
                    {approval.decision === "approved" ? "Disetujui" : "Ditolak"}
                  </Badge>
                  <p className="text-sm font-medium text-foreground">Slot {approval.approvalSlot}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(approval.createdAt)}</p>
                </div>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Petugas</dt>
                    <dd className="font-medium text-foreground">{approval.approverName ?? approval.approverId ?? "-"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Alasan</dt>
                    <dd className="text-foreground">{approval.reason ?? "-"}</dd>
                  </div>
                </dl>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Modal
        open={selectedDecision !== null}
        onOpenChange={(open) => {
          if (!open && !submitting) {
            setSelectedDecision(null);
          }
        }}
        title={selectedDecision ? `${decisionLabelMap[selectedDecision]} KYC ASN` : "Keputusan review KYC"}
        description={modalDescription}
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setSelectedDecision(null)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              variant={selectedDecision === "rejected" ? "destructive" : "default"}
              onClick={submitDecision}
              loading={submitting}
            >
              {submitting ? "Menyimpan..." : selectedDecision ? decisionLabelMap[selectedDecision] : "Simpan"}
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="kyc-review-reason">Alasan review</Label>
          <Textarea
            id="kyc-review-reason"
            rows={5}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Tambahkan alasan review bila diperlukan"
            disabled={submitting}
          />
        </div>
      </Modal>
    </section>
  );
}

function DetailItem({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-sm text-foreground" : "text-sm font-medium text-foreground"}>{value}</p>
    </div>
  );
}

function getNextActionLabel(nextAction: KycReviewDetail["nextAction"]): string {
  if (nextAction === "first_approval") return "Menunggu persetujuan pertama";
  if (nextAction === "second_approval") return "Menunggu persetujuan kedua";
  return "Proses selesai";
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
