"use client";

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-16 text-center">
      <span className="bg-destructive/10 text-destructive flex size-12 items-center justify-center rounded-full">
        <AlertTriangle aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">
        Analitik belum dapat dimuat
      </h1>
      <p className="text-muted-foreground mt-2 max-w-md text-sm leading-relaxed">
        Terjadi kendala saat menampilkan ringkasan. Coba muat ulang halaman.
      </p>
      <Button className="mt-6" onClick={reset}>
        <RotateCw aria-hidden="true" className="size-4" />
        Coba lagi
      </Button>
    </main>
  );
}
