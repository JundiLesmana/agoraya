import type * as NextNavigation from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const testState = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  select: vi.fn(),
  applicationRows: [] as Record<string, unknown>[],
  publicUpdates: [] as Record<string, unknown>[],
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('next/navigation', async () => {
  const actual: typeof NextNavigation = await vi.importActual('next/navigation');
  return {
    ...actual,
    notFound: testState.notFound,
  };
});

vi.mock('@/lib/auth/guards', () => ({
  requireAuth: testState.requireAuth,
}));

vi.mock('@/lib/db', () => ({
  db: () => ({
    select: testState.select,
  }),
}));

import CitizenServiceDetailPage from '@/app/(citizen)/citizen/service/[id]/page';

function mockApplicationQueries(applicationRows: Record<string, unknown>[]) {
  testState.applicationRows = applicationRows;
  testState.publicUpdates = [];
  testState.select.mockImplementation(() => {
    const queryIndex = testState.select.mock.calls.length - 1;
    const result = queryIndex === 0
      ? testState.applicationRows
      : testState.publicUpdates;
    const where = vi.fn().mockReturnValue({
      limit: vi.fn().mockResolvedValue(result),
      orderBy: vi.fn().mockResolvedValue(result),
    });

    return {
      from: vi.fn().mockReturnValue({ where }),
    };
  });
}

const storedApplication = {
  id: 'app-3',
  trackingNumber: 'PGD-261010-00003',
  category: 'social',
  serviceType: 'izin',
  serviceId: 'svc-3',
  routeKey: 'sosial-pendidikan',
  serviceName: 'Pencairan Bantuan Sosial',
  agency: 'Dinas Sosial',
  status: 'resolved',
  applicantName: 'Warga Contoh 3',
  contactEmail: 'warga3@example.com',
  payload: {
    description: 'Permohonan pencairan bantuan sosial untuk keluarga terdampak.',
  },
  submittedAt: new Date('2026-10-08T08:00:00.000Z'),
  updatedAt: new Date('2026-10-09T08:00:00.000Z'),
};

describe('CitizenServiceDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the authenticated citizen submission detail as read-only', async () => {
    testState.requireAuth.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    mockApplicationQueries([storedApplication]);

    render(
      await CitizenServiceDetailPage({
        params: Promise.resolve({ id: 'app-3' }),
      }),
    );

    expect(
      screen.getByRole('heading', { name: 'Pencairan Bantuan Sosial' }),
    ).toBeTruthy();
    expect(screen.getByText('Warga Contoh 3')).toBeTruthy();
    expect(screen.getByText('warga3@example.com')).toBeTruthy();
    expect(screen.getAllByText('Menunggu Tinjauan Warga').length).toBeGreaterThan(0);
    expect(screen.getByText('Pengajuan Anda berhasil dicatat.')).toBeTruthy();
    expect(screen.getByText('Data pemohon')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: 'Kembali ke daftar pengajuan' }).getAttribute('href'),
    ).toBe('/citizen/service');
    expect(
      screen.queryByRole('button', { name: 'Terima & Beri Umpan Balik' }),
    ).toBeNull();
  });

  it('calls notFound when the submission does not belong to the current citizen', async () => {
    testState.requireAuth.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    mockApplicationQueries([]);

    await expect(
      CitizenServiceDetailPage({
        params: Promise.resolve({ id: 'missing-app' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(testState.select).toHaveBeenCalledTimes(1);
    expect(testState.notFound).toHaveBeenCalledTimes(1);
  });
});
