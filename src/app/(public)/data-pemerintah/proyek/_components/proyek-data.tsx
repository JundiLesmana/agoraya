"use client";

import { useEffect, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  Search,
} from "lucide-react";
import { SourceBadge } from "@/components/source-badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select, type SelectOption } from "@/components/ui/select";
import {
  projectPageResponseSchema,
  type ProjectDirectoryItem,
} from "@/lib/project-directory";
import { DownloadButton } from "./download-button";
import { DEFAULT_FILTERS, type FilterValues } from "./filter-controls";

const SORT_OPTIONS: SelectOption[] = [
  { value: "anggaran_desc", label: "Anggaran terbesar" },
  { value: "anggaran_asc", label: "Anggaran terkecil" },
];

function formatBudget(amount: number): string {
  const billions = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(amount / 1_000_000_000);

  return `Rp${billions} M`;
}

function ProjectStatus({ status }: { status: ProjectDirectoryItem["status"] }) {
  const style =
    status === "Selesai"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Berjalan"
        ? "bg-blue-100 text-blue-700"
        : "bg-red-50 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${style}`}
    >
      {status}
    </span>
  );
}

function ProjectDetails({ project }: { project: ProjectDirectoryItem }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3">
      <dt className="text-muted-foreground">Instansi</dt>
      <dd className="font-medium">{project.instansi}</dd>
      <dt className="text-muted-foreground">Lokasi</dt>
      <dd>{project.lokasi}</dd>
      <dt className="text-muted-foreground">Sektor</dt>
      <dd>{project.sektor}</dd>
      <dt className="text-muted-foreground">Anggaran</dt>
      <dd>{formatBudget(project.anggaran)}</dd>
      <dt className="text-muted-foreground">Progres fisik</dt>
      <dd>{project.progres_fisik}%</dd>
      <dt className="text-muted-foreground">Target selesai</dt>
      <dd>{project.target_selesai}</dd>
      <dt className="text-muted-foreground">Status</dt>
      <dd>
        <ProjectStatus status={project.status} />
      </dd>
    </dl>
  );
}

export function ProyekData({
  filters = DEFAULT_FILTERS,
}: {
  filters?: FilterValues;
}) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState("anggaran_desc");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [projects, setProjects] = useState<ProjectDirectoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<ProjectDirectoryItem | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({
      search: debouncedSearch,
      sort,
      page: String(page),
    });
    if (filters.wilayah) params.set("wilayah", filters.wilayah);
    if (filters.periode) params.set("periode", filters.periode);
    if (filters.sektor) params.set("sektor", filters.sektor);
    if (filters.status !== "Semua status") params.set("status", filters.status);

    async function loadProjects() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(`/api/projects?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Project request failed.");

        const result = projectPageResponseSchema.parse(await response.json());
        setProjects(result.data);
        setTotal(result.total);
        setTotalPages(result.totalPages);
      } catch {
        if (!controller.signal.aborted) {
          setHasError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => controller.abort();
  }, [
    debouncedSearch,
    sort,
    filters.wilayah,
    filters.periode,
    filters.sektor,
    filters.status,
    page,
    retryCount,
  ]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const visiblePages = Math.max(totalPages, 1);

  return (
    <section
      aria-labelledby="project-directory-heading"
      className="border-border bg-card rounded-xl border p-5 shadow-sm sm:p-6"
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h2
            id="project-directory-heading"
            className="text-foreground text-xl font-semibold tracking-tight"
          >
            Jelajahi seluruh proyek
          </h2>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-2 text-xs">
            <p>
              Direktori proyek terfilter · data ilustratif · M = miliar rupiah.
            </p>
            <SourceBadge source="SIMULATED" />
          </div>
        </div>
        <DownloadButton
          search={searchInput.trim()}
          sort={sort}
          wilayah={filters.wilayah}
          periode={filters.periode}
          sektor={filters.sektor}
          status={filters.status}
        />
      </header>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
          />
          <Input
            type="search"
            aria-label="Cari nama proyek atau instansi"
            placeholder="Cari nama proyek atau instansi..."
            value={searchInput}
            onChange={(event) => {
              setSearchInput(event.target.value);
              setPage(1);
            }}
            className="h-10 pl-9"
          />
        </div>
        <label className="relative flex items-center gap-2 lg:w-40">
          <ArrowDownWideNarrow
            aria-hidden="true"
            className="text-primary pointer-events-none absolute left-3 size-4"
          />
          <span className="sr-only">Urutkan proyek</span>
          <Select
            aria-label="Urutkan proyek"
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setPage(1);
            }}
            options={SORT_OPTIONS}
            className="h-10 pl-9"
          />
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-left text-xs">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-3 font-medium">
                Proyek / instansi
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Lokasi
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Sektor
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Anggaran
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Progres fisik
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Target selesai
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-3 py-3 font-medium">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {isLoading ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground px-3 py-12 text-center text-sm"
                >
                  <span role="status">Memuat daftar proyek...</span>
                </td>
              </tr>
            ) : hasError ? (
              <tr>
                <td colSpan={8} className="px-3 py-12 text-center">
                  <p role="alert" className="text-destructive text-sm">
                    Daftar proyek gagal dimuat.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setRetryCount((count) => count + 1)}
                  >
                    Coba lagi
                  </Button>
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="text-muted-foreground px-3 py-12 text-center text-sm"
                >
                  Tidak ada proyek yang sesuai dengan pencarian atau filter.
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="text-foreground">
                  <td className="px-3 py-4">
                    <p className="font-semibold">{project.nama_proyek}</p>
                    <p className="text-muted-foreground mt-1">
                      {project.instansi}
                    </p>
                  </td>
                  <td className="text-muted-foreground px-3 py-4">
                    {project.lokasi}
                  </td>
                  <td className="text-muted-foreground px-3 py-4">
                    {project.sektor}
                  </td>
                  <td className="px-3 py-4 font-semibold">
                    {formatBudget(project.anggaran)}
                  </td>
                  <td className="px-3 py-4">
                    <span className="font-semibold">
                      {project.progres_fisik}%
                    </span>
                    <progress
                      aria-label={`Progres fisik ${project.nama_proyek}`}
                      className="accent-primary mt-1 block h-1.5 w-24"
                      value={project.progres_fisik}
                      max={100}
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    {project.target_selesai}
                  </td>
                  <td className="px-3 py-4">
                    <ProjectStatus status={project.status} />
                  </td>
                  <td className="px-3 py-4">
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary h-auto px-0"
                      aria-label={`Lihat detail ${project.nama_proyek}`}
                      onClick={() => setSelectedProject(project)}
                    >
                      Detail <span aria-hidden="true">→</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="text-muted-foreground mt-4 flex flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p aria-live="polite">
          Menampilkan {isLoading || hasError ? 0 : projects.length} proyek ·
          Halaman {page} dari {visiblePages}
          {total !== 240 ? ` · ${total} proyek sesuai filter` : ""}
        </p>
        <nav
          aria-label="Navigasi halaman proyek"
          className="flex items-center gap-2"
        >
          <Button
            variant="outline"
            size="icon"
            aria-label="Halaman sebelumnya"
            disabled={page <= 1 || isLoading || hasError}
            onClick={() => setPage((current) => Math.max(current - 1, 1))}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
          </Button>
          <span
            aria-current="page"
            aria-label={`Halaman ${page} dari ${visiblePages}`}
            className="bg-primary/10 text-primary inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 font-semibold"
          >
            {page}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Halaman berikutnya"
            disabled={page >= visiblePages || isLoading || hasError}
            onClick={() =>
              setPage((current) => Math.min(current + 1, visiblePages))
            }
          >
            <ArrowRight aria-hidden="true" className="size-4" />
          </Button>
        </nav>
      </footer>

      <Modal
        open={selectedProject !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedProject(null);
        }}
        title={selectedProject?.nama_proyek ?? "Detail proyek"}
        description="Detail proyek pemerintah · data ilustratif"
      >
        {selectedProject ? <ProjectDetails project={selectedProject} /> : null}
      </Modal>
    </section>
  );
}
