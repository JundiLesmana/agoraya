import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/projects/route";
import { projectDirectoryItemSchema } from "@/lib/project-directory";

describe("project dataset exports", () => {
  it("streams a CSV attachment containing the full project dataset", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects?format=csv"),
    );

    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("content-disposition")).toContain(
      'filename="daftar-proyek.csv"',
    );

    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(bytes.slice(0, 3))).toEqual([239, 187, 191]);
    const csv = new TextDecoder("utf-8", { ignoreBOM: true }).decode(bytes);
    expect(csv.match(/\r\n/g)).toHaveLength(241);
    expect(csv).toContain('"nama_proyek","instansi","lokasi"');
  });

  it("streams a downloadable JSON array with all project records", async () => {
    const response = await GET(
      new Request("http://localhost/api/projects?format=json&download=true"),
    );

    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("content-disposition")).toContain(
      'filename="daftar-proyek.json"',
    );
    const projects = projectDirectoryItemSchema
      .array()
      .parse(await response.json());
    expect(projects).toHaveLength(240);
    expect(new Set(projects.map((project) => project.lokasi)).size).toBe(27);
  });
});
