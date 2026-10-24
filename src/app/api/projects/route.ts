import { NextResponse } from 'next/server';
import { filterProjects, MOCK_PROJECTS, type Project } from '@/lib/projects';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wilayah = searchParams.get('wilayah') || undefined;
  const periode = searchParams.get('periode') || undefined;
  const sektor = searchParams.get('sektor') || undefined;
  const status = searchParams.get('status') || undefined;

  const filtered = filterProjects(MOCK_PROJECTS, { wilayah, periode, sektor, status });

  return NextResponse.json({
    data: filtered,
    total: filtered.length,
    filters: { wilayah, periode, sektor, status },
  } satisfies { data: Project[]; total: number; filters: Record<string, string | undefined> });
}
