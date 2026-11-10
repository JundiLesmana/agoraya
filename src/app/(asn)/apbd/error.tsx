'use client';

import { Button } from '@/components/ui/button';

export default function AsnApbdDataManagementError({
  reset,
}: {
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <p className="text-destructive">
        Terjadi kesalahan saat memuat data manajemen APBD.
      </p>
      <Button onClick={reset}>Coba Lagi</Button>
    </div>
  );
}
