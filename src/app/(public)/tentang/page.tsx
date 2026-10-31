import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ListChecks,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeyFeaturesSection } from "../_components/key-features-section";
import { ExploreCtaBanner } from "../_components/explore-cta-banner";
import { FaqAccordion } from "./_components/faq-accordion";

export const metadata: Metadata = {
  title: "Tentang Agoraya",
  description:
    "Agoraya adalah ruang digital untuk memahami data pemerintah, mengenali layanan publik, dan menyuarakan persoalan di sekitar kita.",
  openGraph: {
    title: "Tentang Agoraya | Agoraya",
    description:
      "Kenali Agoraya, ruang digital untuk memahami data pemerintah dan berpartisipasi dalam pembangunan.",
    type: "website",
    images: [
      {
        url: "/landing/hero-desktop.png",
        alt: "Monumen Nasional dan pesan tentang data yang terbuka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tentang Agoraya | Agoraya",
    description:
      "Kenali Agoraya, ruang digital untuk memahami data pemerintah dan berpartisipasi dalam pembangunan.",
    images: ["/landing/hero-desktop.png"],
  },
};

const missionPillars = [
  {
    title: "Terbuka dan mudah dipahami",
    description:
      "Informasi perlu disertai sumber, periode, dan konteks agar dapat dibaca tanpa menebak maknanya.",
    Icon: BookOpen,
  },
  {
    title: "Akuntabel dalam proses",
    description:
      "Status, penjelasan, dan tindak lanjut perlu dapat ditelusuri, bukan sekadar ditampilkan sebagai hasil akhir.",
    Icon: ListChecks,
  },
  {
    title: "Partisipatif dan inklusif",
    description:
      "Sudut pandang warga dan instansi sama-sama penting untuk mengenali kebutuhan dan ruang perbaikan.",
    Icon: UsersRound,
  },
];

const citizenSteps = [
  {
    title: "Jelajahi dan pahami",
    description:
      "Baca data atau informasi layanan. Periksa sumber, periode, dan batasannya.",
  },
  {
    title: "Sampaikan dengan konteks",
    description:
      "Susun masukan atau laporan berdasarkan fakta, lokasi, dan bukti yang relevan.",
  },
  {
    title: "Ikuti informasi yang tersedia",
    description:
      "Lihat penjelasan status pada halaman terkait, lalu gunakan masukan secara konstruktif.",
  },
];

const agencySteps = [
  {
    title: "Siapkan informasi yang jelas",
    description:
      "Sertakan sumber, periode, definisi, dan penjelasan proses layanan.",
  },
  {
    title: "Tanggapi dengan konteks",
    description:
      "Jelaskan hal yang dapat ditindaklanjuti, termasuk batasan dan alasan yang relevan.",
  },
  {
    title: "Jadikan masukan bahan evaluasi",
    description:
      "Gunakan persoalan yang berulang untuk memahami kebutuhan dan prioritas perbaikan.",
  },
];

const faqs = [
  {
    question: "Apakah Agoraya merupakan situs resmi pemerintah?",
    answer:
      "Halaman ini tidak menyatakan afiliasi resmi pemerintahan. Untuk informasi resmi atau keputusan administratif, periksa sumber dan kanal instansi yang bersangkutan.",
  },
  {
    question: "Apakah semua data dan layanan sudah terhubung?",
    answer:
      "Tidak. Ketersediaan data, cakupan, periode, dan informasi keterkaitannya dapat berbeda pada halaman yang Anda buka.",
  },
  {
    question: "Apakah laporan warga pasti langsung ditindaklanjuti?",
    answer:
      "Pengiriman laporan bukan jaminan penyelesaian. Verifikasi, kewenangan, dan tindak lanjut bergantung pada proses yang dijelaskan di layanan terkait.",
  },
  {
    question: "Bagaimana jika data kurang tepat atau sulit dipahami?",
    answer:
      "Bandingkan dengan sumber aslinya dan periksa definisi serta periodenya. Jika ada kendala, sampaikan tautan dan penjelasan koreksi yang spesifik melalui kanal yang tersedia.",
  },
];

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Agoraya",
  description:
    "Ruang digital untuk memahami data pemerintah, mengenali layanan publik, dan menyuarakan persoalan di sekitar kita.",
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

function jsonLd(data: object) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function StepList({ steps }: { steps: typeof citizenSteps }) {
  return (
    <ol className="mt-5 space-y-4">
      {steps.map(({ title, description }, index) => (
        <li key={title} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#edf6ff] text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-sky-300"
          >
            {index + 1}
          </span>
          <div>
            <h4 className="dark:text-foreground text-sm font-bold text-[#17263b]">
              {title}
            </h4>
            <p className="dark:text-muted-foreground mt-1 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }}
      />

      <section
        aria-labelledby="about-title"
        className="relative isolate overflow-hidden lg:min-h-[492px]"
      >
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(135deg,rgba(246,250,255,0.98)_0%,rgba(226,237,252,0.94)_52%,rgba(207,225,250,0.82)_100%)] dark:bg-[linear-gradient(135deg,rgba(9,15,25,0.98)_0%,rgba(16,31,50,0.94)_52%,rgba(19,43,67,0.88)_100%)]" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-7 pb-7 sm:px-6 lg:flex lg:min-h-[492px] lg:items-center lg:px-8 lg:py-10">
          <div className="max-w-[650px]">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-3 text-xs"
            >
              <Link
                href="/"
                className="text-slate-600 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 dark:text-slate-300 dark:hover:text-sky-200 dark:focus-visible:outline-sky-300"
              >
                Beranda
              </Link>
              <span
                aria-hidden="true"
                className="text-slate-500 dark:text-slate-400"
              >
                /
              </span>
              <span
                aria-current="page"
                className="font-semibold text-blue-800 dark:text-sky-300"
              >
                Tentang
              </span>
            </nav>
            <p className="text-[11px] font-semibold text-[#405a78] dark:text-slate-300">
              TENTANG Agoraya
            </p>
            <h1
              id="about-title"
              className="mt-5 text-[32px] leading-[1.12] font-bold tracking-tight text-[#17263b] sm:text-[40px] lg:text-[44px] dark:text-slate-100"
            >
              Lebih terbuka datanya.
              <br /> Lebih berarti{" "}
              <span className="text-blue-700 dark:text-sky-300">
                partisipasinya.
              </span>
            </h1>
            <p className="mt-5 max-w-[620px] text-sm leading-6 text-slate-600 sm:text-base dark:text-slate-300">
              Agoraya adalah ruang digital untuk memahami data pemerintah,
              mengenali layanan publik, dan menyuarakan persoalan di sekitar
              kita.
            </p>
            <p className="mt-5 max-w-[620px] text-sm leading-6 text-slate-600 dark:text-slate-300">
              Dirancang untuk mendekatkan informasi dan partisipasi, agar warga
              dan instansi dapat berdialog dengan dasar yang lebih jelas.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-[46px] rounded-[10px] px-5 text-sm font-semibold shadow-none"
              >
                <Link
                  href="/#ecosystem-title"
                  aria-label="Kenali empat pilar Agoraya"
                >
                  Kenali empat pilar
                  <ArrowRight aria-hidden="true" className="size-5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-[46px] rounded-[10px] border-blue-200 bg-white px-5 text-sm font-semibold text-blue-700 shadow-none hover:bg-blue-50 hover:text-blue-800 dark:border-slate-600 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800 dark:hover:text-sky-200"
              >
                <Link
                  href="/tracking"
                  aria-label="Cara berpartisipasi di Agoraya"
                >
                  Cara berpartisipasi
                  <ArrowRight aria-hidden="true" className="size-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="relative aspect-[390/230] w-full lg:absolute lg:inset-0 lg:aspect-auto">
          <picture className="absolute inset-0 block">
            <source
              media="(max-width: 1023px)"
              srcSet="/landing/hero-mobile.png"
            />
            <Image
              src="/landing/hero-desktop.png"
              alt="Monumen Nasional di Jakarta dengan pesan tentang data yang terbuka"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </picture>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[1] dark:bg-[linear-gradient(90deg,rgba(9,15,25,0.96)_0%,rgba(9,15,25,0.88)_48%,rgba(9,15,25,0.08)_78%,transparent_100%)]"
          />
        </div>
      </section>

      <section
        aria-labelledby="mission-title"
        className="dark:bg-background bg-white py-14 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 grid gap-6 md:grid-cols-[5fr_7fr] md:gap-10">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-[#405a78] dark:text-slate-300">
                TUJUAN KAMI
              </p>
              <h2
                id="mission-title"
                className="dark:text-foreground mt-3 max-w-[500px] text-[28px] leading-[1.2] font-bold tracking-tight text-[#17263b]"
              >
                Informasi yang jelas. Partisipasi yang bermakna.
              </h2>
            </div>
            <div className="dark:text-muted-foreground text-sm leading-[1.8] text-slate-600 sm:text-base">
              <p>
                Kami ingin membantu warga memahami isu publik dan memberi
                masukan yang relevan. Bagi instansi, informasi yang tertata
                dapat menjadi bahan untuk menjelaskan proses dan melihat
                kebutuhan masyarakat.
              </p>
              <p className="mt-4 leading-[1.7] font-semibold text-[#17263b] dark:text-slate-200">
                Keterbukaan bukan hanya menyediakan data, tetapi juga membuatnya
                dapat dipahami dan dipertanyakan.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {missionPillars.map(({ title, description, Icon }, index) => (
              <article
                key={title}
                aria-labelledby={`mission-${index + 1}-title`}
                className="dark:border-border dark:bg-card rounded-[14px] border border-[#dce6f1] bg-[#fbfcfe] p-6"
              >
                <Icon
                  aria-hidden="true"
                  className="size-6 text-blue-600 dark:text-sky-300"
                  strokeWidth={1.7}
                />
                <h3
                  id={`mission-${index + 1}-title`}
                  className="dark:text-foreground mt-4 text-[17px] font-bold text-[#17263b]"
                >
                  {title}
                </h3>
                <p className="dark:text-muted-foreground mt-3 text-sm leading-[1.65] text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <KeyFeaturesSection />

      <section
        aria-labelledby="participation-title"
        className="dark:bg-background bg-white py-14 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-semibold tracking-wide text-[#405a78] dark:text-slate-300">
            AMBIL BAGIAN
          </p>
          <h2
            id="participation-title"
            className="dark:text-foreground mt-3 text-[28px] leading-tight font-bold tracking-tight text-[#17263b]"
          >
            Peran berbeda, tujuan yang sama
          </h2>
          <p className="dark:text-muted-foreground mt-3 text-base text-slate-600">
            Informasi yang lebih baik tumbuh dari kontribusi yang jelas dan dialog yang saling menghargai.
          </p>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="dark:border-border dark:bg-card rounded-[14px] border border-[#dce6f1] bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="rounded-xl bg-[#edf6ff] p-3 text-blue-700 dark:bg-blue-950 dark:text-sky-300">
                  <UsersRound aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="dark:text-foreground text-lg font-bold text-[#17263b]">
                    Untuk warga
                  </h3>
                  <p className="dark:text-muted-foreground text-sm text-slate-600">
                    Mulai dari hal yang dekat dengan Anda.
                  </p>
                </div>
              </div>
              <StepList steps={citizenSteps} />
            </article>
            <article className="dark:border-border dark:bg-card rounded-[14px] border border-[#dce6f1] bg-white p-6">
              <div className="flex items-start gap-4">
                <span className="rounded-xl bg-[#eff9f4] p-3 text-blue-700 dark:bg-emerald-950 dark:text-emerald-300">
                  <Building2 aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <h3 className="dark:text-foreground text-lg font-bold text-[#17263b]">
                    Untuk instansi
                  </h3>
                  <p className="dark:text-muted-foreground text-sm text-slate-600">
                    Bangun penjelasan yang mudah diikuti.
                  </p>
                </div>
              </div>
              <StepList steps={agencySteps} />
            </article>
          </div>
          <p className="dark:text-muted-foreground mt-8 text-sm leading-6 text-slate-500">
            Panduan ini adalah cara berkontribusi secara bertanggung jawab,
            bukan jaminan waktu respons atau tindak lanjut dari instansi.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="privacy-title"
        className="bg-[#eaf5fb] py-12 sm:py-14 dark:bg-[#101f32]"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-[5fr_7fr] sm:px-6 lg:grid-cols-[5fr_7fr] lg:px-8">
          <div>
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-white text-blue-700 dark:bg-blue-950 dark:text-sky-300">
              <ShieldCheck aria-hidden="true" className="size-6" />
            </span>
            <p className="mt-5 text-[11px] font-semibold tracking-wide text-[#405a78] dark:text-slate-300">
              DATA YANG BERTANGGUNG JAWAB
            </p>
            <h2
              id="privacy-title"
              className="dark:text-foreground mt-3 max-w-[460px] text-[28px] leading-tight font-bold tracking-tight text-[#17263b]"
            >
              Terbuka untuk publik, tetap menghormati privasi
            </h2>
            <p className="dark:text-muted-foreground mt-3 max-w-[460px] text-sm leading-6 text-slate-600">
              Keterbukaan tidak berarti semua informasi pribadi perlu
              dipublikasikan.
            </p>
          </div>
          <div className="space-y-4">
            {[
              [
                "Bagikan seperlunya",
                "Hindari NIK, alamat lengkap, nomor telepon, serta identitas pribadi yang tidak diperlukan.",
              ],
              [
                "Jaga privasi orang lain",
                "Samarkan wajah, dokumen, dan detail sensitif pada foto atau bukti sebelum dibagikan.",
              ],
              [
                "Gunakan data dengan konteks",
                "Cantumkan sumber dan periode. Perhatikan definisi, keterbatasan, dan hak penggunaan data.",
              ],
            ].map(([title, description]) => (
              <div key={title} className="flex items-start gap-4">
                <Check
                  aria-hidden="true"
                  className="mt-0.5 size-5 shrink-0 text-blue-700"
                  strokeWidth={2.5}
                />
                <div>
                  <h3 className="dark:text-foreground text-sm font-bold text-[#17263b]">
                    {title}
                  </h3>
                  <p className="dark:text-muted-foreground mt-1 text-sm leading-6 text-slate-600">
                    {description}
                  </p>
                </div>
              </div>
            ))}
            <p className="dark:text-muted-foreground pt-1 text-xs leading-5 text-slate-500">
              Sebelum mengirim data, baca ketentuan penggunaan dan informasi
              privasi yang tersedia pada layanan terkait.
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="faq-title"
        className="dark:bg-background bg-white py-14 sm:py-16"
      >
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:grid-cols-[4fr_8fr] sm:px-6 lg:px-8">
          <div>
            <p className="text-[11px] font-semibold tracking-wide text-[#405a78] dark:text-slate-300">
              PERTANYAAN UMUM
            </p>
            <h2
              id="faq-title"
              className="dark:text-foreground mt-3 max-w-[350px] text-[28px] leading-tight font-bold tracking-tight text-[#17263b]"
            >
              Kenali sebelum menjelajahi
            </h2>
            <p className="dark:text-muted-foreground mt-3 max-w-[350px] text-sm leading-6 text-slate-600">
              Beberapa hal penting agar Anda menggunakan Agoraya dengan
              pemahaman yang tepat.
            </p>
          </div>
          <FaqAccordion items={faqs} />
        </div>
      </section>

      <section aria-label="Peran dan mulai" className="sr-only">
        <h2>Mulai dari rasa ingin tahu.Lanjutkan dengan peran Anda.</h2>
      </section>

      <ExploreCtaBanner
        titleId="about-cta-title"
        eyebrow="PARTISIPASI ANDA BERARTI"
        title="Data Transparan, Layanan Lebih Baik, Masa Depan Lebih Cerah"
        mobileDescription="Gunakan data dan laporkan masalah untuk perubahan yang lebih baik."
        description="Jadilah bagian dari masyarakat yang aktif, kritis, dan peduli. Gunakan data, pantau layanan, laporkan masalah, dan bantu wujudkan pemerintahan yang lebih baik."
        buttonLabel="Mulai Sekarang"
        buttonHref="/tracking"
      />
    </>
  );
}
