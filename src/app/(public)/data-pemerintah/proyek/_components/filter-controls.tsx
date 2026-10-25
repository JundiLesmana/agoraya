'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, type SelectOption } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type FilterValues = {
  wilayah: string;
  periode: string;
  sektor: string;
  status: string;
};

const DEFAULT_FILTERS: FilterValues = {
  wilayah: 'Provinsi Jawa Barat',
  periode: '2025 · s.d. TW III',
  sektor: 'Semua sektor',
  status: 'Semua status',
};

export { DEFAULT_FILTERS };

const WILAYAH_OPTIONS: SelectOption[] = [
  { value: 'Provinsi Jawa Barat', label: 'Provinsi Jawa Barat' },
  { value: 'Kabupaten Bandung', label: 'Kabupaten Bandung' },
  { value: 'Kabupaten Bogor', label: 'Kabupaten Bogor' },
  { value: 'Kabupaten Sukabumi', label: 'Kabupaten Sukabumi' },
  { value: 'Kabupaten Cianjur', label: 'Kabupaten Cianjur' },
  { value: 'Kabupaten Garut', label: 'Kabupaten Garut' },
  { value: 'Kabupaten Tasikmalaya', label: 'Kabupaten Tasikmalaya' },
  { value: 'Kabupaten Ciamis', label: 'Kabupaten Ciamis' },
  { value: 'Kabupaten Kuningan', label: 'Kabupaten Kuningan' },
  { value: 'Kabupaten Cirebon', label: 'Kabupaten Cirebon' },
  { value: 'Kabupaten Majalengka', label: 'Kabupaten Majalengka' },
  { value: 'Kabupaten Sumedang', label: 'Kabupaten Sumedang' },
  { value: 'Kabupaten Indramayu', label: 'Kabupaten Indramayu' },
  { value: 'Kabupaten Subang', label: 'Kabupaten Subang' },
  { value: 'Kabupaten Purwakarta', label: 'Kabupaten Purwakarta' },
  { value: 'Kabupaten Karawang', label: 'Kabupaten Karawang' },
  { value: 'Kabupaten Bekasi', label: 'Kabupaten Bekasi' },
  { value: 'Kabupaten Bandung Barat', label: 'Kabupaten Bandung Barat' },
  { value: 'Kabupaten Pangandaran', label: 'Kabupaten Pangandaran' },
  { value: 'Kota Bandung', label: 'Kota Bandung' },
  { value: 'Kota Bogor', label: 'Kota Bogor' },
  { value: 'Kota Sukabumi', label: 'Kota Sukabumi' },
  { value: 'Kota Cirebon', label: 'Kota Cirebon' },
  { value: 'Kota Bekasi', label: 'Kota Bekasi' },
  { value: 'Kota Depok', label: 'Kota Depok' },
  { value: 'Kota Cimahi', label: 'Kota Cimahi' },
  { value: 'Kota Tasikmalaya', label: 'Kota Tasikmalaya' },
  { value: 'Kota Banjar', label: 'Kota Banjar' },
];

const PERIODE_OPTIONS: SelectOption[] = [
  { value: '2025 · s.d. TW III', label: '2025 · s.d. TW III' },
  { value: '2025 · s.d. TW IV', label: '2025 · s.d. TW IV' },
  { value: '2024 · s.d. TW IV', label: '2024 · s.d. TW IV' },
  { value: '2024 · s.d. TW III', label: '2024 · s.d. TW III' },
];

const SEKTOR_OPTIONS: SelectOption[] = [
  { value: 'Semua sektor', label: 'Semua sektor' },
  { value: 'Infrastruktur', label: 'Infrastruktur' },
  { value: 'Pendidikan', label: 'Pendidikan' },
  { value: 'Kesehatan', label: 'Kesehatan' },
  { value: 'Sektor lainnya', label: 'Sektor lainnya' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'Semua status', label: 'Semua status' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Berjalan', label: 'Berjalan' },
  { value: 'Tertunda', label: 'Tertunda' },
];

interface FilterControlsProps {
  /** Current filter values (synced from URL query params). */
  filters: FilterValues;
  /** Callback fired when user clicks "Terapkan filter". Receives the chosen values. */
  onApply: (values: FilterValues) => void;
  /** Reset all filters to default values. */
  onReset: () => void;
}

export function FilterControls({ filters, onApply, onReset }: FilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [local, setLocal] = React.useState<FilterValues>(filters);

  // Keep local draft in sync when URL-driven defaults change externally.
  React.useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', local.wilayah);
    params.set('periode', local.periode);
    params.set('sektor', local.sektor);
    params.set('status', local.status);
    router.replace(`?${params.toString()}`);
    onApply(local);
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', DEFAULT_FILTERS.wilayah);
    params.set('periode', DEFAULT_FILTERS.periode);
    params.set('sektor', DEFAULT_FILTERS.sektor);
    params.set('status', DEFAULT_FILTERS.status);
    router.replace(`?${params.toString()}`);
    onReset();
  };

  const isDefault =
    local.wilayah === DEFAULT_FILTERS.wilayah &&
    local.periode === DEFAULT_FILTERS.periode &&
    local.sektor === DEFAULT_FILTERS.sektor &&
    local.status === DEFAULT_FILTERS.status;

  return (
    <section
      aria-label="Filter proyek"
      className="mx-auto max-w-7xl"
    >
      <div className="border border-border rounded-lg bg-background p-4 sm:p-6 shadow-sm">
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="filter-wilayah">Wilayah</Label>
            <Select
              id="filter-wilayah"
              name="wilayah"
              aria-label="Pilih wilayah provinsi atau kabupaten/kota"
              value={local.wilayah}
              onChange={(e) => setLocal({ ...local, wilayah: e.target.value })}
              options={WILAYAH_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-periode">Periode kumulatif</Label>
            <Select
              id="filter-periode"
              name="periode"
              aria-label="Pilih tahun dan triwulan periode kumulatif"
              value={local.periode}
              onChange={(e) => setLocal({ ...local, periode: e.target.value })}
              options={PERIODE_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-sektor">Sektor</Label>
            <Select
              id="filter-sektor"
              name="sektor"
              aria-label="Pilih sektor proyek"
              value={local.sektor}
              onChange={(e) => setLocal({ ...local, sektor: e.target.value })}
              options={SEKTOR_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-status">Status proyek</Label>
            <Select
              id="filter-status"
              name="status"
              aria-label="Pilih status proyek"
              value={local.status}
              onChange={(e) => setLocal({ ...local, status: e.target.value })}
              options={STATUS_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Button
              onClick={handleApply}
              disabled={isDefault}
              className="w-full"
            >
              Terapkan filter
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isDefault}
              className="w-full"
            >
              Reset filter
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
