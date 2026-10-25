'use client';

import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useFilterStore } from '@/lib/filter-store';

const WILAYAH_OPTIONS = [
  { value: 'Provinsi Jawa Barat', label: 'Provinsi Jawa Barat' },
  { value: 'Provinsi Jawa Tengah', label: 'Provinsi Jawa Tengah' },
  { value: 'Provinsi DKI Jakarta', label: 'Provinsi DKI Jakarta' },
  { value: 'Provinsi Sumatera Utara', label: 'Provinsi Sumatera Utara' },
  { value: 'Semua Wilayah', label: 'Semua Wilayah' },
] as const;

const TAHUN_OPTIONS = ['2023', '2024', '2025', '2026'].map((tahun) => ({
  value: tahun,
  label: tahun,
}));

const PERIODE_OPTIONS = [
  { value: 's.d. Triwulan I', label: 's.d. Triwulan I' },
  { value: 's.d. Triwulan II', label: 's.d. Triwulan II' },
  { value: 's.d. Triwulan III', label: 's.d. Triwulan III' },
  { value: 'Kumulatif', label: 'Kumulatif' },
  { value: 'Tahunan', label: 'Tahunan' },
] as const;

interface FilterBarProps {
  /** Dipanggil saat filter diterapkan (dikunci) oleh pengguna. */
  onApply?: (filters: ReturnType<typeof useFilterStore>['filters']) => void;
}

export function FilterBar({ onApply }: FilterBarProps = {}) {
  const { filters, setFilter, applied, reset, apply } = useFilterStore();

  const handleApply = React.useCallback(() => {
    apply(onApply);
  }, [filters, apply, onApply]);

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-3">
      <div className="flex flex-col gap-1.5 w-full md:w-auto">
        <Label htmlFor="filter-wilayah">Wilayah</Label>
        <Select
          id="filter-wilayah"
          value={filters.wilayah}
          onChange={(event) => setFilter('wilayah', event.currentTarget.value)}
          options={WILAYAH_OPTIONS}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-full md:w-auto">
        <Label htmlFor="filter-tahun">Tahun Anggaran</Label>
        <Select
          id="filter-tahun"
          value={filters.tahun}
          onChange={(event) => setFilter('tahun', event.currentTarget.value)}
          options={TAHUN_OPTIONS}
        />
      </div>

      <div className="flex flex-col gap-1.5 w-full md:w-auto">
        <Label htmlFor="filter-periode">Periode</Label>
        <Select
          id="filter-periode"
          value={filters.periode}
          onChange={(event) => setFilter('periode', event.currentTarget.value)}
          options={PERIODE_OPTIONS}
        />
      </div>

      <div className="flex items-end gap-2 w-full md:w-auto">
        <Button
          type="button"
          onClick={handleApply}
          disabled={applied}
          className="w-full md:w-auto"
        >
          {applied ? 'Terkunci' : 'Terapkan filter'}
        </Button>
        <a
          href="#"
          onClick={(event) => {
            event.preventDefault();
            reset();
          }}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
          aria-label="Reset filter"
        >
          Reset filter
        </a>
      </div>

      <div className="w-full md:w-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        {applied ? (
          <>
            <span className="font-semibold">Diterapkan:</span>
            {filters.wilayah} &bull; {filters.tahun} &bull; {filters.periode}
          </>
        ) : (
          <span>Filter belum dikunci. Klik “Terapkan filter” untuk memperbarui data.</span>
        )}
      </div>
    </div>
  );
}
