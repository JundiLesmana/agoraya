// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { render, screen, within } from '@testing-library/react';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import InsightPage from '@/app/(public)/insight/page';

describe('InsightPage — breadcrumb', () => {
  it('merender 2 item breadcrumb dengan separator yang benar', () => {
    render(<InsightPage />);

    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumb).toBeTruthy();

    const { getByRole, getByText } = within(breadcrumb);

    // "Beranda" mengarah ke "/"
    expect(getByRole('link', { name: /beranda/i }).getAttribute('href')).toBe('/');

    // "Insight" adalah halaman saat ini: tidak dapat diklik, aria-current="page"
    const currentPage = getByText(/insight/i);
    const currentLi = currentPage.closest('li');
    expect(currentLi?.getAttribute('aria-current')).toBe('page');
    expect(currentLi?.querySelector('a')).toBeNull();

    // Separator di antara item (1 separator untuk 2 item)
    const separators = breadcrumb.querySelectorAll('li[aria-hidden="true"]');
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
    const deskripsi = screen.getByText(/bandingkan layanan daerah, telusuri anggaran, dan pahami kesejahteraan/i);
    expect(deskripsi).toBeTruthy();
  });

  it('menampilkan info banner "Seluruh angka · Data contoh" di bawah filter', () => {
    render(<InsightPage />);

    const banner = screen.getByText('Seluruh angka').closest('[role="status"]');
    expect(banner).toBeTruthy();
    expect(banner?.textContent).toContain('Seluruh angka');
    expect(banner?.textContent).toContain('Data contoh');
    expect(banner?.textContent).toContain('Simulasi');
  });
});

describe('InsightPage — filter controls', () => {
  it('menampilkan empat filter serta tombol reset dan terapkan', () => {
    render(<InsightPage />);

    const section = screen.getByRole('region', { name: 'Filter insight' });
    expect(
      within(section).getByLabelText('Pilih wilayah perbandingan provinsi'),
    ).toBeTruthy();
    expect(
      within(section).getByLabelText(
        'Pilih kabupaten atau kota fokus daerah',
      ),
    ).toBeTruthy();
    expect(within(section).getByLabelText('Pilih tahun periode')).toBeTruthy();
    expect(within(section).getByLabelText('Pilih topik insight')).toBeTruthy();
    expect(
      within(section).getByRole('button', { name: 'Reset filter' }),
    ).toBeTruthy();
    expect(
      within(section).getByRole('button', { name: 'Terapkan filter' }),
    ).toBeTruthy();
  });
});

describe('InsightPage — reading guide', () => {
  it('menampilkan tiga panduan dengan heading dan teks yang benar', () => {
    render(<InsightPage />);

    const section = screen.getByRole('region', {
      name: 'Cara membaca insight ini',
    });

    expect(
      within(section).getByRole('heading', {
        level: 2,
        name: 'Cara membaca insight ini',
      }),
    ).toBeTruthy();

    const guides = within(section).getAllByRole('article');
    expect(guides).toHaveLength(3);

    expect(
      within(guides[0]).getByRole('heading', {
        level: 3,
        name: 'Mulai dari ukuran yang sama',
      }),
    ).toBeTruthy();
    expect(within(guides[0]).getByText('Periksa wilayah, tahun, dan satuan. 0,2 poin persentase, bukan 0,2%.')).toBeTruthy();

    expect(
      within(guides[1]).getByRole('heading', {
        level: 3,
        name: 'Baca arah, bukan hanya angka',
      }),
    ).toBeTruthy();
    expect(within(guides[1]).getByText('Nilai tinggi tidak selalu lebih baik. Kemiskinan diharapkan turun; lama sekolah diharapkan naik.')).toBeTruthy();

    expect(
      within(guides[2]).getByRole('heading', {
        level: 3,
        name: 'Selalu lihat konteksnya',
      }),
    ).toBeTruthy();
    expect(within(guides[2]).getByText('Korelasi bukan sebab-akibat. Gunakan data bersama kondisi lapangan; data yang tidak tersedia tidak boleh dianggap nol.')).toBeTruthy();
  });

  it('mengatur grid satu, dua, lalu tiga kolom sesuai breakpoint', () => {
    render(<InsightPage />);

    const section = screen.getByRole('region', {
      name: 'Cara membaca insight ini',
    });
    const grid = section.querySelector('div.grid');

    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('sm:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });
});

describe('InsightPage — source and methodology', () => {
  it('menampilkan ringkasan sumber, periode, cakupan, dan label simulasi', () => {
    render(<InsightPage />);

    const section = screen.getByRole('region', {
      name: 'Sumber & metodologi',
    });
    expect(within(section).getByText('Kenali asal angka dan batas penggunaannya sebelum mengambil kesimpulan.')).toBeTruthy();

    const expectedItems = [
      {
        title: 'Layanan perizinan',
        source: 'Simulasi layanan perizinan Agoraya',
        period: '2024',
        coverage: '5 kota di Jawa Barat',
        href: 'https://oss.go.id/',
      },
      {
        title: 'Anggaran daerah',
        source: 'Simulasi APBD Agoraya · Data contoh',
        period: '2020-2024',
        coverage: 'Kota Bandung',
        href: 'https://djpk.kemenkeu.go.id/portal/data/apbd',
      },
      {
        title: 'Kesejahteraan warga',
        source: 'Simulasi sosial-ekonomi Agoraya',
        period: '2023-2024',
        coverage: 'Kota Bandung',
        href: 'https://sirusa.web.bps.go.id/metadata/',
      },
    ];
    const cards = within(section).getAllByRole('article');
    expect(cards).toHaveLength(3);

    expectedItems.forEach((item) => {
      const cardElement = cards.find(
        (candidate) =>
          within(candidate).queryByRole('heading', {
            level: 3,
            name: item.title,
          }) !== null,
      );
      expect(cardElement).toBeTruthy();
      if (!cardElement) return;

      const card = within(cardElement);
      expect(card.getByRole('heading', { level: 3, name: item.title })).toBeTruthy();
      expect(card.getByText(item.source)).toBeTruthy();
      expect(card.getByText(item.period)).toBeTruthy();
      expect(card.getByText(item.coverage)).toBeTruthy();
      expect(card.getByText('Simulasi')).toBeTruthy();
      const referenceLink = card.getByRole('link');
      expect(referenceLink.getAttribute('href')).toBe(item.href);
      expect(referenceLink.getAttribute('target')).toBe('_blank');
      expect(referenceLink.getAttribute('rel')).toBe('noopener noreferrer');
    });

    expect(screen.getByRole('link', { name: /jelajahi data pemerintah/i }).getAttribute('href')).toBe('/data-pemerintah');
  });

  it('mengatur grid satu, dua, lalu tiga kolom sesuai breakpoint', () => {
    render(<InsightPage />);

    const section = screen.getByRole('region', {
      name: 'Sumber & metodologi',
    });
    const grid = section.querySelector('div.grid');

    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });
});

describe('InsightPage — data CTA', () => {
  it('menampilkan CTA beraksesibel yang mengarah ke laman Data Pemerintah', () => {
    render(<InsightPage />);

    const section = screen.getByRole('region', {
      name: 'Dari insight, lanjutkan ke datanya.',
    });
    expect(within(section).getByText('Temukan dataset dan pelajari konteks di balik setiap angka.')).toBeTruthy();

    const cta = within(section).getByRole('link', {
      name: 'Jelajahi Data Pemerintah',
    });
    expect(cta.getAttribute('href')).toBe('/data-pemerintah');
    expect(cta.getAttribute('aria-label')).toBe('Jelajahi Data Pemerintah');
    expect(cta.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(screen.getByRole('main').lastElementChild).toBe(section);
  });
});
