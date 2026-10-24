import { NextResponse } from 'next/server';
import type { ProjectSummary } from '@/lib/summary';

export const dynamic = 'force-dynamic';

// TODO(#43): replace with real aggregation from database
const MOCK_SUMMARY: ProjectSummary = {
  totalProyek: 240,
  totalWilayah: 27,
  selesai: 156,
  berjalan: 72,
  tertunda: 12,
};

export async function GET() {
  return NextResponse.json(MOCK_SUMMARY);
}