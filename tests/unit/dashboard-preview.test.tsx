import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/source-badges/source-badge', () => ({
  SourceBadge: ({ source }: { source: string }) => <span data-source={source} />,
}));

vi.mock('@/components/charts/bar-chart', () => ({
  BarChart: () => <div data-testid="bar-chart" />,
}));

vi.mock('@/components/charts/line-chart', () => ({
  LineChart: () => <div data-testid="line-chart" />,
}));

vi.mock('@/components/charts/pie-chart', () => ({
  PieChart: () => <div data-testid="pie-chart" />,
}));

import { DashboardPreview } from '@/app/(public)/_components/dashboard-preview';

describe('DashboardPreview', () => {
  it('renders the section heading and CTA link to /data', () => {
    render(<DashboardPreview />);

    expect(screen.getByRole('heading', { name: /akses data, pahami kondisi, lihat perkembangannya/i })).toBeTruthy();
    expect(screen.getAllByText(/data pemerintah/i).length).toBeGreaterThan(0);

    const cta = screen.getByRole('link', { name: /jelajahi semua data/i });
    expect(cta.getAttribute('href')).toBe('/data');
  });

  it('renders all four platform coverage stats', () => {
    render(<DashboardPreview />);

    expect(screen.getByText('+10.000')).toBeTruthy();
    expect(screen.getByText('Dataset Tersedia')).toBeTruthy();
    expect(screen.getByText('34')).toBeTruthy();
    expect(screen.getByText('Provinsi')).toBeTruthy();
    expect(screen.getByText('514')).toBeTruthy();
    expect(screen.getByText('Kabupaten/Kota')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
    expect(screen.getByText('Terbuka untuk Publik')).toBeTruthy();
  });

  it('shows a SIMULATED SourceBadge on mock data', () => {
    render(<DashboardPreview />);

    // SourceBadge renders with data-source attribute
    const badges = document.querySelectorAll('[data-source="SIMULATED"]');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('renders the mock dashboard preview region with an accessible label', () => {
    render(<DashboardPreview />);

    // The dashboard preview card has role="img" and an accessible name
    const previewCard = screen.getByRole('img', { name: /pratinjau dashboard publik/i });
    expect(previewCard).toBeTruthy();
  });

  it('uses the site logo asset instead of a text mark in the dashboard header', () => {
    render(<DashboardPreview />);

    const preview = screen.getByRole('img', { name: /pratinjau dashboard publik/i });
    const lightLogo = preview.querySelector('img.dark\\:hidden');
    const darkLogo = preview.querySelector('img.dark\\:block');
    expect(lightLogo?.getAttribute('src')).toBe('/logo/logo-light.svg');
    expect(darkLogo?.getAttribute('src')).toBe('/logo/logo-dark.svg');
  });

  it('renders the pie and line chart components', () => {
    render(<DashboardPreview />);

    expect(screen.getByTestId('pie-chart')).toBeTruthy();
    expect(screen.getByTestId('line-chart')).toBeTruthy();
  });

  it('uses a responsive two-column layout on desktop', () => {
    render(<DashboardPreview />);

    const section = screen.getByRole('region', { name: /akses data, pahami kondisi, lihat perkembangannya/i });
    const grid = section.querySelector('.grid');
    expect(grid?.className).toContain('lg:grid-cols-');
  });
});
