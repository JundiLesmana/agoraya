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
  readonly backHref?: string;
  readonly title?: string;
  readonly decisionSubject?: string;
  readonly citizenProfile?: {
    readonly phone: string | null;
    readonly address: string | null;
    readonly ktpAttachmentUrl: string | null;
    readonly selfieAttachmentUrl: string | null;
  };
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

export function KycReviewDetailClient({
  initialDetail,
  backHref = "/admin",
  title = "Detail review KYC ASN",
  decisionSubject = "KYC ASN",
  citizenProfile,
}: KycReviewDetailClientProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const modalDescription = useMemo(() => {
    if (selectedDecision === "approved") {
      return `Persetujuan akan mengisi slot review berikutnya dan memperbarui status ${decisionSubject} bila memenuhi syarat dual approval.`;
    }

    if (selectedDecision === "rejected") {
      return `Penolakan akan menghentikan proses review ${decisionSubject} ini. Isi alasan agar petugas lain memahami keputusan ini.`;
    }

    return undefined;
  }, [decisionSubject, selectedDecision]);

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
            href={backHref}
            className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {citizenProfile ? "Kembali ke daftar KYC warga" : "Kembali ke panel admin"}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {title}
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
            <CardTitle>{citizenProfile ? "Informasi akun warga" : "Informasi ASN"}</CardTitle>
            <CardDescription>
              {citizenProfile
                ? "Data pendaftar yang tersimpan saat registrasi."
                : "Data akun dan profil ASN yang sedang direview."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DetailItem label="Nama" value={detail.subject.name} />
            <DetailItem label="Email" value={detail.subject.email} />
            <DetailItem label="NIK" value={detail.subject.nik ?? "-"} mono />
            <DetailItem label="Status akun" value={detail.subject.userStatus} />
            {citizenProfile ? (
              <>
                <DetailItem label="Nomor telepon" value={citizenProfile.phone ?? "-"} />
                <DetailItem label="Alamat" value={citizenProfile.address ?? "-"} />
              </>
            ) : (
              <>
                <DetailItem label="NIP" value={detail.subject.nip ?? "-"} mono />
                <DetailItem label="OPD" value={detail.subject.opdName ?? "-"} />
                <DetailItem label="Unit" value={detail.subject.unitName ?? "-"} />
                <DetailItem label="Jabatan" value={detail.subject.positionName ?? "-"} />
              </>
            )}
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

      {detail.asnRegistration ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Data pendaftaran ASN</CardTitle>
              <CardDescription>
                Informasi identitas, kepegawaian, dan instansi yang dikirim saat
                pendaftaran.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Tempat lahir" value={detail.asnRegistration.birthPlace} />
              <DetailItem label="Tanggal lahir" value={detail.asnRegistration.birthDate} />
              <DetailItem label="Nomor telepon" value={detail.asnRegistration.phone} />
              <DetailItem label="Status kepegawaian" value={detail.asnRegistration.employmentStatus} />
              <DetailItem label="Nomor induk" value={detail.asnRegistration.employeeNumber} mono />
              <DetailItem label="Pangkat/golongan" value={detail.asnRegistration.rankGrade} />
              <DetailItem label="Tanggal pengangkatan" value={detail.asnRegistration.appointmentDate ?? "-"} />
              <DetailItem label="Jenis instansi" value={detail.asnRegistration.agencyType} />
              <DetailItem label="Bidang" value={detail.asnRegistration.field} />
              <DetailItem label="Wilayah tugas" value={[detail.asnRegistration.regencyTask, detail.asnRegistration.provinceTask].filter(Boolean).join(", ") || "-"} />
              <DetailItem label="Alamat kantor" value={detail.asnRegistration.officeAddress} />
              <DetailItem label="Email kantor" value={detail.asnRegistration.officialEmail ?? "-"} />
              <DetailItem label="Telepon kantor" value={detail.asnRegistration.officePhone ?? "-"} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alamat pendaftar</CardTitle>
              <CardDescription>
                Alamat sesuai KTP dan alamat domisili yang disampaikan pemohon.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <AddressDetails
                title="Alamat sesuai KTP"
                address={detail.asnRegistration.ktpAddress}
                rt={detail.asnRegistration.ktpRt}
                rw={detail.asnRegistration.ktpRw}
                village={detail.asnRegistration.ktpVillage}
                district={detail.asnRegistration.ktpDistrict}
                regency={detail.asnRegistration.ktpRegency}
                province={detail.asnRegistration.ktpProvince}
                postalCode={detail.asnRegistration.ktpPostalCode}
              />
              <AddressDetails
                title={`Alamat domisili${detail.asnRegistration.domicileSameAsKtp ? " (sama dengan KTP)" : ""}`}
                address={detail.asnRegistration.domicileAddress}
                rt={detail.asnRegistration.domicileRt}
                rw={detail.asnRegistration.domicileRw}
                village={detail.asnRegistration.domicileVillage}
                district={detail.asnRegistration.domicileDistrict}
                regency={detail.asnRegistration.domicileRegency}
                province={detail.asnRegistration.domicileProvince}
                postalCode={detail.asnRegistration.domicilePostalCode}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dokumen pendaftaran</CardTitle>
              <CardDescription>
                Berkas yang diunggah bersama pengajuan ASN.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {detail.asnRegistration.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Dokumen pengajuan lama belum tersimpan pada sistem.
                </p>
              ) : (
                detail.asnRegistration.attachments.map((attachment) => (
                  <DocumentLink
                    key={attachment.type}
                    label={getAttachmentLabel(attachment.type)}
                    fileName={attachment.fileName}
                    href={attachment.url}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      {citizenProfile ? (
        <Card>
          <CardHeader>
            <CardTitle>Dokumen pendaftaran</CardTitle>
            <CardDescription>
              Berkas yang diunggah pemohon saat mendaftar.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DocumentLink label="Foto KTP" href={citizenProfile.ktpAttachmentUrl} />
            <DocumentLink label="Foto selfie" href={citizenProfile.selfieAttachmentUrl} />
          </CardContent>
        </Card>
      ) : null}

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
        title={selectedDecision ? `${decisionLabelMap[selectedDecision]} ${decisionSubject}` : "Keputusan review KYC"}
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

function DocumentLink({
  label,
  href,
  fileName,
}: {
  label: string;
  href: string | null;
  fileName?: string;
}) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {href ? (
        <div className="space-y-1">
          {fileName ? (
            <p className="break-all text-xs text-muted-foreground">{fileName}</p>
          ) : null}
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary underline underline-offset-4"
          >
            Buka dokumen
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Dokumen belum tersedia.</p>
      )}
    </div>
  );
}

function AddressDetails({
  title,
  address,
  rt,
  rw,
  village,
  district,
  regency,
  province,
  postalCode,
}: {
  title: string;
  address: string;
  rt: string;
  rw: string;
  village: string;
  district: string;
  regency: string;
  province: string;
  postalCode: string;
}) {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <h3 className="font-semibold text-foreground">{title}</h3>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <DetailItem label="Alamat" value={address} />
        <DetailItem label="RT/RW" value={`${rt}/${rw}`} />
        <DetailItem label="Kelurahan" value={village} />
        <DetailItem label="Kecamatan" value={district} />
        <DetailItem label="Kabupaten/Kota" value={regency} />
        <DetailItem label="Provinsi" value={province} />
        <DetailItem label="Kode pos" value={postalCode} />
      </dl>
    </div>
  );
}

function getAttachmentLabel(type: string): string {
  switch (type) {
    case "ktp":
      return "Kartu Tanda Penduduk";
    case "appointment_letter":
      return "SK Pengangkatan";
    case "employee_id":
      return "Kartu pegawai / ID card";
    case "selfie":
      return "Foto diri";
    default:
      return "Dokumen pendaftaran";
  }
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