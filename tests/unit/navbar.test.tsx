import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

import { Navbar } from '@/components/navbar';

describe('Navbar', () => {
  it('renders the main navigation and login CTA', () => {
    render(<Navbar />);

    expect(screen.getByRole('link', { name: /beranda/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /masuk \/ daftar/i })).toBeTruthy();
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
