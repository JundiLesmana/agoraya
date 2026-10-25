export type ProjectStatus = 'Selesai' | 'Berjalan' | 'Tertunda';

export type Project = {
  id: string;
  nama_proyek: string;
  wilayah: string;
  kabupaten: string;
  sektor: string;
  status: ProjectStatus;
  tahun: number;
  triwulan: string;
  anggaran: number;
  realisasi: number;
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    nama_proyek: 'Jalan Raya Barat',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kabupaten Bandung',
    sektor: 'Infrastruktur',
    status: 'Selesai',
    tahun: 2025,
    triwulan: 'TW III',
    anggaran: 500000000,
    realisasi: 320000000,
  },
  {
    id: '2',
    nama_proyek: 'Jembatan Siliwangi',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kabupaten Bandung',
    sektor: 'Infrastruktur',
    status: 'Berjalan',
    tahun: 2025,
    triwulan: 'TW III',
    anggaran: 350000000,
    realisasi: 175000000,
  },
  {
    id: '3',
    nama_proyek: 'TPST Ciparay',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kabupaten Bandung',
    sektor: 'Kesehatan',
    status: 'Tertunda',
    tahun: 2025,
    triwulan: 'TW III',
    anggaran: 120000000,
    realisasi: 48000000,
  },
  {
    id: '4',
    nama_proyek: 'SDN Cicadas',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kabupaten Bogor',
    sektor: 'Pendidikan',
    status: 'Selesai',
    tahun: 2025,
    triwulan: 'TW II',
    anggaran: 200000000,
    realisasi: 200000000,
  },
  {
    id: '5',
    nama_proyek: 'Puskesmas Tajurhalang',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kabupaten Bogor',
    sektor: 'Kesehatan',
    status: 'Berjalan',
    tahun: 2025,
    triwulan: 'TW III',
    anggaran: 450000000,
    realisasi: 180000000,
  },
  {
    id: '6',
    nama_proyek: 'Jalan Raya Bogor',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kabupaten Bogor',
    sektor: 'Infrastruktur',
    status: 'Tertunda',
    tahun: 2024,
    triwulan: 'TW IV',
    anggaran: 600000000,
    realisasi: 0,
  },
  {
    id: '7',
    nama_proyek: 'SMAN 1 Bogor',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kabupaten Bogor',
    sektor: 'Pendidikan',
    status: 'Berjalan',
    tahun: 2025,
    triwulan: 'TW III',
    anggaran: 300000000,
    realisasi: 150000000,
  },
  {
    id: '8',
    nama_proyek: 'RSUD Cimahi',
    wilayah: 'Provinsi Jawa Barat',
    kabupaten: 'Kota Cimahi',
    sektor: 'Kesehatan',
    status: 'Selesai',
    tahun: 2025,
    triwulan: 'TW II',
    anggaran: 800000000,
    realisasi: 800000000,
  },
];

export type ProjectFilters = {
  wilayah?: string | null;
  periode?: string | null;
  sektor?: string | null;
  status?: string | null;
};

export function filterProjects(
  projects: Project[],
  filters: ProjectFilters,
): Project[] {
  let result = projects;

  const { wilayah, periode, sektor, status } = filters;

  if (wilayah) {
    result = result.filter(
      (p) => p.wilayah === wilayah || p.kabupaten === wilayah,
    );
  }

  if (sektor && sektor !== 'Semua sektor') {
    result = result.filter((p) => p.sektor === sektor);
  }

  if (status && status !== 'Semua status') {
    result = result.filter((p) => p.status === status);
  }

  if (periode) {
    const [tahunPart, triwulanPart] = String(periode).split(' · ');
    if (tahunPart) {
      result = result.filter((p) => String(p.tahun) === tahunPart);
    }
    if (triwulanPart) {
      result = result.filter(
        (p) => p.triwulan === triwulanPart.replace('s.d. ', ''),
      );
    }
  }

  return result;
}

// TODO(#42): replace with real data from BPS / infrastructure_projects table
