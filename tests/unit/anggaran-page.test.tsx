// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterProvider } from '@/lib/filter-store';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AnggaranPage from '@/app/(public)/anggaran/page';

function Harness() {
  return (
    <FilterProvider>
      <AnggaranPage />
    </FilterProvider>
  );
}

beforeEach(() => {
  window.localStorage.removeItem('agoraya-theme');
});

describe('AnggaranPage', () => {
  it('menampilkan judul, breadcrumb dengan Anggaran aktif, dan default filter', () => {
    render(<Harness />);

    expect(screen.getByRole('heading', { name: /jelajahi anggaran/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /beranda/i })).toBeTruthy();
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toBeTruthy();
    expect(within(breadcrumb).getByText('Anggaran')).toBeTruthy();
    expect((screen.getByLabelText('Wilayah') as HTMLSelectElement).value).toBe(
      'Provinsi Jawa Barat',
    );
    expect((screen.getByLabelText('Tahun Anggaran') as HTMLSelectElement).value).toBe(
      '2025',
    );
    expect((screen.getByLabelText('Periode') as HTMLSelectElement).value).toBe(
      's.d. Triwulan III',
    );
    expect(screen.getByText(/terapkan filter untuk melihat data/i)).toBeTruthy();
  });

  it('mengunci filter dan memicu pembaruan data saat tombol Terapkan filter diklik', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.selectOptions(
      (screen.getByLabelText('Wilayah') as HTMLSelectElement),
      'Provinsi DKI Jakarta',
    );
    await user.selectOptions(
      (screen.getByLabelText('Tahun Anggaran') as HTMLSelectElement),
      '2026',
    );
    await user.click(screen.getByRole('button', { name: /terapkan filter/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /terkunci/i })).toBeDefined();
    });
    expect(screen.getByText(/diterapkan:/i)).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText(/data diperbarui pada/i)).toBeTruthy();
    });
    expect(screen.queryByText(/terapkan filter untuk melihat data/i)).toBeNull();
  });
});
