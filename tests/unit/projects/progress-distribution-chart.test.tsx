// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ProjectSummary } from '@/lib/summary';
import { buildProgressDistributionData, ProgressDistributionChart } from '@/app/(executive)/executive/dashboard/_components/progress-distribution-chart';

const SUMMARY: ProjectSummary = {
  totalProyek: 240,
  totalWilayah: 27,
  selesai: 156,
  berjalan: 72,
  tertunda: 12,
};

describe('progress distribution chart', () => {
  it('mengubah summary menjadi 3 data status chart', () => {
    expect(buildProgressDistributionData(SUMMARY)).toEqual([
      { name: 'Selesai', value: 156, percent: 65, color: '#2fb58b' },
      { name: 'Berjalan', value: 72, percent: 30, color: '#3b82f6' },
      { name: 'Tertunda', value: 12, percent: 5, color: '#f59e0b' },
    ]);
  });

  it('merender chart donut, label tengah, catatan, dan fallback data table', () => {
    render(<ProgressDistributionChart summary={SUMMARY} />);

    expect(screen.getByText('Progres penyelesaian')).toBeTruthy();
    expect(screen.getByText('240 proyek')).toBeTruthy();
    expect(screen.getByText('status per 30 September 2025')).toBeTruthy();
    expect(screen.getByText('12 proyek tertunda memerlukan perhatian. Periksa progres fisik.')).toBeTruthy();
    expect(screen.getByText('Distribusi status proyek')).toBeTruthy();
    expect(screen.getByText('Selesai')).toBeTruthy();
    expect(screen.getByText('Berjalan')).toBeTruthy();
    expect(screen.getByText('Tertunda')).toBeTruthy();
    expect(screen.getByText('Selesai · 65%')).toBeTruthy();
    expect(screen.getByText('Berjalan · 30%')).toBeTruthy();
    expect(screen.getByText('Tertunda · 5%')).toBeTruthy();
  });
});
