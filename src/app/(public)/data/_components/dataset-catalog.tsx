"use client";

import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BarChart3,
  Info,
  Wallet,
  Wrench,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";

type DatasetColumn = {
  name: string;
  type: string;
  description: string;
};

type Dataset = {
  id: string;
  title: string;
  summary: string;
  schema: string;
  fileName: string;
  icon: typeof Wallet;
  columns: readonly DatasetColumn[];
};

const DATASETS: readonly Dataset[] = [
  {
    id: "apbd",
    title: "Anggaran & realisasi APBD",
    summary: "9 periode bulanan · 4 sektor",
    schema: "Keuangan daerah",
    fileName: "anggaran-realisasi-apbd.csv",
    icon: Wallet,
    columns: [
      {
        name: "periode",
        type: "tanggal (YYYY-MM)",
        description: "Bulan pelaporan pada 2025.",
      },
      {
        name: "sektor",
        type: "teks",
        description: "Sektor penggunaan anggaran.",
      },
      {
        name: "anggaran_rupiah",
        type: "integer",
        description: "Nilai anggaran dalam rupiah.",
      },
      {
        name: "realisasi_rupiah",
        type: "integer",
        description: "Nilai realisasi dalam rupiah.",
      },
      {
        name: "realisasi_persen",
        type: "decimal",
        description: "Persentase realisasi terhadap anggaran.",
      },
    ],
  },
  {
    id: "proyek",
    title: "Progres proyek daerah",
    summary: "240 proyek · 27 kabupaten/kota",
    schema: "Pelaksanaan pembangunan",
    fileName: "progres-proyek-daerah.csv",
    icon: Wrench,
    columns: [
      {
        name: "id_proyek",
        type: "teks",
        description: "Pengenal proyek ilustratif.",
      },
      {
        name: "nama_proyek",
        type: "teks",
        description: "Nama singkat proyek.",
      },
      {
        name: "kabupaten_kota",
        type: "teks",
        description: "Wilayah pelaksanaan proyek.",
      },
      { name: "sektor", type: "teks", description: "Sektor pembangunan." },
      {
        name: "progres_persen",
        type: "integer",
        description: "Progres fisik dalam persen.",
      },
      {
        name: "status",
        type: "teks",
        description: "Status pelaksanaan proyek.",
      },
    ],
  },
  {
    id: "statistik",
    title: "Indikator statistik daerah",
    summary: "4 indikator · perbandingan 2024–2025",
    schema: "Statistik tahunan",
    fileName: "indikator-statistik-daerah.csv",
    icon: BarChart3,
    columns: [
      {
        name: "tahun",
        type: "integer",
        description: "Tahun pengukuran indikator.",
      },
      {
        name: "wilayah",
        type: "teks",
        description: "Cakupan wilayah pengukuran.",
      },
      {
        name: "indikator",
        type: "teks",
        description: "Nama indikator statistik.",
      },
      {
        name: "nilai",
        type: "decimal",
        description: "Nilai indikator sesuai satuannya.",
      },
      { name: "satuan", type: "teks", description: "Satuan yang digunakan." },
    ],
  },
];

function DatasetCatalog() {
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const SelectedIcon = selectedDataset?.icon;

  return (
    <section
      id="katalog-data"
      aria-labelledby="catalog-title"
      className="scroll-mt-24 space-y-4"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="catalog-title"
            className="text-card-foreground text-xl font-semibold tracking-tight"
          >
            Eksplorasi lebih lanjut dengan dataset
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Lihat struktur data, periksa metadata, atau unduh untuk analisis
            Anda.
          </p>
        </div>
        <a
          href="#katalog-data"
          className="border-border bg-background text-primary hover:bg-accent focus-visible:ring-ring inline-flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <ArrowRight className="size-4" aria-hidden="true" />
          Katalog data
        </a>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DATASETS.map((dataset) => {
          const Icon = dataset.icon;

          return (
            <Card key={dataset.id} className="border-border bg-card shadow-sm">
              <CardContent className="flex h-full flex-col p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <span className="inline-flex size-8 items-center justify-center rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-900 dark:bg-blue-950 dark:text-blue-100">
                    DATA ILUSTRATIF
                  </span>
                </div>

                <h3 className="text-card-foreground text-sm font-semibold">
                  {dataset.title}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  {dataset.summary}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Skema: {dataset.schema}
                </p>
                {dataset.id === "proyek" ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    File berisi 3 baris sampel dari cakupan dataset.
                  </p>
                ) : null}
                <p className="text-muted-foreground mt-3 text-xs">
                  30 Sep 2025 · CSV · data ilustratif
                </p>

                <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                  <Button
                    variant="link"
                    size="sm"
                    className="px-0"
                    onClick={() => setSelectedDataset(dataset)}
                    aria-label={`Lihat metadata ${dataset.title}`}
                  >
                    Metadata{" "}
                    <ArrowRight className="size-3" aria-hidden="true" />
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a
                      href={`/data/${dataset.fileName}`}
                      download={dataset.fileName}
                    >
                      <ArrowDownToLine className="size-4" aria-hidden="true" />
                      CSV
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <aside
        role="note"
        aria-labelledby="dataset-disclaimer-title"
        className="rounded-lg border border-amber-300 bg-amber-100 p-4 text-amber-950 sm:p-5 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
      >
        <div className="flex items-start gap-3">
          <Info
            className="mt-0.5 size-5 shrink-0"
            role="img"
            aria-label="Informasi penting tentang data"
          />
          <div>
            <h3 id="dataset-disclaimer-title" className="text-sm font-semibold">
              Data terbuka, konteks tetap penting.
            </h3>
            <p className="mt-1 text-sm leading-6">
              Dashboard ini adalah rancangan dengan data ilustratif, tanpa
              koneksi data langsung. Filter wilayah berlaku daerah menggunakan
              indikator tahunan. Periksa definisi, satuan, dan periode sebelum
              membandingkan data.
            </p>
            <nav
              aria-label="Dokumentasi data"
              className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold"
            >
              <a
                href="#definisi-metodologi"
                className="underline underline-offset-4 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-100 focus-visible:outline-none dark:hover:text-amber-200 dark:focus-visible:ring-amber-200 dark:focus-visible:ring-offset-amber-950"
              >
                Definisi & metodologi →
              </a>
              <a
                href="#panduan-data"
                className="underline underline-offset-4 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-amber-800 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-100 focus-visible:outline-none dark:hover:text-amber-200 dark:focus-visible:ring-amber-200 dark:focus-visible:ring-offset-amber-950"
              >
                Panduan data →
              </a>
            </nav>
          </div>
        </div>
      </aside>

      <div className="grid gap-3 sm:grid-cols-2">
        <article
          id="definisi-metodologi"
          className="border-border scroll-mt-24 rounded-lg border p-4"
        >
          <h3 className="text-card-foreground text-sm font-semibold">
            Definisi & metodologi
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Dataset pada halaman ini bersifat ilustratif dan tidak bersumber
            dari koneksi data langsung. Nilai realisasi adalah nilai nominal
            dalam rupiah; indikator statistik mengikuti satuan yang tercantum
            pada metadata.
          </p>
        </article>
        <article
          id="panduan-data"
          className="border-border scroll-mt-24 rounded-lg border p-4"
        >
          <h3 className="text-card-foreground text-sm font-semibold">
            Panduan membaca data
          </h3>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Unduh metadata untuk memeriksa nama kolom dan tipe data sebelum
            membuka CSV. Bandingkan nilai hanya jika wilayah, satuan, dan
            periode pengukurannya sesuai.
          </p>
        </article>
      </div>

      <Modal
        open={selectedDataset !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDataset(null);
        }}
        title={
          <span className="flex items-center gap-2">
            {SelectedIcon ? (
              <SelectedIcon
                className="text-primary size-5"
                aria-hidden="true"
              />
            ) : null}
            Metadata: {selectedDataset?.title}
          </span>
        }
        description="Struktur kolom dan tipe data pada berkas CSV."
        contentClassName="max-h-[85vh] overflow-y-auto"
      >
        {selectedDataset ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">
                Struktur kolom {selectedDataset.fileName}
              </caption>
              <thead>
                <tr className="border-border border-b">
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Kolom
                  </th>
                  <th scope="col" className="py-2 pr-3 font-semibold">
                    Tipe data
                  </th>
                  <th scope="col" className="py-2 font-semibold">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedDataset.columns.map((column) => (
                  <tr
                    key={column.name}
                    className="border-border/60 border-b align-top"
                  >
                    <th
                      scope="row"
                      className="py-2 pr-3 font-mono text-xs font-medium"
                    >
                      {column.name}
                    </th>
                    <td className="py-2 pr-3">{column.type}</td>
                    <td className="py-2">{column.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

export { DatasetCatalog };
