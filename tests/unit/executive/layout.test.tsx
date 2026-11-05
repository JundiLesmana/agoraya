// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guards', () => ({
  requireAuth: vi.fn().mockResolvedValue({ id: 'user-1', roles: ['executive'] }),
}));

import ExecutiveLayout from '@/app/(executive)/layout';
import { requireAuth } from '@/lib/auth/guards';

describe('ExecutiveLayout', () => {
  it('calls the executive auth guard and renders the nested content', async () => {
    const element = await ExecutiveLayout({
      children: <div>Dashboard child content</div>,
    });

    render(element);

    expect(requireAuth).toHaveBeenCalledWith({
      roles: ['executive', 'pimpinan', 'superadmin'],
    });
    expect(screen.getByText('Dashboard child content')).toBeTruthy();
  });
});
