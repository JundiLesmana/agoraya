import { z } from 'zod';

export interface ProjectSummary {
  totalProyek: number;
  totalWilayah: number;
  selesai: number;
  berjalan: number;
  tertunda: number;
}

export interface ProjectDashboardSummary extends ProjectSummary {
  sektor: Array<{
    nama: string;
    selesai: number;
    total: number;
  }>;
}

export const projectDashboardSummarySchema = z.object({
  totalProyek: z.number().int().nonnegative(),
  totalWilayah: z.number().int().nonnegative(),
  selesai: z.number().int().nonnegative(),
  berjalan: z.number().int().nonnegative(),
  tertunda: z.number().int().nonnegative(),
  sektor: z.array(
    z.object({
      nama: z.string(),
      selesai: z.number().int().nonnegative(),
      total: z.number().int().nonnegative(),
    }),
  ),
});

/** Konversi rasio (0–1) ke string persen, misal 0.65 → "65%". */
export function formatPersentase(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Hitung rasio bagian terhadap total. Mengembalikan 0 jika total 0. */
export function hitungPersentase(bagian: number, total: number): number {
  if (total === 0) return 0;
  return bagian / total;
}

// TODO(#43): replace with real data from BPS / infrastructure_projects table