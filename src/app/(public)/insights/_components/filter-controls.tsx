"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Select, type SelectOption } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  getRegencyOptions,
  INDONESIAN_PROVINCES,
  isIndonesianProvince,
} from "@/lib/indonesia-administrative-areas";

export type InsightFilterValues = {
  wilayah: string;
  fokus: string;
  periode: string;
  topik: string;
};

export const DEFAULT_FILTERS: InsightFilterValues = {
  wilayah: "Provinsi Jawa Barat",
  fokus: "Kota Bandung",
  periode: "2024",
  topik: "Semua topik",
};

const WILAYAH_OPTIONS: SelectOption[] = INDONESIAN_PROVINCES.map(
  (province) => ({ value: province, label: province }),
);
export const ALL_REGENCIES = "Semua kabupaten/kota";

function normalizeFilters(filters: InsightFilterValues): InsightFilterValues {
  const wilayah = isIndonesianProvince(filters.wilayah)
    ? filters.wilayah
    : DEFAULT_FILTERS.wilayah;
  const fokusOptions = getRegencyOptions(wilayah);

  return {
    ...filters,
    wilayah,
    fokus:
      filters.fokus === ALL_REGENCIES || fokusOptions.includes(filters.fokus)
        ? filters.fokus
        : ALL_REGENCIES,
  };
}

const PERIODE_OPTIONS: SelectOption[] = [
  { value: "2020", label: "2020" },
  { value: "2021", label: "2021" },
  { value: "2022", label: "2022" },
  { value: "2023", label: "2023" },
  { value: "2024", label: "2024" },
  { value: "2025", label: "2025" },
];

const TOPIK_OPTIONS: SelectOption[] = [
  { value: "Semua topik", label: "Semua topik" },
  { value: "Layanan", label: "Layanan" },
  { value: "Anggaran", label: "Anggaran" },
  { value: "Kesejahteraan", label: "Kesejahteraan" },
];

interface FilterControlsProps {
  /** Current filter values (synced from URL query params). */
  filters: InsightFilterValues;
  /** Callback fired when user clicks "Terapkan filter". Receives the chosen values. */
  onApply: (values: InsightFilterValues) => void;
  /** Reset all filters to default values. */
  onReset: () => void;
}

export function FilterControls({
  filters,
  onApply,
  onReset,
}: FilterControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [local, setLocal] = React.useState<InsightFilterValues>(() =>
    normalizeFilters(filters),
  );

  React.useEffect(() => {
    setLocal(normalizeFilters(filters));
  }, [filters]);

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("wilayah", local.wilayah);
    params.set("fokus", local.fokus);
    params.set("periode", local.periode);
    params.set("topik", local.topik);
    router.replace(`?${params.toString()}`);
    onApply(local);
  };

  const handleReset = () => {
    setLocal(DEFAULT_FILTERS);
    const params = new URLSearchParams(searchParams.toString());
    params.set("wilayah", DEFAULT_FILTERS.wilayah);
    params.set("fokus", DEFAULT_FILTERS.fokus);
    params.set("periode", DEFAULT_FILTERS.periode);
    params.set("topik", DEFAULT_FILTERS.topik);
    router.replace(`?${params.toString()}`);
    onReset();
  };

  const isUnchanged =
    local.wilayah === filters.wilayah &&
    local.fokus === filters.fokus &&
    local.periode === filters.periode &&
    local.topik === filters.topik;
  const fokusOptions: SelectOption[] = [
    { value: ALL_REGENCIES, label: ALL_REGENCIES },
    ...getRegencyOptions(local.wilayah).map((region) => ({
      value: region,
      label: region,
    })),
  ];

  return (
    <section aria-label="Filter insight" className="mx-auto max-w-7xl">
      <div className="border-border bg-background rounded-lg border p-4 shadow-sm sm:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Atur sudut pandang Anda</h2>
            <p className="text-muted-foreground text-xs">
              Atur wilayah, fokus daerah, periode, dan topik untuk insight yang
              relevan.
            </p>
          </div>
          <Button
            variant="link"
            onClick={handleReset}
            className="h-auto px-2 py-1 text-blue-700 transition-colors duration-200 hover:text-blue-800 hover:no-underline active:scale-[0.98] disabled:opacity-100"
          >
            Reset filter
          </Button>
        </div>
        <div className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
          <div className="space-y-2">
            <Label htmlFor="filter-wilayah">Wilayah perbandingan</Label>
            <Select
              id="filter-wilayah"
              name="wilayah"
              aria-label="Pilih wilayah perbandingan provinsi"
              value={local.wilayah}
              onChange={(event) => {
                const wilayah = event.target.value;
                setLocal({
                  ...local,
                  wilayah,
                  fokus:
                    wilayah === local.wilayah ? local.fokus : ALL_REGENCIES,
                });
              }}
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
              onChange={(event) =>
                setLocal({ ...local, fokus: event.target.value })
              }
              options={fokusOptions}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-periode">Periode</Label>
            <Select
              id="filter-periode"
              name="periode"
              aria-label="Pilih tahun periode"
              value={local.periode}
              onChange={(event) =>
                setLocal({ ...local, periode: event.target.value })
              }
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
              onChange={(event) =>
                setLocal({ ...local, topik: event.target.value })
              }
              options={TOPIK_OPTIONS}
            />
          </div>
          <Button
            onClick={handleApply}
            disabled={isUnchanged}
            className="h-11 w-full rounded-lg bg-[#1745e8] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1238c8] hover:shadow-md active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:bg-[#1745e8] disabled:text-white disabled:opacity-100 motion-reduce:transform-none motion-reduce:transition-none"
          >
            Terapkan filter
          </Button>
        </div>
      </div>
    </section>
  );
}
