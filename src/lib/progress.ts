import { z } from "zod";

export const PROGRESS_WARNING_THRESHOLD = 15;

export interface PhysicalProgressValidationInput {
  readonly currentPhysicalProgress: number;
  readonly lastPhysicalProgress: number;
}

export interface PhysicalProgressValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

/**
 * Validasi integritas data: progres fisik tidak boleh menurun (mundur)
 * dibanding pelaporan bulan sebelumnya. Mengembalikan valid = false ketika
 * input lebih kecil dari progres terakhir. Alur koreksi/revisi ditangani
 * khusus oleh admin dan di luar cakupan halaman input ini.
 */
export function validatePhysicalProgressNonDecreasing(
  input: PhysicalProgressValidationInput,
): PhysicalProgressValidationResult {
  const { currentPhysicalProgress, lastPhysicalProgress } = input;

  if (
    !Number.isFinite(currentPhysicalProgress) ||
    !Number.isFinite(lastPhysicalProgress)
  ) {
    return { valid: true };
  }

  if (currentPhysicalProgress < lastPhysicalProgress) {
    return {
      valid: false,
      error: `Progres fisik ${currentPhysicalProgress}% tidak boleh lebih kecil dari pelaporan sebelumnya (${lastPhysicalProgress}%). Progres fisik tidak boleh menurun; ajukan koreksi melalui alur admin jika terdapat kesalahan input.`,
    };
  }

  return { valid: true };
}

export interface ProgressDeviation {
  readonly physical: number;
  readonly financial: number;
  readonly difference: number;
  readonly warning: boolean;
}

/**
 * Hitung selisih progres fisik vs progres keuangan. warning = true ketika
 * selisih absolut melebihi ambang 15 persen (peringatan hanya, tidak memblokir).
 */
export function computeProgressDeviation(
  physical: number,
  financial: number,
): ProgressDeviation {
  const difference = physical - financial;
  return {
    physical,
    financial,
    difference,
    warning: Math.abs(difference) > PROGRESS_WARNING_THRESHOLD,
  };
}

export interface ProgressDocument {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly url?: string;
}

export interface ProgressReport {
  readonly id: string;
  readonly projectId: string;
  readonly periodeBulan: number;
  readonly periodeTahun: number;
  readonly progresFisik: number;
  readonly progresKeuangan: number;
  readonly catatan: string;
  readonly status: "draft" | "submitted";
  readonly dokumen: readonly ProgressDocument[];
  readonly createdAt: Date;
  readonly inputBy: string;
}

export const progressReportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  periodeBulan: z.number().int().min(1).max(12),
  periodeTahun: z.number().int(),
  progresFisik: z.number().min(0).max(100),
  progresKeuangan: z.number().min(0).max(100),
  catatan: z.string(),
  status: z.enum(["draft", "submitted"]),
  dokumen: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      size: z.number().nonnegative(),
      type: z.enum(["image/jpeg", "image/png"]),
      url: z.string().url().optional(),
    }),
  ),
  createdAt: z.coerce.date(),
  inputBy: z.string(),
});

export const BULAN_INDONESIA = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function periodeLabel(bulan: number, tahun: number): string {
  return `${BULAN_INDONESIA[bulan - 1]} ${tahun}`;
}
