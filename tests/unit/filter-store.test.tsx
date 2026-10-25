// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterProvider, useFilterStore, DEFAULT_FILTER } from '@/lib/filter-store';

function Probe() {
  const store = useFilterStore();
  return (
    <div>
      <span data-testid="wilayah">{store.filters.wilayah}</span>
      <span data-testid="tahun">{store.filters.tahun}</span>
      <span data-testid="periode">{store.filters.periode}</span>
      <span data-testid="applied">{String(store.applied)}</span>
      <button data-testid="set-wilayah" onClick={() => store.setFilter('wilayah', 'Provinsi DKI Jakarta')}>
        Ubah wilayah
      </button>
      <button data-testid="apply" onClick={() => store.apply()}>
        Terapkan
      </button>
      <button data-testid="reset" onClick={() => store.reset()}>
        Reset
      </button>
    </div>
  );
}

function testId(container: HTMLElement, id: string) {
  return container.querySelector(`[data-testid="${id}"]`);
}

function Harness() {
  return (
    <FilterProvider>
      <Probe />
    </FilterProvider>
  );
}

describe('filter store', () => {
  it('berisi default filter saat pertama kali dibuka', () => {
    const { container } = render(<Harness />);
    expect(testId(container, 'wilayah')?.textContent).toBe(DEFAULT_FILTER.wilayah);
    expect(testId(container, 'tahun')?.textContent).toBe(DEFAULT_FILTER.tahun);
    expect(testId(container, 'periode')?.textContent).toBe(DEFAULT_FILTER.periode);
    expect(testId(container, 'applied')?.textContent).toBe('false');
  });

  it('mengubah satu kunci filter dan membuka kunci kembali (applied false)', async () => {
    const { container } = render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('set-wilayah'));
    expect(testId(container, 'wilayah')?.textContent).toBe('Provinsi DKI Jakarta');
    expect(testId(container, 'applied')?.textContent).toBe('false');
  });

  it('menandai filter sebagai diterapkan saat apply dipanggil', async () => {
    const { container } = render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('apply'));
    expect(testId(container, 'applied')?.textContent).toBe('true');
  });

  it('reset mengembalikan default filter dan membuka kunci', async () => {
    const { container } = render(<Harness />);
    const user = userEvent.setup();
    await user.click(screen.getByTestId('apply'));
    await user.click(screen.getByTestId('reset'));
    expect(testId(container, 'wilayah')?.textContent).toBe(DEFAULT_FILTER.wilayah);
    expect(testId(container, 'tahun')?.textContent).toBe(DEFAULT_FILTER.tahun);
    expect(testId(container, 'periode')?.textContent).toBe(DEFAULT_FILTER.periode);
    expect(testId(container, 'applied')?.textContent).toBe('false');
  });

  it('lempar jika digunakan di luar FilterProvider', () => {
    expect(() => {
      render(<Probe />);
    }).toThrow(/FilterProvider/);
  });
});
