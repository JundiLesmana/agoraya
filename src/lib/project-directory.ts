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
    name: "Pembangunan jembatan penghubung",
    agency: "Dinas Bina Marga",
    sector: "Infrastruktur",
  },
] as const;

const STATUSES = ["Berjalan", "Selesai", "Tertunda"] as const;
const TARGET_DATES = ["30 Sep 2025", "30 Nov 2025", "31 Des 2025"] as const;

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
      const template = cycleValue(PROJECT_TEMPLATES, index);
      const location = cycleValue(LOCATIONS, index);
      const sequence = index + SAMPLE_PROJECTS.length + 1;

      return {
        id: `project-${String(sequence).padStart(3, "0")}`,
        nama_proyek: `${template.name} ${Math.floor(index / PROJECT_TEMPLATES.length) + 1}`,
        instansi: template.agency,
        lokasi: location,
        sektor: template.sector,
        anggaran: (5 + (index % 35)) * 1_000_000_000,
        progres_fisik: (index * 17) % 101,
        target_selesai: cycleValue(TARGET_DATES, index),
        status: cycleValue(STATUSES, index),
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
};

export function filterProjectDirectory(
  projects: readonly ProjectDirectoryItem[],
  filters: Pick<ProjectDirectoryFilters, "search" | "status">,
): ProjectDirectoryItem[] {
  const search = filters.search?.trim().toLocaleLowerCase("id-ID");

  return projects.filter((project) => {
    const matchesSearch =
      !search ||
      project.nama_proyek.toLocaleLowerCase("id-ID").includes(search) ||
      project.instansi.toLocaleLowerCase("id-ID").includes(search);
    const matchesStatus = !filters.status || project.status === filters.status;

    return matchesSearch && matchesStatus;
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
