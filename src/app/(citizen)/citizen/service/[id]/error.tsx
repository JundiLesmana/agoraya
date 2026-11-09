'use client';

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function CitizenSubmissionDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-2xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-semibold tracking-tight">Detail pengajuan gagal dimuat</h2>
      <p className="text-sm text-muted-foreground">
        Coba muat ulang halaman atau kembali ke daftar pengajuan Anda.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>Coba lagi</Button>
        <Button asChild variant="outline">
          <Link href="/citizen/service">Kembali ke ruang warga</Link>
        </Button>
      </div>
    </div>
  );
}
