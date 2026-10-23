import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => <img alt={props.alt} />,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/app/(public)/_components/public-hero-search', () => ({
  PublicHeroSearch: () => <div data-testid="hero-search" />,
}));

import PublicLandingPage from '@/app/(public)/page';

describe('PublicLandingPage', () => {
  it('renders the four ecosystem service cards and their CTAs', () => {
    render(<PublicLandingPage />);

    expect(screen.getByText(/ekosistem layanan/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /data pemerintah/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /layanan publik/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /laporan warga/i })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /insight/i })).toBeTruthy();

    expect(screen.getByRole('link', { name: /lihat data/i }).getAttribute('href')).toBe('/data');
    expect(screen.getByRole('link', { name: /cek layanan/i }).getAttribute('href')).toBe('/citizen/dashboard');
    expect(screen.getByRole('link', { name: /laporkan sekarang/i }).getAttribute('href')).toBe('/citizen/reporting');
    expect(screen.getByRole('link', { name: /jelajahi insight/i }).getAttribute('href')).toBe('/insights');
  });

  it('exposes the section as a responsive card grid container', () => {
    render(<PublicLandingPage />);

    const grid = screen
      .getByRole('heading', { name: /solusi lengkap untuk transparansi dan partisipasi publik/i })
      .closest('section')
      ?.querySelector('.grid');

    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('xl:grid-cols-4');
  });
});
