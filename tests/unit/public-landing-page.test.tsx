/** @vitest-environment jsdom */

import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: (props: { alt: string; src: string }) => createElement('img', props),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/navbar', () => ({
  Navbar: () => <header data-testid="navbar" />,
}));

vi.mock('@/components/footer', () => ({
  Footer: () => <footer data-testid="footer" />,
}));

vi.mock('@/app/(public)/_components/public-hero-search', () => ({
  PublicHeroSearch: () => <div data-testid="hero-search" />,
}));

vi.mock('@/app/(public)/_components/dashboard-preview', () => ({
  DashboardPreview: () => <section aria-labelledby="dashboard-preview-title" data-testid="dashboard-preview" />,
}));

import PublicLandingPage from '@/app/(public)/page';
import PublicLayout from '@/app/(public)/layout';

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

  it('mounts the DashboardPreview section within the page', () => {
    render(<PublicLandingPage />);

    expect(screen.getByTestId('dashboard-preview')).toBeTruthy();
  });

  it('renders the hero heading with the platform tagline', () => {
    render(<PublicLandingPage />);

    expect(screen.getByRole('heading', { name: /transparan, terbuka, untuk indonesia yang lebih baik/i })).toBeTruthy();
    expect(screen.getByTestId('hero-search')).toBeTruthy();
  });

  it('uses dark-theme surfaces and readable text across homepage sections', () => {
    const { container } = render(<PublicLandingPage />);

    expect(container.firstElementChild?.className).toContain('bg-background');

    const hero = screen.getByRole('heading', { name: /transparan, terbuka, untuk indonesia yang lebih baik/i }).closest('section');
    expect(hero?.querySelector('div')?.className).toContain('dark:bg-[linear-gradient');
    expect(hero?.querySelector('h1')?.className).toContain('text-foreground');
    expect(
      Array.from(hero?.querySelectorAll('[aria-hidden="true"]') ?? []).some((element) =>
        element.className.includes('dark:bg-[linear-gradient(90deg'),
      ),
    ).toBe(true);

    const ecosystem = screen.getByRole('heading', { name: /solusi lengkap untuk transparansi dan partisipasi publik/i }).closest('section');
    expect(ecosystem?.querySelector('article')?.className).toContain('bg-card');
    expect(ecosystem?.querySelector('article h3')?.className).toContain('text-foreground');
    expect(ecosystem?.querySelector('article p')?.className).toContain('text-muted-foreground');
  });

  it('uses the provided landing images in the hero and CTA banner', () => {
    render(<PublicLandingPage />);

    const images = Array.from(document.querySelectorAll('img'));
    expect(images.map((image) => image.getAttribute('src'))).toEqual(
      expect.arrayContaining(['/landing/hero-desktop.png', '/landing/footer-desktop.png']),
    );

    const responsiveSources = Array.from(document.querySelectorAll('picture source'));
    expect(
      responsiveSources.map((source) => ({
        media: source.getAttribute('media'),
        srcSet: source.getAttribute('srcset'),
      })),
    ).toEqual(
      expect.arrayContaining([
        { media: '(max-width: 1023px)', srcSet: '/landing/hero-mobile.png' },
        { media: '(max-width: 1023px)', srcSet: '/landing/footer-mobile.png' },
      ]),
    );
  });

  it('renders the shared navbar and footer once around the landing page', () => {
    render(
      <PublicLayout>
        <PublicLandingPage />
      </PublicLayout>,
    );

    expect(screen.getAllByTestId('navbar')).toHaveLength(1);
    expect(screen.getAllByTestId('footer')).toHaveLength(1);
  });
});
