import { describe, expect, it } from "vitest";
import {
  filterProjectDirectory,
  paginateProjectDirectory,
  PROJECT_DIRECTORY,
  PROJECT_PAGE_SIZE,
  sortProjectDirectory,
} from "@/lib/project-directory";
import { GET } from "@/app/api/projects/route";

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
