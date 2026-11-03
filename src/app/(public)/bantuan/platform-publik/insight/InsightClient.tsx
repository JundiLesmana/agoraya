"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  Database,
  FileText,
  Home,
  Lightbulb,
  Megaphone,
  Search,
  ArrowRight,
} from "lucide-react";
import { TableOfContents } from "./_components/TableOfContents";
import { MobileDrawer } from "./_components/MobileDrawer";

type Step = {
  n: number;
  text: string;
};

type CaraKerjaItem = {
  id: string;
  title: string;
  siapkan: string;
  steps: Step[];
  hasil: string;
};

type MasalahItem = {
  id: string;
  title: string;
  check: string;
  contact: string;
};

const CARA_KERJA: CaraKerjaItem[] = [
  {
    id: "filter-perbandingan",
    title: "Filter perbandingan",
    siapkan: "Wilayah perbandingan, fokus daerah, periode, dan topik analisis.",
    steps: [
      {
        n: 1,
        text: "Atur wilayah perbandingan, pilih fokus daerah, lalu tentukan periode dan topik yang tersedia pada Insight.",
      },
      {
        n: 2,
        text: "Pilih Terapkan filter. Periksa ringkasan cakupan untuk memastikan daerah fokus berada pada kelompok pembanding yang dimaksud.",
      },
      {
        n: 3,
        text: "Baca catatan cakupan setiap grafik. Jika hasil terlalu sempit, reset filter dan perluas pilihan secara bertahap.",
      },
    ],
    hasil: "Grafik dibaca dengan parameter analisis yang jelas dan dapat ditelusuri.",
  },
  {
    id: "ketepatan-layanan",
    title: "Ketepatan layanan",
    siapkan: "Jenis layanan, definisi tepat waktu, dan periode yang sama.",
    steps: [
      {
        n: 1,
        text: "Baca definisi ketepatan layanan pada sumber/metodologi. Periksa apa yang menjadi pembilang dan penyebut persentasenya.",
      },
      {
        n: 2,
        text: "Bandingkan layanan sejenis pada periode yang sama. Perhatikan volume pengajuan; persentase tinggi tidak otomatis berarti jumlah kasus lebih banyak.",
      },
      {
        n: 3,
        text: "Bedakan rata-rata sederhana dengan rata-rata berbobot jika dijelaskan sumber. Hindari menyebut peringkat kualitas seluruh layanan dari satu indikator.",
      },
    ],
    hasil: "Perbandingan mengacu pada indikator ketepatan, bukan penilaian menyeluruh atas instansi.",
  },
  {
    id: "tren-anggaran",
    title: "Tren anggaran",
    siapkan: "Satuan rupiah dan seri pagu/realisasi yang akan dibaca.",
    steps: [
      {
        n: 1,
        text: "Baca legenda untuk membedakan anggaran dengan realisasi. Cocokkan tahun, cakupan wilayah, dan satuan grafik dengan tabel bila tersedia.",
      },
      {
        n: 2,
        text: "Untuk perubahan antarperiode, bandingkan seri yang sama dan dasar waktu yang setara. Jangan membandingkan realisasi sebagian tahun dengan setahun penuh tanpa catatan.",
      },
      {
        n: 3,
        text: "Periksa apakah nilai bersifat nominal. Jelaskan bahwa kenaikan belanja belum otomatis menunjukkan kenaikan daya beli atau mutu layanan.",
      },
    ],
    hasil: "Arah tren dipahami dengan dasar perbandingan dan batas interpretasi yang benar.",
  },
  {
    id: "indikator-kesejahteraan",
    title: "Indikator kesejahteraan",
    siapkan: "Definisi, satuan, skala, dan arah perbaikan setiap indikator.",
    steps: [
      {
        n: 1,
        text: "Pilih indikator yang ingin dipahami dan baca periode rujukannya. Perhatikan apakah angka berupa persen, tahun, jumlah orang, atau indeks.",
      },
      {
        n: 2,
        text: "Bandingkan tahun dalam indikator yang sama. Penurunan kemiskinan dan kenaikan harapan hidup memiliki arah perbaikan berbeda.",
      },
      {
        n: 3,
        text: "Jangan membandingkan panjang batang antarindikator dengan skala berbeda. Baca konteks wilayah serta keterbatasan data sebelum menyimpulkan perubahan.",
      },
    ],
    hasil: "Makna perubahan tidak tertukar dengan besarnya visualisasi.",
  },
  {
    id: "sumber-metodologi",
    title: "Sumber & metodologi",
    siapkan: "Catatan rujukan dari grafik atau artikel yang dibaca.",
    steps: [
      {
        n: 1,
        text: "Buka sumber dan metodologi. Periksa asal data, versi bila tersedia, tanggal pembaruan, cakupan, dan cara hitung.",
      },
      {
        n: 2,
        text: "Bedakan persen dari poin persentase: contoh ilustratif 40% ke 45% naik 5 poin persentase, atau 12,5% relatif terhadap nilai awal.",
      },
      {
        n: 3,
        text: "Telusuri dataset terkait di Data Pemerintah jika tersedia. Saat mengutip, sertakan periode, satuan, sumber, dan batas analisis; jangan menyatakan hubungan sebab-akibat tanpa dasar.",
      },
    ],
    hasil: "Kesimpulan dapat ditelusuri dan tidak melampaui bukti yang disajikan.",
  },
];

const MASALAH: MasalahItem[] = [
  {
    id: "grafik-kosong",
    title: "Grafik kosong",
    check:
      "Periksa kombinasi wilayah, fokus daerah, periode, dan topik. Terapkan ulang atau reset lalu perluas filter. Cek apakah sumber memang mencakup parameter tersebut.",
    contact:
      "sumber menyatakan data tersedia namun grafik tetap kosong; sertakan judul grafik, parameter, dan waktu kejadian.",
  },
  {
    id: "perbandingan-tidak-setara",
    title: "Perbandingan tidak setara",
    check:
      "Samakan definisi layanan/indikator, unit, periode, serta cakupan wilayah. Jika metodologi berubah, jangan gabungkan seri tanpa penjelasan. Batasi kesimpulan pada bagian yang sebanding.",
    contact:
      "definisi atau dasar perbandingan tidak dijelaskan; mintakan klarifikasi dengan judul analisis dan sumber yang terkait.",
  },
  {
    id: "angka-beda-data-pemerintah",
    title: "Angka beda dari Data Pemerintah",
    check:
      "Bandingkan sumber, versi, tanggal pembaruan, wilayah, dan cara agregasi. Insight bisa memakai periode atau olahan yang berbeda; cocokkan satuan serta pembulatan.",
    contact:
      "angka berbeda meskipun dasar dan metode sama; kirim kedua rujukan serta filter/periode yang digunakan.",
  },
  {
    id: "persen-vs-poin-persentase",
    title: "Persen vs poin persentase",
    check:
      "Hitung selisih dua persentase sebagai poin persentase. Untuk perubahan relatif, bagi selisih dengan nilai awal lalu kali 100. Bila nilai awal nol, jangan memakai rumus relatif biasa.",
    contact:
      "label atau uraian grafik tidak sesuai cara hitung; sertakan grafik dan perhitungan yang ingin diklarifikasi.",
  },
];

const sidebarItems = [
  { title: "Data Pemerintah", icon: Database, href: "/bantuan/platform-publik/data-pemerintah" },
  { title: "Layanan Publik", icon: FileText, href: "/bantuan/platform-publik/layanan-publik" },
  { title: "Lapor Warga", icon: Megaphone, href: "/bantuan/platform-publik/lapor-warga" },
  { title: "Insight", icon: Lightbulb, href: "/bantuan/platform-publik/insight" },
];

function SearchBox({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex h-[30px] items-center rounded-md border border-slate-200 bg-white ${
        compact ? "w-[245px]" : "w-full"
      }`}
    >
      <Search className="ml-2 h-[11px] w-[11px] shrink-0 text-blue-600" aria-hidden="true" />
      <input
        aria-label="Cari panduan"
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-[8px] text-slate-700 outline-none placeholder:text-slate-400"
        placeholder="Cari panduan, topik, atau kendala..."
      />
      <button className="h-full px-2 text-[7px] text-slate-500 hover:text-blue-700" type="button">
        Cari
      </button>
    </div>
  );
}

function StepBadge({ n }: { n: number }) {
  return (
    <span
      className="inline-flex items-center justify-center h-[18px] min-w-[18px] rounded-full bg-blue-50 px-1 text-[10px] font-semibold text-blue-700 shrink-0"
    >
      {n}
    </span>
  );
}

export default function InsightArticlePage() {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="fixed inset-x-0 top-0 z-30 flex h-[47px] items-center border-b border-slate-200 bg-white px-4">
        <Link
          href="/"
          aria-label="Agoraya — Beranda"
          className="flex h-[24px] w-[94px] shrink-0 items-center border-r border-slate-200 pr-2"
        >
          <Image
            src="/logo/logo-light.svg"
            alt="Agoraya"
            width={189}
            height={42}
            priority
            className="h-auto w-full"
          />
        </Link>
        <span className="ml-3 text-[8px] text-slate-600">Pusat bantuan</span>
        <div className="absolute left-[calc(50%+40px)] hidden -translate-x-1/2 md:block">
          <SearchBox compact />
        </div>
        <Link
          href="/"
          className="ml-auto inline-flex items-center gap-1 text-[8px] font-medium text-blue-700 hover:underline"
        >
          Kembali ke platform <ArrowUpRight className="h-[9px] w-[9px]" />
        </Link>
        <button
          className="ml-4 hidden md:flex items-center justify-center h-[47px] w-[47px] rounded-full text-slate-600 hover:bg-slate-100"
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Buka menu navigasi"
        >
          <span className="relative inline-block h-[3px] w-[20px] bg-slate-800">
            <span className="absolute left-0 top-[-7px] h-[3px] w-[20px] bg-slate-800" />
            <span className="absolute left-0 top-[7px] h-[3px] w-[20px] bg-slate-800" />
          </span>
        </button>
      </header>

      <aside
        className="fixed bottom-0 left-0 top-[47px] hidden w-36 border-r border-slate-200 bg-slate-50 md:block"
        aria-label="Navigasi bantuan"
      >
        <nav className="px-[10px] pt-[14px]">
          <p className="mb-[9px] text-[6px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-[20px] items-center gap-[6px] rounded bg-blue-100 px-[6px] text-[8px] font-medium text-blue-800"
          >
            <Home className="h-[9px] w-[9px]" aria-hidden="true" /> Beranda
          </Link>

          <p className="mb-[5px] mt-[13px] text-[6px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Platform publik
          </p>
          <div className="space-y-[2px]">
            {sidebarItems.map(({ title, icon: Icon, href }) => {
              const isActivePillar = title === "Insight";
              return (
                <div key={title} className="border border-slate-200 rounded-md overflow-hidden">
                  <Link
                    href={href}
                    className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
                  >
                    <Icon className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
                    <span className="flex-1">{title}</span>
                    <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
                  </Link>
                  {isActivePillar && (
                    <div className="border-t border-slate-100 bg-white/50">
                      <div className="space-y-0">
                        <p className="mx-[6px] my-[1px] text-[6px] font-semibold uppercase tracking-tighter text-slate-500">
                          Cara kerja
                        </p>
                        <div className="space-y-[1px]">
                          {CARA_KERJA.map((item, i) => (
                            <Link
                              key={item.id}
                              href={`#${item.id}`}
                              className={`block pl-[20px] pr-[6px] py-[2px] rounded text-[7px] ${
                                i === 0
                                  ? "bg-[#eef4fb] text-blue-700 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(item.id);
                                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                        <p className="mx-[6px] my-[3px] text-[6px] font-semibold uppercase tracking-tighter text-slate-500">
                          Pemecahan masalah
                        </p>
                        <div className="space-y-[1px]">
                          {MASALAH.map((item, i) => (
                            <Link
                              key={item.id}
                              href={`#${item.id}`}
                              className={`block pl-[20px] pr-[6px] py-[2px] rounded text-[7px] ${
                                i === 0
                                  ? "bg-[#eef4fb] text-blue-700 font-semibold"
                                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                              }`}
                              onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(item.id);
                                el?.scrollIntoView({ behavior: "smooth", block: "start" });
                              }}
                            >
                              {item.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="mb-[5px] mt-[10px] text-[6px] font-semibold uppercase tracking-[0.04em] text-slate-500">
            CMS · Ruang ASN
          </p>
          <div className="space-y-[2px]">
            <Link
              href="/bantuan/cms-insight"
              className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
            >
              <FileText className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
              <span className="flex-1">CMS Insight</span>
              <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-[12px] space-y-[7px] border-t border-slate-200 pt-[9px]">
            <Link href="#akun-privasi" className="block text-[7px] text-slate-500 hover:text-blue-700">
              Akun & perlindungan privasi
            </Link>
            <Link href="#bantuan-lanjutan" className="block text-[7px] text-slate-500 hover:text-blue-700">
              Menghubungi pengelola
            </Link>
          </div>
        </nav>
      </aside>

      <MobileDrawer isOpen={mobileDrawerOpen} onClose={() => setMobileDrawerOpen(false)} />

      <div className="mx-auto max-w-[1120px] px-4 pb-8 pt-[70px] md:ml-36 md:px-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]">
          <main className="w-full" aria-label="Konten artikel">
            <a href="#main-content" className="sr-only focus:not-sr-only">
              Lompat ke konten utama
            </a>

            <nav aria-label="Breadcrumb" className="mb-[16px] text-[10px] text-slate-500">
              <Link href="/bantuan" className="hover:text-blue-700 hover:underline">
                Pusat bantuan
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <Link href="/bantuan/platform-publik" className="hover:text-blue-700 hover:underline">
                Platform publik
              </Link>
              <span className="px-1 text-slate-400">/</span>
              <span className="font-medium text-slate-700">Insight</span>
            </nav>

            <div className="flex flex-col gap-[20px]" id="main-content">
              <div className="flex flex-col gap-[6px]">
                <span className="inline-flex items-center gap-[4px] rounded-md bg-[#eef4fb] px-[10px] py-[4px] text-[10px] font-semibold tracking-[0.12em] text-blue-700 uppercase">
                  PANDUAN WARGA
                </span>
                <h1 className="mt-[4px] text-[42px] font-bold leading-[0.96] tracking-[-0.04em] text-slate-800">
                  Insight
                </h1>
                <p className="mt-[10px] max-w-[700px] text-[15px] leading-[1.7] text-slate-600">
                  Baca perbandingan layanan, tren anggaran, dan indikator kesejahteraan tanpa kehilangan konteks sumber serta batas analisisnya.
                </p>
                <p className="mt-[8px] text-[12px] leading-[1.5] text-slate-500">
                  5 topik cara kerja · 4 pemecahan masalah
                </p>
              </div>

              <section id="sebelum-mulai" className="rounded-md border-l-2 border-[#2563eb] bg-[#eef4fb] px-[12px] py-[10px]">
                <div className="flex gap-[8px]">
                  <div className="flex shrink-0 items-center text-blue-600" aria-hidden="true">
                    <span role="img" aria-label="Info">ⓘ</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-800">Sebelum mulai</p>
                    <p className="mt-[2px] text-[9px] leading-[1.55] text-slate-600">
                      Tentukan pertanyaan dan wilayah pembanding. Pastikan periode, definisi indikator, serta sumber yang dibandingkan setara. Seluruh angka contoh dalam rancangan bukan data resmi aktual.
                    </p>
                  </div>
                </div>
              </section>

              <section id="cara-kerja" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[2px]">
                  <span className="text-[14px]" aria-hidden="true">
                  </span>
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                    Cara kerja
                  </h2>
                </div>
                <p className="mb-[16px] text-[10px] leading-[1.5] text-slate-600">
                  Ikuti langkah-langkah bernomor untuk setiap fitur. Setiap tahap dilengkapi dengan konteks siapan dan hasil yang dapat diharapkan.
                </p>

                {CARA_KERJA.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="scroll-mt-[90px] mb-[20px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-[3px] text-[9px] text-slate-500">
                      Siapkan: {item.siapkan}
                    </p>
                    <ol className="mt-[8px] list-none space-y-[5px] pl-0">
                      {item.steps.map((step) => (
                        <li key={step.n} className="flex gap-[8px] text-[9px] leading-[1.5] text-slate-600">
                          <StepBadge n={step.n} />
                          <span>{step.text}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="mt-[8px] inline-flex items-center gap-[2px] text-[9px] font-semibold text-blue-600">
                      Hasil <span className="text-blue-600">→</span> {item.hasil}
                    </p>
                  </article>
                ))}
              </section>

              <section className="rounded-md border-l-2 border-[#2563eb] bg-[#eef4fb] px-[12px] py-[10px]">
                <div className="flex gap-[8px]">
                  <div className="flex shrink-0 items-center text-blue-600" aria-hidden="true">
                    <span role="img" aria-label="Info">ⓘ</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold text-slate-800">Penting untuk dipahami</p>
                    <p className="mt-[2px] text-[9px] leading-[1.55] text-slate-600">
                      Korelasi bukan kausalitas. Perubahan yang bergerak bersamaan belum membuktikan dampak suatu kebijakan. Nilai anggaran nominal belum disesuaikan dengan inflasi kecuali sumber menyatakan sebaliknya.
                    </p>
                  </div>
                </div>
              </section>

              <section id="pemecahan-masalah" className="mt-[8px]">
                <div className="mb-[12px] flex items-center gap-[2px]">
                  <span className="text-[14px]" aria-hidden="true">
                  </span>
                  <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                    Pemecahan masalah
                  </h2>
                </div>
                <p className="mb-[16px] text-[10px] leading-[1.5] text-slate-600">
                  Mulai dari gejala yang Anda temui, periksa penyebabnya, lalu eskalasi bila kendala tetap terjadi.
                </p>

                {MASALAH.map((item) => (
                  <article
                    key={item.id}
                    id={item.id}
                    className="scroll-mt-[90px] mb-[20px] border-b border-slate-100 pb-[16px] last:mb-0 last:border-0 last:pb-0"
                  >
                    <h3 className="text-[11px] font-semibold text-slate-800">
                      {item.title}
                    </h3>
                    <p className="mt-[4px] text-[10px] leading-[1.55] text-slate-600">
                      <span className="font-semibold text-slate-800">Periksa &amp; atasi.</span>{" "}
                      {item.check}
                    </p>
                    <p className="mt-[6px] text-[10px] leading-[1.55] text-slate-600">
                      <span className="font-semibold text-slate-800">Hubungi pengelola jika:</span>{" "}
                      {item.contact}
                    </p>
                  </article>
                ))}
              </section>

              <section id="bantuan-lanjutan" className="mt-[8px] rounded-md border border-slate-200 bg-white px-[16px] py-[18px] shadow-sm">
                <h3 className="text-[11px] font-semibold text-slate-800">
                  Masih membutuhkan bantuan?
                </h3>
                <p className="mt-[4px] text-[10px] leading-[1.6] text-slate-600">
                  Gunakan kanal bantuan yang tersedia di platform atau instansi. Sertakan ID
                  laporan, pengajuan, dataset, atau artikel yang terkait; waktu kejadian,
                  filter dan periode; serta tangkapan layar yang sudah disamarkan.
                </p>
                <p className="mt-[4px] text-[10px] leading-[1.6] text-slate-600">
                  Jangan kirim kata sandi, OTP, NIK penuh, atau dokumen pribadi melalui
                  saluran publik.
                </p>
              </section>

              <div className="mt-[20px]">
                <Link
                  href="/bantuan/cms-insight"
                  className="inline-flex items-center gap-[2px] text-[10px] font-medium text-blue-700 hover:underline"
                >
                  Panduan terkait: CMS Insight · Data Pemerintah{" "}
                  <ArrowRight className="h-[10px] w-[10px]" />
                </Link>
              </div>

              <nav
                aria-label="Navigasi artikel sebelumnya dan berikutnya"
                className="mt-[24px] grid grid-cols-2 gap-[12px]"
              >
                <Link
                  href="/bantuan/platform-publik/lapor-warga"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 bg-white px-[10px] py-[12px] transition-colors hover:bg-slate-50"
                >
                  <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-500 group-hover:text-blue-700">
                    Sebelumnya
                  </span>
                  <span className="text-[10px] font-semibold text-slate-800 group-hover:text-blue-700">
                    ← Lapor Warga
                  </span>
                </Link>
                <Link
                  href="/bantuan/cms-data-pemerintah"
                  className="group flex flex-col gap-[2px] rounded-md border border-slate-200 bg-white px-[10px] py-[12px] transition-colors hover:bg-slate-50"
                >
                  <span className="text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-500 group-hover:text-blue-700">
                    Berikutnya
                  </span>
                  <span className="flex items-center gap-[2px] text-[10px] font-semibold text-slate-800 group-hover:text-blue-700">
                    CMS Data Pemerintah <ArrowRight className="h-[10px] w-[10px]" />
                    <span className="rounded-md bg-blue-50 px-[6px] py-[0.5] text-[7px] font-semibold text-blue-700">
                      CMS
                    </span>
                  </span>
                </Link>
              </nav>

              <footer className="mt-[30px] border-t border-slate-200 pt-[12px]">
                <p className="text-[8px] leading-[1.5] text-slate-500">
                  Panduan mengikuti rancangan platform dan ketersediaan fitur/hak akses instansi, bukan layanan operasional. Ini adalah tampilan dokumentasi statis; navigasi dan pencarian tidak diaktifkan.
                </p>
                <div className="mt-[10px] flex items-center justify-between text-[8px] text-slate-600">
                  <span className="font-semibold">
                    Agoraya · Pusat bantuan / Data Publik, Untuk Semua
                  </span>
                  <span>Bahasa Indonesia</span>
                </div>
              </footer>
            </div>
          </main>

          <aside className="hidden xl:block">
            <TableOfContents />
          </aside>
        </div>
      </div>
    </div>
  );
}
