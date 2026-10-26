// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

import { Footer } from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';

describe('Footer', () => {
  it('renders brand, links, and social sections', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByRole('img', { name: 'Agoraya' }).getAttribute('src')).toBe('/logo/logo-light.svg');
    expect(screen.getByRole('navigation', { name: /navigasi sekunder/i })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: /media sosial/i })).toBeTruthy();
    expect(screen.getByText('© 2025 Agoraya. Semua hak dilindungi.')).toBeTruthy();
  });

  it('uses the dark logo when dark mode is selected', async () => {
    window.localStorage.setItem('agoraya-theme', 'dark');
    render(
      <ThemeProvider>
        <Footer />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Agoraya' }).getAttribute('src')).toBe('/logo/logo-dark.svg');
    });
    window.localStorage.removeItem('agoraya-theme');
  });

  it('renders internal navigation links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /beranda/i }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /data pemerintah/i }).getAttribute('href')).toBe('/data');
  });

  it('renders an accessible report CTA before the footer navigation', () => {
    render(<Footer />);

    expect(screen.getByRole('heading', { name: 'Perubahan dimulai dari kepedulian Anda' })).toBeTruthy();
    expect(
      screen.getByText('Buat laporan. Sampaikan laporan yang faktual. Bantu ciptakan lingkungan yang lebih baik.'),
    ).toBeTruthy();

    const cta = screen.getByRole('link', { name: 'Buat laporan' });
    expect(cta.getAttribute('href')).toBe('/citizen/reporting');
    expect(cta.getAttribute('aria-label')).toBe('Buat laporan');
    expect(
      cta.compareDocumentPosition(
        screen.getByRole('navigation', { name: /navigasi sekunder/i }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders secure external social links', () => {
    render(<Footer />);

    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    expect(instagramLink.getAttribute('target')).toBe('_blank');
    expect(instagramLink.getAttribute('rel')).toContain('noopener');
    expect(instagramLink.getAttribute('rel')).toContain('noreferrer');
  });
});
