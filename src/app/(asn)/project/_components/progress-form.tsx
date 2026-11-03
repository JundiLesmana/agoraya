"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import {
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/forms";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import {
  computeProgressDeviation,
  validatePhysicalProgressNonDecreasing,
} from "@/lib/progress";
import type { ProjectDetail } from "@/modules/project-progress/types";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png"];
const ALLOWED_MEDIA_TYPES = ["image/jpeg", "image/png"];

const FORM_SCHEMA = z.object({
  periodeBulan: z.coerce.number().min(1, "Bulan wajib dipilih").max(12),
  periodeTahun: z.coerce
    .number()
    .int()
    .min(2020, "Tahun minimal 2020")
    .max(2100, "Tahun maksimal 2100"),
  progresFisik: z.coerce
    .number()
    .min(0, "Minimal 0%")
    .max(100, "Maksimal 100%"),
  progresKeuangan: z.coerce
    .number()
    .min(0, "Minimal 0%")
    .max(100, "Maksimal 100%"),
  catatan: z.string().optional().default(""),
});

export type ProgressFormValues = z.infer<typeof FORM_SCHEMA>;

export interface ProgressFormProps {
  readonly project: ProjectDetail;
  readonly lastPhysicalProgress: number | null;
  readonly lastKeuanganProgress: number | null;
  readonly onSave: (
    values: ProgressFormValues,
    files: readonly File[],
    mode: "draft" | "submit",
  ) => void | Promise<void>;
  readonly saving: boolean;
}

const now = new Date();

const BULAN_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
] as const;

function formatFileSize(bytes: number): string {
  return (bytes / 1_048_576).toFixed(2) + " MB";
}

function validateFileSelection(files: readonly File[]): string | null {
  if (files.length > MAX_FILES)
    return `Maksimal ${MAX_FILES} foto dokumentasi.`;
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (
      !ALLOWED_EXTENSIONS.includes(extension) ||
      !ALLOWED_MEDIA_TYPES.includes(file.type)
    ) {
      return `Format file ${file.name} harus JPG atau PNG.`;
    }
    if (file.size > MAX_FILE_SIZE)
      return `Ukuran file ${file.name} maksimal 5 MB.`;
  }
  return null;
}

export function ProgressForm({
  project,
  lastPhysicalProgress,
  lastKeuanganProgress,
  onSave,
  saving,
}: ProgressFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const modeRef = useRef<"draft" | "submit">("submit");

  const defaultValues: ProgressFormValues = {
    periodeBulan: now.getMonth() + 1,
    periodeTahun: now.getFullYear(),
    progresFisik: lastPhysicalProgress ?? 0,
    progresKeuangan: lastKeuanganProgress ?? 0,
    catatan: "",
  };

  const form = useForm<ProgressFormValues>({ defaultValues, mode: "onChange" });
  const isSubmitting = form.formState.isSubmitting || saving;

  useEffect(() => {
    const urls: string[] = [];
    files.forEach((file) =>
      urls.push(file instanceof File ? URL.createObjectURL(file) : ""),
    );
    setPreviews(urls);
    return () => {
      urls.forEach(URL.revokeObjectURL);
    };
  }, [files]);

  const renderFieldError = (name: keyof ProgressFormValues) => {
    const message = formErrors[name];
    if (!message) return null;
    return (
      <p
        role="alert"
        data-testid={`error-${name}`}
        className="text-destructive text-xs font-medium"
      >
        {message}
      </p>
    );
  };

  const handleSubmit = useCallback(
    async (values: unknown) => {
      setSubmitError(null);
      setFileError(null);
      setFormErrors({});

      const parsed = FORM_SCHEMA.safeParse(values);
      if (!parsed.success) {
        const errors: Record<string, string> = {};
        for (const issue of parsed.error.issues) {
          const key = issue.path[0];
          if (typeof key === "string") {
            errors[key] = issue.message;
          }
        }
        setFormErrors(errors);
        return;
      }
      const data = parsed.data;

      if (lastPhysicalProgress != null) {
        const validation = validatePhysicalProgressNonDecreasing({
          currentPhysicalProgress: data.progresFisik,
          lastPhysicalProgress,
        });
        if (!validation.valid) {
          setFormErrors({
            progresFisik:
              validation.error ?? "Progres fisik tidak boleh menurun.",
          });
          return;
        }
      }

      const deviation = computeProgressDeviation(
        data.progresFisik,
        data.progresKeuangan,
      );
      if (deviation.warning) {
        setWarning(
          `Perhatikan: selisih progres fisik (${data.progresFisik}%) dan progres keuangan (${data.progresKeuangan}%) mencapai ${Math.abs(deviation.difference).toFixed(0)} persen, melebihi ambang peringatan 15%. Pastikan data sudah akurat sebelum diserahkan.`,
        );
      } else {
        setWarning(null);
      }

      const fileErr = validateFileSelection(files);
      if (fileErr) {
        setFileError(fileErr);
        return;
      }
      if (files.length === 0) {
        setFileError("Minimal satu foto dokumentasi lapangan wajib diunggah.");
        return;
      }

      try {
        await onSave(data, files, modeRef.current);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Gagal menyimpan progres ke server. Coba lagi.",
        );
      }
    },
    [files, lastPhysicalProgress, onSave],
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const next = Array.from(event.target.files ?? []);
      const error = validateFileSelection(next);
      setFileError(error ?? null);
      setFiles(error ? [] : next);
      event.target.value = "";
    },
    [],
  );

  const handleRemoveFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  }, []);

  return (
    <FormProvider {...form} key={String(project.id)}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
        className="space-y-4"
        aria-label="Formulir input progres bulanan"
      >
        <section className="space-y-4">
          {lastPhysicalProgress != null && (
            <p className="text-muted-foreground text-xs">
              Referensi pelaporan bulan lalu: fisik{" "}
              {lastPhysicalProgress.toFixed(2)}% · keuangan{" "}
              {lastKeuanganProgress?.toFixed(2) ?? "-"}%
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="periodeBulan" label="Bulan Pelaporan" required>
              <FormSelect
                placeholder="Pilih bulan"
                options={BULAN_OPTIONS}
                defaultValue={String(defaultValues.periodeBulan)}
              />
            </FormField>
            {renderFieldError("periodeBulan")}
            <FormField name="periodeTahun" label="Tahun Anggaran" required>
              <FormInput
                type="number"
                min="2020"
                max="2100"
                defaultValue={String(defaultValues.periodeTahun)}
                placeholder="2025"
              />
            </FormField>
            {renderFieldError("periodeTahun")}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField name="progresFisik" label="Progres Fisik (%)" required>
              <FormInput
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
              />
            </FormField>
            {renderFieldError("progresFisik")}
            <FormField
              name="progresKeuangan"
              label="Progres Keuangan (%)"
              required
            >
              <FormInput
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0"
              />
            </FormField>
            {renderFieldError("progresKeuangan")}
          </div>

          {warning ? (
            <div
              role="status"
              aria-live="polite"
              className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"
            >
              <AlertTriangle aria-hidden="true" className="size-5" />
              <p className="m-0">{warning}</p>
            </div>
          ) : null}

          <FormField name="catatan" label="Catatan Evaluasi / Kendala" required>
            <FormTextarea placeholder="Contoh: Pekerjaan jalan berjalan sesuai jadwal, ada keterlambatan pengiriman material…" />
          </FormField>

          <fieldset className="space-y-3 rounded-lg border p-3">
            <legend className="px-2 text-sm font-medium">
              Dokumentasi Foto Lapangan
            </legend>
            <p className="text-muted-foreground mb-3 text-xs">
              Maksimal {MAX_FILES} foto, format JPG/PNG, maksimal{" "}
              {formatFileSize(MAX_FILE_SIZE)} per foto.
            </p>
            <input
              id="dokumentasi-foto"
              type="file"
              multiple
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="sr-only"
              onChange={handleFileChange}
            />
            <label
              htmlFor="dokumentasi-foto"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const next = Array.from(event.dataTransfer.files);
                const error = validateFileSelection(next);
                setFileError(error);
                setFiles(error ? [] : next);
              }}
              className="hover:border-primary/50 focus-within:ring-ring block cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-within:ring-2"
            >
              <p className="text-sm">
                Dokumentasi Foto Lapangan — klik atau seret foto ke area ini
              </p>
              <p className="text-muted-foreground text-xs">
                Format JPG/PNG, maksimal 5 MB per foto.
              </p>
            </label>

            {fileError ? (
              <div
                role="alert"
                className="border-destructive/30 bg-destructive/5 text-destructive mt-3 rounded-lg border p-3 text-sm"
              >
                {fileError}
              </div>
            ) : null}

            {files.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="relative flex flex-col items-center gap-1"
                  >
                    <img
                      src={previews[index]}
                      alt={`Pratinjau ${file.name}`}
                      className="border-border h-20 w-20 rounded-md border object-cover"
                      decoding="async"
                    />
                    <p
                      className="text-muted-foreground w-20 truncate text-[10px] leading-none"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {formatFileSize(file.size)}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-destructive/60 hover:text-destructive absolute top-1 right-1 rounded-md p-1 transition-colors"
                      aria-label={`Hapus ${file.name}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </fieldset>

          {submitError ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 text-destructive mt-3 rounded-lg border p-3 text-sm"
            >
              {submitError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="submit"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                modeRef.current = "draft";
              }}
            >
              Simpan Draf
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              onClick={() => {
                modeRef.current = "submit";
              }}
            >
              Publikasikan/Submit ke Pimpinan
            </Button>
          </div>
        </section>
      </form>
    </FormProvider>
  );
}
