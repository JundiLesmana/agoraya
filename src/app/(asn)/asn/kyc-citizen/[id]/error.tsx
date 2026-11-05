'use client';

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function VerifikasiAkunWargaDetailError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[VerifikasiAkunWargaDetail] Gagal memuat detail pengajuan:", error);
  }, [error]);

  return (
    <main className="container mx-auto px-4 py-6 space-y-6 text-center">
      <h1 className="text-2xl font-bold text-destructive">
        Gagal memuat detail pengajuan
      </h1>
      <p className="text-muted-foreground mb-6">
        {error.message ?? "Terjadi kesalahan saat memuat data pengajuan."}
      </p>
      <Button onClick={reset}>Coba Lagi</Button>
    </main>
  );
}
