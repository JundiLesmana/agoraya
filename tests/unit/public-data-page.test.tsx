import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';

vi.mock('next/image', () => ({
  default: (props: { alt: string }) => <div data-testid="next-image" aria-label={props.alt} />,
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

    expect(screen.getByRole('heading', { name: /akses data, pahami kondisi, lihat bukti nyata/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /jelajahi semua data/i }).getAttribute('href')).toBe('/data/catalog');
    expect(screen.getByText('+10.000')).toBeTruthy();
    expect(screen.getByText('34')).toBeTruthy();
    expect(screen.getByText('514')).toBeTruthy();
    expect(screen.getByText('100%')).toBeTruthy();
  });

  it('renders a dashboard mockup image with descriptive alt text', () => {
    render(<PublicDataPage />);

    expect(
      screen.getByAltText(/mockup dashboard publik menampilkan total anggaran dan realisasi/i),
    ).toBeTruthy();
  });

  it('keeps the image layout responsive and legible on mobile', () => {
    render(<PublicDataPage />);

    const section = screen.getByRole('heading', { name: /akses data, pahami kondisi, lihat bukti nyata/i }).closest('section');
    expect(section?.querySelector('.grid')?.className).toContain('lg:grid-cols-[');
    expect(screen.getByAltText(/mockup dashboard publik menampilkan total anggaran dan realisasi/i)).toBeTruthy();
  });
});
