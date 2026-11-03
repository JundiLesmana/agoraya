"use client";

import { Button } from "@/components/ui/button";

export default function StatisticalIndicatorInputError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border p-8 text-center">
      <h2 className="text-lg font-semibold">
        Ruang input statistik gagal dimuat
      </h2>
      <p className="text-muted-foreground text-sm">
        Silakan coba kembali. Jika masalah berlanjut, hubungi administrator.
      </p>
      <Button onClick={reset}>Coba lagi</Button>
    </div>
  );
}
