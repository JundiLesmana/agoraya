'use client';

import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/source-badges/source-badge';
import { formatCurrency, formatPercent } from '@/lib/currency';
import { ApbdInputForm } from './ApbdInputForm';
import type { ApbdFormValues } from './ApbdInputForm';

export interface ApbdEntry {
  readonly id: string;
  readonly tahun: number;
  readonly satker: string;
  readonly kegiatan: string;
  readonly pagu: number;
  readonly realisasi: number;
  readonly periode: string;
  readonly status: 'draft' | 'submitted' | 'published';
}

const STATUS_LABEL: Record<ApbdEntry['status'], string> = {
  draft: 'Draft',
  submitted: 'Diajukan',
  published: 'Terbit',
};

const STATUS_VARIANT: Record<ApbdEntry['status'], 'default' | 'destructive' | 'outline' | 'secondary'> = {
  draft: 'outline',
  submitted: 'outline',
  published: 'default',
} as const;

interface ApbdEntryBoardProps {
  readonly initialEntries: readonly ApbdEntry[];
}

export function ApbdEntryBoard({ initialEntries }: ApbdEntryBoardProps) {
  const [entries, setEntries] = useState<ApbdEntry[]>([...initialEntries]);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = useCallback(
    (values: ApbdFormValues) => {
      setError(null);
      // Simulasi penyimpanan server (antrian audit) untuk MVP.
      setTimeout(() => {
        const entry: ApbdEntry = {
          id: `apbd-${Date.now()}`,
          ...values,
          status: 'draft',
        };
        setEntries((prev) => [...prev, entry]);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }, 600);
    },
    []
  );

  const handleRetry = useCallback(() => {
    setError(null);
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Data APBD</h2>
          <p className="text-muted-foreground text-sm">
            Daftar entri anggaran dan realisasi yang telah dimasukkan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source="SIMULATED" className="text-[10px]" />
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Tambah Data
          </Button>
        </div>
      </div>

      {saved ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          <span aria-hidden="true" className="size-4">
            <svg xmlns="/public/logo" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </span>
          <p>Data APBD berhasil disimpan (simulasi).</p>
        </div>
      ) : error ? (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={handleRetry} className="mt-3">
            Coba Lagi
          </Button>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Daftar Entri APBD</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <caption className="sr-only">
                Daftar entri anggaran dan realisasi APBD
              </caption>
              <thead>
                <tr>
                  <th scope="col" className="p-3 font-medium text-muted-foreground">
                    Tahun
                  </th>
                  <th scope="col" className="p-3 font-medium text-muted-foreground">
                    Satker
                  </th>
                  <th scope="col" className="p-3 font-medium text-muted-foreground">
                    Kegiatan
                  </th>
                  <th scope="col" className="p-3 font-medium text-muted-foreground text-right">
                    Pagu
                  </th>
                  <th scope="col" className="p-3 font-medium text-muted-foreground text-right">
                    Realisasi
                  </th>
                  <th scope="col" className="p-3 font-medium text-muted-foreground text-right">
                    Sisa
                  </th>
                  <th scope="col" className="p-3 font-medium text-muted-foreground text-center">
                    T. Realisasi
                  </th>
                  <th scope="col" className="p-3 font-medium text-muted-foreground text-center">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      Belum ada data APBD. Klik &ldquo;Tambah Data&rdquo; untuk memulai.
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const sisa = entry.pagu - entry.realisasi;
                    const tingkat =
                      entry.pagu > 0 ? (entry.realisasi / entry.pagu) * 100 : 0;
                    return (
                      <tr key={entry.id} className="border-b">
                        <td className="p-3">{entry.tahun}</td>
                        <td className="p-3">{entry.satker}</td>
                        <td className="p-3">{entry.kegiatan}</td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(entry.pagu)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(entry.realisasi)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {formatCurrency(sisa)}
                        </td>
                        <td className="p-3 text-center font-medium">
                          {formatPercent(tingkat)}
                        </td>
                        <td className="p-3 text-center">
                          <Badge variant={STATUS_VARIANT[entry.status]}>
                            {STATUS_LABEL[entry.status]}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ApbdInputForm open={open} onOpenChange={setOpen} onSave={handleSave} />
    </section>
  );
}
