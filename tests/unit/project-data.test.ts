import { describe, expect, it } from "vitest";
import {
  exportProjectsCsv,
  filterProjects,
  PROJECTS,
  sortProjectsByBudget,
} from "@/app/(public)/data/_components/project-data";

describe("project data helpers", () => {
  it("searches project names and agencies without case sensitivity", () => {
    expect(
      filterProjects(PROJECTS, "sekolah", "Semua status").map(
        (project) => project.id,
      ),
    ).toEqual(["rehabilitasi-sekolah-bogor"]);
    expect(
      filterProjects(PROJECTS, "DINAS KESEHATAN", "Semua status"),
    ).toHaveLength(2);
  });

  it("filters by status", () => {
    expect(
      filterProjects(PROJECTS, "", "Tertunda").map((project) => project.id),
    ).toEqual(["sistem-air-bersih-cianjur", "drainase-bekasi"]);
  });

  it("sorts projects by budget descending without changing the input", () => {
    const sorted = sortProjectsByBudget(PROJECTS);

    expect(sorted.map((project) => project.budget)).toEqual([
      120_000_000_000, 80_000_000_000, 60_000_000_000, 40_000_000_000,
      32_000_000_000, 28_000_000_000, 18_000_000_000, 15_000_000_000,
    ]);
    expect(PROJECTS[0].id).toBe("jalan-provinsi");
  });

  it("exports a CSV header and correctly escaped rows", () => {
    const csv = exportProjectsCsv([PROJECTS[1]]);

    expect(csv.split("\r\n")).toEqual([
      '"Proyek","Instansi","Wilayah","Anggaran","Realisasi","Progres fisik","Status"',
      '"Rehabilitasi 12 sekolah","Dinas Pendidikan","Kab. Bogor","80000000000","60000000000","75%","Berjalan"',
    ]);
  });
});
