import { beforeEach, describe, expect, it, vi } from 'vitest';

const testState = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  findFirst: vi.fn(),
  loggerError: vi.fn(),
  and: vi.fn((...conditions: unknown[]) => ({ type: 'and', conditions })),
  eq: vi.fn((column: unknown, value: unknown) => ({ column, value })),
  inArray: vi.fn((column: unknown, values: readonly unknown[]) => ({ column, values })),
  resolveReportingTenantId: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  and: testState.and,
  eq: testState.eq,
  inArray: testState.inArray,
}));

vi.mock('@/lib/auth/session', () => ({
  getCurrentSession: testState.getCurrentSession,
}));

vi.mock('@/lib/db', () => ({
  db: () => ({
    query: {
      serviceApplications: {
        findFirst: testState.findFirst,
      },
    },
  }),
}));

vi.mock('@/lib/db/schema', () => ({
  serviceApplications: {
    id: 'id-column',
    tenantId: 'tenant-column',
    applicantUserId: 'applicant-column',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: testState.loggerError,
  },
}));

vi.mock('@/lib/tenancy/reporting', () => ({
  resolveReportingTenantId: testState.resolveReportingTenantId,
}));

import { GET } from '@/app/api/citizen/service-applications/[id]/route';

describe('GET /api/citizen/service-applications/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    testState.resolveReportingTenantId.mockResolvedValue('tenant-recipient');
  });

  it('returns 404 when the citizen does not own the requested submission', async () => {
    testState.getCurrentSession.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    testState.findFirst.mockResolvedValue(undefined);

    const response = await GET(new Request('http://localhost/api/citizen/service-applications/app-9'), {
      params: Promise.resolve({ id: 'app-9' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: 'Pengajuan tidak ditemukan.',
    });
    expect(testState.eq).toHaveBeenNthCalledWith(1, 'id-column', 'app-9');
    expect(testState.inArray).toHaveBeenCalledWith('tenant-column', [
      'tenant-1',
      'tenant-recipient',
    ]);
    expect(testState.eq).toHaveBeenNthCalledWith(2, 'applicant-column', 'user-1');
  });

  it('returns the matching submission detail for the current citizen', async () => {
    testState.getCurrentSession.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    testState.findFirst.mockResolvedValue({
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
      payload: {},
      submittedAt: new Date('2026-10-08T08:00:00.000Z'),
      updatedAt: new Date('2026-10-09T08:00:00.000Z'),
    });

    const response = await GET(new Request('http://localhost/api/citizen/service-applications/app-3'), {
      params: Promise.resolve({ id: 'app-3' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      application: {
        id: 'app-3',
        trackingNumber: 'PGD-261010-00003',
        applicantName: 'Warga Contoh 3',
      },
    });
  });
});
