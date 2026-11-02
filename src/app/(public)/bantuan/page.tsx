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
  Search,
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
    publicLink: "/bantuan/data-pemerintah",
    cmsLink: "/bantuan/cms-data-pemerintah",
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
    publicLink: "/bantuan/layanan-publik",
    cmsLink: "/bantuan/cms-layanan-publik",
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
    publicLink: "/bantuan/lapor-warga",
    cmsLink: "/bantuan/cms-lapor-warga",
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
    publicLink: "/bantuan/insight",
    cmsLink: "/bantuan/cms-insight",
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
  { title: "Data Pemerintah", icon: Database, href: "/bantuan/data-pemerintah" },
  { title: "Layanan Publik", icon: FileText, href: "/bantuan/layanan-publik" },
  { title: "Lapor Warga", icon: Megaphone, href: "/bantuan/lapor-warga" },
  { title: "Insight", icon: ChartNoAxesColumnIncreasing, href: "/bantuan/insight" },
];

function TopicList({ items }: { items: string[] }) {
  return <p className="mt-1 text-[7px] leading-[1.4] text-slate-500">{items.join(" · ")}</p>;
}

function SearchBox({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`relative flex h-[30px] items-center rounded-md border border-slate-200 bg-white ${
        compact ? "w-[245px]" : "w-full"
      }`}
    >
      <Search
        className="ml-2 h-[11px] w-[11px] shrink-0 text-blue-600"
        aria-hidden="true"
      />
      <input
        aria-label="Cari panduan"
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-2 text-[8px] text-slate-700 outline-none placeholder:text-slate-400"
        placeholder="Cari panduan, topik, atau kendala..."
      />
      <button
        className="h-full px-2 text-[7px] text-slate-500 hover:text-blue-700"
        type="button"
      >
        Cari
      </button>
    </div>
  );
}

export default function BantuanPage() {
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
      </header>

      <aside className="fixed bottom-0 left-0 top-[47px] hidden w-36 border-r border-slate-200 bg-slate-50 md:block">
        <nav aria-label="Navigasi bantuan" className="px-[10px] pt-[14px]">
          <p className="mb-[9px] text-[6px] font-semibold uppercase tracking-[0.08em] text-slate-500">
            Dokumentasi
          </p>
          <Link
            href="/bantuan"
            className="flex h-[20px] items-center gap-[6px] rounded bg-blue-100 px-[6px] text-[8px] font-medium text-blue-800"
          >
            <Home className="h-[9px] w-[9px]" aria-hidden="true" />
            Beranda
          </Link>

          <p className="mb-[5px] mt-[13px] text-[6px] font-semibold uppercase tracking-[0.06em] text-slate-500">
            Platform publik
          </p>
          <div className="space-y-[2px]">
            {sidebarItems.map(({ title, href, icon: Icon }) => (
              <Link
                key={title}
                href={href}
                className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
              >
                <Icon className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
                <span className="flex-1">{title}</span>
                <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <p className="mb-[5px] mt-[10px] text-[6px] font-semibold uppercase tracking-[0.04em] text-slate-500">
            CMS · Ruang ASN
          </p>
          <div className="space-y-[2px]">
            {pillars.map(({ title, cmsLink }) => (
              <Link
                key={title}
                href={cmsLink}
                className="flex h-[22px] items-center gap-[6px] rounded px-[6px] text-[7px] text-slate-700 hover:bg-slate-100"
              >
                <FileText className="h-[9px] w-[9px] text-blue-700" aria-hidden="true" />
                <span className="flex-1">CMS {title}</span>
                <ChevronRight className="h-[8px] w-[8px] text-blue-700" aria-hidden="true" />
              </Link>
            ))}
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

      <main className="mx-auto max-w-[1120px] px-4 pb-5 pt-[70px] md:ml-36 md:px-6">
        <nav aria-label="Breadcrumb" className="mb-[16px] text-[8px] text-slate-500">
          Pusat bantuan <span className="px-1">/</span>{" "}
          <span className="font-medium text-slate-700">Beranda</span>
        </nav>

        <div className="flex flex-col gap-[20px]">
          <section className="mb-[4px] rounded-md bg-[#eaf4fc] px-[17px] py-[18px]">
            <p className="text-[7px] font-bold tracking-[0.12em] text-blue-700">
              DOKUMENTASI AGORAYA
            </p>
            <h1 className="mt-[8px] text-[21px] font-bold leading-[1.2] tracking-[-0.04em] text-slate-800">
              Langkah jelas untuk setiap kebutuhan.
            </h1>
            <p className="mt-[9px] max-w-[430px] text-[9px] leading-[1.5] text-slate-500">
              Pelajari cara menggunakan empat pilar Agoraya, mengelola informasi di Ruang
              ASN, dan mengatasi kendala dengan panduan yang terarah.
            </p>
            <div className="mt-[11px]">
              <SearchBox />
            </div>
            <p className="mt-[10px] text-[7px] text-slate-500">
              Contoh topik: membaca APBD · melacak pengajuan · identitas pelapor ·
              publikasi insight
            </p>
          </section>

          <section className="mb-[5px]">
            <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
              Mulai dari peran Anda
            </h2>
            <div className="mt-[3px] grid gap-[12px] md:grid-cols-2">
              <article className="min-h-[111px] rounded-md border border-slate-200 bg-white px-[12px] py-[9px]">
                <UsersRound className="h-[14px] w-[14px] text-blue-600" aria-hidden="true" />
                <h3 className="mt-[7px] text-[11px] font-semibold text-slate-800">Saya warga</h3>
                <p className="mt-[6px] text-[8px] leading-[1.5] text-slate-500">
                  Temukan data, ajukan layanan, sampaikan laporan, dan pahami insight publik.
                </p>
                <Link
                  href="/bantuan"
                  className="mt-[7px] inline-flex items-center text-[8px] font-medium text-blue-700 hover:underline"
                >
                  Jelajahi panduan platform publik <ArrowUpRight className="ml-[2px] h-[8px] w-[8px]" />
                </Link>
              </article>
              <article className="min-h-[111px] rounded-md border border-slate-200 bg-white px-[12px] py-[9px]">
                <Building2 className="h-[14px] w-[14px] text-blue-600" aria-hidden="true" />
                <h3 className="mt-[7px] text-[11px] font-semibold text-slate-800">
                  Saya ASN / pengelola
                </h3>
                <p className="mt-[6px] text-[8px] leading-[1.5] text-slate-500">
                  Kelola data, proses antrean, tangani laporan, dan siapkan publikasi sesuai
                  kewenangan.
                </p>
                <Link
                  href="/bantuan"
                  className="mt-[7px] inline-flex items-center text-[8px] font-medium text-blue-700 hover:underline"
                >
                  Jelajahi panduan CMS · Ruang ASN <ArrowUpRight className="ml-[2px] h-[8px] w-[8px]" />
                </Link>
              </article>
            </div>
          </section>

          <section className="mb-[5px]">
            <div className="flex items-baseline justify-between">
              <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
                Temukan panduan menurut pilar
              </h2>
              <span className="text-[7px] text-slate-500">4 pilar · 8 kategori panduan</span>
            </div>
            <p className="mb-[9px] mt-[10px] text-[9px] text-slate-500">
              Setiap kategori memuat cara kerja dan pemecahan masalah. Pilih jalur publik
              atau CMS sesuai kebutuhan Anda.
            </p>
            <div className="space-y-[13px]">
              {pillars.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <article
                    key={pillar.title}
                    className="min-h-[178px] rounded-md border border-slate-200 bg-white px-[14px] py-[10px]"
                  >
                    <div className="flex items-center gap-[8px]">
                      <span className="flex h-[24px] w-[24px] items-center justify-center rounded-md bg-blue-100">
                        <Icon className="h-[13px] w-[13px] text-blue-700" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="text-[12px] font-semibold leading-tight text-slate-800">
                          {pillar.title}
                        </h3>
                        <p className="mt-[3px] text-[7px] text-slate-500">{pillar.desc}</p>
                      </div>
                    </div>

                    <div className="mt-[13px] grid gap-[16px] sm:grid-cols-2">
                      <div className="border-t border-slate-100 pt-[9px]">
                        <Link
                          href={pillar.publicLink}
                          className="text-[8px] font-medium text-blue-700 hover:underline"
                        >
                          {pillar.title} <ArrowUpRight className="inline h-[8px] w-[8px]" />
                        </Link>
                        <div className="mt-[5px]">
                          <p className="text-[7px] font-semibold text-slate-800">Cara kerja</p>
                          <TopicList items={pillar.public.how} />
                        </div>
                        <div className="mt-[7px]">
                          <p className="text-[7px] font-semibold text-slate-800">
                            Pemecahan masalah
                          </p>
                          <TopicList items={pillar.public.trouble} />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-[9px]">
                        <Link
                          href={pillar.cmsLink}
                          className="text-[8px] font-medium text-blue-700 hover:underline"
                        >
                          CMS {pillar.title} <ArrowUpRight className="inline h-[8px] w-[8px]" />
                        </Link>
                        <div className="mt-[5px]">
                          <p className="text-[7px] font-semibold text-slate-800">Cara kerja</p>
                          <TopicList items={pillar.cms.how} />
                        </div>
                        <div className="mt-[7px]">
                          <p className="text-[7px] font-semibold text-slate-800">
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
            <h2 className="text-[14px] font-bold tracking-[-0.02em] text-slate-800">
              Bantuan akun & privasi
            </h2>
            <div className="mt-[6px] grid gap-[16px] md:grid-cols-2">
              <article>
                <h3 className="text-[8px] font-semibold text-slate-800">Kesulitan masuk?</h3>
                <p className="mt-[5px] text-[8px] leading-[1.6] text-slate-500">
                  Periksa akun yang digunakan dan ikuti pemulihan akses bila tersedia. ASN
                  perlu memastikan peran serta cakupan instansinya kepada administrator.
                </p>
              </article>
              <article>
                <h3 className="text-[8px] font-semibold text-slate-800">
                  Jaga informasi pribadi
                </h3>
                <p className="mt-[5px] text-[8px] leading-[1.6] text-slate-500">
                  Jangan bagikan kata sandi, OTP, atau NIK penuh. Samarkan tangkapan layar
                  dan gunakan jalur dokumen yang tersedia untuk lampiran pribadi.
                </p>
              </article>
            </div>
            <div
              id="bantuan-lanjutan"
              className="mt-[19px] flex gap-[8px] rounded-md border-l-2 border-blue-600 bg-[#eaf4fc] px-[10px] py-[11px]"
            >
              <Info className="mt-[1px] h-[10px] w-[10px] shrink-0 text-blue-600" aria-hidden="true" />
              <div>
                <h3 className="text-[7px] font-semibold text-slate-800">
                  Belum menemukan jawaban?
                </h3>
                <p className="mt-[3px] text-[7px] leading-[1.5] text-slate-500">
                  Baca pemecahan masalah pada kategori terkait. Jika perlu eskalasi, gunakan
                  kanal bantuan yang tersedia di platform atau instansi; sertakan ID
                  terkait, waktu kejadian, filter/periode, dan tangkapan layar terbaru.
                </p>
              </div>
            </div>
          </section>

          <footer className="border-t border-slate-200 pt-[12px]">
            <p className="text-[7px] leading-[1.5] text-slate-500">
              Panduan mengikuti rancangan platform dan ketersediaan fitur/hak akses
              instansi, bukan layanan operasional. Ini adalah tampilan dokumentasi statis;
              navigasi dan pencarian tidak diaktifkan.
            </p>
            <div className="mt-[10px] flex items-center justify-between text-[7px] text-slate-600">
              <span className="font-semibold">Agoraya · Pusat bantuan</span>
              <span>Bahasa Indonesia</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
