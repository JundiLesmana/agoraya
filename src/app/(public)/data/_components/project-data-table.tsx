"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import {
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Download,
  ExternalLink,
  Flag,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { SourceBadge } from "@/components/source-badges/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  exportProjectsCsv,
  filterProjects,
  PROJECTS,
  sortProjectsByBudget,
  type Project,
  type ProjectStatus,
} from "./project-data";

const PAGE_SIZE = 4;
const STATUS_OPTIONS = [
  { value: "Semua status", label: "Semua status" },
  { value: "Selesai", label: "Selesai" },
  { value: "Berjalan", label: "Berjalan" },
  { value: "Tertunda", label: "Tertunda" },
] as const;

function formatBudget(value: number): string {
  return `Rp${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(value / 1_000_000_000)} M`;
}

function statusClassName(status: ProjectStatus): string {
  switch (status) {
    case "Selesai":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "Berjalan":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "Tertunda":
      return "border-red-200 bg-red-50 text-red-800";
  }
}

export function ProjectDataTable() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "Semua status">(
    "Semua status",
  );
  const [sortByBudget, setSortByBudget] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const filteredProjects = useMemo(() => {
    const filtered = filterProjects(PROJECTS, debouncedSearch, status);
    return sortByBudget ? sortProjectsByBudget(filtered) : filtered;
  }, [debouncedSearch, sortByBudget, status]);
  const pageCount = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const visibleProjects = filteredProjects.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE,
  );
  const firstVisible = filteredProjects.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const lastVisible = Math.min((page + 1) * PAGE_SIZE, filteredProjects.length);

  function downloadCsv() {
    const csv = `\uFEFF${exportProjectsCsv(filteredProjects)}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "data-proyek.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function openDetails(project: Project, opener: HTMLElement) {
    openerRef.current = opener;
    setSelectedProject(project);
  }

  return (
    <section
      id="project-catalog"
      aria-labelledby="project-data-title"
      className="space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="project-data-title"
            className="text-card-foreground text-2xl font-semibold tracking-tight"
          >
            Pantau proyek, lihat dampaknya
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            8 contoh dari 240 proyek · angka ilustratif · M = miliar rupiah
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SourceBadge
            source="SIMULATED"
            label="Data simulasi"
            withIcon={false}
          />
          <Button
            variant="outline"
            onClick={downloadCsv}
            disabled={filteredProjects.length === 0}
          >
            <Download className="size-4" aria-hidden="true" />
            Unduh CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Cari nama proyek atau instansi</span>
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            ref={searchInputRef}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder="Cari nama proyek atau instansi..."
            className="pl-9"
          />
        </label>
        <label className="relative sm:w-44">
          <span className="sr-only">Filter status proyek</span>
          <Select
            value={status}
            onChange={(event) => {
              const selectedStatus =
                STATUS_OPTIONS.find(
                  (option) => option.value === event.target.value,
                )?.value ?? "Semua status";
              setStatus(selectedStatus);
              setPage(0);
            }}
            options={STATUS_OPTIONS}
            className="pr-9"
          />
          <ChevronDown
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
        </label>
        <label className="relative sm:w-48">
          <span className="sr-only">Urutkan proyek</span>
          <Select
            value={sortByBudget ? "budget-desc" : "default"}
            onChange={(event) => {
              setSortByBudget(event.target.value === "budget-desc");
              setPage(0);
            }}
            options={[
              { value: "default", label: "Urutan awal" },
              { value: "budget-desc", label: "Anggaran terbesar" },
            ]}
            className="pr-9"
          />
          <ArrowDownWideNarrow
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
        </label>
      </div>

      <div className="border-border overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[860px] text-left text-sm">
          <caption className="sr-only">
            Daftar proyek publik yang dapat dicari dan difilter
          </caption>
          <thead className="bg-muted/50 text-muted-foreground text-xs">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Proyek / Instansi
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Wilayah
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Anggaran
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Realisasi
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Progres fisik
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-4 py-3 text-right font-medium">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-border divide-y">
            {visibleProjects.map((project) => (
              <tr
                key={project.id}
                tabIndex={0}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" &&
                    event.target === event.currentTarget
                  ) {
                    openDetails(project, event.currentTarget);
                  }
                }}
                className="focus-visible:bg-accent/50 focus-visible:outline-none"
              >
                <th scope="row" className="px-4 py-3 font-medium">
                  <span className="text-card-foreground block">
                    {project.name}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-xs font-normal">
                    {project.agency}
                  </span>
                </th>
                <td className="text-muted-foreground px-4 py-3">
                  {project.region}
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums">
                  {formatBudget(project.budget)}
                </td>
                <td className="text-muted-foreground px-4 py-3 tabular-nums">
                  {formatBudget(project.realization)}
                </td>
                <td className="px-4 py-3">
                  <div className="w-24">
                    <span className="text-xs font-semibold tabular-nums">
                      {project.progress}%
                    </span>
                    <div
                      role="progressbar"
                      aria-label={`Progres fisik ${project.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={project.progress}
                      className="bg-muted mt-1 h-1.5 overflow-hidden rounded-full"
                    >
                      <div
                        className="bg-primary h-full rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={statusClassName(project.status)}
                  >
                    {project.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="link"
                    size="sm"
                    aria-label={`Detail ${project.name}`}
                    onClick={(event) =>
                      openDetails(project, event.currentTarget)
                    }
                  >
                    Detail{" "}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Button>
                </td>
              </tr>
            ))}
            {visibleProjects.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground px-4 py-12 text-center"
                >
                  Tidak ada proyek yang cocok. Coba ubah kata pencarian atau
                  status.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="text-muted-foreground flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
        <p aria-live="polite">
          Menampilkan {firstVisible}–{lastVisible} dari{" "}
          {filteredProjects.length} contoh proyek
        </p>
        <nav
          aria-label="Navigasi halaman proyek"
          className="flex items-center gap-2"
        >
          <Button
            variant="outline"
            size="icon"
            aria-label="Halaman sebelumnya"
            disabled={page <= 0}
            onClick={() => setPage((current) => current - 1)}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Button>
          <span
            className="min-w-9 text-center tabular-nums"
            aria-current="page"
          >
            {page + 1} / {Math.max(pageCount, 1)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Halaman berikutnya"
            disabled={page + 1 >= pageCount}
            onClick={() => setPage((current) => current + 1)}
          >
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      </div>

      <Dialog.Root
        open={selectedProject !== null}
        onOpenChange={(open) => !open && setSelectedProject(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
          {selectedProject ? (
            <Dialog.Content
              onCloseAutoFocus={(event) => {
                event.preventDefault();
                openerRef.current?.focus();
              }}
              className="border-border bg-background fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-xl translate-x-0 flex-col overflow-y-auto border-l p-6 shadow-2xl transition-transform duration-300 ease-out data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-primary text-xs font-semibold tracking-wide uppercase">
                    Detail proyek terpilih
                  </p>
                  <Dialog.Title className="mt-3 text-2xl font-semibold tracking-tight">
                    {selectedProject.name}
                  </Dialog.Title>
                </div>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Tutup detail proyek"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </Button>
                </Dialog.Close>
              </div>
              <Dialog.Description className="text-muted-foreground mt-3 text-sm leading-6">
                {selectedProject.description}
              </Dialog.Description>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs">Instansi</p>
                  <p className="mt-1 font-medium">{selectedProject.agency}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Status</p>
                  <Badge
                    variant="outline"
                    className={`mt-1 ${statusClassName(selectedProject.status)}`}
                  >
                    {selectedProject.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Realisasi keuangan
                  </p>
                  <p className="mt-1 font-semibold tabular-nums">
                    {formatBudget(selectedProject.realization)} /{" "}
                    {formatBudget(selectedProject.budget)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Periode pelaksanaan
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedProject.schedule}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Target penerima manfaat
                  </p>
                  <p className="mt-1 font-semibold">
                    {selectedProject.beneficiaries}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Progres fisik</p>
                  <p className="text-sm font-semibold tabular-nums">
                    {selectedProject.progress}%
                  </p>
                </div>
                <div
                  role="progressbar"
                  aria-label={`Progres fisik ${selectedProject.name}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={selectedProject.progress}
                  className="bg-muted mt-2 h-2.5 overflow-hidden rounded-full"
                >
                  <div
                    className="bg-primary h-full rounded-full transition-[width]"
                    style={{ width: `${selectedProject.progress}%` }}
                  />
                </div>
              </div>

              <div className="mt-7">
                <h3 className="font-semibold">Milestone proyek</h3>
                <ol className="mt-4 space-y-4">
                  {selectedProject.milestones.map((milestone, index) => {
                    const MilestoneIcon =
                      index === 0
                        ? CheckCircle2
                        : index === 1
                          ? CircleDashed
                          : Flag;
                    return (
                      <li key={milestone} className="flex items-start gap-3">
                        <MilestoneIcon
                          className={`mt-0.5 size-4 shrink-0 ${index < 2 ? "text-emerald-700" : "text-muted-foreground"}`}
                          aria-hidden="true"
                        />
                        <span className="text-sm">{milestone}</span>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="outline">
                  <Link
                    href="#project-catalog"
                    onClick={() => setSelectedProject(null)}
                  >
                    <ExternalLink className="size-4" aria-hidden="true" />
                    Lihat dataset proyek
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadCsv}
                  disabled={filteredProjects.length === 0}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Unduh CSV
                </Button>
              </div>
              <p className="text-muted-foreground mt-6 text-xs">
                Data simulasi · Pembaruan ilustratif 30 September 2025
              </p>
            </Dialog.Content>
          ) : null}
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
