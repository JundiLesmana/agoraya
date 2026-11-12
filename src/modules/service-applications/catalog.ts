export const SERVICE_APPLICATION_CATEGORIES = [
  "permit",
  "education",
  "social",
  "health",
] as const;

export type ServiceApplicationCategory =
  (typeof SERVICE_APPLICATION_CATEGORIES)[number];

export const SERVICE_APPLICATION_CATALOG = {
  permit: {
    label: "Perizinan",
    href: "/citizen/apply/permit",
    agency: "Dinas Penanaman Modal dan PTSP",
    prefix: "IZN",
    services: {
      "nib-usaha-mikro": "NIB / usaha mikro",
      "izin-kegiatan": "Izin kegiatan",
      "perizinan-lainnya": "Perizinan lainnya",
    },
  },
  education: {
    label: "Pendidikan",
    href: "/citizen/apply/education",
    agency: "Dinas Pendidikan",
    prefix: "EDU",
    services: {
      "bantuan-biaya": "Bantuan biaya",
      "administrasi-siswa": "Administrasi siswa",
      "konsultasi-pendidikan": "Konsultasi pendidikan",
    },
  },
  social: {
    label: "Sosial",
    href: "/citizen/apply/social",
    agency: "Dinas Sosial",
    prefix: "SCL",
    services: {
      "kebutuhan-dasar": "Kebutuhan dasar",
      "dukungan-keluarga": "Dukungan keluarga",
      "bantuan-darurat": "Bantuan darurat",
    },
  },
  health: {
    label: "Kesehatan",
    href: "/citizen/apply/health",
    agency: "Dinas Kesehatan",
    prefix: "KSE",
    services: {
      "konsultasi-informasi": "Konsultasi & informasi layanan",
      "permohonan-layanan-puskesmas": "Permohonan layanan Puskesmas",
      "aduan-fasilitas-kesehatan": "Aduan fasilitas kesehatan",
    },
  },
} as const satisfies Record<
  ServiceApplicationCategory,
  {
    label: string;
    href: string;
    agency: string;
    prefix: "IZN" | "EDU" | "SCL" | "KSE";
    services: Record<string, string>;
  }
>;