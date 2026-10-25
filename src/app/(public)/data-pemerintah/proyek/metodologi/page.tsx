import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Definisi & metodologi data proyek | Agoraya",
  description:
    "Definisi kolom, status, dan panduan membaca dataset proyek daerah Agoraya.",
};

export default function ProjectMethodologyPage() {
  return (
    <main className="container mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/data-pemerintah/proyek"
        className="text-primary text-sm font-medium underline underline-offset-4"
      >
        Kembali ke data proyek
      </Link>
      <header className="space-y-3">
        <p className="text-primary text-sm font-semibold">
          Dokumentasi dataset
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Definisi &amp; metodologi
        </h1>
        <p className="text-muted-foreground leading-7">
          Dataset progres proyek daerah pada rancangan ini adalah data
          ilustratif dan tidak terhubung dengan sumber data pemerintah secara
          langsung. Angka dan catatan di dalamnya tidak boleh ditafsirkan
          sebagai laporan resmi.
        </p>
      </header>

      <section
        id="definisi"
        aria-labelledby="definitions-title"
        className="scroll-mt-6 space-y-4"
      >
        <h2 id="definitions-title" className="text-xl font-semibold">
          Definisi kolom dan status
        </h2>
        <dl className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <dt className="font-medium">Selesai</dt>
          <dd className="text-muted-foreground">Pekerjaan tuntas.</dd>
          <dt className="font-medium">Berjalan</dt>
          <dd className="text-muted-foreground">
            Pekerjaan masih berlangsung.
          </dd>
          <dt className="font-medium">Tertunda</dt>
          <dd className="text-muted-foreground">Pelaksanaan terhambat.</dd>
          <dt className="font-medium">Target selesai</dt>
          <dd className="text-muted-foreground">
            Tanggal rencana penyelesaian; bukan tanggal penyelesaian aktual.
          </dd>
          <dt className="font-medium">Anggaran</dt>
          <dd className="text-muted-foreground">
            Nilai anggaran proyek dalam rupiah (IDR).
          </dd>
          <dt className="font-medium">Progres fisik</dt>
          <dd className="text-muted-foreground">
            Persentase pekerjaan fisik yang dicatat dalam dataset ilustratif.
          </dd>
        </dl>
      </section>

      <section
        id="panduan"
        aria-labelledby="reading-guide-title"
        className="scroll-mt-6 space-y-4"
      >
        <h2 id="reading-guide-title" className="text-xl font-semibold">
          Panduan membaca data
        </h2>
        <ul className="text-muted-foreground list-disc space-y-2 pl-5 leading-7">
          <li>
            Periksa definisi indikator, satuan, wilayah, dan periode sebelum
            membandingkan nilai.
          </li>
          <li>
            Filter wilayah berlaku untuk indikator tahunan; jangan menganggap
            filter itu mengubah cakupan daftar proyek.
          </li>
          <li>
            Data proyek, progres pekerjaan, dan penyerapan anggaran adalah
            ukuran berbeda dan tidak dapat saling menggantikan.
          </li>
          <li>
            Seluruh rekaman proyek yang tersedia merupakan simulasi untuk
            keperluan rancangan dan analisis alur.
          </li>
        </ul>
      </section>
    </main>
  );
}
