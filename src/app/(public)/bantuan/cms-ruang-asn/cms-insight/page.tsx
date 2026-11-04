import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { HelpSearch } from "../../_components/HelpSearch";

export const metadata: Metadata = {
  title: "CMS Insight — Pusat bantuan | Agoraya",
  description:
    "Panduan mengelola sumber, widget data, draf, dan publikasi Insight di CMS Ruang ASN.",
};

const sections = [
  {
    id: "sumber-validasi",
    title: "Sumber & validasi analisis",
    text: "Pilih sumber data yang dapat ditelusuri dan sesuai dengan klaim analisis. Periksa pemilik sumber, cakupan wilayah, periode, satuan, definisi indikator, serta tanggal pembaruan sebelum menyimpan.",
    steps: [
      "Cantumkan rujukan yang dapat diperiksa dan jelaskan batas cakupannya.",
      "Cocokkan angka, periode, dan satuan dengan sumber; jangan mencampur indikator yang definisinya berbeda.",
      "Tinjau kembali klaim dan konteks analisis sebelum mengajukan pemeriksaan.",
    ],
  },
  {
    id: "identitas-seo",
    title: "Identitas & SEO",
    text: "Gunakan judul yang jelas, ringkasan yang mewakili isi, dan slug yang mudah dikenali. Pastikan identitas Insight tidak menjanjikan kesimpulan yang tidak didukung sumber.",
    steps: [
      "Isi judul dan ringkasan dengan konteks wilayah, indikator, atau periode yang relevan.",
      "Periksa slug dan pastikan belum digunakan oleh Insight lain.",
      "Pratinjau judul dan deskripsi sebelum menyimpan atau menerbitkan.",
    ],
  },
  {
    id: "widget-data",
    title: "Widget data",
    text: "Tambahkan widget yang mendukung analisis. Periksa konfigurasi, filter, label, satuan, serta periode agar visualisasi terbaca dalam konteks yang benar.",
    steps: [
      "Pilih dataset atau indikator yang sesuai dengan klaim Insight.",
      "Atur cakupan wilayah dan periode yang hendak ditampilkan.",
      "Pastikan widget tampil dan nilainya sesuai sumber pada pratinjau.",
    ],
  },
  {
    id: "draf-pratinjau",
    title: "Draf & pratinjau",
    text: "Simpan draf saat analisis belum siap ditinjau. Gunakan pratinjau untuk memeriksa isi, sumber, widget, dan tampilan pada ukuran layar berbeda.",
    steps: [
      "Simpan perubahan melalui kontrol yang tersedia dan tunggu konfirmasi.",
      "Buka kembali draf untuk memastikan perubahan terakhir tersimpan.",
      "Tinjau tautan, sumber, visualisasi, dan tampilan sebelum mengajukan publikasi.",
    ],
  },
  {
    id: "penerbitan-publikasi",
    title: "Penerbitan & publikasi",
    text: "Ajukan Insight melalui alur pemeriksaan dan persetujuan yang berlaku. Publikasikan hanya setelah sumber, isi, dan tampilan telah diperiksa oleh petugas berwenang.",
    steps: [
      "Lengkapi materi dan tanggapi catatan pemeriksaan bila draf dikembalikan.",
      "Pastikan persetujuan dilakukan oleh akun dengan kewenangan yang sesuai.",
      "Setelah terbit, buka halaman publik dan periksa kembali konten serta widget.",
    ],
  },
];

const problems = [
  {
    title: "Sumber tidak valid",
    description:
      "Periksa akses sumber, cakupan, periode, definisi, dan tanggal pembaruan. Ganti atau lengkapi rujukan bila sumber tidak dapat diverifikasi.",
  },
  {
    title: "Widget kosong",
    description:
      "Pastikan dataset tersedia untuk filter aktif, samakan periode dan wilayah, lalu cek kembali konfigurasi widget pada pratinjau.",
  },
  {
    title: "Slug konflik",
    description:
      "Gunakan slug berbeda yang tetap menggambarkan isi. Pastikan perubahan identitas tidak memutus rujukan yang sudah dibagikan.",
  },
  {
    title: "Draf belum tersimpan",
    description:
      "Periksa pesan validasi dan status penyimpanan. Lengkapi kolom wajib, simpan kembali, lalu buka draf untuk memastikan perubahan terakhir tersedia.",
  },
  {
    title: "Validasi atau akses publikasi",
    description:
      "Tinjau catatan validasi dan pastikan akun memiliki peran serta cakupan instansi yang sesuai. Minta administrator memeriksa akses bila tugas resmi memerlukannya.",
  },
];

export default function CmsInsightPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Link href="/" aria-label="Agoraya — Beranda" className="w-28 shrink-0">
            <Image
              src="/logo/logo-light.svg"
              alt="Agoraya"
              width={189}
              height={42}
              priority
              className="h-auto w-full"
            />
          </Link>
          <span className="ml-3 text-base font-medium text-slate-600 dark:text-slate-300">Pusat bantuan</span>
          <div className="ml-auto hidden w-full max-w-sm md:block">
            <HelpSearch compact />
          </div>
          <Link
            href="/bantuan/cms-ruang-asn"
            className="shrink-0 text-sm font-medium text-blue-800 hover:underline"
          >
            Semua panduan CMS
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:py-12">
        <aside className="lg:sticky lg:top-8 lg:self-start">
          <nav
            aria-label="Daftar isi CMS Insight"
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4"
          >
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Dalam panduan ini
            </h2>
            <ul className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block rounded px-2.5 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#pemecahan-masalah"
                  className="block rounded px-2.5 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700"
                >
                  Pemecahan masalah
                </a>
              </li>
            </ul>
          </nav>
          <div className="mt-4 md:hidden">
            <HelpSearch />
          </div>
        </aside>

        <main className="min-w-0">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-600 dark:text-slate-300">
            <Link href="/bantuan" className="hover:text-blue-800 hover:underline">
              Pusat bantuan
            </Link>
            <span className="mx-2 text-slate-400">/</span>
            <Link
              href="/bantuan/cms-ruang-asn"
              className="hover:text-blue-800 hover:underline"
            >
              CMS · Ruang ASN
            </Link>
            <span className="mx-2 text-slate-400">/</span>
            <span aria-current="page" className="font-medium text-slate-800 dark:text-slate-100">
              CMS Insight
            </span>
          </nav>
          <header className="border-b border-slate-200 dark:border-slate-800 pb-7">
            <p className="text-sm font-semibold text-blue-800">Panduan CMS · Ruang ASN</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              CMS Insight
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
              Kelola sumber dan validasi analisis, identitas, widget data, draf,
              hingga penerbitan Insight dengan rujukan yang dapat diperiksa.
            </p>
          </header>

          <div className="divide-y divide-slate-200">
            {sections.map((section, index) => (
              <section
                id={section.id}
                key={section.id}
                className="scroll-mt-8 py-8"
                aria-labelledby={`${section.id}-title`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
                  Langkah {index + 1}
                </p>
                <h2
                  id={`${section.id}-title`}
                  className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl"
                >
                  {section.title}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                  {section.text}
                </p>
                <ol className="mt-4 grid max-w-3xl gap-3">
                  {section.steps.map((step, stepIndex) => (
                    <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700">
                      <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-800">
                        {stepIndex + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>

          <section
            id="pemecahan-masalah"
            className="scroll-mt-8 border-t border-slate-200 dark:border-slate-800 py-8"
            aria-labelledby="troubleshooting-title"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">
              Bantuan lanjutan
            </p>
            <h2 id="troubleshooting-title" className="mt-2 text-2xl font-semibold">
              Pemecahan masalah
            </h2>
            <dl className="mt-5 divide-y divide-slate-200 border-y border-slate-200 dark:border-slate-800">
              {problems.map((problem) => (
                <div key={problem.title} className="py-4">
                  <dt className="font-semibold text-slate-900">{problem.title}</dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {problem.description}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </main>
      </div>
    </div>
  );
}
