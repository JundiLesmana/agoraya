import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  filterProjectDirectory,
  PROJECT_DIRECTORY,
} from '@/lib/project-directory';
import type { ProjectDashboardSummary } from '@/lib/summary';

export const dynamic = 'force-dynamic';

const querySchema = z.object({
  wilayah: z.string().trim().max(100).optional(),
  periode: z.string().trim().max(50).optional(),
  sektor: z
    .enum([
      'Infrastruktur',
      'Pendidikan',
      'Kesehatan',
      'Sektor lainnya',
      'Semua sektor',
    ])
    .optional(),
  status: z.enum(['Selesai', 'Berjalan', 'Tertunda', 'Semua status']).optional(),
});

const SECTORS = [
  'Infrastruktur',
  'Pendidikan',
  'Kesehatan',
  'Sektor lainnya',
] as const;

export async function GET(request: Request) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Parameter ringkasan proyek tidak valid.' },
      { status: 400 },
    );
  }

  const filters = parsed.data;
  const projects = filterProjectDirectory(PROJECT_DIRECTORY, {
    wilayah: filters.wilayah,
    periode: filters.periode,
    sektor: filters.sektor,
    status:
      filters.status && filters.status !== 'Semua status'
        ? filters.status
        : undefined,
  });
  const countStatus = (status: 'Selesai' | 'Berjalan' | 'Tertunda') =>
    projects.filter((project) => project.status === status).length;

  const summary: ProjectDashboardSummary = {
    totalProyek: projects.length,
    totalWilayah:
      filters.wilayah && filters.wilayah !== 'Provinsi Jawa Barat'
        ? new Set(projects.map((project) => project.lokasi)).size
        : new Set(PROJECT_DIRECTORY.map((project) => project.lokasi)).size,
    selesai: countStatus('Selesai'),
    berjalan: countStatus('Berjalan'),
    tertunda: countStatus('Tertunda'),
    sektor: SECTORS.map((nama) => {
      const sectorProjects = projects.filter(
        (project) => project.sektor === nama,
      );
      return {
        nama,
        selesai: sectorProjects.filter((project) => project.status === 'Selesai')
          .length,
        total: sectorProjects.length,
      };
    }),
  };

  return NextResponse.json(summary);
}