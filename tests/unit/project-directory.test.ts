import { describe, expect, it } from "vitest";
import {
  filterProjectDirectory,
  paginateProjectDirectory,
  PROJECT_DIRECTORY,
  PROJECT_PAGE_SIZE,
  sortProjectDirectory,
} from "@/lib/project-directory";
import { GET } from "@/app/api/projects/route";
import { GET as GETSummary } from "@/app/api/projects/summary/route";

describe("project directory data operations", () => {
  it("provides 240 illustrative projects and a first page of 40", () => {
    expect(PROJECT_DIRECTORY).toHaveLength(240);

    const page = paginateProjectDirectory(PROJECT_DIRECTORY, 1);
    expect(page.data).toHaveLength(PROJECT_PAGE_SIZE);
    expect(page.total).toBe(240);
    expect(page.totalPages).toBe(6);
  });

  it("searches project names and agencies without case sensitivity", () => {
    const matches = filterProjectDirectory(PROJECT_DIRECTORY, {
      search: "sekolah",
    });
    const agencyMatches = filterProjectDirectory(PROJECT_DIRECTORY, {
      search: "bina marga",
    });

    expect(matches.length).toBeGreaterThan(0);
    expect(
      matches.every((project) => /sekolah/i.test(project.nama_proyek)),
    ).toBe(true);
    expect(agencyMatches.length).toBeGreaterThan(0);
    expect(
      agencyMatches.every((project) => /bina marga/i.test(project.instansi)),
    ).toBe(true);
  });

  it("filters statuses and sorts budgets in either direction", () => {
    const finished = filterProjectDirectory(PROJECT_DIRECTORY, {
      status: "Selesai",
    });
    const descending = sortProjectDirectory(finished, "anggaran_desc");
    const ascending = sortProjectDirectory(finished, "anggaran_asc");

    expect(finished.every((project) => project.status === "Selesai")).toBe(
      true,
    );
    expect(descending[0].anggaran).toBeGreaterThanOrEqual(
      descending[descending.length - 1].anggaran,
    );
    expect(ascending[0].anggaran).toBeLessThanOrEqual(
      ascending[ascending.length - 1].anggaran,
    );
  });

  it("matches the published portfolio totals and sector completion data", () => {
    expect(
      PROJECT_DIRECTORY.filter((project) => project.status === "Selesai"),
    ).toHaveLength(156);
    expect(
      PROJECT_DIRECTORY.filter((project) => project.status === "Berjalan"),
    ).toHaveLength(72);
    expect(
      PROJECT_DIRECTORY.filter((project) => project.status === "Tertunda"),
    ).toHaveLength(12);

    const sectorTotals = new Map<string, number>();
    for (const project of PROJECT_DIRECTORY) {
      sectorTotals.set(
        project.sektor,
        (sectorTotals.get(project.sektor) ?? 0) + 1,
      );
    }
    expect(Object.fromEntries(sectorTotals)).toEqual({
      Infrastruktur: 80,
      Pendidikan: 60,
      Kesehatan: 60,
      "Sektor lainnya": 40,
    });
  });

  it("filters projects by region, sector and available snapshot period", () => {
    const bogorProjects = filterProjectDirectory(PROJECT_DIRECTORY, {
      wilayah: "Kabupaten Bogor",
      sektor: "Pendidikan",
    });

    expect(bogorProjects.length).toBeGreaterThan(0);
    expect(
      bogorProjects.every(
        (project) =>
          project.lokasi === "Kab. Bogor" &&
          project.sektor === "Pendidikan",
      ),
    ).toBe(true);
    expect(
      filterProjectDirectory(PROJECT_DIRECTORY, {
        periode: "2024 · s.d. TW IV",
      }),
    ).toHaveLength(0);
  });

  it("returns a different page without duplicating the previous page", () => {
    const firstPage = paginateProjectDirectory(PROJECT_DIRECTORY, 1);
    const secondPage = paginateProjectDirectory(PROJECT_DIRECTORY, 2);

    expect(secondPage.data).toHaveLength(PROJECT_PAGE_SIZE);
    expect(secondPage.data[0].id).not.toBe(firstPage.data[0].id);
  });
});

describe("/api/projects", () => {
  it("filters, sorts and paginates the project directory", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects?status=Berjalan&page=2"),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(PROJECT_PAGE_SIZE);
    expect(
      body.data.every(
        (project: { status: string }) => project.status === "Berjalan",
      ),
    ).toBe(true);
  });

  it("exports the complete filtered dataset as CSV", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects?status=Tertunda&format=csv"),
    );
    const csv = await response.text();

    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(csv).toContain('"nama_proyek","instansi"');
    expect(csv).toContain('"Tertunda"');
    expect(csv.split("\r\n").length).toBeGreaterThan(2);
  });

  it("rejects unsupported status values", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects?status=unknown"),
    );

    expect(response.status).toBe(400);
  });
});

describe("/api/projects/summary", () => {
  it("returns portfolio and sector aggregates from the same filtered directory", async () => {
    const response = await GETSummary(
      new Request(
        "http://localhost/api/projects/summary?wilayah=Provinsi+Jawa+Barat&periode=2025+%C2%B7+s.d.+TW+III&sektor=Semua+sektor&status=Semua+status",
      ),
    );
    const summary = await response.json();

    expect(response.status).toBe(200);
    expect(summary).toMatchObject({
      totalProyek: 240,
      totalWilayah: 27,
      selesai: 156,
      berjalan: 72,
      tertunda: 12,
    });
    expect(summary.sektor).toEqual([
      { nama: "Infrastruktur", selesai: 52, total: 80 },
      { nama: "Pendidikan", selesai: 39, total: 60 },
      { nama: "Kesehatan", selesai: 39, total: 60 },
      { nama: "Sektor lainnya", selesai: 26, total: 40 },
    ]);
  });

  it("applies the selected region, sector and status to aggregates", async () => {
    const response = await GETSummary(
      new Request(
        "http://localhost/api/projects/summary?wilayah=Kabupaten+Bogor&sektor=Pendidikan&status=Berjalan",
      ),
    );
    const summary = await response.json();

    expect(response.status).toBe(200);
    expect(summary.totalWilayah).toBe(1);
    expect(summary.totalProyek).toBeGreaterThan(0);
    expect(summary.berjalan).toBe(summary.totalProyek);
    expect(summary.sektor[0]).toEqual({
      nama: "Infrastruktur",
      selesai: 0,
      total: 0,
    });
    expect(summary.sektor[1].total).toBe(summary.totalProyek);
  });
});
