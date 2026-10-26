import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterProvider } from '@/lib/filter-store';
import { FilterBar } from '@/components/filter-bar';

function Harness({ onApply }: { onApply?: () => void } = {}) {
  return (
    <FilterProvider>
      <FilterBar onApply={onApply} />
    </FilterProvider>
  );
}

describe('FilterBar', () => {
  it('menampilkan 3 dropdown dengan default wilayah, tahun, dan periode', () => {
    render(<Harness />);
    expect((screen.getByLabelText('Wilayah') as HTMLSelectElement).value).toBe(
      'Provinsi Jawa Barat',
    );
    expect((screen.getByLabelText('Tahun Anggaran') as HTMLSelectElement).value).toBe(
      '2025',
    );
    expect((screen.getByLabelText('Periode') as HTMLSelectElement).value).toBe(
      's.d. Triwulan III',
    );
    expect(screen.getByRole('button', { name: /terapkan filter/i })).toBeDefined();
    expect(screen.getByText(/filter belum dikunci/i)).toBeTruthy();
  });

  it('memanggil onApply dengan nilai terpilih saat tombol Terapkan filter diklik', async () => {
    const onApply = vi.fn();
    render(<Harness onApply={onApply} />);
    const user = userEvent.setup();

    await user.selectOptions(
      (screen.getByLabelText('Wilayah') as HTMLSelectElement),
      'Provinsi DKI Jakarta',
    );
    await user.selectOptions(
      (screen.getByLabelText('Tahun Anggaran') as HTMLSelectElement),
      '2026',
    );
    await user.selectOptions(
      (screen.getByLabelText('Periode') as HTMLSelectElement),
      'Kumulatif',
    );
    await user.click(screen.getByRole('button', { name: /terapkan filter/i }));

    expect(onApply.mock.calls).toHaveLength(1);
    expect(onApply.mock.calls[0][0]).toEqual({
      wilayah: 'Provinsi DKI Jakarta',
      tahun: '2026',
      periode: 'Kumulatif',
    });

    // Tombol terklunci dan ringkasan diterapkan ditampilkan.
    expect(screen.getByRole('button', { name: /terkunci/i })).toBeDefined();
    expect(screen.getByText(/diterapkan:/i)).toBeTruthy();
    expect(screen.getByText(/Provinsi DKI Jakarta.*2026.*Kumulatif/i)).toBeTruthy();
  });

  it('reset filter mengembalikan ke default dan membuka kunci', async () => {
    render(<Harness />);
    const user = userEvent.setup();

    await user.selectOptions(
      (screen.getByLabelText('Wilayah') as HTMLSelectElement),
      'Semua Wilayah',
    );
    await user.click(screen.getByRole('button', { name: /terapkan filter/i }));
    expect(screen.getByRole('button', { name: /terkunci/i })).toBeDefined();

    await user.click(screen.getByRole('link', { name: /reset filter/i }));
    expect((screen.getByLabelText('Wilayah') as HTMLSelectElement).value).toBe(
      'Provinsi Jawa Barat',
    );
    expect(screen.getByRole('button', { name: /terapkan filter/i })).toBeDefined();
    expect(screen.queryByText(/diterapkan:/i)).toBeNull();
  });
});
