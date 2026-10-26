'use client';

import * as React from 'react';
import Link from 'next/link';
import { useFilterStore } from '@/lib/filter-store';
import { FilterBar } from '@/components/filter-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SourceBadge } from '@/components/source-badges/source-badge';
import { Clock, AlertTriangle } from 'lucide-react';

const REGIONS = [
  { name: 'Kabupaten Bandung', alokasi: 'Rp 12,4 T', realisasi: 'Rp 9,8 T', capaian: 79 },
  { name: 'Kabupaten Cianjur', alokasi: 'Rp 6,1 T', realisasi: 'Rp 4,2 T', capaian: 69 },
  { name: 'Kabupaten Bogor', alokasi: 'Rp 10,8 T', realisasi: 'Rp 8,1 T', capaian: 75 },
  { name: 'Kabupaten Bekasi', alokasi: 'Rp 9,5 T', realisasi: 'Rp 7,0 T', capaian: 74 },
  { name: 'Kabupaten Subang', alokasi: 'Rp 5,4 T', realisasi: 'Rp 3,9 T', capaian: 72 },
] as const;

export default function AnggaranPage() {
  const { filters, applied } = useFilterStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<string | null>(null);

  const handleApply = React.useCallback(() => {
    setRefreshing(true);
    setLastUpdated(null);
    setTimeout(() => {
      setRefreshing(false);
      setLastUpdated(new Date().toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
      }));
    }, 700);
  }, []);

  return (
    <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <section className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Anggaran
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Jelajahi anggaran
        </h1>
        <p className="text-base text-muted-foreground">
          Lihat alokasi dan realisasi anggaran untuk {filters.wilayah},
          tahun anggaran {filters.tahun}, periode {filters.periode}.
        </p>
      </section>

      <nav aria-label="Breadcrumb" className="flex flex-wrap gap-1 text-xs text-muted-foreground">
        <Link
          href="/"
          className="rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Beranda
        </Link>
        <span className="mx-1">&rsaquo;</span>
        <span className="rounded-md px-2 py-1 bg-primary/10 text-primary font-medium">
          Anggaran
        </span>
      </nav>

      <Card className="border-border shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
          <div>
            <CardTitle className="text-base font-semibold">Filter Data Anggaran</CardTitle>
            <CardDescription className="text-sm">
              Pilih wilayah, tahun anggaran, dan periode sebelum mengeksplorasi
              detail anggaran di bawah ini.
            </CardDescription>
          </div>
          <FilterBar onApply={handleApply} />
        </CardHeader>
      </Card>

      {applied && !refreshing && lastUpdated && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          Data diperbarui pada {lastUpdated} (WIB) untuk filter yang dikunci.
        </div>
      )}

      <section className="grid gap-6 sm:grid-cols-3">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="px-4 pb-3 pt-4">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Total Anggaran
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-foreground">Rp 342,7 T</span>
              <span className="text-xs text-muted-foreground">
                {filters.tahun} &middot; {filters.wilayah}
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Alokasi awal APBD {filters.periode.toLowerCase()}.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="px-4 pb-3 pt-4">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Realisasi
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-foreground">Rp 284,1 T</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Realisasi kumulatif {filters.periode.toLowerCase()}.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="px-4 pb-3 pt-4">
            <CardTitle className="text-base font-semibold text-card-foreground">
              Status Filter
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Badge variant={applied ? 'default' : 'secondary'} className="text-xs">
              {applied ? 'Dikunci' : 'Belum dikunci'}
            </Badge>
            <p className="mt-2 text-xs text-muted-foreground">
              Klik “Terapkan filter” untuk mengunci pilihan dan memicu
              pembaruan data di seluruh halaman.
            </p>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            Detail Alokasi per Daerah
          </h2>
          {refreshing ? (
            <Button variant="outline" size="sm" disabled className="w-auto">
              Memperbarui data…
            </Button>
          ) : null}
        </div>

        {refreshing ? (
          <div className="rounded-lg border border-border bg-background p-4 animate-pulse">
            <p className="text-sm text-muted-foreground">
              Memuat data anggaran terbaru untuk {filters.wilayah}, {filters.tahun},…
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50 text-muted-foreground">
                  <th className="p-3 font-medium" scope="col">Daerah</th>
                  <th className="p-3 font-medium" scope="col">Alokasi</th>
                  <th className="p-3 font-medium" scope="col">Realisasi</th>
                  <th className="p-3 font-medium" scope="col">Capaian</th>
                </tr>
              </thead>
              <tbody>
                {REGIONS.map((region) => (
                  <tr key={region.name} className="border-b border-border/50 hover:bg-accent/50 transition-colors">
                    <td className="p-3 font-medium text-foreground">{region.name}</td>
                    <td className="p-3 text-muted-foreground">{region.alokasi}</td>
                    <td className="p-3 text-muted-foreground">{region.realisasi}</td>
                    <td className="p-3">
                      <Badge variant={region.capaian >= 75 ? 'default' : 'outline'} className="text-xs">
                        {region.capaian}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <AlertTriangle className="size-3.5" aria-hidden="true" />
          <span>
            Data simulasi (SIMULATED) — merupakan pratinjau dan bukan data
            resmi dari sumber pemerintah.
          </span>
        </div>
        <SourceBadge source="SIMULATED" label="Preview mockup" />
      </section>

      {!applied && (
        <div className="rounded-lg border border-border bg-amber-50 p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-amber-800">
                Terapkan filter untuk melihat data
              </p>
              <p className="text-xs text-amber-700">
                Pilih wilayah, tahun anggaran, dan periode, lalu klik
                “Terapkan filter” untuk mengunci dan memperbarui data di
                seluruh halaman.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
