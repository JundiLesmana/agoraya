"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Landmark,
  MapPin,
  Percent,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Activity,
  HeartPulse,
  UserRoundSearch,
  Users,
  Wallet,
} from "lucide-react";
import { BarChart } from "@/components/charts/bar-chart";
import { LineChart } from "@/components/charts/line-chart";
import { PieChart } from "@/components/charts/pie-chart";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import {
  formatPersentase,
  formatRupiah,
  formatRupiahForScreenReader,
} from "@/lib/public-data-format";
import { SummaryKpiCards } from "./summary-kpi-cards";

const REGIONS = [
  { value: "all", label: "Seluruh Indonesia", budget: 2_450, coverage: 514 },
  { value: "jabar", label: "Provinsi Jawa Barat", budget: 80, coverage: 27 },
  { value: "bogor", label: "Kabupaten Bogor", budget: 18, coverage: 1 },
  { value: "bandung", label: "Kota Bandung", budget: 14, coverage: 1 },
  { value: "jateng", label: "Provinsi Jawa Tengah", budget: 74, coverage: 35 },
  { value: "jatim", label: "Provinsi Jawa Timur", budget: 92, coverage: 38 },
] as const;

const YEARS = ["2023", "2024", "2025"] as const;
const PERIODS = [
  { value: "q1", label: "s.d. Triwulan I", months: 3, realization: 0.25 },
  { value: "q2", label: "s.d. Triwulan II", months: 6, realization: 0.5 },
  { value: "q3", label: "s.d. Triwulan III", months: 9, realization: 0.75 },
  { value: "q4", label: "Setahun penuh", months: 12, realization: 0.9375 },
] as const;
const REGIONAL_INDICATORS = [
  {
    region: "all",
    population: 284,
    ipm: 74.2,
    poverty: 9.0,
    unemployment: 5.3,
  },
  {
    region: "jabar",
    population: 50.4,
    ipm: 75.2,
    poverty: 7.4,
    unemployment: 6.8,
  },
  {
    region: "bogor",
    population: 5.5,
    ipm: 70.1,
    poverty: 7.3,
    unemployment: 8.2,
  },
  {
    region: "bandung",
    population: 2.5,
    ipm: 83.3,
    poverty: 3.6,
    unemployment: 8.1,
  },
  {
    region: "jateng",
    population: 37.9,
    ipm: 73.9,
    poverty: 10.5,
    unemployment: 5.3,
  },
  {
    region: "jatim",
    population: 41.5,
    ipm: 74.6,
    poverty: 10.4,
    unemployment: 4.1,
  },
] as const;

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

type ProjectStatus = "Selesai" | "Berjalan" | "Tertunda";
export type DashboardView = "overview" | "budget" | "projects" | "statistics";
type DashboardCategory = Exclude<DashboardView, "overview"> | "overview";

const DASHBOARD_CATEGORIES: {
  id: DashboardCategory;
  label: string;
  href: string;
}[] = [
  { id: "overview", label: "Ringkasan", href: "/data" },
  { id: "budget", label: "Anggaran", href: "/data/anggaran" },
  { id: "projects", label: "Proyek", href: "/data/project" },
  { id: "statistics", label: "Statistik daerah", href: "/data/statistik" },
];

const BUDGET_SECTORS = [
  {
    id: "pendidikan",
    name: "Pendidikan",
    description: "Layanan pendidikan dan sarana belajar",
    allocation: 0.4,
  },
  {
    id: "kesehatan",
    name: "Kesehatan",
    description: "Layanan kesehatan dan fasilitas publik",
    allocation: 0.25,
  },
  {
    id: "infrastruktur",
    name: "Infrastruktur",
    description: "Jalan, air bersih, dan konektivitas",
    allocation: 0.2,
  },
  {
    id: "lainnya",
    name: "Sektor lainnya",
    description: "Urusan pemerintahan dan layanan lainnya",
    allocation: 0.15,
  },
] as const;

interface Project {
  id: string;
  name: string;
  agency: string;
  province: string;
  district: string;
  year: (typeof YEARS)[number];
  budget: number;
  realization: number;
  physicalProgress: number;
  status: ProjectStatus;
  description: string;
  beneficiaries: number;
  startDate: string;
  endDate: string;
}

const PROJECTS: Project[] = [
  {
    id: "JBR-025",
    name: "Peningkatan jalan provinsi",
    agency: "Dinas Bina Marga",
    province: "jabar",
    district: "Kab. Bandung",
    year: "2025",
    budget: 120_000_000_000,
    realization: 120_000_000_000,
    physicalProgress: 100,
    status: "Selesai",
    description:
      "Peningkatan kualitas jalan penghubung antarkecamatan untuk memperlancar akses layanan dan distribusi.",
    beneficiaries: 18_400,
    startDate: "Jan 2025",
    endDate: "Agu 2025",
  },
  {
    id: "JBR-024",
    name: "Rehabilitasi 12 sekolah",
    agency: "Dinas Pendidikan",
    province: "jabar",
    district: "Kab. Bogor",
    year: "2025",
    budget: 80_000_000_000,
    realization: 60_000_000_000,
    physicalProgress: 75,
    status: "Berjalan",
    description:
      "Perbaikan ruang kelas dan sanitasi pada 12 sekolah di Kabupaten Bogor.",
    beneficiaries: 3_600,
    startDate: "Mar 2025",
    endDate: "Des 2025",
  },
  {
    id: "JBR-023",
    name: "Pembangunan Puskesmas",
    agency: "Dinas Kesehatan",
    province: "jabar",
    district: "Kab. Garut",
    year: "2025",
    budget: 60_000_000_000,
    realization: 38_000_000_000,
    physicalProgress: 60,
    status: "Berjalan",
    description:
      "Pembangunan fasilitas kesehatan tingkat pertama untuk memperluas akses layanan masyarakat.",
    beneficiaries: 9_200,
    startDate: "Feb 2025",
    endDate: "Nov 2025",
  },
  {
    id: "JBR-022",
    name: "Sistem air bersih",
    agency: "Dinas Sumber Daya Air",
    province: "jabar",
    district: "Kab. Cianjur",
    year: "2025",
    budget: 40_000_000_000,
    realization: 14_000_000_000,
    physicalProgress: 35,
    status: "Tertunda",
    description:
      "Perluasan jaringan air bersih dengan penyesuaian jadwal karena kondisi medan.",
    beneficiaries: 5_100,
    startDate: "Apr 2025",
    endDate: "Des 2025",
  },
  {
    id: "JBR-021",
    name: "Perbaikan drainase perkotaan",
    agency: "Dinas Pekerjaan Umum",
    province: "jabar",
    district: "Kota Bandung",
    year: "2024",
    budget: 35_000_000_000,
    realization: 31_500_000_000,
    physicalProgress: 100,
    status: "Selesai",
    description: "Peningkatan kapasitas drainase pada kawasan rawan genangan.",
    beneficiaries: 12_600,
    startDate: "Feb 2024",
    endDate: "Okt 2024",
  },
  {
    id: "JTG-025",
    name: "Renovasi pasar kecamatan",
    agency: "Dinas Perdagangan",
    province: "jateng",
    district: "Kab. Banyumas",
    year: "2025",
    budget: 54_000_000_000,
    realization: 32_400_000_000,
    physicalProgress: 60,
    status: "Berjalan",
    description:
      "Renovasi pasar rakyat untuk mendukung kegiatan ekonomi lokal.",
    beneficiaries: 2_800,
    startDate: "Jan 2025",
    endDate: "Des 2025",
  },
  {
    id: "JTM-025",
    name: "Pembangunan jembatan penghubung",
    agency: "Dinas Bina Marga",
    province: "jatim",
    district: "Kab. Jember",
    year: "2025",
    budget: 72_000_000_000,
    realization: 18_000_000_000,
    physicalProgress: 25,
    status: "Tertunda",
    description:
      "Pembangunan jembatan penghubung antardesa yang masih dalam penyesuaian pekerjaan pondasi.",
    beneficiaries: 7_400,
    startDate: "Mei 2025",
    endDate: "Des 2025",
  },
];

const CATALOG_DATASETS = [
  {
    id: "anggaran",
    title: "Anggaran & realisasi APBD",
    detail: "12 periode bulanan · 4 sektor",
    updated: "30 Sep 2025",
    rows: [
      ["Sektor", "Anggaran", "Realisasi"],
      ["Pendidikan", "32000000000000", "24000000000000"],
      ["Kesehatan", "20000000000000", "15000000000000"],
      ["Infrastruktur", "16000000000000", "12000000000000"],
      ["Sektor lainnya", "12000000000000", "9000000000000"],
    ],
  },
  {
    id: "proyek",
    title: "Progres proyek daerah",
    detail: "240 proyek · 27 kabupaten/kota",
    updated: "30 Sep 2025",
    rows: [
      [
        "ID",
        "Nama proyek",
        "Wilayah",
        "Anggaran",
        "Realisasi",
        "Progres fisik",
        "Status",
      ],
      ...PROJECTS.map((project) => [
        project.id,
        project.name,
        project.district,
        String(project.budget),
        String(project.realization),
        `${project.physicalProgress}%`,
        project.status,
      ]),
    ],
  },
  {
    id: "statistik",
    title: "Indikator statistik daerah",
    detail: "4 indikator · perbandingan 2024–2025",
    updated: "30 Sep 2025",
    rows: [
      ["Indikator", "2024", "2025"],
      ["Jumlah penduduk", "49800000", "50400000"],
      ["Indeks pembangunan manusia", "74.6", "75.2"],
      ["Tingkat kemiskinan", "7.1%", "7.4%"],
      ["Pengangguran terbuka", "6.4%", "6.8%"],
    ],
  },
] as const;

function toCsv(rows: readonly (readonly string[])[]): string {
  return rows
    .map((row) =>
      row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
    )
    .join("\r\n");
}

function downloadFile(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDateRange(months: number, year: string): string {
  const lastMonth = MONTHS[months - 1];
  return `Januari – ${lastMonth} ${year}`;
}

function getStatusClass(status: ProjectStatus): string {
  if (status === "Selesai") return "bg-emerald-50 text-emerald-700";
  if (status === "Tertunda") return "bg-amber-50 text-amber-800";
  return "bg-blue-50 text-blue-700";
}

function getProjectSector(agency: string): string {
  if (agency.includes("Pendidikan")) return "pendidikan";
  if (agency.includes("Kesehatan")) return "kesehatan";
  if (agency.includes("Bina Marga") || agency.includes("Sumber Daya Air"))
    return "infrastruktur";
  return "lainnya";
}

function isRegion(value: string): value is (typeof REGIONS)[number]["value"] {
  return REGIONS.some((option) => option.value === value);
}

function isYear(value: string): value is (typeof YEARS)[number] {
  return YEARS.some((option) => option === value);
}

function isPeriod(value: string): value is (typeof PERIODS)[number]["value"] {
  return PERIODS.some((option) => option.value === value);
}

function CategoryNavigation({
  activeCategory,
}: {
  activeCategory: DashboardCategory;
}) {
  return (
    <nav
      aria-label="Kategori data pemerintah"
      className="border-border flex gap-6 overflow-x-auto border-b"
    >
      {DASHBOARD_CATEGORIES.map((category) => (
        <Link
          key={category.id}
          href={category.href}
          aria-current={activeCategory === category.id ? "location" : undefined}
          className={`focus-visible:ring-ring shrink-0 border-b-2 px-0 py-2.5 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none ${
            activeCategory === category.id
              ? "border-primary text-primary font-semibold"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          {category.label}
        </Link>
      ))}
    </nav>
  );
}

export function PublicDataDashboard({
  view = "overview",
}: {
  view?: DashboardView;
}) {
  const [region, setRegion] =
    useState<(typeof REGIONS)[number]["value"]>("jabar");
  const [year, setYear] = useState<(typeof YEARS)[number]>("2025");
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("q3");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "budget" | "progress">(
    "budget",
  );
  const [ascending, setAscending] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [sectorSearch, setSectorSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [projectSector, setProjectSector] = useState("all");
  const [projectStatus, setProjectStatus] = useState("all");

  const selectedRegion =
    REGIONS.find((option) => option.value === region) ?? REGIONS[1];
  const selectedPeriod =
    PERIODS.find((option) => option.value === period) ?? PERIODS[2];
  const yearMultiplier = year === "2023" ? 0.88 : year === "2024" ? 0.94 : 1;
  const budget = selectedRegion.budget * 1_000_000_000_000 * yearMultiplier;
  const realization = budget * selectedPeriod.realization;
  const projectTotal =
    region === "all"
      ? 4_380
      : region === "bogor" || region === "bandung"
        ? 22
        : region === "jabar"
          ? 240
          : 198;
  const completedProjects = Math.min(
    projectTotal,
    Math.round(projectTotal * 0.65 * (selectedPeriod.realization / 0.75)),
  );
  const coverage = selectedRegion.coverage;
  const activeCategory: DashboardCategory = view;
  const isOverview = view === "overview";
  const showBudget = view === "budget" || isOverview;
  const showProjects = view === "projects" || isOverview;
  const showStatistics = view === "statistics" || isOverview;
  const regionalIndicator =
    REGIONAL_INDICATORS.find((indicator) => indicator.region === region) ??
    REGIONAL_INDICATORS[1];
  const yearDifference = Number(year) - 2025;
  const regionalStats = [
    {
      label: "Jumlah penduduk",
      value: `${new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 1,
      }).format(regionalIndicator.population + yearDifference * 0.6)} juta`,
      note: `Estimasi pertengahan ${year}`,
      Icon: Users,
    },
    {
      label: "Indeks pembangunan manusia",
      value: new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 1,
      }).format(regionalIndicator.ipm + yearDifference * 0.4),
      note: "Skala 0–100",
      Icon: HeartPulse,
    },
    {
      label: "Tingkat kemiskinan",
      value: `${new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 1,
      }).format(regionalIndicator.poverty + yearDifference * 0.2)}%`,
      note: `Indikator tahunan ${year}`,
      Icon: Activity,
    },
    {
      label: "Pengangguran terbuka",
      value: `${new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 1,
      }).format(regionalIndicator.unemployment + yearDifference * 0.3)}%`,
      note: "Persentase angkatan kerja",
      Icon: UserRoundSearch,
    },
  ];

  const trendData = useMemo(
    () =>
      MONTHS.slice(0, selectedPeriod.months).map((bulan, index) => {
        const month = index + 1;
        const share = month / selectedPeriod.months;
        const periodTarget = budget * Math.min((month / 12) * (16 / 15), 1);
        return {
          bulan,
          target: Math.round(periodTarget / 1_000_000_000_000),
          realisasi: Math.round((realization * share) / 1_000_000_000_000),
        };
      }),
    [budget, realization, selectedPeriod.months],
  );

  const sectorData = useMemo(() => {
    return BUDGET_SECTORS.map(({ name, allocation }) => ({
      sektor: name,
      anggaran: Math.round((budget * allocation) / 1_000_000_000_000),
      realisasi: Math.round((realization * allocation) / 1_000_000_000_000),
    }));
  }, [budget, realization]);

  const budgetSectorRows = useMemo(
    () =>
      BUDGET_SECTORS.map((sector) => {
        const allocation = Math.round(budget * sector.allocation);
        const realized = Math.round(realization * sector.allocation);
        return {
          ...sector,
          allocation,
          realization: realized,
          remaining: allocation - realized,
          percentage: allocation > 0 ? realized / allocation : 0,
        };
      }).filter((sector) => {
        const query = sectorSearch.trim().toLocaleLowerCase("id-ID");
        return (
          (sectorFilter === "all" || sector.id === sectorFilter) &&
          (!query ||
            `${sector.name} ${sector.description}`
              .toLocaleLowerCase("id-ID")
              .includes(query))
        );
      }),
    [budget, realization, sectorFilter, sectorSearch],
  );

  const projectStatusData = [
    { name: "Selesai", value: Math.round(projectTotal * 0.65) },
    { name: "Berjalan", value: Math.round(projectTotal * 0.3) },
    {
      name: "Tertunda",
      value:
        projectTotal -
        Math.round(projectTotal * 0.65) -
        Math.round(projectTotal * 0.3),
    },
  ];
  const projectSectorData = [
    {
      sector: "Infrastruktur",
      complete: Math.round((projectTotal * 52) / 240),
      total: Math.round((projectTotal * 80) / 240),
    },
    {
      sector: "Pendidikan",
      complete: Math.round((projectTotal * 39) / 240),
      total: Math.round((projectTotal * 60) / 240),
    },
    {
      sector: "Kesehatan",
      complete: Math.round((projectTotal * 39) / 240),
      total: Math.round((projectTotal * 60) / 240),
    },
    {
      sector: "Sektor lainnya",
      complete: Math.round((projectTotal * 26) / 240),
      total: Math.round((projectTotal * 40) / 240),
    },
  ];

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("id-ID");
    const matchesRegion = (project: Project) =>
      region === "all" ||
      project.province === region ||
      (region === "bogor" && project.district === "Kab. Bogor") ||
      (region === "bandung" && project.district === "Kota Bandung");
    return PROJECTS.filter(
      (project) =>
        matchesRegion(project) &&
        project.year === year &&
        (projectSector === "all" ||
          getProjectSector(project.agency) === projectSector) &&
        (projectStatus === "all" || project.status === projectStatus) &&
        (!normalizedSearch ||
          `${project.name} ${project.agency} ${project.district} ${project.status}`
            .toLocaleLowerCase("id-ID")
            .includes(normalizedSearch)),
    )
      .map((project) => ({
        ...project,
        realization: Math.min(
          project.budget,
          Math.round(project.realization * (selectedPeriod.realization / 0.75)),
        ),
      }))
      .sort((left, right) => {
        const comparison =
          sortBy === "name"
            ? left.name.localeCompare(right.name, "id-ID")
            : sortBy === "progress"
              ? left.physicalProgress - right.physicalProgress
              : left.budget - right.budget;
        return ascending ? comparison : -comparison;
      });
  }, [
    region,
    search,
    sortBy,
    ascending,
    year,
    selectedPeriod.realization,
    projectSector,
    projectStatus,
  ]);

  const pageSize = 4;
  const pageCount = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const featuredProject =
    filteredProjects.find((project) => project.id === "JBR-024") ??
    filteredProjects[0];
  const visibleProjects = filteredProjects.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  function changeSort(column: "name" | "budget" | "progress") {
    setAscending(sortBy === column ? !ascending : column === "name");
    setSortBy(column);
  }

  function downloadSummary() {
    const rows = [
      [
        "Wilayah",
        "Tahun anggaran",
        "Periode",
        "Total anggaran",
        "Realisasi",
        "Proyek selesai",
        "Total proyek",
        "Cakupan wilayah",
      ],
      [
        selectedRegion.label,
        year,
        selectedPeriod.label,
        String(Math.round(budget)),
        String(Math.round(realization)),
        String(completedProjects),
        String(projectTotal),
        String(coverage),
      ],
    ];
    downloadFile(
      `ringkasan-data-pemerintah-${year}.csv`,
      toCsv(rows),
      "text/csv;charset=utf-8",
    );
  }

  function downloadProjectRows() {
    const rows = [
      [
        "ID",
        "Nama proyek",
        "Instansi",
        "Wilayah",
        "Sektor",
        "Tahun",
        "Anggaran",
        "Realisasi",
        "Progres fisik",
        "Target selesai",
        "Status",
        "Penerima manfaat",
      ],
      ...filteredProjects.map((project) => [
        project.id,
        project.name,
        project.agency,
        project.district,
        BUDGET_SECTORS.find(
          (sector) => sector.id === getProjectSector(project.agency),
        )?.name ?? "Sektor lainnya",
        project.year,
        String(project.budget),
        String(project.realization),
        `${project.physicalProgress}%`,
        project.endDate,
        project.status,
        String(project.beneficiaries),
      ]),
    ];
    downloadFile(
      `daftar-proyek-${year}.csv`,
      toCsv(rows),
      "text/csv;charset=utf-8",
    );
  }

  function downloadBudgetSectors() {
    const rows = [
      [
        "Sektor / urusan",
        "Alokasi",
        "Realisasi",
        "Sisa anggaran",
        "Penyerapan",
      ],
      ...budgetSectorRows.map((sector) => [
        sector.name,
        String(sector.allocation),
        String(sector.realization),
        String(sector.remaining),
        formatPersentase(sector.percentage),
      ]),
    ];
    downloadFile(
      `rincian-anggaran-${year}.csv`,
      toCsv(rows),
      "text/csv;charset=utf-8",
    );
  }

  function downloadDataset(datasetId: (typeof CATALOG_DATASETS)[number]["id"]) {
    const dataset = CATALOG_DATASETS.find((item) => item.id === datasetId);
    if (!dataset) throw new Error(`Dataset tidak ditemukan: ${datasetId}`);
    downloadFile(
      `${dataset.id}-daerah-${year}.csv`,
      toCsv(dataset.rows),
      "text/csv;charset=utf-8",
    );
  }

  function downloadMetadata(
    datasetId: (typeof CATALOG_DATASETS)[number]["id"],
  ) {
    const dataset = CATALOG_DATASETS.find((item) => item.id === datasetId);
    if (!dataset) throw new Error(`Dataset tidak ditemukan: ${datasetId}`);
    downloadFile(
      `metadata-${dataset.id}.json`,
      JSON.stringify(
        {
          id: dataset.id,
          nama: dataset.title,
          deskripsi: dataset.detail,
          tanggalPembaruan: dataset.updated,
          sumber: "Data ilustratif Agoraya",
          lisensi: "Data terbuka untuk keperluan analisis",
          wilayah: selectedRegion.label,
          tahun: year,
          statusData: "SIMULATED",
        },
        null,
        2,
      ),
      "application/json;charset=utf-8",
    );
  }

  return (
    <div className="bg-background">
      <header className="border-border border-b bg-sky-50/70 dark:bg-sky-950/20">
        <div className="container mx-auto flex flex-wrap items-end justify-between gap-4 px-4 py-7 sm:px-6 lg:px-8">
          <div>
            <nav
              aria-label="Breadcrumb"
              className="text-muted-foreground mb-3 text-xs"
            >
              <ol className="flex flex-wrap items-center gap-2">
                <li>
                  <Link href="/" className="hover:text-primary">
                    Beranda
                  </Link>
                </li>
                <li aria-hidden="true">&gt;</li>
                <li>
                  <Link href="/data" className="hover:text-primary">
                    Data Pemerintah
                  </Link>
                </li>
                <li aria-hidden="true">&gt;</li>
                <li aria-current="page" className="text-foreground font-medium">
                  {view === "budget"
                    ? "Anggaran"
                    : view === "projects"
                      ? "Proyek"
                      : view === "statistics"
                        ? "Statistik daerah"
                        : "Ringkasan"}
                </li>
              </ol>
            </nav>
            <h1 className="text-card-foreground text-3xl font-semibold tracking-tight">
              {view === "budget"
                ? "Anggaran & realisasi APBD"
                : view === "projects"
                  ? "Pantau proyek daerah"
                  : view === "statistics"
                    ? "Statistik daerah"
                    : "Data Pemerintah"}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {view === "budget"
                ? "Telusuri alokasi, penyerapan, dan sisa anggaran daerah secara terbuka."
                : view === "projects"
                  ? `Telusuri progres, anggaran, dan tahapan pembangunan di ${selectedRegion.label.replace("Provinsi ", "")}.`
                  : view === "statistics"
                    ? `Jelajahi indikator pembangunan ${selectedRegion.label.replace("Provinsi ", "")} berdasarkan tahun anggaran.`
                    : "Pantau anggaran, proyek, dan jelajahi statistik daerah dalam satu dashboard terbuka."}
            </p>
          </div>
          <Button
            onClick={
              view === "projects" ? downloadProjectRows : downloadSummary
            }
            className="gap-2"
          >
            <Download className="size-4" aria-hidden="true" />
            {view === "projects"
              ? "Unduh data proyek"
              : view === "budget"
                ? "Unduh ringkasan"
                : "Unduh ringkasan"}
          </Button>
        </div>
      </header>

      <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <CategoryNavigation activeCategory={activeCategory} />
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
            <h2 className="flex items-center gap-2 text-base leading-none font-semibold tracking-tight">
              <SlidersHorizontal
                className="text-primary size-4"
                aria-hidden="true"
              />
              {view === "budget"
                ? "Jelajahi anggaran"
                : view === "projects"
                  ? "Jelajahi proyek"
                  : "Jelajahi data"}
            </h2>
            <Button
              variant="link"
              size="sm"
              className="h-auto px-1"
              onClick={() => {
                setRegion("jabar");
                setYear("2025");
                setPeriod("q3");
                setSearch("");
                setSectorSearch("");
                setSectorFilter("all");
                setProjectSector("all");
                setProjectStatus("all");
                setPage(1);
              }}
            >
              Reset filter
            </Button>
          </CardHeader>
          <CardContent
            className={`grid gap-3 px-4 pb-4 ${view === "projects" ? "md:grid-cols-5" : "md:grid-cols-3"}`}
          >
            <label className="space-y-1.5 text-xs font-medium">
              Wilayah
              <span className="relative block">
                <MapPin
                  className="text-primary absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Select
                  aria-label="Wilayah"
                  value={region}
                  onChange={(event) => {
                    if (isRegion(event.target.value)) {
                      setRegion(event.target.value);
                      setPage(1);
                    }
                  }}
                  className="pl-9"
                  options={REGIONS.map(({ value, label }) => ({
                    value,
                    label,
                  }))}
                />
              </span>
            </label>
            {view !== "projects" ? (
              <label className="space-y-1.5 text-xs font-medium">
                Tahun anggaran
                <span className="relative block">
                  <CalendarDays
                    className="text-primary absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Select
                    aria-label="Tahun anggaran"
                    value={year}
                    onChange={(event) => {
                      if (isYear(event.target.value)) {
                        setYear(event.target.value);
                        setPage(1);
                      }
                    }}
                    className="pl-9"
                    options={YEARS.map((value) => ({ value, label: value }))}
                  />
                </span>
              </label>
            ) : null}
            <label className="space-y-1.5 text-xs font-medium">
              Periode kumulatif
              <span className="relative block">
                <Select
                  aria-label="Periode kumulatif"
                  value={view === "projects" ? `${year}-${period}` : period}
                  onChange={(event) => {
                    if (view === "projects") {
                      const [selectedYear, selectedPeriodValue] =
                        event.target.value.split("-");
                      if (selectedYear && isYear(selectedYear))
                        setYear(selectedYear);
                      if (selectedPeriodValue && isPeriod(selectedPeriodValue))
                        setPeriod(selectedPeriodValue);
                      setPage(1);
                    } else if (isPeriod(event.target.value)) {
                      setPeriod(event.target.value);
                    }
                  }}
                  options={
                    view === "projects"
                      ? YEARS.flatMap((yearOption) =>
                          PERIODS.map((periodOption) => ({
                            value: `${yearOption}-${periodOption.value}`,
                            label: `${yearOption} · ${periodOption.label}`,
                          })),
                        )
                      : PERIODS.map(({ value, label }) => ({ value, label }))
                  }
                />
              </span>
            </label>
            {view === "projects" ? (
              <>
                <label className="space-y-1.5 text-xs font-medium">
                  Sektor
                  <Select
                    aria-label="Sektor proyek"
                    value={projectSector}
                    onChange={(event) => {
                      setProjectSector(event.target.value);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: "Semua sektor" },
                      { value: "infrastruktur", label: "Infrastruktur" },
                      { value: "pendidikan", label: "Pendidikan" },
                      { value: "kesehatan", label: "Kesehatan" },
                      { value: "lainnya", label: "Sektor lainnya" },
                    ]}
                  />
                </label>
                <label className="space-y-1.5 text-xs font-medium">
                  Status proyek
                  <Select
                    aria-label="Status proyek"
                    value={projectStatus}
                    onChange={(event) => {
                      setProjectStatus(event.target.value);
                      setPage(1);
                    }}
                    options={[
                      { value: "all", label: "Semua status" },
                      { value: "Selesai", label: "Selesai" },
                      { value: "Berjalan", label: "Berjalan" },
                      { value: "Tertunda", label: "Tertunda" },
                    ]}
                  />
                </label>
              </>
            ) : null}
            {view === "projects" ? (
              <Button className="self-end" onClick={() => setPage(1)}>
                Terapkan filter
              </Button>
            ) : null}
            <p
              className={`text-muted-foreground text-xs ${
                view === "projects" ? "md:col-span-5" : "md:col-span-3"
              }`}
            >
              Filter aktif:{" "}
              <span className="text-primary font-medium">
                {selectedRegion.label} · {year} · {selectedPeriod.label}
              </span>
              <span className="ml-2">
                Pembaruan data: 30 Sep {year}, 16.00 WIB
              </span>
            </p>
          </CardContent>
        </Card>

        {isOverview ? (
          <SummaryKpiCards
            data={{
              totalAnggaran: budget,
              realisasi: realization,
              proyekSelesai: completedProjects,
              totalProyek: projectTotal,
              cakupanWilayah: coverage,
            }}
            periodLabel={`${selectedRegion.label} · ${year} · ${selectedPeriod.label}`}
          />
        ) : null}

        {view === "budget" ? (
          <section aria-labelledby="budget-summary-title" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2
                id="budget-summary-title"
                className="text-xl font-semibold tracking-tight"
              >
                Ringkasan anggaran{" "}
                {selectedRegion.label.replace("Provinsi ", "")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {formatDateRange(selectedPeriod.months, year)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Total anggaran",
                  value: formatRupiah(budget),
                  note: `Pagu APBD tahun ${year}`,
                  Icon: Wallet,
                },
                {
                  label: "Realisasi anggaran",
                  value: formatRupiah(realization),
                  note: `Kumulatif s.d. ${MONTHS[selectedPeriod.months - 1]}`,
                  Icon: Landmark,
                },
                {
                  label: "Sisa anggaran",
                  value: formatRupiah(budget - realization),
                  note: `${formatPersentase(1 - selectedPeriod.realization)} belum terealisasi`,
                  Icon: Building2,
                },
                {
                  label: "Tingkat realisasi",
                  value: formatPersentase(
                    budget > 0 ? realization / budget : 0,
                  ),
                  note: `${formatRupiah(realization)} dari pagu ${formatRupiah(budget)}`,
                  Icon: Percent,
                },
              ].map(({ label, value, note, Icon }) => (
                <Card key={label} className="border-border shadow-sm">
                  <CardHeader className="px-4 pt-4 pb-0">
                    <span className="text-primary inline-flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-1 px-4 pb-4">
                    <CardDescription className="text-xs">
                      {label}
                    </CardDescription>
                    <p className="text-2xl font-semibold tracking-tight">
                      {value}
                    </p>
                    <p className="text-muted-foreground text-xs">{note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {view === "projects" ? (
          <section
            aria-labelledby="project-summary-title"
            className="space-y-4"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2
                id="project-summary-title"
                className="text-xl font-semibold tracking-tight"
              >
                Ringkasan proyek {selectedRegion.label.replace("Provinsi ", "")}
              </h2>
              <p className="text-muted-foreground text-xs">
                {formatDateRange(selectedPeriod.months, year)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[
                {
                  label: "Total proyek",
                  value: projectTotal,
                  note: `${coverage} kabupaten / kota`,
                  Icon: BriefcaseBusiness,
                },
                {
                  label: "Selesai",
                  value: projectStatusData[0].value,
                  note: `${formatPersentase(projectStatusData[0].value / projectTotal)} dari total proyek`,
                  Icon: CheckCircle2,
                },
                {
                  label: "Berjalan",
                  value: projectStatusData[1].value,
                  note: `${formatPersentase(projectStatusData[1].value / projectTotal)} dari total proyek`,
                  Icon: Activity,
                },
                {
                  label: "Tertunda",
                  value: projectStatusData[2].value,
                  note: `${formatPersentase(projectStatusData[2].value / projectTotal)} perlu perhatian`,
                  Icon: CalendarDays,
                },
                {
                  label: "Cakupan wilayah",
                  value: coverage,
                  note: "Kabupaten / kota",
                  Icon: MapPin,
                },
              ].map(({ label, value, note, Icon }) => (
                <Card key={label} className="border-border shadow-sm">
                  <CardHeader className="px-4 pt-4 pb-0">
                    <span className="text-primary inline-flex size-9 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-1 px-4 pb-4">
                    <CardDescription className="text-xs">
                      {label}
                    </CardDescription>
                    <p className="text-2xl font-semibold tracking-tight">
                      {value}
                    </p>
                    <p className="text-muted-foreground text-xs">{note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}

        {showBudget ? (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
            <Card className="border-border min-w-0 shadow-sm">
              <CardHeader className="px-4 pt-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base leading-none font-semibold tracking-tight">
                      Tren realisasi anggaran
                    </h2>
                    <CardDescription className="mt-1 text-xs">
                      Kumulatif {formatDateRange(selectedPeriod.months, year)} ·
                      triliun rupiah
                    </CardDescription>
                  </div>
                  <SourceBadge
                    source="SIMULATED"
                    label="Simulasi"
                    withIcon={false}
                    className="px-1.5 py-0.5 text-[10px]"
                  />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[260px]">
                  <LineChart
                    data={trendData}
                    xKey="bulan"
                    series={[
                      { key: "target", name: "Target realisasi" },
                      { key: "realisasi", name: "Realisasi" },
                    ]}
                    width="100%"
                    height={250}
                    showGrid
                    showLegend
                    showTooltip
                    ariaLabel={`Grafik tren target dan realisasi anggaran ${selectedRegion.label}, tahun ${year}, ${selectedPeriod.label}, dalam triliun rupiah`}
                  />
                </div>
                <p
                  aria-label={`Realisasi kumulatif ${formatRupiahForScreenReader(realization)}`}
                  className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-800"
                >
                  Realisasi kumulatif: {formatRupiah(realization)} ·{" "}
                  {formatPersentase(budget > 0 ? realization / budget : 0)} dari
                  pagu.
                </p>
              </CardContent>
            </Card>

            {view === "budget" ? (
              <Card className="border-border min-w-0 shadow-sm lg:order-3 lg:col-span-2">
                <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 pb-3">
                  <div>
                    <h2 className="text-base leading-none font-semibold tracking-tight">
                      Rincian anggaran per sektor
                    </h2>
                    <CardDescription className="mt-2 text-xs">
                      {budgetSectorRows.length} sektor · nilai dalam rupiah
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={downloadBudgetSectors}
                    className="gap-2"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    Unduh CSV
                  </Button>
                  <div className="grid w-full gap-3 sm:grid-cols-[minmax(220px,1fr)_180px]">
                    <label className="relative">
                      <span className="sr-only">Cari sektor atau urusan</span>
                      <Search
                        className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <Input
                        aria-label="Cari sektor atau urusan"
                        placeholder="Cari sektor atau urusan..."
                        value={sectorSearch}
                        onChange={(event) =>
                          setSectorSearch(event.target.value)
                        }
                        className="pl-9"
                      />
                    </label>
                    <Select
                      aria-label="Filter sektor anggaran"
                      value={sectorFilter}
                      onChange={(event) => setSectorFilter(event.target.value)}
                      options={[
                        { value: "all", label: "Semua sektor" },
                        ...BUDGET_SECTORS.map(({ id, name }) => ({
                          value: id,
                          label: name,
                        })),
                      ]}
                    />
                  </div>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <caption className="sr-only">
                      Rincian alokasi anggaran {selectedRegion.label} tahun{" "}
                      {year}
                    </caption>
                    <thead className="bg-muted/40 text-muted-foreground text-xs">
                      <tr>
                        <th scope="col" className="px-4 py-3">
                          Sektor / urusan
                        </th>
                        <th scope="col" className="px-3 py-3 text-right">
                          Alokasi
                        </th>
                        <th scope="col" className="px-3 py-3 text-right">
                          Realisasi
                        </th>
                        <th scope="col" className="px-3 py-3 text-right">
                          Sisa anggaran
                        </th>
                        <th scope="col" className="px-4 py-3 text-right">
                          Penyerapan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {budgetSectorRows.map((sector) => (
                        <tr key={sector.id}>
                          <th scope="row" className="px-4 py-3 font-medium">
                            {sector.name}
                            <span className="text-muted-foreground mt-1 block text-xs font-normal">
                              {sector.description}
                            </span>
                          </th>
                          <td className="px-3 py-3 text-right">
                            <span className="font-medium">
                              {formatRupiah(sector.allocation)}
                            </span>
                            <span className="text-muted-foreground block text-xs">
                              {formatPersentase(sector.allocation / budget)}{" "}
                              dari pagu
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-medium">
                            {formatRupiah(sector.realization)}
                          </td>
                          <td className="px-3 py-3 text-right">
                            {formatRupiah(sector.remaining)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs font-medium">
                                {formatPersentase(sector.percentage)}
                              </span>
                              <span
                                className="bg-muted h-1.5 w-16 overflow-hidden rounded-full"
                                role="progressbar"
                                aria-label={`Penyerapan sektor ${sector.name}`}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-valuenow={Math.round(
                                  sector.percentage * 100,
                                )}
                              >
                                <span
                                  className="bg-primary block h-full rounded-full"
                                  style={{
                                    width: `${sector.percentage * 100}%`,
                                  }}
                                />
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {budgetSectorRows.length === 0 ? (
                        <tr>
                          <td
                            colSpan={5}
                            className="text-muted-foreground px-4 py-8 text-center"
                          >
                            Tidak ada sektor yang cocok dengan pencarian.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                    <tfoot className="bg-sky-50 font-semibold dark:bg-sky-950/20">
                      <tr>
                        <th scope="row" className="px-4 py-3">
                          Total anggaran{" "}
                          {selectedRegion.label.replace("Provinsi ", "")}
                        </th>
                        <td className="px-3 py-3 text-right">
                          {formatRupiah(budget)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatRupiah(realization)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {formatRupiah(budget - realization)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatPersentase(realization / budget)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            ) : null}

            <Card className="border-border shadow-sm lg:order-2">
              <CardHeader className="px-4 pt-4 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base leading-none font-semibold tracking-tight">
                      Anggaran per sektor
                    </h2>
                    <CardDescription className="mt-1 text-xs">
                      Alokasi dan realisasi · triliun rupiah
                    </CardDescription>
                  </div>
                  <SourceBadge
                    source="SIMULATED"
                    label="Simulasi"
                    withIcon={false}
                    className="px-1.5 py-0.5 text-[10px]"
                  />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="h-[260px]">
                  <BarChart
                    data={sectorData}
                    xKey="sektor"
                    series={[
                      { key: "anggaran", name: "Pagu anggaran" },
                      { key: "realisasi", name: "Realisasi" },
                    ]}
                    width="100%"
                    height={250}
                    showGrid
                    showLegend
                    showTooltip
                    ariaLabel={`Grafik anggaran dan realisasi per sektor ${selectedRegion.label} tahun ${year}`}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {showStatistics ? (
          <Card id="statistik" className="border-border scroll-mt-6 shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3">
              <div>
                <h2 className="text-base leading-none font-semibold tracking-tight">
                  Statistik daerah
                </h2>
                <CardDescription className="mt-2 text-xs">
                  Profil {selectedRegion.label} · indikator tahunan {year}
                </CardDescription>
              </div>
              <SourceBadge
                source="SIMULATED"
                label="Simulasi"
                withIcon={false}
                className="px-1.5 py-0.5 text-[10px]"
              />
            </CardHeader>
            <CardContent className="grid gap-3 px-4 pb-4 sm:grid-cols-2 lg:grid-cols-4">
              {regionalStats.map(({ label, value, note, Icon }) => (
                <div key={label} className="bg-muted/30 rounded-lg p-3">
                  <div className="text-primary flex items-center gap-2">
                    <Icon className="size-4" aria-hidden="true" />
                    <h3 className="text-muted-foreground text-xs font-medium">
                      {label}
                    </h3>
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums">
                    {value}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">{note}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {view === "budget" ? (
          <section
            aria-labelledby="budget-context-title"
            className="grid gap-4 lg:grid-cols-2"
          >
            <Card className="border-border min-w-0 shadow-sm">
              <CardHeader className="px-4 pt-4 pb-2">
                <h2 className="text-base font-semibold">
                  Anggaran & realisasi APBD
                </h2>
                <CardDescription className="text-xs">
                  Sumber: simulasi APBD Agoraya · Data ilustratif
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 text-xs">
                <p>
                  Wilayah: {selectedRegion.label} · {year} ·{" "}
                  {BUDGET_SECTORS.length} sektor
                </p>
                <p>
                  Skema: keuangan daerah · satuan ditampilkan dalam triliun
                  rupiah.
                </p>
                <p>
                  Pembaruan visualisasi mengikuti filter periode kumulatif yang
                  dipilih.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border shadow-sm">
              <CardHeader className="px-4 pt-4 pb-2">
                <h2
                  id="budget-context-title"
                  className="text-base font-semibold"
                >
                  Memahami angka anggaran
                </h2>
              </CardHeader>
              <CardContent className="space-y-3 px-4 pb-4 text-xs">
                <p>
                  <strong>Pagu / alokasi</strong>
                  <span className="text-muted-foreground mt-1 block">
                    Batas anggaran untuk satu tahun fiskal.
                  </span>
                </p>
                <p>
                  <strong>Realisasi</strong>
                  <span className="text-muted-foreground mt-1 block">
                    Belanja kumulatif hingga periode yang dipilih.
                  </span>
                </p>
                <p>
                  <strong>Sisa anggaran</strong>
                  <span className="text-muted-foreground mt-1 block">
                    Pagu dikurangi realisasi: {formatRupiah(budget)} −{" "}
                    {formatRupiah(realization)} ={" "}
                    {formatRupiah(budget - realization)}.
                  </span>
                </p>
                <p>
                  <strong>Tingkat realisasi</strong>
                  <span className="text-muted-foreground mt-1 block">
                    Realisasi ÷ pagu × 100% ={" "}
                    {formatPersentase(realization / budget)}.
                  </span>
                </p>
                <p className="text-muted-foreground">
                  Target realisasi adalah rencana penyerapan sepanjang periode,
                  bukan total pagu tahunan.
                </p>
              </CardContent>
            </Card>
          </section>
        ) : null}

        {view === "projects" ? (
          <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.4fr)]">
            <Card className="border-border min-w-0 shadow-sm">
              <CardHeader className="px-4 pt-4 pb-2">
                <h2 className="text-base font-semibold">
                  Progres penyelesaian
                </h2>
                <CardDescription className="text-xs">
                  {projectTotal} proyek · status per{" "}
                  {formatDateRange(selectedPeriod.months, year)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid items-center gap-3 px-4 pb-4 sm:grid-cols-[minmax(120px,0.8fr)_minmax(0,1fr)]">
                <div className="relative min-w-0">
                  <PieChart
                    data={projectStatusData}
                    width="100%"
                    height={190}
                    innerRadius="58%"
                    outerRadius="82%"
                    showLegend={false}
                    showTooltip
                    colors={["#0f9f91", "#2563eb", "#c45b16"]}
                    ariaLabel={`Distribusi status ${projectTotal} proyek: ${projectStatusData.map(({ name, value }) => `${name} ${value}`).join(", ")}`}
                  />
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">
                      {formatPersentase(
                        projectStatusData[0].value / projectTotal,
                      )}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                      selesai
                    </span>
                  </div>
                </div>
                <ul className="space-y-3 text-xs">
                  {projectStatusData.map((item, index) => (
                    <li
                      key={item.name}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`size-2 rounded-full ${index === 0 ? "bg-emerald-600" : index === 1 ? "bg-blue-600" : "bg-amber-700"}`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </span>
                      <span className="font-medium tabular-nums">
                        {item.value} ·{" "}
                        {formatPersentase(item.value / projectTotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <p className="text-muted-foreground px-4 pb-4 text-xs">
                Persentase berdasarkan jumlah proyek, bukan rata-rata progres
                fisik.
              </p>
            </Card>

            <Card className="border-border min-w-0 shadow-sm">
              <CardHeader className="px-4 pt-4 pb-2">
                <h2 className="text-base font-semibold">
                  Penyelesaian per sektor
                </h2>
                <CardDescription className="text-xs">
                  Jumlah proyek selesai dibandingkan total proyek di tiap
                  sektor.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-4 pb-4">
                {projectSectorData.map((sector) => (
                  <div key={sector.sector}>
                    <div className="mb-1 flex justify-between gap-2 text-xs">
                      <span className="font-medium">{sector.sector}</span>
                      <span className="text-muted-foreground">
                        {sector.complete} / {sector.total} proyek
                      </span>
                    </div>
                    <div
                      className="bg-muted h-2 overflow-hidden rounded-full"
                      role="progressbar"
                      aria-label={`Penyelesaian sektor ${sector.sector}`}
                      aria-valuemin={0}
                      aria-valuemax={sector.total}
                      aria-valuenow={sector.complete}
                    >
                      <div
                        className="h-full rounded-full bg-emerald-600"
                        style={{
                          width: `${sector.total > 0 ? (sector.complete / sector.total) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {featuredProject ? (
              <Card className="border-border shadow-sm lg:col-span-2">
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-2">
                  <div>
                    <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                      Sorotan proyek
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      {featuredProject.name}
                    </h2>
                    <CardDescription className="mt-1 text-xs">
                      {featuredProject.district} ·{" "}
                      {getProjectSector(featuredProject.agency)} ·{" "}
                      {featuredProject.agency}
                    </CardDescription>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClass(featuredProject.status)}`}
                  >
                    {featuredProject.status}
                  </span>
                </CardHeader>
                <CardContent className="grid gap-5 px-4 pb-4 lg:grid-cols-[1.4fr_1fr]">
                  <div>
                    <p className="text-muted-foreground text-sm leading-6">
                      {featuredProject.description}
                    </p>
                    <h3 className="mt-4 text-sm font-semibold">
                      Tahapan pelaksanaan · {featuredProject.startDate} –{" "}
                      {featuredProject.endDate}
                    </h3>
                    <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                      <li className="text-xs">
                        <span className="font-medium">
                          ✓ Perencanaan selesai
                        </span>
                        <span className="text-muted-foreground mt-1 block">
                          {featuredProject.startDate}
                        </span>
                      </li>
                      <li className="text-xs">
                        <span className="font-medium">↻ Pelaksanaan</span>
                        <span className="text-muted-foreground mt-1 block">
                          {featuredProject.physicalProgress}% terlaksana
                        </span>
                      </li>
                      <li className="text-xs">
                        <span className="font-medium">○ Target selesai</span>
                        <span className="text-muted-foreground mt-1 block">
                          {featuredProject.endDate}
                        </span>
                      </li>
                    </ol>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex justify-between text-xs">
                      <span>Progres fisik</span>
                      <span className="font-medium">
                        {featuredProject.physicalProgress}%
                      </span>
                    </div>
                    <div className="bg-muted mt-2 h-2 overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{
                          width: `${featuredProject.physicalProgress}%`,
                        }}
                      />
                    </div>
                    <p className="mt-4 text-xs">
                      Anggaran{" "}
                      <strong>{formatRupiah(featuredProject.budget)}</strong>
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Realisasi keuangan:{" "}
                      {formatRupiah(featuredProject.realization)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Penerima manfaat:{" "}
                      {new Intl.NumberFormat("id-ID").format(
                        featuredProject.beneficiaries,
                      )}{" "}
                      orang (estimasi)
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => setSelectedProject(featuredProject)}
                    >
                      Lihat detail proyek
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        ) : null}

        {showProjects ? (
          <section id="project-status-breakdown" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Pantau proyek, lihat dampaknya
                </h2>
                <p className="text-muted-foreground mt-1 text-sm">
                  Contoh proyek {selectedRegion.label} · {year} · data
                  ilustratif.
                </p>
              </div>
              <Button
                variant="outline"
                onClick={downloadProjectRows}
                className="gap-2"
              >
                <Download className="size-4" aria-hidden="true" />
                Unduh daftar
              </Button>
            </div>
            <Card className="border-border overflow-hidden shadow-sm">
              <div className="border-border grid gap-3 border-b p-4 sm:grid-cols-[minmax(220px,1fr)_180px]">
                <label className="relative">
                  <span className="sr-only">
                    Cari nama proyek atau instansi
                  </span>
                  <Search
                    className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                    aria-hidden="true"
                  />
                  <Input
                    aria-label="Cari nama proyek atau instansi"
                    placeholder="Cari nama proyek atau instansi..."
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                      setPage(1);
                    }}
                    className="pl-9"
                  />
                </label>
                <label className="sr-only" htmlFor="project-sort">
                  Urutkan proyek
                </label>
                <Select
                  id="project-sort"
                  aria-label="Urutkan proyek"
                  value={sortBy}
                  onChange={(event) => {
                    if (
                      event.target.value === "name" ||
                      event.target.value === "budget" ||
                      event.target.value === "progress"
                    ) {
                      setSortBy(event.target.value);
                    }
                  }}
                  options={[
                    { value: "budget", label: "Anggaran terbesar" },
                    { value: "name", label: "Nama proyek" },
                    { value: "progress", label: "Progres fisik" },
                  ]}
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <caption className="sr-only">
                    Daftar proyek {selectedRegion.label} tahun anggaran {year}
                  </caption>
                  <thead className="bg-muted/40 text-muted-foreground text-xs">
                    <tr>
                      <th scope="col" className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => changeSort("name")}
                          className="hover:text-foreground inline-flex items-center gap-1"
                        >
                          Proyek / Instansi
                          {sortBy === "name" ? (
                            ascending ? (
                              <ArrowUp className="size-3" aria-hidden="true" />
                            ) : (
                              <ArrowDown
                                className="size-3"
                                aria-hidden="true"
                              />
                            )
                          ) : null}
                        </button>
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Wilayah
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Sektor
                      </th>
                      <th scope="col" className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => changeSort("budget")}
                          className="hover:text-foreground inline-flex items-center gap-1"
                        >
                          Anggaran
                          {sortBy === "budget" ? (
                            ascending ? (
                              <ArrowUp className="size-3" aria-hidden="true" />
                            ) : (
                              <ArrowDown
                                className="size-3"
                                aria-hidden="true"
                              />
                            )
                          ) : null}
                        </button>
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Realisasi kumulatif
                      </th>
                      <th scope="col" className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => changeSort("progress")}
                          className="hover:text-foreground inline-flex items-center gap-1"
                        >
                          Progres fisik
                          {sortBy === "progress" ? (
                            ascending ? (
                              <ArrowUp className="size-3" aria-hidden="true" />
                            ) : (
                              <ArrowDown
                                className="size-3"
                                aria-hidden="true"
                              />
                            )
                          ) : null}
                        </button>
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-3 py-3">
                        Target selesai
                      </th>
                      <th scope="col" className="px-4 py-3 text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {visibleProjects.map((project) => (
                      <tr key={project.id} className="hover:bg-accent/40">
                        <th scope="row" className="px-4 py-3 font-medium">
                          {project.name}
                          <span className="text-muted-foreground mt-1 block text-xs font-normal">
                            {project.agency}
                          </span>
                        </th>
                        <td className="text-muted-foreground px-3 py-3 text-xs">
                          {project.district}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {BUDGET_SECTORS.find(
                            (sector) =>
                              sector.id === getProjectSector(project.agency),
                          )?.name ?? "Sektor lainnya"}
                        </td>
                        <td className="px-3 py-3 text-xs font-medium">
                          {formatRupiah(project.budget)}
                        </td>
                        <td className="px-3 py-3 text-xs">
                          {formatRupiah(project.realization)}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-8 text-xs tabular-nums">
                              {project.physicalProgress}%
                            </span>
                            <span
                              className="bg-muted h-1.5 w-16 overflow-hidden rounded-full"
                              role="progressbar"
                              aria-label={`Progres fisik ${project.name}`}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-valuenow={project.physicalProgress}
                            >
                              <span
                                className="bg-primary block h-full rounded-full"
                                style={{
                                  width: `${project.physicalProgress}%`,
                                }}
                              />
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${getStatusClass(project.status)}`}
                          >
                            {project.status}
                          </span>
                        </td>
                        <td className="text-muted-foreground px-3 py-3 text-xs">
                          {project.endDate}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="link"
                            size="sm"
                            className="h-auto px-1"
                            onClick={() => setSelectedProject(project)}
                          >
                            Detail{" "}
                            <ArrowRight className="size-3" aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {visibleProjects.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="text-muted-foreground px-4 py-10 text-center"
                        >
                          Tidak ada proyek yang cocok dengan filter dan
                          pencarian.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="text-muted-foreground border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-xs">
                <span>
                  {filteredProjects.length === 0
                    ? "Tidak ada proyek"
                    : `Menampilkan ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filteredProjects.length)} dari ${filteredProjects.length} contoh proyek`}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Halaman sebelumnya"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ArrowRight
                      className="size-4 rotate-180"
                      aria-hidden="true"
                    />
                  </Button>
                  <span aria-live="polite">
                    Halaman {page} dari {pageCount}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Halaman berikutnya"
                    disabled={page >= pageCount}
                    onClick={() => setPage(page + 1)}
                  >
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </Card>
          </section>
        ) : null}

        <section id="katalog-data" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Eksplorasi lebih lanjut dengan dataset
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Lihat struktur data, periksa metadata, atau unduh untuk analisis
                Anda.
              </p>
            </div>
            <a
              href="#katalog-data"
              className="text-primary inline-flex items-center gap-2 text-sm font-medium"
            >
              Katalog data <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {CATALOG_DATASETS.map((dataset, index) => {
              const DatasetIcon =
                index === 0
                  ? Wallet
                  : index === 1
                    ? BriefcaseBusiness
                    : FileText;
              return (
                <Card key={dataset.id} className="border-border shadow-sm">
                  <CardHeader className="px-4 pt-4 pb-2">
                    <span className="text-primary inline-flex size-9 items-center justify-center rounded-lg bg-blue-50">
                      <DatasetIcon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="pt-2 text-base leading-none font-semibold tracking-tight">
                      {dataset.title}
                    </h3>
                    <CardDescription className="text-xs">
                      {dataset.detail}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-2 px-4 pb-4">
                    <span className="text-muted-foreground text-xs">
                      {dataset.updated} · CSV / JSON · ilustratif
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Unduh metadata ${dataset.title}`}
                        onClick={() => downloadMetadata(dataset.id)}
                      >
                        Metadata
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Unduh CSV ${dataset.title}`}
                        onClick={() => downloadDataset(dataset.id)}
                      >
                        <Download className="size-3.5" aria-hidden="true" /> CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section
          id="metodologi"
          aria-labelledby="disclaimer-title"
          className="rounded-xl bg-sky-50 px-5 py-5 dark:bg-sky-950/20"
        >
          <div className="flex gap-3">
            <ShieldCheck
              className="text-primary mt-0.5 size-5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <h2 id="disclaimer-title" className="text-sm font-semibold">
                Data terbuka, konteks tetap penting.
              </h2>
              <p className="text-muted-foreground mt-2 max-w-5xl text-xs leading-5">
                Dashboard ini adalah rancangan dengan data ilustratif, tanpa
                koneksi ke layanan produksi. Filter wilayah berlaku untuk
                ringkasan, anggaran, dan proyek; data statistik hanya
                ditampilkan sebagai konteks. Nilai proyek dan indikator dapat
                berbeda dari laporan resmi. Gunakan definisi, periode, dan
                satuan sumber saat membandingkan data.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs">
                <a
                  className="text-primary font-medium hover:underline"
                  href="#metodologi"
                >
                  Definisi & metodologi{" "}
                  <ArrowRight className="inline size-3" aria-hidden="true" />
                </a>
                <a
                  className="text-primary font-medium hover:underline"
                  href="#katalog-data"
                >
                  Panduan membaca data{" "}
                  <ArrowRight className="inline size-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Modal
        open={selectedProject !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
        title={selectedProject?.name ?? "Detail proyek"}
        description={
          selectedProject
            ? `${selectedProject.agency} · ${selectedProject.district} · Data ilustratif`
            : undefined
        }
        contentClassName="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {selectedProject ? (
          <div className="space-y-5">
            <p className="text-muted-foreground leading-6">
              {selectedProject.description}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  Realisasi anggaran
                </p>
                <p className="mt-1 font-semibold">
                  {formatRupiah(selectedProject.realization)} /{" "}
                  {formatRupiah(selectedProject.budget)}
                </p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">Progres fisik</p>
                <p className="mt-1 font-semibold">
                  {selectedProject.physicalProgress}% · {selectedProject.status}
                </p>
              </div>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-muted-foreground text-xs">
                  Penerima manfaat
                </p>
                <p className="mt-1 font-semibold">
                  {new Intl.NumberFormat("id-ID").format(
                    selectedProject.beneficiaries,
                  )}{" "}
                  orang
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold">Timeline proyek</h3>
              <ol className="mt-3 grid gap-3 sm:grid-cols-3">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                    ✓
                  </span>
                  <span>
                    <span className="block text-xs font-medium">
                      Perencanaan selesai
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {selectedProject.startDate}
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    ↻
                  </span>
                  <span>
                    <span className="block text-xs font-medium">
                      Pelaksanaan
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {selectedProject.physicalProgress}% terlaksana
                    </span>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-muted text-muted-foreground mt-1 inline-flex size-5 items-center justify-center rounded-full">
                    ○
                  </span>
                  <span>
                    <span className="block text-xs font-medium">
                      Target penyelesaian
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {selectedProject.endDate}
                    </span>
                  </span>
                </li>
              </ol>
            </div>
            <p className="text-muted-foreground border-border border-t pt-3 text-xs">
              Penerima manfaat merupakan estimasi simulasi. Realisasi fisik dan
              keuangan ditampilkan secara terpisah.
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
