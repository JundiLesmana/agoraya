import type * as NextNavigation from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

const testState = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findFirst: vi.fn(),
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
    query: {
      serviceApplications: {
        findFirst: testState.findFirst,
      },
    },
  }),
}));

import CitizenServiceDetailPage from '@/app/(citizen)/citizen/service/[id]/page';

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
  it('renders the citizen-owned submission detail page', async () => {
    testState.requireAuth.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    testState.findFirst.mockResolvedValue(storedApplication);

    render(
      await CitizenServiceDetailPage({
        params: Promise.resolve({ id: 'app-3' }),
      }),
    );

    expect(screen.getByRole('heading', { name: 'Tinjau Resolusi' })).toBeTruthy();
    expect(screen.getByText('Pencairan Bantuan Sosial')).toBeTruthy();
    expect(screen.getByText('Warga Contoh 3')).toBeTruthy();
    expect(screen.getByText('warga3@example.com')).toBeTruthy();
    expect(screen.getAllByText('Menunggu Tinjauan Warga').length).toBeGreaterThan(0);
    expect(screen.getByText('Permintaan Asli')).toBeTruthy();
    expect(screen.getByText('Resolusi Instansi')).toBeTruthy();
    expect(screen.getByText('Bukti Tindak Lanjut')).toBeTruthy();
    expect(screen.getByText('Area Aksi')).toBeTruthy();
    expect(screen.getByText('Timeline')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Kembali ke pengajuan saya' }).getAttribute('href')).toBe('/citizen/service');
    expect(screen.getByRole('button', { name: 'Terima & Beri Umpan Balik' }).hasAttribute('disabled')).toBe(false);
    expect(screen.getByRole('button', { name: 'Tolak & Minta Revisi' }).hasAttribute('disabled')).toBe(false);
  });

  it('accepts a citizen review from the detail page and closes the submission locally', async () => {
    testState.requireAuth.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    testState.findFirst.mockResolvedValue(storedApplication);

    render(
      await CitizenServiceDetailPage({
        params: Promise.resolve({ id: 'app-3' }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Terima & Beri Umpan Balik' }));
    fireEvent.change(screen.getByLabelText('Rating layanan'), {
      target: { value: '4' },
    });
    fireEvent.change(screen.getByLabelText('Komentar (opsional)'), {
      target: { value: 'Sudah sesuai dan cepat.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Simpan penerimaan' }));

    expect(screen.getAllByText('Selesai (Ditutup)').length).toBeGreaterThan(0);
    expect(screen.getByText('Resolusi diterima. Pengajuan ditutup dan ringkasan umpan balik disimpan.')).toBeTruthy();
    expect(screen.getByText('Warga menerima resolusi')).toBeTruthy();
    expect(screen.getByText('Rating: 4 / 5 · Umpan balik: Sudah sesuai dan cepat.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Tolak & Minta Revisi' })).toBeNull();
  });

  it('records a revision request from the detail page while keeping the submission in review', async () => {
    testState.requireAuth.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    testState.findFirst.mockResolvedValue(storedApplication);

    render(
      await CitizenServiceDetailPage({
        params: Promise.resolve({ id: 'app-3' }),
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Tolak & Minta Revisi' }));
    fireEvent.change(screen.getByLabelText('Alasan revisi'), {
      target: { value: 'Mohon tambahkan rincian tindak lanjut lapangan.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Kirim permintaan revisi' }));

    expect(screen.getByText('Permintaan revisi dicatat pada timeline pengajuan.')).toBeTruthy();
    expect(screen.getByText('Revisi telah diminta')).toBeTruthy();
    expect(screen.getByText('Alasan warga: Mohon tambahkan rincian tindak lanjut lapangan.')).toBeTruthy();
    expect(screen.getByText('Warga meminta revisi')).toBeTruthy();
    expect(screen.getAllByText('Menunggu Tinjauan Warga').length).toBeGreaterThan(0);
  });

  it('keeps review actions unavailable for a closed submission', async () => {
    testState.requireAuth.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    testState.findFirst.mockResolvedValue({
      ...storedApplication,
      status: 'closed',
    });

    render(
      await CitizenServiceDetailPage({
        params: Promise.resolve({ id: 'app-3' }),
      }),
    );

    expect(screen.getAllByText('Selesai (Ditutup)').length).toBeGreaterThan(0);
    expect(screen.getByText('Aksi review hanya tersedia ketika status pengajuan adalah Menunggu Tinjauan Warga.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Terima & Beri Umpan Balik' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Tolak & Minta Revisi' })).toBeNull();
  });

  it('calls notFound when the submission does not belong to the current citizen', async () => {
    testState.requireAuth.mockResolvedValue({
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'citizen',
      roles: ['citizen'],
    });
    testState.findFirst.mockResolvedValue(undefined);

    await expect(
      CitizenServiceDetailPage({
        params: Promise.resolve({ id: 'missing-app' }),
      }),
    ).rejects.toThrow('NEXT_NOT_FOUND');

    expect(testState.findFirst).toHaveBeenCalledTimes(1);
    expect(testState.notFound).toHaveBeenCalledTimes(1);
  });
});
