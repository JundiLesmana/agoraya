'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { FilterControls, type FilterValues, DEFAULT_FILTERS } from './filter-controls';

export function MobileFilterDrawer({
  filters,
  onApply,
  onReset,
}: {
  filters: FilterValues;
  onApply: (values: FilterValues) => void;
  onReset: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const handleApply = (values: FilterValues) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', values.wilayah);
    params.set('periode', values.periode);
    params.set('sektor', values.sektor);
    params.set('status', values.status);
    router.replace(`?${params.toString()}`);
    onApply(values);
    setOpen(false);
  };

  const handleReset = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('wilayah', DEFAULT_FILTERS.wilayah);
    params.set('periode', DEFAULT_FILTERS.periode);
    params.set('sektor', DEFAULT_FILTERS.sektor);
    params.set('status', DEFAULT_FILTERS.status);
    router.replace(`?${params.toString()}`);
    onReset();
    setOpen(false);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <>
      {isMobile ? (
        <>
          <Button
            variant="outline"
            onClick={() => setOpen(true)}
            aria-label="Buka filter proyek"
            className="w-full"
          >
            Filter
          </Button>
          <Modal
            open={open}
            onOpenChange={setOpen}
            title="Filter proyek"
            description="Pilih wilayah, periode, sektor, dan status untuk menyaring data proyek."
          >
            <FilterControls
              filters={filters}
              onApply={handleApply}
              onReset={handleReset}
            />
          </Modal>
        </>
      ) : (
        <FilterControls
          filters={filters}
          onApply={onApply}
          onReset={onReset}
        />
      )}
    </>
  );
}
