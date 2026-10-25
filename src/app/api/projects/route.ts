import { NextResponse } from "next/server";
import {
  filterProjectDirectory,
  paginateProjectDirectory,
  PROJECT_DIRECTORY,
  PROJECT_PAGE_SIZE,
  projectDirectoryItemSchema,
  sortProjectDirectory,
} from "@/lib/project-directory";
import { z } from "zod";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  search: z.string().trim().max(200).optional().default(""),
  sort: z
    .enum(["anggaran_desc", "anggaran_asc"])
    .optional()
    .default("anggaran_desc"),
  status: z.enum(["Selesai", "Berjalan", "Tertunda"]).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  format: z.enum(["json", "csv"]).optional().default("json"),
});

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parameter proyek tidak valid." },
      { status: 400 },
    );
  }

  const { search, sort, status, page, format } = parsed.data;
  const directoryFiltered = filterProjectDirectory(PROJECT_DIRECTORY, {
    search,
    status,
  });
  const sorted = sortProjectDirectory(directoryFiltered, sort);
  const totalPages = Math.ceil(sorted.length / PROJECT_PAGE_SIZE);

  if (page > Math.max(totalPages, 1)) {
    return NextResponse.json(
      { error: "Halaman proyek tidak tersedia." },
      { status: 400 },
    );
  }

  if (format === "csv") {
    const headers = [
      "nama_proyek",
      "instansi",
      "lokasi",
      "sektor",
      "anggaran",
      "progres_fisik",
      "target_selesai",
      "status",
    ];
    const rows = sorted.map((project) =>
      [
        project.nama_proyek,
        project.instansi,
        project.lokasi,
        project.sektor,
        project.anggaran,
        project.progres_fisik,
        project.target_selesai,
        project.status,
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = `\uFEFF${headers.map(csvCell).join(",")}\r\n${rows.join("\r\n")}\r\n`;

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="daftar-proyek.csv"',
      },
    });
  }

  const result = paginateProjectDirectory(sorted, page, PROJECT_PAGE_SIZE);
  const data = result.data.map((item) =>
    projectDirectoryItemSchema.parse(item),
  );

  return NextResponse.json({
    ...result,
    data,
    filters: { search, sort, status },
  } satisfies {
    data: typeof data;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    filters: Record<string, string | undefined>;
  });
}
