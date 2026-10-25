export type ProjectStatus = "Selesai" | "Berjalan" | "Tertunda";

export interface Project {
  id: string;
  name: string;
  agency: string;
  region: string;
  budget: number;
  realization: number;
  progress: number;
  status: ProjectStatus;
  schedule: string;
  beneficiaries: string;
  description: string;
  milestones: string[];
}

// TODO: Replace these illustrative records with the read-only public projects endpoint.
export const PROJECTS: Project[] = [
  {
    id: "jalan-provinsi",
    name: "Peningkatan Jalan Provinsi",
    agency: "Dinas Bina Marga",
    region: "Kab. Bandung",
    budget: 120_000_000_000,
    realization: 120_000_000_000,
    progress: 100,
    status: "Selesai",
    schedule: "Jan – Des 2025",
    beneficiaries: "12.400 warga",
    description:
      "Peningkatan kualitas jalan provinsi untuk memperkuat akses antarkawasan.",
    milestones: [
      "Perencanaan selesai",
      "Pekerjaan konstruksi selesai",
      "Target tuntas Desember",
    ],
  },
  {
    id: "rehabilitasi-sekolah-bogor",
    name: "Rehabilitasi 12 sekolah",
    agency: "Dinas Pendidikan",
    region: "Kab. Bogor",
    budget: 80_000_000_000,
    realization: 60_000_000_000,
    progress: 75,
    status: "Berjalan",
    schedule: "Jan – Des 2025",
    beneficiaries: "3.600 siswa",
    description:
      "Perbaikan ruang kelas dan sanitasi pada 12 sekolah di Kabupaten Bogor. Penanggung jawab: Dinas Pendidikan Provinsi Jawa Barat.",
    milestones: [
      "Perencanaan selesai",
      "9 dari 12 sekolah selesai",
      "Target tuntas Desember",
    ],
  },
  {
    id: "pembangunan-puskesmas-garut",
    name: "Pembangunan Puskesmas",
    agency: "Dinas Kesehatan",
    region: "Kab. Garut",
    budget: 60_000_000_000,
    realization: 36_000_000_000,
    progress: 60,
    status: "Berjalan",
    schedule: "Mar – Des 2025",
    beneficiaries: "18.000 warga",
    description:
      "Pembangunan fasilitas layanan kesehatan tingkat pertama di Kabupaten Garut.",
    milestones: [
      "Perencanaan selesai",
      "Pembangunan struktur berjalan",
      "Target tuntas Desember",
    ],
  },
  {
    id: "sistem-air-bersih-cianjur",
    name: "Sistem air bersih",
    agency: "Dinas Sumber Daya Air",
    region: "Kab. Cianjur",
    budget: 40_000_000_000,
    realization: 14_000_000_000,
    progress: 35,
    status: "Tertunda",
    schedule: "Jan – Des 2025",
    beneficiaries: "8.200 warga",
    description:
      "Perluasan akses air bersih untuk permukiman di Kabupaten Cianjur.",
    milestones: [
      "Perencanaan selesai",
      "Pekerjaan jaringan tertunda",
      "Target tuntas Desember",
    ],
  },
  {
    id: "irigasi-subang",
    name: "Rehabilitasi jaringan irigasi",
    agency: "Dinas Sumber Daya Air",
    region: "Kab. Subang",
    budget: 32_000_000_000,
    realization: 21_000_000_000,
    progress: 68,
    status: "Berjalan",
    schedule: "Feb – Nov 2025",
    beneficiaries: "2.100 petani",
    description:
      "Rehabilitasi saluran irigasi untuk menjaga pasokan air area pertanian.",
    milestones: [
      "Perencanaan selesai",
      "Saluran utama selesai",
      "Target tuntas November",
    ],
  },
  {
    id: "jembatan-sukabumi",
    name: "Pembangunan jembatan desa",
    agency: "Dinas Bina Marga",
    region: "Kab. Sukabumi",
    budget: 28_000_000_000,
    realization: 28_000_000_000,
    progress: 100,
    status: "Selesai",
    schedule: "Jan – Agu 2025",
    beneficiaries: "5.400 warga",
    description:
      "Pembangunan jembatan penghubung antardesa di Kabupaten Sukabumi.",
    milestones: [
      "Perencanaan selesai",
      "Konstruksi selesai",
      "Serah terima selesai",
    ],
  },
  {
    id: "posyandu-depok",
    name: "Renovasi fasilitas Posyandu",
    agency: "Dinas Kesehatan",
    region: "Kota Depok",
    budget: 18_000_000_000,
    realization: 9_000_000_000,
    progress: 50,
    status: "Berjalan",
    schedule: "Apr – Des 2025",
    beneficiaries: "6.700 keluarga",
    description:
      "Perbaikan fasilitas Posyandu dan ruang layanan kesehatan ibu dan anak.",
    milestones: [
      "Perencanaan selesai",
      "Renovasi tahap dua berjalan",
      "Target tuntas Desember",
    ],
  },
  {
    id: "drainase-bekasi",
    name: "Perbaikan drainase perkotaan",
    agency: "Dinas Pekerjaan Umum",
    region: "Kota Bekasi",
    budget: 15_000_000_000,
    realization: 4_500_000_000,
    progress: 30,
    status: "Tertunda",
    schedule: "Mei – Des 2025",
    beneficiaries: "9.100 warga",
    description:
      "Peningkatan kapasitas drainase di beberapa titik rawan genangan.",
    milestones: [
      "Perencanaan selesai",
      "Pekerjaan saluran tertunda",
      "Target tuntas Desember",
    ],
  },
];

export function filterProjects(
  projects: readonly Project[],
  search: string,
  status: ProjectStatus | "Semua status",
): Project[] {
  const normalizedSearch = search.trim().toLocaleLowerCase("id");

  return projects.filter((project) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      `${project.name} ${project.agency}`
        .toLocaleLowerCase("id")
        .includes(normalizedSearch);
    return (
      matchesSearch && (status === "Semua status" || project.status === status)
    );
  });
}

export function sortProjectsByBudget(projects: readonly Project[]): Project[] {
  return [...projects].sort(
    (first, second) =>
      second.budget - first.budget || first.id.localeCompare(second.id),
  );
}

function escapeCsvValue(value: string | number): string {
  const text = String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function exportProjectsCsv(projects: readonly Project[]): string {
  const headers = [
    "Proyek",
    "Instansi",
    "Wilayah",
    "Anggaran",
    "Realisasi",
    "Progres fisik",
    "Status",
  ];
  const rows = projects.map((project) => [
    project.name,
    project.agency,
    project.region,
    project.budget,
    project.realization,
    `${project.progress}%`,
    project.status,
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\r\n");
}
