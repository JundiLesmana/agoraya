import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Footer } from '@/components/footer';

describe('Footer', () => {
  it('renders brand, links, and social sections', () => {
    render(<Footer />);

    expect(screen.getByRole('contentinfo')).toBeTruthy();
    expect(screen.getByText('Agoraya')).toBeTruthy();
    expect(screen.getByText('SatuData.id')).toBeTruthy();
    expect(screen.getByText('Data Publik, Untuk Semua')).toBeTruthy();
    expect(screen.getByRole('navigation', { name: /navigasi sekunder/i })).toBeTruthy();
    expect(screen.getByRole('navigation', { name: /media sosial/i })).toBeTruthy();
    expect(screen.getByText('© 2025 SatuData.id. Semua hak dilindungi.')).toBeTruthy();
  });

  it('renders internal navigation links', () => {
    render(<Footer />);

    expect(screen.getByRole('link', { name: /beranda/i }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: /data pemerintah/i }).getAttribute('href')).toBe('/data');
  });

  it('renders secure external social links', () => {
    render(<Footer />);

    const instagramLink = screen.getByRole('link', { name: /instagram/i });
    expect(instagramLink.getAttribute('target')).toBe('_blank');
    expect(instagramLink.getAttribute('rel')).toContain('noopener');
    expect(instagramLink.getAttribute('rel')).toContain('noreferrer');
  });
});
