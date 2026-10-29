'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Select, type SelectOption } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export type InsightFilterValues = {
  wilayah: string;
  fokus: string;
  periode: string;
  topik: string;
};

export const DEFAULT_FILTERS: InsightFilterValues = {
  wilayah: 'Provinsi Jawa Barat',
  fokus: 'Kota Bandung',
  periode: '2024',
  topik: 'Semua topik',
};

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

const FOKUS_OPTIONS: SelectOption[] = [
  { value: 'Semua kabupaten/kota', label: 'Semua kabupaten/kota' },
  ...WILAYAH_OPTIONS.filter((option) => option.value !== 'Provinsi Jawa Barat'),
];

const PERIODE_OPTIONS: SelectOption[] = [
  { value: '2020', label: '2020' },
  { value: '2021', label: '2021' },
  { value: '2022', label: '2022' },
  { value: '2023', label: '2023' },
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
];

const TOPIK_OPTIONS: SelectOption[] = [
  { value: 'Semua topik', label: 'Semua topik' },
  { value: 'Layanan', label: 'Layanan' },
  { value: 'Anggaran', label: 'Anggaran' },
  { value: 'Kesejahteraan', label: 'Kesejahteraan' },
];

interface FilterControlsProps {
  /** Current filter values (synced from URL query params). */
  filters: InsightFilterValues;
  /** Callback fired when user clicks "Terapkan filter". Receives the chosen values. */
  onApply: (values: InsightFilterValues) => void;
  /** Reset all filters to default values. */
  onReset: () => void;
}

export function FilterControls({ filters, onApply, onReset }: FilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [local, setLocal] = React.useState<InsightFilterValues>(filters);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', local.wilayah);
    params.set('fokus', local.fokus);
    params.set('periode', local.periode);
    params.set('topik', local.topik);
    router.replace(`?${params.toString()}`);
    onApply(local);
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', DEFAULT_FILTERS.wilayah);
    params.set('fokus', DEFAULT_FILTERS.fokus);
    params.set('periode', DEFAULT_FILTERS.periode);
    params.set('topik', DEFAULT_FILTERS.topik);
    router.replace(`?${params.toString()}`);
    onReset();
  };

  const isDefault =
    local.wilayah === DEFAULT_FILTERS.wilayah &&
    local.fokus === DEFAULT_FILTERS.fokus &&
    local.periode === DEFAULT_FILTERS.periode &&
    local.topik === DEFAULT_FILTERS.topik;

  return (
    <section aria-label="Filter insight" className="mx-auto max-w-7xl">
      <div className="border border-border rounded-lg bg-background p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Atur sudut pandang Anda</h2>
            <p className="text-xs text-muted-foreground">
              Atur wilayah, fokus daerah, periode, dan topik untuk insight yang relevan.
            </p>
          </div>
          <Button
            variant="link"
            onClick={handleReset}
            disabled={isDefault}
          >
            Reset filter
          </Button>
        </div>
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 items-end">
          <div className="space-y-2">
            <Label htmlFor="filter-wilayah">Wilayah perbandingan</Label>
            <Select
              id="filter-wilayah"
              name="wilayah"
              aria-label="Pilih wilayah perbandingan provinsi"
              value={local.wilayah}
              onChange={(event) => setLocal({ ...local, wilayah: event.target.value })}
              options={WILAYAH_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-fokus">Fokus daerah</Label>
            <Select
              id="filter-fokus"
              name="fokus"
              aria-label="Pilih kabupaten atau kota fokus daerah"
              value={local.fokus}
              onChange={(event) => setLocal({ ...local, fokus: event.target.value })}
              options={FOKUS_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-periode">Periode</Label>
            <Select
              id="filter-periode"
              name="periode"
              aria-label="Pilih tahun periode"
              value={local.periode}
              onChange={(event) => setLocal({ ...local, periode: event.target.value })}
              options={PERIODE_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-topik">Topik</Label>
            <Select
              id="filter-topik"
              name="topik"
              aria-label="Pilih topik insight"
              value={local.topik}
              onChange={(event) => setLocal({ ...local, topik: event.target.value })}
              options={TOPIK_OPTIONS}
            />
          </div>
          <div className="space-y-2">
            <Button onClick={handleApply} disabled={isDefault}>
              Terapkan filter
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

