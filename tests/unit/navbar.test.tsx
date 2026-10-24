// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

import { Navbar } from '@/components/navbar';
import { ThemeProvider } from '@/components/theme-provider';

describe('Navbar', () => {
  it('renders the main navigation and login CTA', () => {
    render(<Navbar />);

    expect(screen.getByRole('img', { name: 'Agoraya' }).getAttribute('src')).toBe('/logo/logo-light.svg');
    // The navbar renders desktop + mobile nav; use getAllByRole for links
    // that appear in both. At least one "Beranda" link must be present.
    expect(screen.getAllByRole('link', { name: /beranda/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /masuk \/ daftar/i }).length).toBeGreaterThan(0);
  });

  it('uses the dark logo when dark mode is selected', async () => {
    window.localStorage.setItem('agoraya-theme', 'dark');
    render(
      <ThemeProvider>
        <Navbar />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Agoraya' }).getAttribute('src')).toBe('/logo/logo-dark.svg');
    });
    window.localStorage.removeItem('agoraya-theme');
  });

  it('toggles the mobile menu open and closed', async () => {
    const user = userEvent.setup();
    render(<Navbar />);

    await user.click(screen.getByRole('button', { name: /buka menu/i }));
    expect(screen.getByLabelText(/navigasi mobile/i)).toBeTruthy();

    await user.keyboard('{Escape}');
    expect(screen.queryByLabelText(/navigasi mobile/i)).toBeTruthy();
  });
});
