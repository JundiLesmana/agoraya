import { HelpSearch } from "@/app/(public)/bantuan/_components/HelpSearch";
import { HelpThemeToggle } from "@/app/(public)/bantuan/_components/HelpThemeToggle";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  Database,
  FileText,
  Home,
  Info,
  Lightbulb,
  Megaphone,

  UsersRound,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pusat bantuan | Agoraya",
  description: "Pusat bantuan Agoraya: panduan platform publik dan CMS Ruang ASN.",
};

type GuidePath = {
  how: string[];
  trouble: string[];
};

type Pillar = {
  title: string;
  desc: string;
  icon: React.ElementType;
  publicLink: string;
  cmsLink: string;
  public: GuidePath;
  cms: GuidePath;
};

const pillars: Pillar[] = [
  {
    title: "Data Pemerintah",
    desc: "Baca anggaran, pantau proyek, dan telusuri data daerah.",
    icon: Database,
    publicLink: "/bantuan/platform-publik/data-pemerintah",
    cmsLink: "/bantuan/cms-ruang-asn/cms-data-pemerintah",
    public: {
      how: [
        "Ringkasan & filter",
        "Anggaran APBD",
        "Proyek pembangunan",
        "Statistik daerah",
        "Dataset & unduhan",
      ],
      trouble: ["Data kosong", "Angka berbeda", "Unduhan gagal"],
    },
    cms: {
      how: [
        "Dataset & Metadata",
        "Anggaran APBD",
        "Proyek Pembangunan",
        "Statistik Daerah",
        "Verifikasi & publikasi",
      ],
      trouble: [
        "Impor gagal",
        "Metadata belum lengkap",
        "Angka tidak konsisten",
        "Belum tampil publik",
        "Akses ditolak",
      ],
    },
  },
  {
    title: "Layanan Publik",
    desc: "Ajukan layanan dan pahami setiap pembaruan statusnya.",
    icon: FileText,
    publicLink: "/bantuan/platform-publik/layanan-publik",
    cmsLink: "/bantuan/cms-ruang-asn/cms-layanan-publik",
    public: {
      how: [
        "Ruang warga, instansi & statistik",
        "Pengajuan layanan",
        "Pelacakan & dokumen",
        "Hasil & peninjauan",
      ],
      trouble: [
        "Nomor tidak ditemukan",
        "Dokumen ditolak",
        "Status belum berubah",
        "Hasil perlu ditinjau",
      ],
    },
    cms: {
      how: [
        "Antrean Pengajuan",
        "Standar & Formulir Layanan",
        "Penanganan Pengaduan",
        "Hasil & riwayat",
      ],
      trouble: [
        "Antrean kosong",
        "Gagal asignasi",
        "SLA terlewati",
        "Status gagal berubah",
        "Dokumen tidak lengkap",
      ],
    },
  },
  {
    title: "Lapor Warga",
    desc: "Sampaikan fakta, lindungi identitas, dan pantau penanganan.",
    icon: Megaphone,
    publicLink: "/bantuan/platform-publik/lapor-warga",
    cmsLink: "/bantuan/cms-ruang-asn/cms-lapor-warga",
    public: {
      how: [
        "Kategori & kronologi",
        "Lokasi & bukti",
        "Pelindungan identitas",
        "Kirim & lacak",
        "Konfirmasi hasil",
      ],
      trouble: [
        "Lokasi salah",
        "Bukti gagal diunggah",
        "Kode hilang",
        "Perlu kelengkapan / ditolak",
        "Hasil belum sesuai",
      ],
    },
    cms: {
      how: [
        "Antrean Laporan",
        "Verifikasi & Moderasi",
        "Disposisi ke OPD",
        "Tindak Lanjut & Penutupan",
      ],
      trouble: [
        "Salah OPD",
        "Bukti sensitif",
        "Informasi kurang",
        "Disposisi gagal",
        "Laporan belum bisa ditutup",
      ],
    },
  },
  {
    title: "Insight",
    desc: "Bandingkan indikator dengan konteks dan metodologi yang tepat.",
    icon: Lightbulb,
    publicLink: "/bantuan/platform-publik/insight",
    cmsLink: "/bantuan/cms-ruang-asn",
    public: {
      how: [
        "Filter perbandingan",
        "Ketepatan layanan",
        "Tren anggaran",
        "Kesejahteraan",
        "Sumber & metodologi",
      ],
      trouble: [
        "Grafik kosong",
        "Perbandingan tidak setara",
        "Angka berbeda",
        "Persen vs poin persentase",
      ],
    },
    cms: {
      how: [
        "Sumber & Validasi Analisis",
        "Identitas & SEO",
        "Widget data",
        "Draf & pratinjau",
        "Penerbitan & publikasi",
      ],
      trouble: [
        "Sumber tidak valid",
        "Widget kosong",
        "Slug konflik",
        "Draf belum tersimpan",
        "Validasi / akses publikasi",
      ],
    },
  },
];

const sidebarItems = [
  { title: "Data Pemerintah", icon: Database, href: "/bantuan/platform-publik/data-pemerintah" },
  { title: "Layanan Publik", icon: FileText, href: "/bantuan/platform-publik/layanan-publik" },
  { title: "Lapor Warga", icon: Megaphone, href: "/bantuan/platform-publik/lapor-warga" },
  { title: "Insight", icon: ChartNoAxesColumnIncreasing, href: "/bantuan/platform-publik/insight" },
];

function TopicList({ items }: { items: string[] }) {
  return <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{items.join(" · ")}</p>;
}

function SearchBox({ compact = false }: { compact?: boolean }) {
  return <HelpSearch compact={compact} />;
}

export default function BantuanPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 dark:bg-slate-950 dark:text-slate-100">
      <header className="fixed inset-x-0 top-0 z-30 flex h-20 items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 sm:px-6 dark:border-slate-800 dark:bg-slate-900">
        <Link
          href="/"
          aria-label="Agoraya — Beranda"
          className="flex h-10 w-[180px] shrink-0 items-center border-r border-slate-200 dark:border-slate-800 pr-3"
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
        <span className="ml-3 text-base font-medium text-slate-600 dark:text-slate-300">Pusat bantuan</span>
        <div className="absolute left-[calc(50%+48px)] hidden -translate-x-1/2 md:block">
          <SearchBox compact />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <HelpThemeToggle />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:underline"
          >
            Kembali ke platform <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-20 hidden w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 md:block">
        <nav aria-label="Navigasi bantuan" className="px-4 pt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-9 items-center gap-2 rounded-md bg-blue-100 px-2.5 text-sm font-medium text-blue-800"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            Beranda
          </Link>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Platform publik
          </p>
          <div className="space-y-1">
            {sidebarItems.map(({ title, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Icon className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <span className="flex-1">{title}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <p className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            CMS · Ruang ASN
          </p>
          <div className="space-y-1">
            {pillars.map(({ title, cmsLink }) => (
              <Link
                key={title}
                href={cmsLink}
                className="flex h-9 items-center gap-2 rounded-md px-2.5 text-sm text-slate-700 hover:bg-slate-100"
              >
                <FileText className="h-4 w-4 text-blue-700" aria-hidden="true" />
                <span className="flex-1">CMS {title}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <div className="mt-5 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-4">
            <Link href="#akun-privasi" className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-700">
              Akun & perlindungan privasi
            </Link>
            <Link href="#bantuan-lanjutan" className="block text-sm text-slate-600 dark:text-slate-300 hover:text-blue-700">
              Menghubungi pengelola
            </Link>
          </div>
        </nav>
      </aside>

      <main className="mx-auto max-w-6xl px-4 pb-8 pt-28 sm:px-6 md:ml-64 md:px-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Pusat bantuan <span className="px-1.5">/</span>{" "}
          <span className="font-medium text-slate-700">Beranda</span>
        </nav>

        <div className="flex flex-col gap-8">
          <section className="mb-2 rounded-lg bg-[#eaf4fc] dark:bg-slate-900 px-6 py-8 sm:px-8">
            <p className="text-xs font-bold tracking-widest text-blue-700">
              DOKUMENTASI AGORAYA
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-slate-800 dark:text-slate-100 sm:text-4xl">
              Langkah jelas untuk setiap kebutuhan.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300">
              Pelajari cara menggunakan empat pilar Agoraya, mengelola informasi di Ruang
              ASN, dan mengatasi kendala dengan panduan yang terarah.
            </p>
            <div className="mt-5">
              <SearchBox />
            </div>
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
              Contoh topik: membaca APBD · melacak pengajuan · identitas pelapor ·
              publikasi insight
            </p>
          </section>

          <section className="mb-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
              Mulai dari peran Anda
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <article className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-5">
                <UsersRound className="h-6 w-6 text-blue-600" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">Saya warga</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Temukan data, ajukan layanan, sampaikan laporan, dan pahami insight publik.
                </p>
                <Link
                  href="/bantuan"
                  className="mt-4 inline-flex items-center text-base font-medium text-blue-700 hover:underline"
                >
                  Jelajahi panduan platform publik <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
              <article className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-5">
                <Building2 className="h-6 w-6 text-blue-600" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                  Saya ASN / pengelola
                </h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Kelola data, proses antrean, tangani laporan, dan siapkan publikasi sesuai
                  kewenangan.
                </p>
                <Link
                  href="/bantuan"
                  className="mt-4 inline-flex items-center text-base font-medium text-blue-700 hover:underline"
                >
                  Jelajahi panduan CMS · Ruang ASN <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </article>
            </div>
          </section>

          <section className="mb-2">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
                Temukan panduan menurut pilar
              </h2>
              <span className="text-sm text-slate-500 dark:text-slate-400">4 pilar · 8 kategori panduan</span>
            </div>
            <p className="mb-4 mt-2 text-base text-slate-600 dark:text-slate-300">
              Setiap kategori memuat cara kerja dan pemecahan masalah. Pilih jalur publik
              atau CMS sesuai kebutuhan Anda.
            </p>
            <div className="space-y-5">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-5 py-5 sm:px-6"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-100">
                        <Icon className="h-5 w-5 text-blue-700" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">
                          {pillar.title}
                        </h3>
                        <p className="mt-1 text-base text-slate-600 dark:text-slate-300">{pillar.desc}</p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-6 sm:grid-cols-2">
                      <div className="border-t border-slate-100 pt-4">
                        <Link
                          href={pillar.publicLink}
                          className="text-base font-medium text-blue-700 hover:underline"
                        >
                          {pillar.title} <ArrowUpRight className="inline h-4 w-4" />
                        </Link>
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cara kerja</p>
                          <TopicList items={pillar.public.how} />
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Pemecahan masalah
                          </p>
                          <TopicList items={pillar.public.trouble} />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4">
                        <Link
                          href={pillar.cmsLink}
                          className="text-base font-medium text-blue-700 hover:underline"
                        >
                          CMS {pillar.title} <ArrowUpRight className="inline h-4 w-4" />
                        </Link>
                        <div className="mt-3">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Cara kerja</p>
                          <TopicList items={pillar.cms.how} />
                        </div>
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            Pemecahan masalah
                          </p>
                          <TopicList items={pillar.cms.trouble} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="akun-privasi">
            <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
              Bantuan akun & privasi
            </h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              <article>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">Kesulitan masuk?</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Periksa akun yang digunakan dan ikuti pemulihan akses bila tersedia. ASN
                  perlu memastikan peran serta cakupan instansinya kepada administrator.
                </p>
              </article>
              <article>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Jaga informasi pribadi
                </h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Jangan bagikan kata sandi, OTP, atau NIK penuh. Samarkan tangkapan layar
                  dan gunakan jalur dokumen yang tersedia untuk lampiran pribadi.
                </p>
              </article>
            </div>
            <div
              id="bantuan-lanjutan"
              className="mt-6 flex gap-3 rounded-lg border-l-4 border-blue-600 bg-[#eaf4fc] dark:bg-slate-900 px-4 py-4 sm:px-5"
            >
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                  Belum menemukan jawaban?
                </h3>
                <p className="mt-1 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  Baca pemecahan masalah pada kategori terkait. Jika perlu eskalasi, gunakan
                  kanal bantuan yang tersedia di platform atau instansi; sertakan ID
                  terkait, waktu kejadian, filter/periode, dan tangkapan layar terbaru.
                </p>
              </div>
            </div>
          </section>

          <footer className="border-t border-slate-200 dark:border-slate-800 pt-6">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              Panduan mengikuti rancangan platform dan ketersediaan fitur/hak akses
              instansi, bukan layanan operasional. Ini adalah tampilan dokumentasi statis;
              navigasi antarhalaman dan pencarian panduan tersedia.
            </p>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">Agoraya · Pusat bantuan</span>
              <span>Bahasa Indonesia</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
