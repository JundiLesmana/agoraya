import { z } from "zod";

export const PROJECT_PAGE_SIZE = 40;
export const PROJECT_DIRECTORY_TOTAL = 240;

export const projectDirectoryItemSchema = z.object({
  id: z.string(),
  nama_proyek: z.string(),
  instansi: z.string(),
  lokasi: z.string(),
  sektor: z.string(),
  anggaran: z.number().nonnegative(),
  progres_fisik: z.number().min(0).max(100),
  target_selesai: z.string(),
  status: z.enum(["Selesai", "Berjalan", "Tertunda"]),
});

export type ProjectDirectoryItem = z.infer<typeof projectDirectoryItemSchema>;

export const projectPageResponseSchema = z.object({
  data: z.array(projectDirectoryItemSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
});

export type ProjectPageResponse = z.infer<typeof projectPageResponseSchema>;

const SAMPLE_PROJECTS: ProjectDirectoryItem[] = [
  {
    id: "project-001",
    nama_proyek: "Peningkatan jalan provinsi",
    instansi: "Dinas Bina Marga",
    lokasi: "Kab. Bandung",
    sektor: "Infrastruktur",
    anggaran: 120_000_000_000,
    progres_fisik: 100,
    target_selesai: "30 Sep 2025",
    status: "Selesai",
  },
  {
    id: "project-002",
    nama_proyek: "Rehabilitasi 12 sekolah",
    instansi: "Dinas Pendidikan",
    lokasi: "Kab. Bogor",
    sektor: "Pendidikan",
    anggaran: 80_000_000_000,
    progres_fisik: 75,
    target_selesai: "31 Des 2025",
    status: "Berjalan",
  },
  {
    id: "project-003",
    nama_proyek: "Pembangunan Puskesmas",
    instansi: "Dinas Kesehatan",
    lokasi: "Kab. Garut",
    sektor: "Kesehatan",
    anggaran: 60_000_000_000,
    progres_fisik: 60,
    target_selesai: "30 Nov 2025",
    status: "Berjalan",
  },
  {
    id: "project-004",
    nama_proyek: "Sistem air bersih",
    instansi: "Dinas Sumber Daya Air",
    lokasi: "Kab. Cianjur",
    sektor: "Infrastruktur",
    anggaran: 40_000_000_000,
    progres_fisik: 35,
    target_selesai: "31 Des 2025",
    status: "Tertunda",
  },
];

const LOCATIONS = [
  "Kab. Bogor",
  "Kab. Bandung",
  "Kab. Garut",
  "Kab. Cianjur",
  "Kab. Sukabumi",
  "Kab. Cirebon",
  "Kab. Tasikmalaya",
  "Kab. Karawang",
  "Kab. Subang",
  "Kota Bandung",
  "Kota Bekasi",
  "Kab. Sumedang",
  "Kab. Bandung Barat",
  "Kab. Bekasi",
  "Kab. Ciamis",
  "Kab. Indramayu",
  "Kab. Kuningan",
  "Kab. Majalengka",
  "Kab. Pangandaran",
  "Kab. Purwakarta",
  "Kota Banjar",
  "Kota Bogor",
  "Kota Cimahi",
  "Kota Cirebon",
  "Kota Depok",
  "Kota Sukabumi",
  "Kota Tasikmalaya",
] as const;

const PROJECT_TEMPLATES = [
  {
    name: "Perbaikan jalan kabupaten",
    agency: "Dinas Bina Marga",
    sector: "Infrastruktur",
  },
  {
    name: "Renovasi ruang kelas",
    agency: "Dinas Pendidikan",
    sector: "Pendidikan",
  },
  {
    name: "Peningkatan layanan puskesmas",
    agency: "Dinas Kesehatan",
    sector: "Kesehatan",
  },
  {
    name: "Pembangunan saluran irigasi",
    agency: "Dinas Sumber Daya Air",
    sector: "Infrastruktur",
  },
  {
    name: "Pengadaan fasilitas sekolah",
    agency: "Dinas Pendidikan",
    sector: "Pendidikan",
  },
  {
    name: "Perbaikan jaringan air bersih",
    agency: "Dinas Perumahan dan Permukiman",
    sector: "Infrastruktur",
  },
  {
    name: "Peningkatan fasilitas kesehatan",
    agency: "Dinas Kesehatan",
    sector: "Kesehatan",
  },
  {
    name: "Penataan ruang terbuka hijau",
    agency: "Dinas Lingkungan Hidup",
    sector: "Sektor lainnya",
  },
  {
    name: "Pengembangan layanan publik",
    agency: "Dinas Komunikasi dan Informatika",
    sector: "Sektor lainnya",
  },
  {
    name: "Pembangunan jembatan penghubung",
    agency: "Dinas Bina Marga",
    sector: "Infrastruktur",
  },
] as const;

const TARGET_DATES = ["30 Sep 2025", "30 Nov 2025", "31 Des 2025"] as const;
const SECTOR_QUOTAS = [
  { sector: "Infrastruktur", count: 78 },
  { sector: "Pendidikan", count: 59 },
  { sector: "Kesehatan", count: 59 },
  { sector: "Sektor lainnya", count: 40 },
] as const;

function sectorForAdditionalProject(index: number): string {
  let cumulative = 0;
  for (const quota of SECTOR_QUOTAS) {
    cumulative += quota.count;
    if (index < cumulative) return quota.sector;
  }
  throw new Error("Illustrative project sector quotas must cover all projects.");
}

function additionalIndexInSector(index: number, sector: string): number {
  let start = 0;
  for (const quota of SECTOR_QUOTAS) {
    if (quota.sector === sector) return index - start;
    start += quota.count;
  }
  throw new Error("Illustrative project sector is not configured.");
}

function statusForAdditionalProject(
  index: number,
  sector: string,
): ProjectDirectoryItem["status"] {
  const position = additionalIndexInSector(index, sector);
  let completedCount = 0;
  let delayedCount = 0;
  switch (sector) {
    case "Infrastruktur":
      completedCount = 51;
      break;
    case "Pendidikan":
      completedCount = 39;
      delayedCount = 3;
      break;
    case "Kesehatan":
      completedCount = 39;
      delayedCount = 3;
      break;
    case "Sektor lainnya":
      completedCount = 26;
      delayedCount = 5;
      break;
    default:
      throw new Error("Illustrative project sector is not configured.");
  }

  if (position < completedCount) return "Selesai";
  if (position < completedCount + delayedCount) {
    return "Tertunda";
  }
  return "Berjalan";
}

function templateForProject(sector: string, index: number) {
  const templates = PROJECT_TEMPLATES.filter(
    (template) => template.sector === sector,
  );
  return cycleValue(templates, index);
}

function cycleValue<T>(values: readonly T[], index: number): T {
  const value = values.at(index % values.length);
  if (value === undefined) {
    throw new Error("Illustrative project data requires non-empty templates.");
  }
  return value;
}

function createIllustrativeProjects(): ProjectDirectoryItem[] {
  const additionalProjects = Array.from(
    { length: PROJECT_DIRECTORY_TOTAL - SAMPLE_PROJECTS.length },
    (_, index) => {
      const sector = sectorForAdditionalProject(index);
      const template = templateForProject(sector, index);
      const location = cycleValue(LOCATIONS, index);
      const sequence = index + SAMPLE_PROJECTS.length + 1;
      const status = statusForAdditionalProject(index, sector);

      return {
        id: `project-${String(sequence).padStart(3, "0")}`,
        nama_proyek: `${template.name} ${Math.floor(index / PROJECT_TEMPLATES.length) + 1}`,
        instansi: template.agency,
        lokasi: location,
        sektor: template.sector,
        anggaran: (5 + (index % 35)) * 1_000_000_000,
        progres_fisik: (index * 17) % 101,
        target_selesai: cycleValue(TARGET_DATES, index),
        status,
      };
    },
  );

  return [...SAMPLE_PROJECTS, ...additionalProjects];
}

// TODO: replace illustrative records with the public projects data source.
export const PROJECT_DIRECTORY = createIllustrativeProjects();

export type ProjectDirectoryFilters = {
  search?: string;
  status?: ProjectDirectoryItem["status"];
  sort?: "anggaran_desc" | "anggaran_asc";
  wilayah?: string;
  periode?: string;
  sektor?: string;
};

function normalizeLocation(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  const kabupaten = normalized.replace(
    /^(?:kabupaten\s+|kab\.\s*|kab\s+)/i,
    "Kabupaten ",
  );
  return kabupaten.toLocaleLowerCase("id-ID");
}

export function filterProjectDirectory(
  projects: readonly ProjectDirectoryItem[],
  filters: Pick<
    ProjectDirectoryFilters,
    "search" | "status" | "wilayah" | "periode" | "sektor"
  >,
): ProjectDirectoryItem[] {
  const search = filters.search?.trim().toLocaleLowerCase("id-ID");
  const normalizedWilayah = filters.wilayah
    ? normalizeLocation(filters.wilayah)
    : undefined;

  return projects.filter((project) => {
    const matchesSearch =
      !search ||
      project.nama_proyek.toLocaleLowerCase("id-ID").includes(search) ||
      project.instansi.toLocaleLowerCase("id-ID").includes(search);
    const matchesStatus = !filters.status || project.status === filters.status;
    const normalizedLokasi = normalizeLocation(project.lokasi);
    const matchesWilayah =
      !normalizedWilayah ||
      filters.wilayah === "Provinsi Jawa Barat" ||
      normalizedLokasi === normalizedWilayah;
    const matchesSektor =
      !filters.sektor ||
      filters.sektor === "Semua sektor" ||
      project.sektor === filters.sektor;
    const matchesPeriode =
      !filters.periode || filters.periode === "2025 · s.d. TW III";

    return (
      matchesSearch &&
      matchesStatus &&
      matchesWilayah &&
      matchesSektor &&
      matchesPeriode
    );
  });
}

export function sortProjectDirectory(
  projects: readonly ProjectDirectoryItem[],
  sort: ProjectDirectoryFilters["sort"] = "anggaran_desc",
): ProjectDirectoryItem[] {
  return [...projects].sort((first, second) =>
    sort === "anggaran_asc"
      ? first.anggaran - second.anggaran
      : second.anggaran - first.anggaran,
  );
}

export function paginateProjectDirectory(
  projects: readonly ProjectDirectoryItem[],
  page = 1,
  pageSize = PROJECT_PAGE_SIZE,
): ProjectPageResponse {
  const total = projects.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;

  return {
    data: projects.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}
