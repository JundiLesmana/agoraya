// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ExecutiveDashboardPage from '@/app/(executive)/executive/dashboard/page';

describe('ExecutiveDashboardPage', () => {
  it('renders the executive audit log dashboard shell and key sections', () => {
    render(<ExecutiveDashboardPage />);

    expect(screen.getAllByText('Audit log terpadu').length).toBeGreaterThan(0);
    expect(screen.getByText('Kejadian dalam periode')).toBeTruthy();
    expect(screen.getByText('Penyaring kejadian')).toBeTruthy();
    expect(screen.getByText('Riwayat kejadian')).toBeTruthy();
    expect(
      screen.getByText('Detail kejadian · pembaruan akses Executive'),
    ).toBeTruthy();
  });

  it('renders the summary cards for the main audit metrics', () => {
    render(<ExecutiveDashboardPage />);

    expect(screen.getByText('Kejadian dalam periode')).toBeTruthy();
    expect(screen.getByText('Kejadian CMS')).toBeTruthy();
    expect(screen.getByText('Verifikasi ASN')).toBeTruthy();
    expect(screen.getByText('Perubahan hak akses')).toBeTruthy();
  });
});
