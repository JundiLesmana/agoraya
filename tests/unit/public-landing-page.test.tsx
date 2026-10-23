import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

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

  it('renders the CTA banner with the expected label, copy, quote, and registration button', () => {
    render(<PublicLandingPage />);

    expect(screen.getByText(/partisipasi anda berarti/i)).toBeTruthy();
    expect(screen.getByRole('heading', { name: /data transparan, layanan lebih baik, masa depan lebih cerah/i })).toBeTruthy();
    expect(screen.getByText(/jadilah bagian dari masyarakat yang aktif, kritis, dan peduli/i)).toBeTruthy();
    expect(screen.getByText(/bersama kita bisa membuat perubahan/i)).toBeTruthy();

    const cta = screen.getByRole('link', { name: /mulai sekarang/i });
    expect(cta.getAttribute('href')).toBe('/register');
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

  it('keeps the CTA banner readable and mobile-friendly', () => {
    render(<PublicLandingPage />);

    const ctaSection = screen.getByRole('heading', { name: /data transparan, layanan lebih baik, masa depan lebih cerah/i }).closest('section');
    expect(ctaSection?.className).toContain('bg-slate-950');
    expect(ctaSection?.className).toContain('text-white');
    expect(screen.getByRole('link', { name: /mulai sekarang/i }).className).toContain('w-full');
  });
});
