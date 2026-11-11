"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  Construction,
  FileText,
  ImagePlus,
  Leaf,
  MapPin,
  ShieldCheck,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker, type LocationData } from "@/components/forms/location-picker";

const CATEGORIES = ["Infrastruktur", "Dugaan korupsi", "Lingkungan"] as const;

const CATEGORY_CARDS = [
  {
    label: "Infrastruktur",
    category: "Infrastruktur",
    description: "Jalan, trotoar, atau fasilitas umum.",
    icon: Construction,
  },
  {
    label: "Dugaan korupsi",
    category: "Dugaan korupsi",
    description: "Dugaan yang perlu pemeriksaan. Gunakan jalur rahasia.",
    icon: CircleAlert,
  },
  {
    label: "Lingkungan",
    category: "Lingkungan",
    description: "Sampah, pencemaran, atau drainase.",
    icon: Leaf,
  },
] as const satisfies readonly {
  label: string;
  category: (typeof CATEGORIES)[number];
  description: string;
  icon: LucideIcon;
}[];

const SUBCATEGORIES: Record<(typeof CATEGORIES)[number], string[]> = {
  Infrastruktur: [
    "Jalan rusak",
    "Jembatan rusak",
    "Lampu jalan",
    "Fasilitas umum",
    "Lainnya",
  ],
  "Dugaan korupsi": [
    "Penyalahgunaan anggaran",
    "Pungutan liar",
    "Penyalahgunaan wewenang",
    "Lainnya",
  ],
  Lingkungan: [
    "Sampah menumpuk",
    "Pencemaran",
    "Saluran tersumbat",
    "Kerusakan ruang hijau",
    "Lainnya",
  ],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

interface ReportFormValues {
  category: string;
  subcategory: string;
  title: string;
  description: string;
  location: LocationData | null;
  name: string;
  isPublic: boolean;
  showIdentity: boolean;
}

interface Attachment {
  id: string;
  file: File;
  previewUrl: string | null;
}

const STEPS = [
  "Pilih kategori",
  "Detail masalah",
  "Bukti pendukung",
  "Nama samaran",
] as const;

function categoryIsValid(value: string): value is (typeof CATEGORIES)[number] {
  return CATEGORIES.some((category) => category === value);
}

function isAllowedFileType(file: File, extension: string): boolean {
  const type = file.type;
  if (extension === "jpg" || extension === "jpeg") {
    return type.length === 0 || type === "image/jpeg";
  }
  if (extension === "png") return type.length === 0 || type === "image/png";
  if (extension === "mp4") return type.length === 0 || type === "video/mp4";
  if (extension === "pdf")
    return type.length === 0 || type === "application/pdf";
  return false;
}

function getInitialValues(
  category?: string,
  subcategory?: string,
): ReportFormValues {
  const validCategory = category && categoryIsValid(category) ? category : "";
  const subcategoryOptions = categoryIsValid(validCategory)
    ? getSubcategories(validCategory as (typeof CATEGORIES)[number])
    : [];
  const validSubcategory =
    subcategory && subcategoryOptions.includes(subcategory) ? subcategory : "";
  return {
    category: validCategory,
    subcategory: validSubcategory,
    title: "",
    description: "",
    location: null,
    name: "",
    isPublic: true,
    showIdentity: false,
  };
}

function validateStep(step: number, values: ReportFormValues): boolean {
  if (step === 0) return categoryIsValid(values.category);
  if (step === 1) {
    return (
      values.title.trim().length > 0 &&
      values.title.trim().length <= 100 &&
      values.description.trim().length >= 50 &&
      values.subcategory.length > 0 &&
      values.location !== null &&
      values.location.province.trim().length > 0 &&
      values.location.city.trim().length > 0 &&
      values.location.address.trim().length > 0
    );
  }
  if (step === 3) {
    return values.name.trim().length > 0 && values.name.trim().length <= 80;
  }
  return true;
}

function getSubcategories(
  category: (typeof CATEGORIES)[number] | null,
): string[] {
  if (category === "Infrastruktur") return SUBCATEGORIES.Infrastruktur;
  if (category === "Dugaan korupsi") return SUBCATEGORIES["Dugaan korupsi"];
  if (category === "Lingkungan") return SUBCATEGORIES.Lingkungan;
  return [];
}

function FieldError({ children }: { children: string }) {
  return <p className="text-destructive text-sm">{children}</p>;
}

function FormField({
  id,
  label,
  required = false,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
      {error ? (
        <div id={errorId}>
          <FieldError>{error}</FieldError>
        </div>
      ) : null}
    </div>
  );
}

export function ReportForm({
  initialCategory,
  initialSubcategory,
}: {
  initialCategory?: string;
  initialSubcategory?: string;
}) {
  const [step, setStep] = useState(() =>
    initialCategory && categoryIsValid(initialCategory) ? 1 : 0,
  );
  const [values, setValues] = useState(() =>
    getInitialValues(initialCategory, initialSubcategory),
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionReceipt, setSubmissionReceipt] = useState<{
    reportNumber: string;
  } | null>(null);
  const previewUrls = useRef(new Set<string>());

  useEffect(
    () => () => {
      for (const url of previewUrls.current) URL.revokeObjectURL(url);
      previewUrls.current.clear();
    },
    [],
  );

  const selectedCategory = categoryIsValid(values.category)
    ? values.category
    : null;
  const subcategoryOptions = getSubcategories(selectedCategory).map(
    (label) => ({
      value: label,
      label,
    }),
  );

  function updateValue<K extends keyof ReportFormValues>(
    key: K,
    value: ReportFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setSubmitError("");
    setSubmissionReceipt(null);
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setSubmissionReceipt(null);
    const nextAttachments: Attachment[] = [];
    const errors: string[] = [];
    const availableSlots = MAX_FILES - attachments.length;

    Array.from(fileList).forEach((file, index) => {
      if (index >= availableSlots) {
        errors.push(`Maksimal ${MAX_FILES} file dapat dilampirkan.`);
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      if (!isAllowedFileType(file, extension)) {
        errors.push(`${file.name}: format harus JPG, PNG, MP4, atau PDF.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ukuran file melebihi 10 MB.`);
        return;
      }

      const previewUrl =
        (extension === "jpg" ||
          extension === "jpeg" ||
          extension === "png" ||
          extension === "mp4") &&
        typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(file)
          : null;
      if (previewUrl) previewUrls.current.add(previewUrl);
      nextAttachments.push({
        id: crypto.randomUUID(),
        file,
        previewUrl,
      });
    });

    if (nextAttachments.length) {
      setAttachments((current) => [...current, ...nextAttachments]);
    }
    setFileError(errors.join(" "));
  }

  function removeAttachment(id: string) {
    setSubmissionReceipt(null);
    const attachment = attachments.find((item) => item.id === id);
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
      previewUrls.current.delete(attachment.previewUrl);
    }
    setAttachments((current) => current.filter((item) => item.id !== id));
    setFileError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(3, values)) return;
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          attachments: attachments.map(({ file }) => file.name),
        }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof payload === "object" &&
          payload !== null &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "Laporan gagal disimpan. Silakan coba kembali.";
        throw new Error(message);
      }
      if (
        typeof payload !== "object" ||
        payload === null ||
        !("reportNumber" in payload) ||
        typeof payload.reportNumber !== "string"
      ) {
        throw new Error("Respons penyimpanan laporan tidak valid.");
      }
      setSubmissionReceipt({ reportNumber: payload.reportNumber });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Laporan gagal disimpan. Periksa koneksi lalu coba kembali.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const titleError =
    values.title.trim().length === 0
      ? "Judul laporan wajib diisi."
      : values.title.trim().length > 100
        ? "Judul maksimal 100 karakter."
        : undefined;
  const descriptionError =
    values.description.trim().length === 0
      ? "Detail masalah wajib diisi."
      : values.description.trim().length < 50
        ? `Detail masalah minimal 50 karakter (saat ini ${values.description.trim().length}).`
        : undefined;
  const subcategoryError = values.subcategory
    ? undefined
    : "Pilih kategori laporan yang lebih spesifik.";
  const provinceError = values.location?.province.trim()
    ? undefined
    : "Provinsi wajib diisi (pilih dari peta).";
  const cityError = values.location?.city.trim()
    ? undefined
    : "Kabupaten atau kota wajib diisi (pilih dari peta).";
  const locationError = values.location?.address.trim()
    ? undefined
    : "Alamat atau patokan lokasi wajib diisi (pilih dari peta).";
  const nameError =
    values.name.trim().length === 0
      ? "Nama samaran wajib diisi."
      : values.name.trim().length > 80
        ? "Nama samaran maksimal 80 karakter."
        : undefined;
  const currentStepLabel =
    step === 0
      ? STEPS[0]
      : step === 1
        ? STEPS[1]
        : step === 2
          ? STEPS[2]
          : STEPS[3];

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,0.8fr)]">
      <section className="bg-card rounded-xl border p-4 shadow-sm sm:p-6">
        <div
          className="mb-6"
          aria-label={`Langkah ${step + 1} dari ${STEPS.length}`}
        >
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold">
              Langkah {step + 1} dari {STEPS.length}
            </span>
            <span className="text-muted-foreground">{currentStepLabel}</span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={STEPS.length}
            aria-valuenow={step + 1}
            aria-label="Progres pengisian laporan"
            className="bg-muted h-2 overflow-hidden rounded-full"
          >
            <div
              className={`bg-primary h-full rounded-full transition-all ${
                step === 0
                  ? "w-1/4"
                  : step === 1
                    ? "w-2/4"
                    : step === 2
                      ? "w-3/4"
                      : "w-full"
              }`}
            />
          </div>
          <ol className="mt-4 grid grid-cols-4 gap-2">
            {STEPS.map((label, index) => (
              <li
                key={label}
                aria-current={step === index ? "step" : undefined}
                className={`border-t-2 pt-2 text-xs ${
                  index <= step
                    ? "border-primary text-foreground font-medium"
                    : "border-muted text-muted-foreground"
                }`}
              >
                <span className="sr-only">Langkah {index + 1}: </span>
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{index + 1}/4</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
          Laporan dan nama samaran akan disimpan agar instansi dapat
          menindaklanjuti laporan. Email dan nomor HP tidak dikumpulkan. Berkas
          lampiran saat ini belum diunggah; hanya nama berkas yang disimpan.
        </div>

        {submissionReceipt ? (
          <div
            role="status"
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
          >
            <p className="font-semibold">Laporan berhasil disimpan.</p>
            <p className="mt-1">
              Nomor laporan:{" "}
              <span className="font-mono">
                {submissionReceipt.reportNumber}
              </span>
            </p>
            <Button asChild className="mt-3">
              <Link
                href={`/report/tracking?reportNumber=${encodeURIComponent(submissionReceipt.reportNumber)}`}
              >
                Lacak laporan
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} noValidate>
          {step === 0 ? (
            <fieldset className="space-y-3">
              <legend className="mb-1 text-lg font-semibold">
                Pilih kategori laporan *
              </legend>
              <p className="text-muted-foreground text-sm">
                Pilih kategori yang paling mendekati masalah Anda.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {CATEGORY_CARDS.map(
                  ({ label, category, description, icon: Icon }) => {
                    const selected = values.category === category;
                    return (
                      <label
                        key={category}
                        className={`focus-within:ring-primary flex cursor-pointer flex-col items-center gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 ${
                          selected
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <Icon
                          aria-hidden="true"
                          className="text-primary size-5"
                        />
                        <span className="font-medium">{label}</span>
                        <span className="text-muted-foreground text-center text-xs">
                          {description}
                        </span>
                        <input
                          type="radio"
                          name="category"
                          value={category}
                          checked={selected}
                          onChange={() => {
                            updateValue("category", category);
                            updateValue("subcategory", "");
                          }}
                          className="sr-only"
                        />
                      </label>
                    );
                  },
                )}
              </div>
              {!validateStep(0, values) ? (
                <FieldError>
                  Pilih salah satu kategori untuk melanjutkan.
                </FieldError>
              ) : null}
            </fieldset>
          ) : null}

          {step === 1 ? (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold">Detail masalah</h2>
              <FormField
                id="report-title"
                label="Judul laporan"
                required
                error={titleError}
              >
                <Input
                  id="report-title"
                  name="title"
                  value={values.title}
                  maxLength={100}
                  aria-invalid={Boolean(titleError)}
                  aria-describedby={
                    titleError ? "report-title-error" : undefined
                  }
                  onChange={(event) => updateValue("title", event.target.value)}
                  placeholder="Contoh: Jalan berlubang di Jalan Melati"
                />
                <p className="text-muted-foreground text-right text-xs">
                  {values.title.length}/100 karakter
                </p>
              </FormField>
              <FormField
                id="report-description"
                label="Detail masalah"
                required
                error={descriptionError}
              >
                <Textarea
                  id="report-description"
                  name="description"
                  value={values.description}
                  rows={5}
                  aria-invalid={Boolean(descriptionError)}
                  aria-describedby={
                    descriptionError ? "report-description-error" : undefined
                  }
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                  placeholder="Jelaskan kronologi, dampak, dan informasi yang membantu verifikasi."
                />
                <p className="text-muted-foreground text-right text-xs">
                  Minimal 50 karakter ({values.description.trim().length}/50)
                </p>
              </FormField>
              <FormField
                id="report-subcategory"
                label="Kategori laporan"
                required
                error={subcategoryError}
              >
                <Select
                  id="report-subcategory"
                  name="subcategory"
                  value={values.subcategory}
                  aria-invalid={Boolean(subcategoryError)}
                  aria-describedby={
                    subcategoryError ? "report-subcategory-error" : undefined
                  }
                  onChange={(event) =>
                    updateValue("subcategory", event.target.value)
                  }
                  options={subcategoryOptions}
                  placeholder="Pilih kategori spesifik"
                  disabled={!selectedCategory}
                />
              </FormField>
              <FormField
                id="report-location"
                label="Lokasi kejadian"
                required
                error={locationError}
              >
                <LocationPicker
                  value={values.location}
                  onChange={(location) => updateValue("location", location)}
                  ariaLabel="Pilih lokasi kejadian di peta"
                />
                <p className="text-muted-foreground text-xs">
                  Klik pada peta untuk menentukan lokasi pasti. Provinsi, kabupaten/kota,
                  dan alamat/patokan akan terisi otomatis berdasarkan titik yang dipilih.
                </p>
              </FormField>
              {!validateStep(1, values) ? (
                <p className="text-muted-foreground text-sm">
                  Lengkapi judul, detail minimal 50 karakter, kategori spesifik,
                  dan lokasi untuk melanjutkan.
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Bukti pendukung</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Opsional. Maksimal 5 file, masing-masing hingga 10 MB. Format
                  JPG, PNG, MP4, atau PDF.
                </p>
              </div>
              <label
                htmlFor="report-attachments"
                className="hover:bg-muted/50 focus-within:ring-primary flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-colors focus-within:ring-2"
              >
                <UploadCloud
                  aria-hidden="true"
                  className="text-primary mb-2 size-7"
                />
                <span className="font-medium">
                  Pilih berkas dari perangkat Anda
                </span>
                <span className="text-muted-foreground mt-1 text-xs">
                  File tetap di perangkat Anda; unggah belum tersedia.
                </span>
                <Input
                  id="report-attachments"
                  type="file"
                  accept=".jpg,.jpeg,.png,.mp4,.pdf,image/jpeg,image/png,video/mp4,application/pdf"
                  multiple
                  className="sr-only"
                  aria-label="Pilih bukti pendukung"
                  aria-describedby={fileError ? "file-error" : undefined}
                  onChange={(event) => {
                    handleFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
              </label>
              {fileError ? (
                <p
                  id="file-error"
                  role="alert"
                  className="text-destructive text-sm"
                >
                  {fileError}
                </p>
              ) : null}
              {attachments.length ? (
                <ul className="space-y-2" aria-label="Bukti yang dipilih">
                  {attachments.map((attachment) => {
                    const isImage = /\.(jpe?g|png)$/i.test(
                      attachment.file.name,
                    );
                    const isVideo = /\.mp4$/i.test(attachment.file.name);
                    return (
                      <li
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-lg border p-3"
                      >
                        {attachment.previewUrl && isImage ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={attachment.previewUrl}
                            alt={`Pratinjau ${attachment.file.name}`}
                            className="size-12 rounded object-cover"
                          />
                        ) : attachment.previewUrl && isVideo ? (
                          <video
                            src={attachment.previewUrl}
                            aria-label={`Pratinjau video ${attachment.file.name}`}
                            controls
                            className="h-12 w-20 rounded object-cover"
                          />
                        ) : (
                          <FileText
                            aria-hidden="true"
                            className="text-muted-foreground size-8 shrink-0"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {attachment.file.name}
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {(attachment.file.size / (1024 * 1024)).toFixed(2)}{" "}
                            MB
                          </span>
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Hapus ${attachment.file.name}`}
                          onClick={() => removeAttachment(attachment.id)}
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                <p>
                  Hindari mengunggah dokumen yang memuat informasi pribadi
                  sensitif. File saat ini hanya dipreview dan tidak terkirim.
                </p>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-semibold">Nama samaran Anda</h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Gunakan nama samaran, bukan nama asli. Email dan nomor HP
                  tidak diminta.
                </p>
              </div>
              <fieldset className="space-y-3">
                <legend className="font-medium">Pengaturan privasi</legend>
                <label className="flex items-start gap-3 rounded-md border p-3">
                  <input
                    type="checkbox"
                    checked={values.isPublic}
                    onChange={(event) => {
                      updateValue("isPublic", event.target.checked);
                      if (!event.target.checked)
                        updateValue("showIdentity", false);
                    }}
                    className="accent-primary mt-1 size-4"
                  />
                  <span>
                    <span className="block font-medium">
                      Laporan Anda akan dibagikan secara publik
                    </span>
                    <span className="text-muted-foreground text-sm">
                      Jika tidak dicentang, laporan bersifat privat.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3 rounded-md border p-3">
                  <input
                    type="checkbox"
                    checked={values.isPublic && values.showIdentity}
                    disabled={!values.isPublic}
                    onChange={(event) =>
                      updateValue("showIdentity", event.target.checked)
                    }
                    className="accent-primary mt-1 size-4"
                  />
                  <span>
                    <span className="block font-medium">
                      Saya tidak keberatan jika nama samaran ditampilkan
                    </span>
                    <span className="text-muted-foreground text-sm">
                      Jika tidak dicentang, nama samaran tidak ditampilkan pada
                      laporan publik.
                    </span>
                  </span>
                </label>
                <p className="text-muted-foreground text-sm">
                  Pilihan saat ini:{" "}
                  <strong>
                    {!values.isPublic
                      ? "Privat"
                      : values.showIdentity
                        ? "Publik dengan nama samaran"
                        : "Publik anonim"}
                  </strong>
                </p>
              </fieldset>
              <FormField
                id="report-name"
                label="Nama samaran Anda"
                required
                error={nameError}
              >
                <Input
                  id="report-name"
                  name="pseudonym"
                  autoComplete="nickname"
                  value={values.name}
                  maxLength={80}
                  aria-invalid={Boolean(nameError)}
                  aria-describedby={
                    nameError ? "report-name-error" : undefined
                  }
                  onChange={(event) => updateValue("name", event.target.value)}
                  placeholder="Contoh: Melati Senja"
                />
              </FormField>
              <p className="flex items-start gap-2 rounded-md bg-blue-50 p-3 text-sm text-blue-900 dark:bg-blue-950/50 dark:text-blue-200">
                <ShieldCheck
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0"
                />
                Jangan masukkan nama asli atau informasi pribadi ke nama
                samaran. Email dan nomor HP tidak dikumpulkan.
              </p>
            </div>
          ) : null}

          {submitError ? (
            <p
              role="alert"
              className="bg-destructive/10 text-destructive mt-5 rounded-md p-3 text-sm"
            >
              {submitError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse justify-between gap-3 border-t pt-5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSubmitError("");
                setStep((current) => Math.max(0, current - 1));
              }}
              disabled={step === 0}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Kembali
            </Button>
            {step < STEPS.length - 1 ? (
              <Button
                type="button"
                onClick={() => {
                  setSubmitError("");
                  setStep((current) => Math.min(STEPS.length - 1, current + 1));
                }}
                disabled={!validateStep(step, values)}
              >
                Lanjut
                <ArrowRight aria-hidden="true" className="size-4" />
              </Button>
            ) : (
              <Button
                type="submit"
                disabled={
                  !validateStep(step, values) ||
                  isSubmitting ||
                  submissionReceipt !== null
                }
              >
                {isSubmitting
                  ? "Menyimpan laporan…"
                  : submissionReceipt
                    ? "Laporan terkirim"
                    : "Submit laporan"}
                <Check aria-hidden="true" className="size-4" />
              </Button>
            )}
          </div>
        </form>

        <p className="text-muted-foreground mt-4 text-xs">
          Ingin melihat halaman lain?{" "}
          <Link
            href="/report/tracking"
            className="text-primary font-medium underline underline-offset-4"
          >
            Lacak laporan secara publik
          </Link>
        </p>
      </section>

      <aside className="space-y-4">
        <section className="bg-card rounded-xl border p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <ImagePlus aria-hidden="true" className="text-primary size-5" />
            Laporan jelas, lebih mudah ditangani
          </h2>
          <ul className="mt-4 space-y-4 text-sm">
            {[
              ["Ceritakan fakta", "Jelaskan apa, kapan, dan dampaknya."],
              ["Tentukan lokasi", "Tambahkan alamat dan patokan yang jelas."],
              ["Lengkapi bukti", "Gunakan foto atau dokumen yang relevan."],
              [
                "Pantau perkembangan",
                "Lacak tindak lanjut setelah pengiriman diaktifkan.",
              ],
            ].map(([title, detail]) => (
              <li key={title} className="flex gap-2">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 text-emerald-700 dark:text-emerald-400"
                />
                <span>
                  <strong className="block">{title}</strong>
                  <span className="text-muted-foreground">{detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl bg-blue-50 p-5 text-sm text-blue-950 dark:bg-blue-950/50 dark:text-blue-100">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck aria-hidden="true" className="size-5" />
            Anda memilih apa yang dibagikan
          </h2>
          <p className="mt-2 text-blue-900 dark:text-blue-200">
            Saat ini formulir hanya menyimpan isian di perangkat selama halaman
            terbuka. Pengiriman dan penyimpanan belum diaktifkan.
          </p>
        </section>
        <section className="rounded-xl bg-amber-50 p-5 text-sm text-amber-950 dark:bg-amber-950/40 dark:text-amber-100">
          <h2 className="flex items-center gap-2 font-semibold">
            <AlertTriangle aria-hidden="true" className="size-5" />
            Bukan untuk keadaan darurat
          </h2>
          <p className="mt-2">
            Jika ada ancaman keselamatan langsung, hubungi layanan darurat atau
            pihak berwenang setempat.
          </p>
        </section>
      </aside>
    </div>
  );
}
