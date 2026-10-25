// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: (props: { alt: string; src: string }) => <img alt={props.alt} src={props.src} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import PublicDataPage from '@/app/(public)/data/page';

describe('PublicDataPage', () => {
  it('renders the preview section with the key statistics and CTA', () => {
    render(<PublicDataPage />);

    expect(screen.getByRole('heading', { name: 'Ringkasan Anggaran dan Pembangunan' })).toBeTruthy();
    expect(screen.getByText('Rp80T')).toBeTruthy();
    expect(screen.getByText('Rp60T')).toBeTruthy();
    expect(screen.getByText('75% dari total anggaran')).toBeTruthy();
    expect(screen.getByText('156 / 240')).toBeTruthy();
    expect(screen.getByText('65% dari seluruh proyek')).toBeTruthy();
    expect(screen.getByText('27 daerah')).toBeTruthy();
    expect(screen.getByRole('heading', { name: /akses data, pahami kondisi, lihat bukti nyata/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /jelajahi semua data/i }).getAttribute('href')).toBe('/data/catalog');
    expect(screen.getByText('+10.000')).toBeTruthy();
    expect(screen.getByText('34')).toBeTruthy();
    expect(screen.getByText('514')).toBeTruthy();
    expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
  });

  it('renders the dashboard mockup preview without relying on a missing image asset', () => {
    render(<PublicDataPage />);

    expect(screen.getByRole('img', { name: /pratinjau dashboard publik menampilkan total anggaran dan realisasi/i })).toBeTruthy();
    expect(document.querySelector('img[src="/dashboard-public-preview.png"]')).toBeNull();
  });

  it('keeps the image layout responsive and legible on mobile', () => {
    render(<PublicDataPage />);

    const section = screen.getByRole('heading', { name: /akses data, pahami kondisi, lihat bukti nyata/i }).closest('section');
    expect(section?.querySelector('.grid')?.className).toContain('lg:grid-cols-[');
    expect(screen.getByRole('img', { name: /pratinjau dashboard publik menampilkan total anggaran dan realisasi/i })).toBeTruthy();
  });

  it('uses compact source badges on small screens and restores readable sizing at larger breakpoints', () => {
    render(<PublicDataPage />);

    const statBadge = document.querySelector('[data-source="SIMULATED"].shrink-0');
    expect(statBadge?.className).toContain('text-[10px]');
    expect(statBadge?.className).toContain('sm:text-xs');
  });
});
