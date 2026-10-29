"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SourceBadge } from "@/components/source-badges/source-badge";
import {
  APPLICATION_STEPS,
  getDocumentValidationError,
  getWizardProgress,
  isValidEmail,
  isValidNik,
  PUBLIC_SERVICES,
  type PublicService,
} from "./service-application-data";

type ApplicationDetails = {
  subject: string;
  location: string;
  description: string;
  contactEmail: string;
  businessName: string;
  permitType: string;
  aidType: string;
  nik: string;
  householdMembers: string;
};

const INITIAL_DETAILS: ApplicationDetails = {
  subject: "",
  location: "",
  description: "",
  contactEmail: "warga.simulasi@example.test",
  businessName: "",
  permitType: "",
  aidType: "",
  nik: "",
  householdMembers: "",
};

const CATEGORIES = ["Semua kategori", "Perizinan", "Bansos", "Kesehatan"] as const;

// This fixture is intentionally synthetic; the current session contract has no profile data.
const PROFILE = {
  name: "Budi Santoso (SIMULATED)",
  email: "warga.simulasi@example.test",
  phone: "08xx-xxxx-xxxx",
  area: "Kecamatan Melati (SIMULATED)",
};

function getDetailsError(
  service: PublicService,
  details: ApplicationDetails,
): string | null {
  if (!isValidEmail(details.contactEmail))
    return "Masukkan alamat email dengan format yang benar.";
  if (!details.description.trim()) return "Ceritakan detail pengajuan Anda.";

  if (service.category === "Bansos" && !isValidNik(details.nik)) {
    return "NIK harus terdiri dari 16 angka.";
  }
  if (service.category === "Perizinan" && !details.businessName.trim()) {
    return "Nama usaha wajib diisi.";
  }
  if (service.category === "Perizinan" && !details.permitType.trim()) {
    return "Jenis izin wajib diisi.";
  }
  if (service.category === "Pengaduan" && !details.subject.trim()) {
    return "Judul pengaduan wajib diisi.";
  }
  if (service.category !== "Bansos" && !details.location.trim()) {
    return "Alamat atau lokasi wajib diisi.";
  }
  if (service.category === "Bansos" && !details.aidType.trim()) {
    return "Jenis bantuan wajib dipilih.";
  }
  return null;
}

function createTrackingNumber(service: PublicService): string {
  const now = new Date();
  const date = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("");
  const suffix = String(Math.floor(Math.random() * 100000)).padStart(5, "0");
  return `${service.prefix}-${date}-${suffix}`;
}

function StepProgress({ currentStep }: { currentStep: number }) {
  const progress = getWizardProgress(currentStep);
  const progressWidth =
    currentStep === 1
      ? "w-1/4"
      : currentStep === 2
        ? "w-2/4"
        : currentStep === 3
          ? "w-3/4"
          : "w-full";

  return (
    <section
      aria-label="Progres pengajuan"
      className="border-border bg-card rounded-xl border p-4 shadow-sm"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium">
          Langkah {currentStep} dari {APPLICATION_STEPS.length}
        </p>
        <p className="text-muted-foreground text-xs">{progress}% selesai</p>
      </div>
      <div
        className="bg-muted mb-4 h-2 overflow-hidden rounded-full"
        role="progressbar"
        aria-label="Progres langkah pengajuan"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className={`bg-primary h-full rounded-full transition-all ${progressWidth}`}
        />
      </div>
      <ol className="flex gap-3 overflow-x-auto pb-1">
        {APPLICATION_STEPS.map((step, index) => {
          const number = index + 1;
          const completed = number < currentStep;
          const active = number === currentStep;
          return (
            <li
              key={step}
              aria-current={active ? "step" : undefined}
              className="flex min-w-max items-center gap-2 text-xs"
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
                  completed || active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground"
                }`}
              >
                {completed ? (
                  <Check className="size-3.5" aria-hidden="true" />
                ) : (
                  number
                )}
              </span>
              <span
                className={
                  active
                    ? "text-foreground font-semibold"
                    : "text-muted-foreground"
                }
              >
                {number}. {step}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ServiceCatalog({
  selectedService,
  onSelect,
}: {
  selectedService: PublicService | null;
  onSelect: (service: PublicService) => void;
}) {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] =
    React.useState<(typeof CATEGORIES)[number]>("Semua kategori");
  const normalizedQuery = query.trim().toLocaleLowerCase("id");
  const services = PUBLIC_SERVICES.filter((service) => {
    const matchesCategory =
      category === "Semua kategori" || service.category === category;
      const matchesSearch =
        !normalizedQuery ||
        `${service.description} ${service.agency}`
          .toLocaleLowerCase("id")
          .includes(normalizedQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <section aria-labelledby="catalog-heading" className="space-y-4">
      <div>
        <h2
          id="catalog-heading"
          className="text-xl font-semibold tracking-tight"
        >
          Katalog Layanan
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Cari layanan yang sesuai. Katalog ini merupakan data simulasi.
        </p>
      </div>
      <SourceBadge source="SIMULATED" label="Katalog simulasi" />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative block">
          <span className="sr-only">Cari layanan</span>
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama layanan..."
            className="pl-9"
          />
        </label>
        <label className="block">
          <span className="sr-only">Filter kategori layanan</span>
          <select
            aria-label="Filter kategori layanan"
            value={category}
            onChange={(event) =>
              setCategory(
                CATEGORIES.find((item) => item === event.target.value) ??
                  "Semua kategori",
              )
            }
            className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
      {services.length ? (
        <ul className="grid gap-3 md:grid-cols-2">
          {services.map((service) => {
            const selected = service.id === selectedService?.id;
            return (
              <li key={service.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onSelect(service)}
                  className={`focus-visible:ring-ring h-full w-full rounded-xl border p-4 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                    selected
                      ? "border-primary bg-primary/5 ring-primary ring-1"
                      : "border-border bg-card hover:border-primary/50 hover:bg-accent/50"
                  }`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
                      <FileText className="size-4" aria-hidden="true" />
                    </span>
                  </span>
                  <span className="mt-3 block font-semibold">
                    {service.name}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm">
                    {service.description}
                  </span>
                  <span className="text-muted-foreground mt-3 block text-xs">
                    Instansi: {service.agency}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-border rounded-xl border border-dashed px-4 py-10 text-center">
          <p className="font-medium">Layanan tidak ditemukan</p>
          <p className="text-muted-foreground mt-1 text-sm">
            Ubah kata pencarian atau pilih kategori lain.
          </p>
        </div>
      )}
    </section>
  );
}

function ProfileFields({
  contactEmail,
  onChange,
  emailError,
}: {
  contactEmail: string;
  onChange: (key: keyof ApplicationDetails, value: string) => void;
  emailError: string | null;
}) {
  return (
    <fieldset className="border-border bg-muted/30 space-y-3 rounded-xl border p-4">
      <legend className="px-1 text-sm font-semibold">
        Data dari profil (simulasi)
      </legend>
      <p className="text-muted-foreground text-xs">
        Data contoh ini hanya untuk pratinjau dan tidak berasal dari akun Anda.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Nama pemohon", PROFILE.name],
          ["Nomor kontak", PROFILE.phone],
          ["Wilayah", PROFILE.area],
        ].map(([label, value]) => (
          <label key={label} className="space-y-1.5 text-sm">
            <span className="font-medium">{label}</span>
            <Input value={value} readOnly aria-label={label} />
          </label>
        ))}
        <label className="space-y-1.5 text-sm">
          <span className="font-medium">Email</span>
          <Input
            type="email"
            value={contactEmail}
            onChange={(event) => onChange("contactEmail", event.target.value)}
            aria-label="Email"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? "email-error" : undefined}
          />
          {emailError ? (
            <span
              id="email-error"
              role="alert"
              className="text-destructive block text-xs"
            >
              {emailError}
            </span>
          ) : null}
        </label>
      </div>
    </fieldset>
  );
}

function ServiceSpecificFields({
  service,
  details,
  onChange,
  nikError,
}: {
  service: PublicService;
  details: ApplicationDetails;
  onChange: (key: keyof ApplicationDetails, value: string) => void;
  nikError: string | null;
}) {
  const isPermit = service.category === "Perizinan";
  const isAid = service.category === "Bansos";
  const locationLabel = isPermit
    ? "Alamat usaha"
    : "Alamat atau lokasi kejadian";

  return (
    <div className="space-y-4">
      {isAid ? (
        <>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">NIK pemohon</span>
            <Input
              inputMode="numeric"
              autoComplete="off"
              value={details.nik}
              onChange={(event) =>
                onChange(
                  "nik",
                  event.target.value.replace(/\D/g, "").slice(0, 16),
                )
              }
              aria-invalid={Boolean(nikError)}
              aria-describedby={nikError ? "nik-error" : "nik-hint"}
              placeholder="16 angka"
            />
            {nikError ? (
              <span
                id="nik-error"
                role="alert"
                className="text-destructive block text-xs"
              >
                {nikError}
              </span>
            ) : (
              <span
                id="nik-hint"
                className="text-muted-foreground block text-xs"
              >
                Data hanya berada di formulir simulasi ini dan tidak disimpan
                atau dikirim.
              </span>
            )}
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Jenis bantuan</span>
            <select
              value={details.aidType}
              onChange={(event) => onChange("aidType", event.target.value)}
              className="border-input bg-background focus-visible:ring-ring h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
            >
              <option value="">Pilih jenis bantuan</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Keluarga">Bantuan keluarga</option>
            </select>
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Jumlah anggota keluarga</span>
            <Input
              type="number"
              min="1"
              max="30"
              value={details.householdMembers}
              onChange={(event) =>
                onChange("householdMembers", event.target.value)
              }
              placeholder="Contoh: 4"
            />
          </label>
        </>
      ) : isPermit ? (
        <>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Nama usaha</span>
            <Input
              value={details.businessName}
              onChange={(event) => onChange("businessName", event.target.value)}
              placeholder="Nama usaha Anda"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Jenis izin</span>
            <Input
              value={details.permitType}
              onChange={(event) => onChange("permitType", event.target.value)}
              placeholder="Contoh: Perizinan"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{locationLabel}</span>
            <Input
              value={details.location}
              onChange={(event) => onChange("location", event.target.value)}
              placeholder="Alamat lengkap lokasi usaha"
            />
          </label>
        </>
      ) : (
        <>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">Judul pengaduan</span>
            <Input
              value={details.subject}
              onChange={(event) => onChange("subject", event.target.value)}
              placeholder="Ringkas masalah yang dilaporkan"
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium">{locationLabel}</span>
            <Input
              value={details.location}
              onChange={(event) => onChange("location", event.target.value)}
              placeholder="Nama jalan, wilayah, atau patokan"
            />
          </label>
        </>
      )}
      <label className="block space-y-1.5 text-sm">
        <span className="font-medium">
          {isAid
            ? "Jelaskan kebutuhan bantuan"
            : isPermit
              ? "Tujuan pengajuan"
              : "Ceritakan detail"}
        </span>
        <Textarea
          value={details.description}
          onChange={(event) => onChange("description", event.target.value)}
          rows={4}
          placeholder="Tuliskan informasi yang membantu instansi memahami pengajuan Anda."
        />
      </label>
    </div>
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
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  return (
    <section aria-labelledby="document-heading" className="space-y-4">
      <div>
        <h2 id="document-heading" className="text-lg font-semibold">
          Dokumen pendukung
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Unggah dokumen yang terbaca. Format PDF/JPG, maksimal 5 MB per berkas.
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
        ke server. Validasi backend tetap diperlukan sebelum fitur unggah
        dipakai di produksi.
      </p>
    </section>
  );
}

function ReviewSummary({
  service,
  details,
  files,
}: {
  service: PublicService;
  details: ApplicationDetails;
  files: File[];
}) {
  return (
    <section aria-labelledby="review-heading" className="space-y-4">
      <div>
        <h2 id="review-heading" className="text-lg font-semibold">
          Periksa kembali pengajuan Anda
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Pastikan informasi dan dokumen sudah sesuai sebelum mengirim simulasi.
        </p>
      </div>
      <dl className="border-border grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground text-xs">Layanan</dt>
          <dd className="mt-1 font-medium">{service.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Kategori</dt>
          <dd className="mt-1 font-medium">{service.category}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">
            Nama pemohon (simulasi)
          </dt>
          <dd className="mt-1 font-medium">{PROFILE.name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">
            Email notifikasi (simulasi)
          </dt>
          <dd className="mt-1 font-medium">{details.contactEmail}</dd>
        </div>
        {details.subject ? (
          <div>
            <dt className="text-muted-foreground text-xs">Judul pengaduan</dt>
            <dd className="mt-1 font-medium">{details.subject}</dd>
          </div>
        ) : null}
        {details.businessName ? (
          <div>
            <dt className="text-muted-foreground text-xs">Nama usaha</dt>
            <dd className="mt-1 font-medium">{details.businessName}</dd>
          </div>
        ) : null}
        {details.permitType ? (
          <div>
            <dt className="text-muted-foreground text-xs">Jenis izin</dt>
            <dd className="mt-1 font-medium">{details.permitType}</dd>
          </div>
        ) : null}
        {details.aidType ? (
          <div>
            <dt className="text-muted-foreground text-xs">Jenis bantuan</dt>
            <dd className="mt-1 font-medium">{details.aidType}</dd>
          </div>
        ) : null}
        {details.location ? (
          <div className="sm:col-span-2">
            <dt className="text-muted-foreground text-xs">Lokasi</dt>
            <dd className="mt-1 font-medium">{details.location}</dd>
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground text-xs">Detail</dt>
          <dd className="mt-1 font-medium whitespace-pre-wrap">
            {details.description || "Belum diisi"}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground text-xs">
            Dokumen ({files.length})
          </dt>
          <dd className="mt-1 font-medium">
            {files.length
              ? files.map((file) => file.name).join(", ")
              : "Tidak ada dokumen"}
          </dd>
        </div>
      </dl>
      {service.category === "Bansos" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          NIK tidak ditampilkan lagi di ringkasan ini. Ini hanya simulasi; data
          tidak disimpan atau dikirim.
        </p>
      ) : null}
    </section>
  );
}

function SuccessState({ trackingNumber }: { trackingNumber: string }) {
  return (
    <section className="mx-auto max-w-2xl py-10 text-center">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
        <CheckCircle2 className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-5 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
        SIMULASI BERHASIL
      </p>
      <h2 className="mt-2 text-2xl font-bold tracking-tight">
        Pengajuan berhasil disimulasikan
      </h2>
      <p className="text-muted-foreground mt-2 text-sm">
        Nomor pelacakan contoh Anda:
      </p>
      <p className="border-border bg-muted/40 mt-3 rounded-xl border px-4 py-4 font-mono text-lg font-semibold tracking-wider">
        {trackingNumber}
      </p>
      <p className="text-muted-foreground mt-4 text-sm">
        Pengajuan belum dikirim atau disimpan ke sistem. Nomor ini hanya contoh
        dan tidak akan muncul pada daftar pelacakan.
      </p>
      <Button asChild className="mt-6">
        <Link href="/tracking">
          Lacak Pengajuan <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </Button>
    </section>
  );
}

export function ServiceApplicationWizard() {
  const [selectedService, setSelectedService] =
    React.useState<PublicService | null>(null);
  const [step, setStep] = React.useState(1);
  const [details, setDetails] = React.useState(INITIAL_DETAILS);
  const [files, setFiles] = React.useState<File[]>([]);
  const [fileError, setFileError] = React.useState("");
  const [formError, setFormError] = React.useState("");
  const [confirmed, setConfirmed] = React.useState(false);
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [nikTouched, setNikTouched] = React.useState(false);
  const [draftNotice, setDraftNotice] = React.useState("");

  const nikError =
    selectedService?.category === "Bansos" &&
    nikTouched &&
    details.nik.length > 0 &&
    !isValidNik(details.nik)
      ? "NIK harus terdiri dari 16 angka."
      : null;
  const emailError =
    details.contactEmail.length > 0 && !isValidEmail(details.contactEmail)
      ? "Masukkan alamat email dengan format yang benar."
      : null;

  function updateDetail(key: keyof ApplicationDetails, value: string) {
    setDetails((current) => ({ ...current, [key]: value }));
    setFormError("");
    if (key === "nik") setNikTouched(true);
  }

  function addFiles(incomingFiles: FileList | File[]) {
    const accepted: File[] = [];
    const rejected: string[] = [];
    Array.from(incomingFiles).forEach((file) => {
      const error = getDocumentValidationError(file);
      if (error) rejected.push(`${file.name}: ${error}`);
      else accepted.push(file);
    });
    if (accepted.length) {
      setFiles((current) => [...current, ...accepted]);
      setFileError("");
    }
    if (rejected.length) setFileError(rejected.join(" "));
  }

  function continueFromDetails() {
    if (!selectedService) return;
    const error = getDetailsError(selectedService, details);
    if (error) {
      setFormError(error);
      return;
    }
    setFormError("");
    setStep(3);
  }

  function submitApplication(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!confirmed || !selectedService) {
      setFormError("Centang pernyataan kebenaran sebelum melanjutkan.");
      return;
    }
    setTrackingNumber(createTrackingNumber(selectedService));
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
                  href="/tracking"
                  className="hover:text-foreground hover:underline"
                >
                  Layanan Publik
                </Link>
              </li>
              <li aria-hidden="true">&gt;</li>
              <li aria-current="page" className="text-foreground font-medium">
                Ajukan Layanan
              </li>
            </ol>
          </nav>
          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-primary text-xs font-semibold tracking-wider uppercase">
                Ruang Warga
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                Ajukan Layanan Publik
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
                Kirim pengaduan, perizinan, atau bantuan sosial dengan panduan
                bertahap. Lengkapi data inti sekali, lalu pantau progresnya di
                pelacakan layanan.
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
                  onClick={() =>
                    setDraftNotice(
                      "Fitur simpan draft belum tersedia. Data formulir tidak disimpan.",
                    )
                  }
                >
                  Simpan draft
                </Button>
              </div>
            ) : null}
          </div>
          {draftNotice ? (
            <p
              role="status"
              className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
            >
              {draftNotice}
            </p>
          ) : null}
        </div>
      </section>

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-8 lg:py-8">
        <div className="min-w-0 space-y-5">
          {!trackingNumber ? (
            <>
              <StepProgress currentStep={step} />
              <Card className="rounded-xl shadow-sm">
                <CardContent className="space-y-6 p-4 sm:p-6">
                  {step === 1 ? (
                    <ServiceCatalog
                      selectedService={selectedService}
                      onSelect={setSelectedService}
                    />
                  ) : null}
                  {step === 2 && selectedService ? (
                    <section
                      aria-labelledby="details-heading"
                      className="space-y-5"
                    >
                      <div>
                        <h2
                          id="details-heading"
                          className="text-xl font-semibold"
                        >
                          Data &amp; Detail
                        </h2>
                        <p className="text-muted-foreground mt-1 text-sm">
                          Layanan dipilih: {selectedService.name}
                        </p>
                      </div>
                      <ProfileFields
                        contactEmail={details.contactEmail}
                        onChange={updateDetail}
                        emailError={emailError}
                      />
                      <ServiceSpecificFields
                        service={selectedService}
                        details={details}
                        onChange={updateDetail}
                        nikError={nikError}
                      />
                    </section>
                  ) : null}
                  {step === 3 ? (
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
                  {step === 4 && selectedService ? (
                    <ReviewSummary
                      service={selectedService}
                      details={details}
                      files={files}
                    />
                  ) : null}
                  {formError ? (
                    <p
                      role="alert"
                      className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm"
                    >
                      {formError}
                    </p>
                  ) : null}
                  <div className="border-border flex flex-col-reverse justify-between gap-3 border-t pt-4 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={step === 1}
                      onClick={() => {
                        setFormError("");
                        setStep((current) => Math.max(1, current - 1));
                      }}
                    >
                      <ArrowLeft className="size-4" aria-hidden="true" />
                      Kembali
                    </Button>
                    {step < 4 ? (
                      <Button
                        type="button"
                        disabled={step === 1 && !selectedService}
                        onClick={() => {
                          setFormError("");
                          if (step === 2) {
                            continueFromDetails();
                          } else {
                            setStep((current) => Math.min(4, current + 1));
                          }
                        }}
                      >
                        {step === 1
                          ? "Pilih layanan"
                          : step === 2
                            ? "Lanjut ke dokumen"
                            : "Tinjau pengajuan"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </div>
                  {step === 4 ? (
                    <form onSubmit={submitApplication} className="space-y-4">
                      <label className="border-border flex items-start gap-3 rounded-lg border p-3 text-sm">
                        <input
                          type="checkbox"
                          checked={confirmed}
                          onChange={(event) => {
                            setConfirmed(event.target.checked);
                            setFormError("");
                          }}
                          className="accent-primary mt-0.5 size-4"
                        />
                        <span>
                          Saya menyatakan data pada formulir simulasi ini benar
                          dan sesuai.
                        </span>
                      </label>
                      <Button type="submit" className="w-full sm:w-auto">
                        Kirim simulasi{" "}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Button>
                    </form>
                  ) : null}
                </CardContent>
              </Card>
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
          <Card className="rounded-xl shadow-sm">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className="text-primary size-4"
                  aria-hidden="true"
                />
                <h2 className="font-semibold">Data tetap di perangkat</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Ini prototipe antarmuka. Data formulir dan dokumen tidak
                disimpan di URL, penyimpanan browser, atau server.
              </p>
            </CardContent>
          </Card>
          <Card className="rounded-xl bg-sky-50 shadow-none dark:bg-sky-950/30">
            <CardContent className="space-y-2 p-4">
              <h2 className="font-semibold">Sebelum mengirim</h2>
              <ul className="text-muted-foreground list-inside list-disc space-y-1 text-sm">
                <li>Pilih layanan yang paling sesuai.</li>
                <li>Isi data wajib dan periksa kembali.</li>
                <li>Gunakan dokumen PDF/JPG maksimal 5 MB.</li>
              </ul>
            </CardContent>
          </Card>
          <p className="text-muted-foreground text-xs">
            Perlu bantuan?{" "}
            <Link
              href="/tracking"
              className="text-primary font-medium hover:underline"
            >
              Kembali ke Ruang Warga
            </Link>
          </p>
        </aside>
      </main>
    </div>
  );
}
