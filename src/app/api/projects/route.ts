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
  wilayah: z.string().trim().max(100).optional(),
  periode: z.string().trim().max(50).optional(),
  sektor: z
    .enum([
      "Infrastruktur",
      "Pendidikan",
      "Kesehatan",
      "Sektor lainnya",
      "Semua sektor",
    ])
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  format: z.enum(["json", "csv"]).optional().default("json"),
  download: z.literal("true").optional(),
});

function csvCell(value: string | number): string {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function streamText(parts: Iterable<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = parts[Symbol.iterator]();

  return new ReadableStream({
    pull(controller) {
      const next = iterator.next();
      if (next.done) {
        controller.close();
        return;
      }

      controller.enqueue(encoder.encode(next.value));
    },
  });
}

function* csvRows(
  projects: ReturnType<typeof sortProjectDirectory>,
): Generator<string> {
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
  yield `\uFEFF${headers.map(csvCell).join(",")}\r\n`;

  for (const project of projects) {
    yield [
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
      .join(",") + "\r\n";
  }
}

function* jsonRows(
  projects: ReturnType<typeof sortProjectDirectory>,
): Generator<string> {
  yield "[\n";
  for (const [index, project] of projects.entries()) {
    yield `${index > 0 ? ",\n" : ""}${JSON.stringify(project)}`;
  }
  yield "\n]\n";
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

  const {
    search,
    sort,
    status,
    wilayah,
    periode,
    sektor,
    page,
    format,
    download,
  } = parsed.data;
  const directoryFiltered = filterProjectDirectory(PROJECT_DIRECTORY, {
    search,
    status,
    wilayah,
    periode,
    sektor,
  });
  const sorted = sortProjectDirectory(directoryFiltered, sort);
  const totalPages = Math.ceil(sorted.length / PROJECT_PAGE_SIZE);

  if (download === "true" && format === "json") {
    return new Response(streamText(jsonRows(sorted)), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="daftar-proyek.json"',
      },
    });
  }

  if (page > Math.max(totalPages, 1)) {
    return NextResponse.json(
      { error: "Halaman proyek tidak tersedia." },
      { status: 400 },
    );
  }

  if (format === "csv") {
    return new Response(streamText(csvRows(sorted)), {
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
    filters: { search, sort, status, wilayah, periode, sektor },
  } satisfies {
    data: typeof data;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    filters: Record<string, string | undefined>;
  });
}
