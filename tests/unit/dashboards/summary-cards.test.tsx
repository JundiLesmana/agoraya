// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/components/source-badges/source-badge', () => ({
  SourceBadge: ({ source }: { source: string }) => (
    <span data-testid="source-badge" data-source={source} />
  ),
}));

import { SummaryCards } from '@/app/(executive)/executive/dashboard/_components/summary-cards';
import type { ProjectSummary } from '@/lib/summary';

const SUMMARY: ProjectSummary = {
  totalProyek: 240,
  totalWilayah: 27,
  selesai: 156,
  berjalan: 72,
  tertunda: 12,
};

describe('SummaryCards', () => {
  it('merender 4 kartu KPI dengan data yang benar', () => {
    render(<SummaryCards summary={SUMMARY} />);

    // Kartu Total Proyek
    expect(screen.getByText('Total proyek')).toBeTruthy();
    expect(screen.getByText('240')).toBeTruthy();
    expect(screen.getByText('27 kabupaten / kota')).toBeTruthy();

    // Kartu Selesai
    expect(screen.getByText('Selesai')).toBeTruthy();
    expect(screen.getByText('156')).toBeTruthy();
    expect(screen.getByText('65% dari total proyek')).toBeTruthy();

    // Kartu Berjalan
    expect(screen.getByText('Berjalan')).toBeTruthy();
    expect(screen.getByText('72')).toBeTruthy();
    expect(screen.getByText('30% dari total proyek')).toBeTruthy();

    // Kartu Tertunda
    expect(screen.getByText('Tertunda')).toBeTruthy();
    expect(screen.getByText('12')).toBeTruthy();
    expect(screen.getByText('5% dari total proyek · perlu perhatian')).toBeTruthy();
  });

  it('menampilkan SourceBadge SIMULATED pada setiap kartu data', () => {
    render(<SummaryCards summary={SUMMARY} />);

    const badge = screen.getByTestId('source-badge');
    expect(badge.getAttribute('data-source')).toBe('SIMULATED');
  });

  it('menyertakan aria-label deskriptif pada setiap nilai angka', () => {
    render(<SummaryCards summary={SUMMARY} />);

    const el240 = screen.getByText('240', { selector: '[aria-label]' });
    expect(el240.getAttribute('aria-label')).toBe('Total proyek 240');
    const el156 = screen.getByText('156', { selector: '[aria-label]' });
    expect(el156.getAttribute('aria-label')).toBe('Selesai 156 proyek');
    const el72 = screen.getByText('72', { selector: '[aria-label]' });
    expect(el72.getAttribute('aria-label')).toBe('Berjalan 72 proyek');
    const el12 = screen.getByText('12', { selector: '[aria-label]' });
    expect(el12.getAttribute('aria-label')).toBe('Tertunda 12 proyek');
  });

  it('menggunakan grid responsif (2 kol mobile, 3 kol tablet, 5 kol desktop)', () => {
    render(<SummaryCards summary={SUMMARY} />);

    const grid = screen.getByRole('region', { name: 'Ringkasan KPI proyek' });
    expect(grid.className).toContain('sm:grid-cols-2');
    expect(grid.className).toContain('md:grid-cols-3');
    expect(grid.className).toContain('lg:grid-cols-5');
  });

  it('menampilkan loading skeleton saat data null', () => {
    const { container } = render(
      <div data-testid="loading-placeholder">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton-card">
            <div className="animate-pulse" />
          </div>
        ))}
      </div>,
    );

    const skeletonCards = container.querySelectorAll('.skeleton-card');
    expect(skeletonCards.length).toBe(4);
    skeletonCards.forEach((card) => {
      expect(card.querySelector('.animate-pulse')).toBeTruthy();
    });
  });
});