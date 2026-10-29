export type ServiceCategory = "Pengaduan" | "Perizinan" | "Bansos" | "Kesehatan";

export interface PublicService {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  agency: string;
  prefix: "PGD" | "IZN" | "BSL" | "KSE";
}

// TODO(#86): replace this simulated catalog with data from the public-services API.
export const PUBLIC_SERVICES: readonly PublicService[] = [
  {
    id: "business-permit",
    name: "Perizinan",
    description: "Ajukan perizinan usaha mikro dengan panduan dokumen.",
    category: "Perizinan",
    agency: "Dinas Penanaman Modal dan PTSP",
    prefix: "IZN",
  },
  {
    id: "education-aid",
    name: "Pendidikan",
    description: "Ajukan bantuan pendidikan bagi warga yang memenuhi kriteria.",
    category: "Bansos",
    agency: "Dinas Sosial",
    prefix: "BSL",
  },
  {
    id: "social-aid",
    name: "Sosial",
    description: "Sampaikan kebutuhan bantuan sosial untuk keluarga.",
    category: "Bansos",
    agency: "Dinas Sosial",
    prefix: "BSL",
  },
  {
    id: "health-service",
    name: "Kesehatan",
    description: "Akses layanan kesehatan dan fasilitas puskesmas.",
    category: "Kesehatan",
    agency: "Dinas Kesehatan",
    prefix: "KSE",
  },
];

export const APPLICATION_STEPS = [
  "Pilih Layanan",
  "Data & Detail",
  "Dokumen",
  "Review",
] as const;

export const MAX_DOCUMENT_SIZE = 5 * 1024 * 1024;

export function getWizardProgress(step: number): number {
  return Math.round((step / APPLICATION_STEPS.length) * 100);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidNik(nik: string): boolean {
  return /^\d{16}$/.test(nik);
}

export function getDocumentValidationError(
  file: Pick<File, "name" | "type" | "size">,
): string | null {
  const extension = file.name.split(".").pop()?.toLowerCase();
  const isPdf = extension === "pdf" && file.type === "application/pdf";
  const isJpeg =
    (extension === "jpg" || extension === "jpeg") && file.type === "image/jpeg";

  if (!isPdf && !isJpeg) {
    return "Format tidak didukung. Pilih berkas PDF atau JPG.";
  }
  if (file.size > MAX_DOCUMENT_SIZE) {
    return "Ukuran berkas melebihi batas 5 MB.";
  }
  return null;
}
