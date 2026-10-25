"use client";

import { useState } from "react";
import Link from "next/link";
import { Database, Download, FileJson2, FileText, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

const METADATA_FIELDS = [
  ["id", "Teks", "Identitas unik proyek."],
  ["nama_proyek", "Teks", "Nama pekerjaan pembangunan."],
  ["instansi", "Teks", "Instansi pelaksana proyek."],
  ["lokasi", "Teks", "Kabupaten/kota lokasi proyek."],
  ["sektor", "Teks", "Kelompok sektor proyek."],
  ["anggaran", "Angka (IDR)", "Nilai anggaran dalam rupiah."],
  ["progres_fisik", "Angka (%)", "Persentase progres pekerjaan fisik."],
  ["target_selesai", "Teks (tanggal)", "Tanggal target, bukan tanggal aktual."],
  ["status", "Kategori", "Selesai, Berjalan, atau Tertunda."],
] as const;

export function DatasetInformation() {
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);

  return (
    <>
      <section
        aria-labelledby="dataset-card-title"
        className="border-border bg-card flex flex-col gap-5 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6"
      >
        <div className="flex min-w-0 items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
            <Database className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2
              id="dataset-card-title"
              className="text-card-foreground font-semibold"
            >
              Progres proyek daerah
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              240 proyek · 27 kabupaten/kota · CSV/JSON
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Sumber: simulasi pelaksanaan pembangunan - 30 Sep 2025
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={() => setIsMetadataOpen(true)}
            aria-haspopup="dialog"
          >
            <FileText className="size-4" aria-hidden="true" />
            Metadata
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/projects?format=csv">
              <Download className="size-4" aria-hidden="true" />
              Unduh CSV
            </a>
          </Button>
        </div>
      </section>

      <section
        aria-labelledby="data-disclaimer-title"
        className="rounded-xl border border-amber-300 bg-amber-100 p-5 text-amber-950 sm:p-6"
      >
        <div className="flex items-start gap-3">
          <Info
            className="mt-0.5 size-5 shrink-0 text-amber-900"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 id="data-disclaimer-title" className="font-semibold">
              Data terbuka, konteks tetap penting.
            </h2>
            <p className="mt-3 text-sm leading-6">
              Rancangan ini menggunakan data ilustratif tanpa koneksi data
              langsung. Filter wilayah berlaku untuk indikator tahunan. Periksa
              definisi, satuan, dan periode sebelum membandingkan data proyek,
              progres pekerjaan, dan penyerapan anggaran.
            </p>
            <p className="mt-3 text-sm leading-6">
              Selesai: pekerjaan tuntas. Berjalan: pekerjaan masih berlangsung.
              Tertunda: pelaksanaan terhambat. Target selesai adalah rencana,
              bukan tanggal penyelesaian aktual.
            </p>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
              <Link
                className="underline decoration-amber-700 underline-offset-4 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-100 focus-visible:outline-none"
                href="/data-pemerintah/proyek/metodologi#definisi"
              >
                Definisi &amp; metodologi →
              </Link>
              <Link
                className="underline decoration-amber-700 underline-offset-4 hover:text-amber-800 focus-visible:ring-2 focus-visible:ring-amber-900 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-100 focus-visible:outline-none"
                href="/data-pemerintah/proyek/metodologi#panduan"
              >
                Panduan membaca data →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Modal
        open={isMetadataOpen}
        onOpenChange={setIsMetadataOpen}
        title="Metadata — Progres proyek daerah"
        description="Struktur kolom dalam ekspor dataset proyek. Data yang tersedia saat ini bersifat ilustratif."
        contentClassName="max-h-[85vh] overflow-y-auto"
        footer={
          <>
            <Button variant="outline" asChild>
              <a href="/datasets/progres-proyek-metadata.json" download>
                <FileJson2 className="size-4" aria-hidden="true" />
                Unduh metadata JSON
              </a>
            </Button>
            <Button asChild>
              <a href="/api/projects?format=json&download=true">
                <Download className="size-4" aria-hidden="true" />
                Unduh data JSON
              </a>
            </Button>
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[30rem] text-left text-xs">
            <thead className="text-muted-foreground border-b">
              <tr>
                <th scope="col" className="px-2 py-2 font-semibold">
                  Kolom
                </th>
                <th scope="col" className="px-2 py-2 font-semibold">
                  Tipe
                </th>
                <th scope="col" className="px-2 py-2 font-semibold">
                  Deskripsi
                </th>
              </tr>
            </thead>
            <tbody>
              {METADATA_FIELDS.map(([name, type, description]) => (
                <tr key={name} className="border-b last:border-0">
                  <th scope="row" className="px-2 py-2 font-mono font-medium">
                    {name}
                  </th>
                  <td className="px-2 py-2">{type}</td>
                  <td className="px-2 py-2">{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>
    </>
  );
}
