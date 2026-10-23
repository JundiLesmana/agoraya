import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

import { PublicHeroSearch } from '@/app/(public)/_components/public-hero-search';

describe('PublicHeroSearch', () => {
  it('accepts text and shows a clear button', async () => {
    const user = userEvent.setup();
    render(<PublicHeroSearch />);

    const input = screen.getByRole('textbox', { name: /cari data, layanan, atau informasi/i });
    await user.type(input, 'APBD');

    expect(screen.getByRole('button', { name: /hapus pencarian/i })).toBeTruthy();
    expect((input as HTMLInputElement).value).toBe('APBD');
  });

  it('populates a popular tag into the search input', async () => {
    const user = userEvent.setup();
    render(<PublicHeroSearch />);

    await user.click(screen.getByRole('button', { name: 'APBD' }));

    expect((screen.getByRole('textbox', { name: /cari data, layanan, atau informasi/i }) as HTMLInputElement).value).toBe('APBD');
  });

  it('navigates to the search results page with query params', async () => {
    const user = userEvent.setup();
    render(<PublicHeroSearch />);

    await user.type(screen.getByRole('textbox', { name: /cari data, layanan, atau informasi/i }), 'Pendidikan');
    await user.click(screen.getByRole('button', { name: /^cari$/i }));

    expect(push).toHaveBeenCalledWith('/data?query=Pendidikan');
  });
});
