/**
 * Presentasi data KYC untuk halaman detail pengajuan verifikasi akun warga.
 *
 * Fungsi-fungsi di sini bersifat murni (pure) dan hanya difORMAT untuk tampilan.
 * Tidak ada logika bisnis atau autorisasi di sini.
 */

/** Susunan penyamaran NIK: tampilkan 4 digit pertama dan 4 digit terakhir, sisa disamarkan. */
export function maskNik(nik: string): string {
  if (!nik) return "";
  const visible = 4;
  if (nik.length <= visible * 2) {
    return "•".repeat(nik.length);
  }
  return `${nik.slice(0, visible)}${"•".repeat(nik.length - visible * 2)}${nik.slice(
    -visible,
  )}`;
}

/** Susunan penyamaran email: tampilkan 1 karakter awal, bagian tengah disamarkan, domain utuh. */
export function maskEmail(email: string): string {
  const at = email.indexOf("@");
  if (at <= 0) return "••••";
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const maskedLocal = local.length > 0 ? local[0] + "***" : "***";
  return `${maskedLocal}@${domain}`;
}

/** Format ukuran berkas untuk ditampilkan di metadata dokumen pendukung. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}

/** Status bagian pemeriksaan yang tersedia di sidebar. */
export const INSPECTION_STATUS_OPTIONS = [
  { value: "belum", label: "Belum diperiksa" },
  { value: "perbaikan", label: "Perlu perbaikan" },
  { value: "sesuai", label: "Sesuai" },
] as const;

export type InspectionStatusValue = (typeof INSPECTION_STATUS_OPTIONS)[number]["value"];
