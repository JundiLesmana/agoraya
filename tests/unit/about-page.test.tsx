import { describe, expect, it, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: ({
    alt,
    src,
    className,
  }: {
    alt: string;
    src: string;
    className?: string;
    fill?: boolean;
    priority?: boolean;
    sizes?: string;
  }) => createElement('img', { alt, src, className }),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import AboutPage, { metadata } from '@/app/(public)/tentang/page';

describe('AboutPage', () => {
  it('renders the headline, breadcrumb, and copy from the design', () => {
    render(<AboutPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Lebih terbuka datanya. Lebih berarti partisipasinya.',
      }),
    ).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeTruthy();
    expect(screen.getByText('TENTANG Agoraya')).toBeTruthy();
    expect(
      screen.getByText(
        'Agoraya adalah ruang digital untuk memahami data pemerintah, mengenali layanan publik, dan menyuarakan persoalan di sekitar kita.',
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Dirancang untuk mendekatkan informasi dan partisipasi, agar warga dan instansi dapat berdialog dengan dasar yang lebih jelas.',
      ),
    ).toBeTruthy();
  });

  it('uses the desktop and mobile hero images and responsive layout', () => {
    render(<AboutPage />);

    const hero = screen.getByRole('region', { name: /lebih terbuka datanya/i });
    const container = hero.querySelector('div');
    const image = screen.getByRole('img', { name: /monumen nasional/i });

    expect(container?.className).toContain('lg:min-h-[492px]');
    expect(container?.className).toContain('max-w-[1320px]');
    expect(container?.className).toContain('lg:items-center');
    expect(image.getAttribute('src')).toBe('/landing/hero-desktop.png');
    expect(
      within(hero).getByRole('img', { name: /monumen nasional/i }).closest('picture')?.querySelector('source')?.getAttribute('srcset'),
    ).toBe('/landing/hero-mobile.png');
  });

  it('renders the two accessible actions with their destinations and arrow icons', () => {
    render(<AboutPage />);

    const pillars = screen.getByRole('link', { name: 'Kenali empat pilar Agoraya' });
    const participation = screen.getByRole('link', {
      name: 'Cara berpartisipasi di Agoraya',
    });

    expect(pillars.getAttribute('href')).toBe('/#ecosystem-title');
    expect(pillars.className).toContain('bg-blue-700');
    expect(pillars.className).toContain('hover:bg-blue-800');
    expect(participation.getAttribute('href')).toBe('/tracking');
    expect(pillars.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(participation.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('sets the page title and SEO description', () => {
    expect(metadata.title).toBe('Tentang Agoraya');
    expect(metadata.description).toBe(
      'Agoraya adalah ruang digital untuk memahami data pemerintah, mengenali layanan publik, dan menyuarakan persoalan di sekitar kita.',
    );
  });
});
