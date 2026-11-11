"use client";

import { useCallback, useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ProjectDetail } from "@/modules/project-progress/types";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ProjectSelectorProps {
  readonly projects: readonly ProjectDetail[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}

export function ProjectSelector({
  projects,
  selectedId,
  onSelect,
}: ProjectSelectorProps) {
  const [search, setSearch] = useState("");
  const [tahun, setTahun] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("id-ID");
    return projects.filter((p) => {
      const matchesSearch =
        !q ||
        p.namaPaket.toLocaleLowerCase("id-ID").includes(q) ||
        p.instansi.toLocaleLowerCase("id-ID").includes(q) ||
        p.lokasi.toLocaleLowerCase("id-ID").includes(q);
      const matchesTahun = !tahun || p.tahunAnggaran === Number(tahun);
      return matchesSearch && matchesTahun;
    });
  }, [search, tahun, projects]);
  const years = [...new Set(projects.map((project) => project.tahunAnggaran))]
    .sort((a, b) => b - a)
    .map((year) => ({ value: String(year), label: String(year) }));

  const selectedInList = filtered.some((p) => p.id === selectedId);
  const selectedProject = projects.find((p) => p.id === selectedId);

  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      onSelect(event.target.value);
    },
    [onSelect],
  );

  return (
    <section className="bg-card rounded-xl border p-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium leading-none">
          Pemilihan Proyek
          <span aria-hidden="true" className="ml-0.5 text-destructive">
            *
          </span>
        </label>
        <p className="text-xs text-muted-foreground">
          Cari berdasarkan nama paket, instansi, lokasi, atau tahun anggaran.
        </p>
        <div className="grid items-end gap-4 sm:grid-cols-12">
          <div className="relative col-span-12 sm:col-span-5">
            <Search
              aria-hidden="true"
              className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder="Cari nama paket, lokasi, atau instansi…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 pl-10 text-base shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <Select
              placeholder="Tahun Anggaran"
              value={tahun || undefined}
              onChange={(event) => setTahun(event.target.value)}
              options={[{ value: "", label: "Semua Tahun Anggaran" }, ...years]}
            />
          </div>
          <div className="col-span-12 sm:col-span-4">
            <select
              id="project-picker"
              value={selectedInList ? selectedId : ""}
              onChange={handleSelect}
              className="border-input focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">
                Pilih proyek dari hasil pencarian di atas
              </option>
              {filtered.map((p) => {
                return (
                  <option key={p.id} value={p.id}>
                    {p.namaPaket} — {p.instansi} · {p.lokasi} (
                    {p.tahunAnggaran})
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      {selectedProject && (
        <p className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
          <span className={cn("bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 text-xs")}>
            {selectedProject.instansi}
          </span>
          {selectedProject.namaPaket} · {selectedProject.lokasi}
        </p>
      )}
    </section>
  );
}
