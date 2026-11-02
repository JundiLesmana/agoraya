"use client";

import Link from "next/link";
import { useState, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { WizardLayout, type WizardStep } from "@/components/wizard-layout";
import {
  EDUCATION_SERVICE_CATEGORY,
  type EducationServiceOption,
} from "../_components/education-service-data";

const WIZARD_STEPS: readonly WizardStep[] = [
  "pilih-layanan",
  "isi-detail",
  "lampiran",
  "tinjau-kirim",
];
type EducationApplicationDetails = {
  namaPemohon: string;
  kontakNotifikasi: string;
  kecamatan: string;
  kelurahan: string;
  judulPengajuan: string;
  namaSiswa: string;
  hubungan: string;
  namaSekolah: string;
  jenjang: string;
  kelas: string;
  detailKebutuhan: string;
};

const INITIAL_DETAILS: EducationApplicationDetails = {
  namaPemohon: "",
  kontakNotifikasi: "",
  kecamatan: "",
  kelurahan: "",
  judulPengajuan: "Usulan bantuan perlengkapan sekolah",
  namaSiswa: "",
  hubungan: "",
  namaSekolah: "",
  jenjang: "",
  kelas: "",
  detailKebutuhan: "",
};

const JENJANG_OPTIONS = [
  { value: "SD / MI", label: "SD / MI" },
  { value: "SMP / MTs", label: "SMP / MTs" },
  { value: "SMA / MA / SMK", label: "SMA / MA / SMK" },
  { value: "Perguruan Tinggi", label: "Perguruan Tinggi" },
  { value: "Lainnya", label: "Lainnya" },
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const KELAS_OPTIONS = [
  "Kelas I",
  "Kelas II",
  "Kelas III",
  "Kelas IV",
  "Kelas V",
  "Kelas VI",
  "Kelas VII",
  "Kelas VIII",
  "Kelas IX",
  "Kelas X",
  "Kelas XI",
  "Kelas XII",
];

const ADMINISTRATION_GRADE_OPTIONS = [
  "SD / Kelas I",
  "SD / Kelas II",
  "SD / Kelas III",
  "SD / Kelas IV",
  "SD / Kelas V",
  "SD / Kelas VI",
  "SMP / Kelas VII",
  "SMP / Kelas VIII",
  "SMP / Kelas IX",
  "SMA / Kelas X",
  "SMA / Kelas XI",
  "SMA / Kelas XII",
];

const CONSULTATION_GRADE_OPTIONS = [
  "SD / Kelas I",
  "SD / Kelas II",
  "SD / Kelas III",
  "SD / Kelas IV",
  "SD / Kelas V",
  "SD / Kelas VI",
  "SMP / Kelas VII",
  "SMP / Kelas VIII",
  "SMP / Kelas IX",
  "SMA / Kelas X",
  "SMA / Kelas XI",
  "SMA / Kelas XII",
];

function DetailForm({
  details,
  onChange,
  onGradeChange,
  service,
}: {
  details: EducationApplicationDetails;
  onChange: (key: keyof EducationApplicationDetails, value: string) => void;
  onGradeChange: (value: string) => void;
  service: EducationServiceOption | null;
}) {
  const isBantuanBiaya = service?.type === "BantuanBiaya";
  const isAdministrasiSiswa = service?.type === "AdministrasiSiswa";
  const isKonsultasiPendidikan = service?.type === "KonsultasiPendidikan";

  return (
    <section aria-labelledby="details-heading" className="space-y-5">
      <div>
        <h2 id="details-heading" className="text-xl font-semibold">
          Data pemohon
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Nama pemohon *</span>
          <Input
            value={details.namaPemohon}
            onChange={(event) => onChange("namaPemohon", event.target.value)}
            placeholder="Nama lengkap pemohon"
          />
          <span className="text-muted-foreground block text-xs">
            Mengikuti akun warga yang sedang masuk.
          </span>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Kontak notifikasi *</span>
          <Input
            type="email"
            value={details.kontakNotifikasi}
            onChange={(event) =>
              onChange("kontakNotifikasi", event.target.value)
            }
            placeholder="anda@email.id"
          />
          <span className="text-muted-foreground block text-xs">
            {isKonsultasiPendidikan
              ? "Digunakan untuk pembaruan status dan pesan tindak lanjut."
              : "Digunakan untuk pembaruan status."}
          </span>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Kecamatan domisili *</span>
          <select
            value={details.kecamatan}
            onChange={(event) => onChange("kecamatan", event.target.value)}
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">Pilih kecamatan</option>
            <option value="Kecamatan Melati">Kecamatan Melati</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Kelurahan / Desa *</span>
          <select
            value={details.kelurahan}
            onChange={(event) => onChange("kelurahan", event.target.value)}
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option value="">Pilih kelurahan / desa</option>
            <option value="Kelurahan Melati">Kelurahan Melati</option>
          </select>
        </label>
      </div>

      <div className="border-border border-t pt-5">
        <h2 className="text-lg font-semibold">
          {isAdministrasiSiswa
            ? "Data Siswa, Sekolah & Kebutuhan Administrasi"
            : isKonsultasiPendidikan
              ? "Data Siswa & Pertanyaan Konsultasi"
              : "Data siswa dan kebutuhan pendidikan"}
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium">Judul pengajuan *</span>
            <Input
              value={details.judulPengajuan}
              onChange={(event) =>
                onChange("judulPengajuan", event.target.value)
              }
            />
            <span className="text-muted-foreground block text-xs">
              {isAdministrasiSiswa
                ? "Tulis ringkasan kebutuhan administrasi yang diajukan."
                : isKonsultasiPendidikan
                  ? "Tulis ringkasan topik konsultasi yang ingin dibahas bersama konselor."
                  : "Tulis kebutuhan pendidikan yang ingin diajukan."}
            </span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Nama siswa *</span>
            <Input
              value={details.namaSiswa}
              onChange={(event) => onChange("namaSiswa", event.target.value)}
              placeholder="Nama lengkap siswa"
            />
            <span className="text-muted-foreground block text-xs">
              {isAdministrasiSiswa
                ? "Sesuai dokumen akta/kartu keluarga."
                : isKonsultasiPendidikan
                  ? "Sesuai dokumen akta, rapor, atau kartu keluarga."
                  : "Sesuai dokumen sekolah."}
            </span>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Hubungan pemohon dengan siswa *</span>
            <select
              value={details.hubungan}
              onChange={(event) => onChange("hubungan", event.target.value)}
              className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <option value="">Pilih hubungan</option>
              <option value="Orang tua / wali">Orang tua / wali</option>
              <option value="Siswa">Siswa</option>
              <option value="Keluarga">Keluarga</option>
            </select>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Nama sekolah *</span>
            <Input
              value={details.namaSekolah}
              onChange={(event) => onChange("namaSekolah", event.target.value)}
              placeholder={
                isAdministrasiSiswa
                  ? "Sekolah asal atau tujuan"
                  : "Nama sekolah siswa"
              }
            />
            {isAdministrasiSiswa || isKonsultasiPendidikan ? (
              <span className="text-muted-foreground block text-xs">
                {isAdministrasiSiswa
                  ? "Sekolah asal atau tujuan administrasi."
                  : "Sekolah asal atau tujuan konsultasi pendidikan."}
              </span>
            ) : null}
          </label>
          {isAdministrasiSiswa || isKonsultasiPendidikan ? (
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium">Jenjang / kelas *</span>
              <select
                value={
                  details.jenjang && details.kelas
                    ? `${details.jenjang} / ${details.kelas}`
                    : ""
                }
                onChange={(event) => onGradeChange(event.target.value)}
                className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                <option value="">Pilih jenjang / kelas</option>
                {(isAdministrasiSiswa
                  ? ADMINISTRATION_GRADE_OPTIONS
                  : CONSULTATION_GRADE_OPTIONS
                ).map((grade) => (
                  <option key={grade} value={grade}>
                    {grade}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Jenjang pendidikan *</span>
                <select
                  value={details.jenjang}
                  onChange={(event) => onChange("jenjang", event.target.value)}
                  className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  <option value="">Pilih jenjang</option>
                  {JENJANG_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">Kelas *</span>
                <select
                  value={details.kelas}
                  onChange={(event) => onChange("kelas", event.target.value)}
                  className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
                >
                  <option value="">Pilih kelas</option>
                  {KELAS_OPTIONS.map((kelas) => (
                    <option key={kelas} value={kelas}>
                      {kelas}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <label className="block space-y-1.5 text-sm sm:col-span-2">
            <span className="font-medium">
              {isBantuanBiaya
                ? "Ceritakan kebutuhan pendidikan *"
                : isKonsultasiPendidikan
                  ? "Ceritakan kebutuhan pendidikan *"
                  : "Ceritakan kebutuhan layanan pendidikan *"}
            </span>
            <Textarea
              value={details.detailKebutuhan}
              onChange={(event) =>
                onChange("detailKebutuhan", event.target.value)
              }
              rows={4}
              maxLength={1000}
              placeholder={
                isAdministrasiSiswa
                  ? "Jelaskan kebutuhan administrasi siswa, misalnya pengurusan surat rekomendasi mutasi dan dokumen pendukung."
                  : isKonsultasiPendidikan
                    ? "Ceritakan hal yang ingin ditanyakan, misalnya pilihan belajar, dokumen masuk sekolah, atau adaptasi belajar."
                    : "Jelaskan kebutuhan siswa dan bantuan yang diperlukan."
              }
            />
            {isKonsultasiPendidikan ? (
              <span
                aria-live="polite"
                className="text-muted-foreground block text-right text-xs"
              >
                {details.detailKebutuhan.length} / 1000 karakter
              </span>
            ) : null}
            <span className="text-muted-foreground block text-xs">
              {isAdministrasiSiswa
                ? "Jangan tuliskan NISN, NIK siswa, atau informasi sensitif perbankan di kolom uraian."
                : isKonsultasiPendidikan
                  ? "Jangan tuliskan NISN, NIK siswa, nomor rekening, atau informasi sensitif di kolom uraian terbuka."
                  : "Jangan tuliskan NIK, NIK siswa, atau informasi sensitif di kolom uraian."}
            </span>
          </label>
        </div>
        {isAdministrasiSiswa || isKonsultasiPendidikan ? (
          <div
            role="note"
            className="border-primary/20 bg-primary/5 text-foreground mt-5 flex gap-3 rounded-xl border p-4 text-sm"
          >
            <ShieldCheck
              className="text-primary mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <p>
              <strong>
                {isKonsultasiPendidikan
                  ? "Privasi Data & Integrasi:"
                  : "Perlindungan data:"}
              </strong>{" "}
              Data pribadi hanya digunakan oleh instansi terkait untuk memproses
              layanan. Formulir ini masih simulasi dan belum mengirimkan data ke
              sistem sekolah atau Dinas Pendidikan.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ServiceOptionCards({
  selectedService,
  onSelect,
}: {
  selectedService: EducationServiceOption | null;
  onSelect: (service: EducationServiceOption) => void;
}) {
  return (
    <fieldset
      aria-label="Pilih jenis layanan pendidikan"
      className="grid gap-3 md:grid-cols-3"
    >
      {EDUCATION_SERVICE_CATEGORY.subCategories.map((option) => {
        const selected = selectedService?.id === option.id;
        return (
          <label key={option.id} className="block">
            <input
              type="radio"
              name="education-service"
              checked={selected}
              onChange={() => onSelect(option)}
              className="peer sr-only"
              aria-label={option.name}
            />
            <span
              className={`peer-focus-visible:ring-ring flex min-h-28 flex-col justify-between rounded-xl border p-4 text-left transition-colors peer-focus-visible:ring-2 peer-focus-visible:outline-none ${
                selected
                  ? "border-primary bg-primary/5 ring-primary ring-1"
                  : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
              }`}
            >
              <span>
                <span className="flex items-center gap-2 font-semibold">
                  <FileText
                    className="text-primary size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {option.name}
                </span>
                <span className="text-muted-foreground mt-2 block text-sm">
                  {option.description}
                </span>
              </span>
              <span className="text-muted-foreground mt-3 block text-xs">
                Instansi: {EDUCATION_SERVICE_CATEGORY.defaultAgency}
              </span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}

function DocumentUploader({
  files,
  onFiles,
  onRemove,
  error,
}: {
  files: File[];
  onFiles: (files: FileList | File[]) => void;
  onRemove: (file: File) => void;
  error: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section aria-labelledby="document-heading" className="space-y-4">
      <div>
        <h2 id="document-heading" className="text-lg font-semibold">
          Lampiran Dokumen
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Unggah dokumen pendukung (Kartu Keluarga, Surat keterangan aktif
          sekolah, dll.). Format PDF/JPG, maksimal 5 MB per berkas.
        </p>
      </div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          onFiles(event.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors sm:p-10 ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20"
        }`}
      >
        <span className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
          <Upload className="size-5" aria-hidden="true" />
        </span>
        <p className="mt-3 font-medium">Seret dan lepas berkas di sini</p>
        <p className="text-muted-foreground mt-1 text-sm">
          atau pilih dari perangkat Anda
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,application/pdf,image/jpeg"
          className="sr-only"
          aria-label="Pilih dokumen pendukung"
          onChange={(event) => {
            if (event.currentTarget.files) onFiles(event.currentTarget.files);
            event.currentTarget.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          onClick={() => inputRef.current?.click()}
        >
          Pilih berkas
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      {files.length > 0 ? (
        <ul aria-label="Berkas terpilih" className="space-y-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="border-border flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <span className="flex min-w-0 items-center gap-2">
                <FileText
                  className="text-primary size-4 shrink-0"
                  aria-hidden="true"
                />
                <span className="truncate text-sm">{file.name}</span>
                <span className="text-muted-foreground shrink-0 text-xs">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </span>
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Hapus ${file.name}`}
                onClick={() => onRemove(file)}
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">
          Belum ada dokumen yang dipilih.
        </p>
      )}
      <p className="bg-muted/50 text-muted-foreground rounded-lg p-3 text-xs">
        Berkas hanya dipilih di perangkat ini untuk simulasi. Tidak ada unggahan
        ke server.
      </p>
    </section>
  );
}
function ReviewSummary({
  service,
  details,
  files,
  notificationChannel,
  contactTime,
  followUpNote,
  confirmed,
  isSubmitting,
  onEditDetails,
  onEditAttachments,
  onConfirmChange,
  onSubmit,
  onChannelChange,
  onContactTimeChange,
  onNoteChange,
}: {
  service: EducationServiceOption;
  details: EducationApplicationDetails;
  files: File[];
  notificationChannel: string;
  contactTime: string;
  followUpNote: string;
  confirmed: boolean;
  isSubmitting: boolean;
  onEditDetails: () => void;
  onEditAttachments: () => void;
  onConfirmChange: (checked: boolean) => void;
  onSubmit: (event: React.FormEvent) => void;
  onChannelChange: (value: string) => void;
  onContactTimeChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section aria-labelledby="review-heading" className="space-y-4">
        <div>
          <h2 id="review-heading" className="text-lg font-semibold">
            Periksa kembali pengajuan Anda
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Pastikan informasi dan dokumen sudah sesuai sebelum mengirimkan
            pengajuan.
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Data pemohon dan siswa</h3>
          <Button type="button" variant="outline" onClick={onEditDetails}>
            Ubah data
          </Button>
        </div>
        <dl className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground text-xs">Jenis layanan</dt>
            <dd className="mt-1 font-medium">{service.name}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Keterangan</dt>
            <dd className="mt-1 font-medium">{service.description}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Instansi tujuan</dt>
            <dd className="mt-1 font-medium">{EDUCATION_SERVICE_CATEGORY.defaultAgency}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Nama pemohon</dt>
            <dd className="mt-1 font-medium">{details.namaPemohon}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Kontak notifikasi</dt>
            <dd className="mt-1 font-medium">{details.kontakNotifikasi}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Kecamatan domisili</dt>
            <dd className="mt-1 font-medium">{details.kecamatan}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Kelurahan / Desa</dt>
            <dd className="mt-1 font-medium">{details.kelurahan}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Judul pengajuan</dt>
            <dd className="mt-1 font-medium">{details.judulPengajuan}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Nama siswa</dt>
            <dd className="mt-1 font-medium">{details.namaSiswa}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Hubungan dengan siswa</dt>
            <dd className="mt-1 font-medium">{details.hubungan}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Nama sekolah</dt>
            <dd className="mt-1 font-medium">{details.namaSekolah}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Jenjang pendidikan</dt>
            <dd className="mt-1 font-medium">{details.jenjang}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground text-xs">Kelas</dt>
            <dd className="mt-1 font-medium">{details.kelas}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Detail kebutuhan</dt>
            <dd className="mt-1 font-medium whitespace-pre-wrap">{details.detailKebutuhan || "Belum diisi"}</dd>
          </div>
        </dl>
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Lampiran</h3>
          <Button type="button" variant="outline" onClick={onEditAttachments}>
            Ubah lampiran
          </Button>
        </div>
        <dl className="border-border rounded-xl border p-4">
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Dokumen ({files.length})</dt>
            <dd className="mt-1 font-medium">{files.length ? files.map((file) => file.name).join(", ") : "Tidak ada dokumen"}</dd>
          </div>
        </dl>
      </section>

      <section aria-labelledby="preferences-review-heading" className="space-y-4">
        <div>
          <h2 id="preferences-review-heading" className="text-lg font-semibold">
            Preferensi tindak lanjut
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Pilih cara dan waktu yang nyaman untuk menerima pembaruan pengajuan.
          </p>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Jalur pembaruan</span>
          <select
            value={notificationChannel}
            onChange={(event) => onChannelChange(event.target.value)}
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option>Notifikasi akun + email</option>
            <option>Notifikasi akun</option>
            <option>Email</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Waktu dapat dihubungi</span>
          <select
            value={contactTime}
            onChange={(event) => onContactTimeChange(event.target.value)}
            className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            <option>Hari kerja, 08.00-16.00</option>
            <option>Hari kerja, 16.00-20.00</option>
            <option>Akhir pekan, 09.00-12.00</option>
          </select>
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium">Catatan (opsional)</span>
          <Textarea
            value={followUpNote}
            onChange={(event) => onNoteChange(event.target.value)}
            maxLength={2000}
            placeholder="Tambahkan waktu atau informasi tindak lanjut yang membantu."
          />
        </label>
      </section>

      <label className="border-border flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => onConfirmChange(event.target.checked)}
          className="accent-primary mt-0.5 size-4"
        />
        <span>
          Saya menyatakan data dan lampiran yang diberikan benar dan sesuai. Saya memahami data tidak dapat diubah setelah pengajuan dikirim.
        </span>
      </label>
      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? "Memeriksa privasi..." : "Kirim pengajuan"}
        <ArrowRight className="size-4" aria-hidden="true" />
      </Button>
    </form>
  );
}

function SuccessState({ trackingNumber }: { trackingNumber: string }) {
  return (
    <section className="mx-auto max-w-2xl py-10 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        PENGAJUAN BERHASIL
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        Pengajuan pendidikan berhasil disimulasikan
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Nomor pelacakan contoh Anda:
      </p>
      <p className="border-border bg-muted/40 mt-3 rounded-xl border px-4 py-4 font-mono text-lg font-semibold tracking-wider">
        {trackingNumber}
      </p>
      <p className="text-muted-foreground mt-4 text-sm">
        Pengajuan akan diverifikasi bersama sekolah. Nomor ini hanya contoh dan
        tidak akan muncul pada daftar pelacakan.
      </p>
      <Button asChild className="mt-6">
        <Link href="/tracking">
          Lacak Pengajuan <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}
export default function EducationApplicationPage() {
  const [selectedService, setSelectedService] =
    useState<EducationServiceOption | null>(null);
  const [step, setStep] = useState<number>(1);
  const [details, setDetails] =
    useState<EducationApplicationDetails>(INITIAL_DETAILS);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [formError, setFormError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notificationChannel, setNotificationChannel] = useState(
    "Notifikasi akun + email",
  );
  const [contactTime, setContactTime] = useState("Hari kerja, 08.00-16.00");
  const [followUpNote, setFollowUpNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const category = EDUCATION_SERVICE_CATEGORY;

  const currentStepIndex = step - 1;
  const isStep1 = step === 1;
  const isStep2 = step === 2;
  const isStep3 = step === 3;
  const isStep4 = step === 4;

  function updateDetail(key: keyof EducationApplicationDetails, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
    setFormError("");
  }

  function selectEducationService(service: EducationServiceOption) {
    setSelectedService(service);
    setStep(2);
    setFormError("");
    setDetails((current) => ({
      ...current,
      judulPengajuan: [
        "Usulan bantuan perlengkapan sekolah",
        "Permohonan Surat Keterangan Pindah / Mutasi Siswa",
        "Konsultasi Pilihan Belajar & Dokumen Masuk SMP",
      ].includes(current.judulPengajuan)
        ? service.type === "AdministrasiSiswa"
          ? "Permohonan Surat Keterangan Pindah / Mutasi Siswa"
          : service.type === "KonsultasiPendidikan"
            ? "Konsultasi Pilihan Belajar & Dokumen Masuk SMP"
            : "Usulan bantuan perlengkapan sekolah"
        : current.judulPengajuan,
    }));
  }

  function updateAdministrationGrade(value: string) {
    const [jenjang = "", kelas = ""] = value.split(" / ");
    setDetails((current) => ({ ...current, jenjang, kelas }));
    setFormError("");
  }

  function addFiles(incomingFiles: FileList | File[]) {
    const accepted: File[] = [];
    const rejected: string[] = [];
    Array.from(incomingFiles).forEach((file) => {
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > 5) {
        rejected.push(`${file.name}: melebihi batas 5 MB`);
      } else {
        accepted.push(file);
      }
    });
    if (accepted.length) {
      setFiles((current) => [...current, ...accepted]);
      setFileError("");
    }
    if (rejected.length) setFileError(rejected.join(" "));
  }

  function continueFromDetails() {
    if (!selectedService) return;

    let error: string | null = null;
    if (!details.namaPemohon.trim()) error = "Nama pemohon wajib diisi.";
    else if (!details.kontakNotifikasi.trim())
      error = "Kontak notifikasi wajib diisi.";
    else if (!isValidEmail(details.kontakNotifikasi))
      error = "Masukkan alamat email dengan format yang benar.";
    else if (!details.kecamatan) error = "Kecamatan domisili wajib dipilih.";
    else if (!details.kelurahan) error = "Kelurahan atau desa wajib dipilih.";
    else if (!details.judulPengajuan.trim())
      error = "Judul pengajuan wajib diisi.";
    else if (!details.namaSiswa.trim()) error = "Nama siswa wajib diisi.";
    else if (!details.hubungan)
      error = "Hubungan pemohon dengan siswa wajib dipilih.";
    else if (!details.namaSekolah.trim()) error = "Nama sekolah wajib diisi.";
    else if (!details.jenjang.trim())
      error = "Jenjang pendidikan wajib dipilih.";
    else if (!details.kelas.trim()) error = "Kelas wajib dipilih.";
    else if (!details.detailKebutuhan.trim())
      error = "Detail kebutuhan wajib diisi.";

    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    setStep(3);
  }

  function createTrackingNumber(): string {
    const now = new Date();
    const date = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()]
      .map((part) => String(part).padStart(2, "0"))
      .join("");
    const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
    return `EDU-${date}-${suffix}`;
  }

  async function submitApplication(event: React.FormEvent) {
    event.preventDefault();
    if (!confirmed || !selectedService) {
      setFormError("Centang pernyataan kebenaran sebelum melanjutkan.");
      return;
    }
    setIsSubmitting(true);
    setFormError("");
    try {
      const response = await fetch(
        "/api/education-applications/privacy-check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            kebutuhan: details.detailKebutuhan,
            catatan: followUpNote,
          }),
        },
      );
      const result: { error?: string; valid?: boolean } = await response.json();
      if (!response.ok || !result.valid) {
        setFormError(
          result.error ??
            "Validasi privasi gagal. Periksa kembali uraian dan catatan Anda.",
        );
        return;
      }
      setTrackingNumber(createTrackingNumber());
    } catch {
      setFormError(
        "Validasi privasi tidak dapat dihubungi. Periksa koneksi lalu coba lagi.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="bg-background min-h-[70vh] pb-12">
      <section className="border-border border-b bg-sky-50 dark:bg-sky-950/30">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
          <nav
            aria-label="Breadcrumb"
            className="text-muted-foreground text-xs"
          >
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/"
                  className="hover:text-foreground hover:underline"
                >
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li>
                <Link
                  href="/layanan-publik"
                  className="hover:text-foreground hover:underline"
                >
                  Layanan Publik
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li aria-current="page" className="text-foreground font-medium">
                Ajukan Layanan Pendidikan
              </li>
            </ol>
          </nav>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                Layanan Pendidikan
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Ajukan Layanan Pendidikan
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                Ajukan bantuan biaya, administrasi siswa, atau konsultasi
                pendidikan melalui Dinas Pendidikan. Pengajuan akan diverifikasi
                bersama sekolah.
              </p>
              <div className="mt-3">
                <SourceBadge
                  source="SIMULATED"
                  label="Simulasi, tidak dikirim"
                />
              </div>
            </div>
            {!trackingNumber ? (
              <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
                <Button asChild variant="outline" className="bg-background">
                  <Link href="/tracking">
                    <ArrowLeft className="size-4" aria-hidden="true" />
                    Kembali ke pelacakan
                  </Link>
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setFormError(
                      "Fitur simpan draft belum tersedia. Data formulir tidak disimpan.",
                    );
                  }}
                >
                  Simpan draft
                </Button>
              </div>
            ) : null}
          </div>
          {formError ? (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive mt-3 rounded-lg p-3 text-sm"
            >
              {formError}
            </p>
          ) : null}
        </div>
      </section>
      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-8">
        <div className="min-w-0 space-y-5">
          {!trackingNumber ? (
            <>
              <WizardLayout
                steps={WIZARD_STEPS}
                currentStep={currentStepIndex}
                onBack={() => setStep((current) => Math.max(1, current - 1))}
                onNext={() => {
                  if (isStep1) {
                    if (!selectedService) {
                      setFormError("Pilih jenis layanan terlebih dahulu.");
                      return;
                    }
                    setStep(2);
                  } else if (isStep2) {
                    continueFromDetails();
                  } else if (isStep3) {
                    setStep(4);
                  } else if (isStep4) {
                    // go straight to submission from review
                  }
                }}
                nextDisabled={
                  isStep1 ? !selectedService : isStep2 ? false : false
                }
                nextLabel={isStep1 ? "Pilih layanan" : undefined}
                backLabel="Kembali"
              >
                {isStep1 ? (
                  <>
                    <section
                      aria-labelledby="service-selection-heading"
                      className="space-y-4"
                    >
                      <div>
                        <h2
                          id="service-selection-heading"
                          className="text-xl font-semibold"
                        >
                          Pilih Jenis Layanan Pendidikan
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Pilih salah satu jenis layanan yang paling sesuai
                          dengan kebutuhan Anda.
                        </p>
                        <p className="mt-2 text-sm">
                          Instansi tujuan default:{" "}
                          <strong>{category.defaultAgency}</strong>
                        </p>
                      </div>

                      <ServiceOptionCards
                        selectedService={selectedService}
                        onSelect={selectEducationService}
                      />

                      <div
                        role="note"
                        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200"
                      >
                        <ShieldAlert
                          className="mr-2 size-4"
                          aria-hidden="true"
                        />
                        <span className="font-semibold">Perhatian:</span>{" "}
                        {category.disclaimer}
                      </div>

                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
                        <span className="font-semibold">Info layanan:</span>{" "}
                        {category.infoBox}
                      </div>

                      <div className="mt-4">
                        <Button
                          type="button"
                          variant="outline"
                          asChild
                          className="w-full sm:w-auto"
                        >
                          <Link
                            href={category.helpCenterUrl}
                            className="text-primary flex items-center gap-2 font-medium hover:underline"
                          >
                            Butuh bantuan mengisi?
                          </Link>
                        </Button>
                        <p className="text-muted-foreground mt-1 text-xs">
                          Pusat bantuan: {category.helpCenterHours}
                        </p>
                      </div>
                    </section>
                  </>
                ) : null}
                {isStep2 && selectedService ? (
                  <div className="space-y-6">
                    <section
                      aria-labelledby="detail-service-heading"
                      className="space-y-3"
                    >
                      <div>
                        <h2
                          id="detail-service-heading"
                          className="text-lg font-semibold"
                        >
                          Pilih jenis layanan
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Pilih kebutuhan pendidikan Anda. Formulir di bawah
                          menyesuaikan layanan{" "}
                          {selectedService.name.toLocaleLowerCase("id")}.
                        </p>
                      </div>
                      <ServiceOptionCards
                        selectedService={selectedService}
                        onSelect={selectEducationService}
                      />
                    </section>
                    <DetailForm
                      details={details}
                      onChange={updateDetail}
                      onGradeChange={updateAdministrationGrade}
                      service={selectedService}
                    />
                  </div>
                ) : null}
                {isStep3 ? (
                  <DocumentUploader
                    files={files}
                    onFiles={addFiles}
                    onRemove={(file) =>
                      setFiles((current) =>
                        current.filter((item) => item !== file),
                      )
                    }
                    error={fileError}
                  />
                ) : null}
                {isStep4 && selectedService ? (
                  <ReviewSummary
                    service={selectedService}
                    details={details}
                    files={files}
                    notificationChannel={notificationChannel}
                    contactTime={contactTime}
                    followUpNote={followUpNote}
                    confirmed={confirmed}
                    isSubmitting={isSubmitting}
                    onEditDetails={() => setStep(2)}
                    onEditAttachments={() => setStep(3)}
                    onConfirmChange={setConfirmed}
                    onSubmit={submitApplication}
                    onChannelChange={setNotificationChannel}
                    onContactTimeChange={setContactTime}
                    onNoteChange={(value) => {
                      setFollowUpNote(value);
                      setFormError("");
                    }}
                  />
                ) : null}
              </WizardLayout>
            </>
          ) : (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="p-5 sm:p-8">
                <SuccessState trackingNumber={trackingNumber} />
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          {selectedService?.type === "KonsultasiPendidikan" ? (
            <Card className="rounded-xl shadow-sm">
              <CardContent className="space-y-3 p-4">
                <h2 className="font-semibold">Dokumen yang dapat disiapkan</h2>
                <ul className="text-muted-foreground space-y-2 text-sm">
                  {[
                    "Kartu Keluarga (KK)",
                    "Rapor atau surat keterangan aktif sekolah",
                    "Surat permohonan orang tua / wali",
                    "Dokumen pendukung pertanyaan belajar",
                  ].map((document) => (
                    <li key={document} className="flex items-start gap-2">
                      <FileText
                        className="text-primary mt-0.5 size-4 shrink-0"
                        aria-hidden="true"
                      />
                      {document}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground text-xs">
                  Siapkan dokumen yang relevan untuk membantu konsultasi.
                  Unggahan hanya simulasi dan belum dikirim.
                </p>
              </CardContent>
            </Card>
          ) : null}
          <Card className="rounded-xl shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className="text-primary size-4"
                  aria-hidden="true"
                />
                <h2 className="font-semibold">Penyimpanan belum tersedia</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Draf dan pengajuan belum disimpan. Data hanya tersedia selama
                halaman ini terbuka, dan berkas tetap di perangkat. Uraian dan
                catatan dikirim hanya untuk validasi privasi saat pengiriman dan
                tidak disimpan.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl border-amber-200 bg-amber-50 shadow-none dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="space-y-2 p-4" role="note">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className="size-4 text-amber-800 dark:text-amber-200"
                  aria-hidden="true"
                />
                <h2 className="font-semibold text-amber-950 dark:text-amber-100">
                  Perlu Anda ketahui
                </h2>
              </div>
              <p className="text-sm text-amber-950 dark:text-amber-100">
                {category.disclaimer}
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-sky-50 shadow-none dark:bg-sky-950/30">
            <CardContent className="space-y-2 p-4">
              <h2 className="font-semibold">Sebelum mengirim</h2>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                {selectedService?.type === "KonsultasiPendidikan" ? (
                  <>
                    <li>Tulis pertanyaan pendidikan secara jelas.</li>
                    <li>Siapkan rapor atau dokumen sekolah yang relevan.</li>
                    <li>Dinas Pendidikan meninjau kebutuhan konsultasi.</li>
                  </>
                ) : (
                  <>
                    <li>Pilih jenis layanan pendidikan yang sesuai.</li>
                    <li>Isi data wajib dan periksa kembali.</li>
                    <li>Gunakan dokumen PDF/JPG maksimal 5 MB.</li>
                    <li>Pengajuan akan diverifikasi bersama sekolah.</li>
                  </>
                )}
              </ul>
            </CardContent>
          </Card>
          <p className="text-muted-foreground text-xs">
            Perlu bantuan?{" "}
            <Link
              href={category.helpCenterUrl}
              className="text-primary font-medium hover:underline"
            >
              Pusat bantuan ({category.helpCenterHours})
            </Link>
          </p>
        </aside>
      </main>
    </div>
  );
}




