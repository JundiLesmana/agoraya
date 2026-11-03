// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { filterProjects, MOCK_PROJECTS } from '@/lib/projects';
import { DEFAULT_FILTERS } from '@/app/(public)/data-pemerintah/proyek/_components/filter-controls';

const push = vi.fn();
const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

import { FilterControls } from '@/app/(public)/data-pemerintah/proyek/_components/filter-controls';

describe('lib/filterProjects — default values', () => {
  it('mengembalikan semua proyek ketika tidak ada filter', () => {
    const result = filterProjects(MOCK_PROJECTS, {});
    expect(result).toHaveLength(MOCK_PROJECTS.length);
  });

  it('DEFAULT_FILTERS memiliki nilai default yang benar', () => {
    expect(DEFAULT_FILTERS).toEqual({
      wilayah: 'Provinsi Jawa Barat',
      periode: '2025 · s.d. TW III',
      sektor: 'Semua sektor',
      status: 'Semua status',
    });
  });

  it('memfilter sektor Pendidikan hanya proyek pendidikan', () => {
    const pendidikan = filterProjects(MOCK_PROJECTS, {
      sektor: 'Pendidikan',
    });
    expect(pendidikan.length).toBeGreaterThan(0);
    pendidikan.forEach((p) => expect(p.sektor).toBe('Pendidikan'));
  });

  it('memfilter status Tertunda hanya proyek tertunda', () => {
    const tertunda = filterProjects(MOCK_PROJECTS, { status: 'Tertunda' });
    expect(tertunda.length).toBeGreaterThan(0);
    tertunda.forEach((p) => expect(p.status).toBe('Tertunda'));
  });

  it('reset filter mengembalikan ke semua proyek', () => {
    const filtered = filterProjects(MOCK_PROJECTS, {
      sektor: 'Pendidikan',
      status: 'Selesai',
    });
    expect(filtered.length).toBeLessThan(MOCK_PROJECTS.length);

    const reset = filterProjects(MOCK_PROJECTS, {});
    expect(reset).toHaveLength(MOCK_PROJECTS.length);
  });
});

describe('FilterControls — render default values', () => {
  beforeEach(() => {
    push.mockClear();
    replace.mockClear();
  });

  it('menampilkan default value semua filter', () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const wilayahSelect = screen.getByLabelText(/pilih wilayah provinsi atau kabupaten\/kota/i) as HTMLSelectElement;
    expect(wilayahSelect.value).toBe('Provinsi Jawa Barat');
    const periodeSelect = screen.getByLabelText(/pilih tahun dan triwulan periode kumulatif/i) as HTMLSelectElement;
    expect(periodeSelect.value).toBe('2025 · s.d. TW III');
    const sektorSelectA = screen.getByLabelText(/pilih sektor proyek/i) as HTMLSelectElement;
    expect(sektorSelectA.value).toBe('Semua sektor');
    const statusSelect = screen.getByLabelText(/pilih status proyek/i) as HTMLSelectElement;
    expect(statusSelect.value).toBe('Semua status');
  });

  it('mengubah nilai dropdown sektor saat dipilih', () => {
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const sektorSelect = screen.getByLabelText(/pilih sektor proyek/i);
    fireEvent.change(sektorSelect, { target: { value: 'Pendidikan' } });
    expect((sektorSelect as HTMLSelectElement).value).toBe('Pendidikan');
  });

  it('memicu onApply dengan nilai yang dipilih saat klik Terapkan filter', () => {
    const onApply = vi.fn();
    render(
      <FilterControls
        filters={DEFAULT_FILTERS}
        onApply={onApply}
        onReset={vi.fn()}
      />,
    );

    const sektorSelect = screen.getByLabelText(/pilih sektor proyek/i);
    fireEvent.change(sektorSelect, { target: { value: 'Pendidikan' } });
    fireEvent.click(screen.getByRole('button', { name: /terapkan filter/i }));

    expect(onApply).toHaveBeenCalledWith({
      wilayah: 'Provinsi Jawa Barat',
      periode: '2025 · s.d. TW III',
      sektor: 'Pendidikan',
      status: 'Semua status',
    });
  });

  it('memicu onReset saat klik Reset filter', () => {
    const onReset = vi.fn();
    render(
      <FilterControls
        filters={{ ...DEFAULT_FILTERS, sektor: 'Pendidikan' }}
        onApply={vi.fn()}
        onReset={onReset}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /reset filter/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
