import type { ProgressReport } from "@/lib/progress";

export interface ProjectDetail {
  readonly id: string;
  readonly namaPaket: string;
  readonly instansi: string;
  readonly lokasi: string;
  readonly sektor: string;
  readonly nilaiKontrak: number;
  readonly penyedia: string;
  readonly tanggalMulai: string;
  readonly tanggalSelesai: string;
  readonly tahunAnggaran: number;
  readonly progresFisik: number;
  readonly progresKeuangan: number;
  readonly status: "Selesai" | "Berjalan" | "Tertunda";
}

export interface ProjectProgressPageData {
  readonly project: ProjectDetail;
  readonly history: readonly ProgressReport[];
}
