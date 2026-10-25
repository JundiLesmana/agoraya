'use client';

import * as React from 'react';

/**
 * Konteks filter global untuk data anggaran (wilayah, tahun, periode).
 * State ini disimpan di React Context sehingga dapat dikonsumsi oleh
 * Summary, Chart, dan Table tanpa prop-drilling. Tidak ada dependensi
 * tambahan (Zustand/Redux tidak terpasang di repositori ini).
 *
 * Filter tidak disimpan riwayatnya dan tidak disimpan ke localStorage
 * (sesuai non-goals issue); hanya tema yang dipertahankan di localStorage
 * oleh theme-provider.
 */
export interface BudgetFilter {
  wilayah: string;
  tahun: string;
  periode: string;
}

export const DEFAULT_FILTER: BudgetFilter = {
  wilayah: 'Provinsi Jawa Barat',
  tahun: '2025',
  periode: 's.d. Triwulan III',
};

interface FilterStoreState {
  filters: BudgetFilter;
  applied: boolean;
  setFilter: (key: keyof BudgetFilter, value: string) => void;
  setFilters: (filters: Partial<BudgetFilter>) => void;
  apply: (onApply?: (filters: BudgetFilter) => void) => void;
  reset: () => void;
}

const FilterContext = React.createContext<FilterStoreState | null>(null);

export function useFilterStore(): FilterStoreState {
  const store = React.useContext(FilterContext);
  if (!store) {
    throw new Error('useFilterStore harus digunakan di dalam FilterProvider');
  }
  return store;
}

export function FilterProvider({
  children,
  defaultFilter = DEFAULT_FILTER,
}: {
  children: React.ReactNode;
  defaultFilter?: BudgetFilter;
}) {
  const [filters, setFiltersState] = React.useState<BudgetFilter>(defaultFilter);
  const [applied, setApplied] = React.useState(false);

  const setFilter = React.useCallback(
    (key: keyof BudgetFilter, value: string) => {
      setFiltersState((prev) => ({ ...prev, [key]: value }));
      setApplied(false);
    },
    [],
  );

  const setFilters = React.useCallback(
    (next: Partial<BudgetFilter>) => {
      setFiltersState((prev) => ({ ...prev, ...next }));
      setApplied(false);
    },
    [],
  );

  const apply = React.useCallback(
    (onApply?: (filters: BudgetFilter) => void) => {
      setApplied(true);
      onApply?.(filters);
    },
    [filters],
  );

  const reset = React.useCallback(() => {
    setFiltersState(defaultFilter);
    setApplied(false);
  }, [defaultFilter]);

  const value: FilterStoreState = {
    filters,
    applied,
    setFilter,
    setFilters,
    apply,
    reset,
  };

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}
