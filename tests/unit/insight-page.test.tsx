// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import InsightPage from '@/app/(public)/insights/page';

describe('InsightPage — breadcrumb', () => {
  it('merender 2 item breadcrumb dengan separator yang benar', () => {
    render(<InsightPage />);

    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumb).toBeTruthy();

    const { getByRole, getByText } = within(breadcrumb);

    // "Beranda" mengarah ke "/"
    expect(getByRole('link', { name: /beranda/i }).getAttribute('href')).toBe(
      '/',
    );

    // "Insight" adalah halaman saat ini: tidak dapat diklik, aria-current="page"
    const currentPage = getByText(/insight/i);
    const currentLi = currentPage.closest('li');
    expect(currentLi?.getAttribute('aria-current')).toBe('page');
    expect(currentLi?.querySelector('a')).toBeNull();

    // Separator di antara item (1 separator untuk 2 item)
    const separators = breadcrumb.querySelectorAll(
      'li[aria-hidden="true"]',
    );
    expect(separators.length).toBe(1);
    separators.forEach((sep: Element) => {
      expect(sep.textContent?.trim()).toBe('›');
    });
  });
});

describe('InsightPage — hero section', () => {
  it('menampilkan label, judul H1, dan deskripsi sesuai desain', () => {
    render(<InsightPage />);

    // Label "INSIGHT PUBLIK" di atas judul
    const label = screen.getByText(/insight publik/i);
    expect(label).toBeTruthy();

    // Judul H1: "Pahami datanya. Lihat maknanya."
    const judul = screen.getByRole('heading', {
      name: /pahami datanya\. lihat maknanya\./i,
    });
    expect(judul).toBeTruthy();
    expect(judul.tagName).toBe('H1');
    expect(judul.className).toContain('font-bold');

    // Deskripsi
    const deskripsi = screen.getByText(
      /bandingkan layanan daerah, telusuri anggaran, dan pahami kesejahteraan/i,
    );
    expect(deskripsi).toBeTruthy();
  });

  it('menampilkan info banner "Seluruh angka · Data contoh" di bawah filter', () => {
    render(<InsightPage />);

    const banner = screen.getByRole('status');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Seluruh angka');
    expect(banner.textContent).toContain('Data contoh');
  });
});
