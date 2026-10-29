import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, ListChecks, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KeyFeaturesSection } from "../_components/key-features-section";

export const metadata: Metadata = {
  title: "Tentang Agoraya",
  description:
    "Agoraya adalah ruang digital untuk memahami data pemerintah, mengenali layanan publik, dan menyuarakan persoalan di sekitar kita.",
};

const missionPillars = [
  {
    title: "Terbuka dan mudah dipahami",
    description:
      "Informasi perlu disertai sumber, periode, dan konteks agar dapat dibaca tanpa menebak maknanya.",
    icon: BookOpen,
  },
  {
    title: "Akuntabel dalam proses",
    description:
      "Status, penjelasan, dan tindak lanjut perlu dapat ditelusuri, bukan sekadar ditampilkan sebagai hasil akhir.",
    icon: ListChecks,
  },
  {
    title: "Partisipatif dan inklusif",
    description:
      "Sudut pandang warga dan instansi sama-sama penting untuk mengenali kebutuhan dan ruang perbaikan.",
    icon: UsersRound,
  },
];

export default function AboutPage() {
  return (
    <>
      <section
        aria-labelledby="about-title"
        className="relative isolate overflow-hidden bg-[#edf6fc] lg:min-h-[492px]"
      >
        <div className="relative z-10 mx-auto max-w-[1320px] px-6 pt-8 pb-8 lg:flex lg:min-h-[492px] lg:items-center lg:pb-10">
          <div className="max-w-[650px]">
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-3 text-xs"
            >
              <Link
                href="/"
                className="text-slate-500 transition-colors hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                Beranda
              </Link>
              <span aria-hidden="true" className="text-slate-400">
                /
              </span>
              <span aria-current="page" className="font-semibold text-blue-700">
                Tentang
              </span>
            </nav>

            <p className="text-[11px] font-semibold text-[#405a78]">
              TENTANG Agoraya
            </p>
            <h1
              id="about-title"
              className="mt-5 text-[clamp(2rem,4vw,2.875rem)] leading-[1.12] font-bold tracking-tight text-[#17263b]"
            >
              Lebih terbuka datanya.
              <br /> Lebih berarti{" "}
              <span className="text-blue-700">partisipasinya.</span>
            </h1>
            <p className="mt-5 max-w-[620px] text-base leading-7 text-slate-500 sm:text-[17px]">
              Agoraya adalah ruang digital untuk memahami data pemerintah,
              mengenali layanan publik, dan menyuarakan persoalan di sekitar
              kita.
            </p>
            <p className="mt-5 max-w-[620px] text-sm leading-6 text-slate-500 sm:text-[15px]">
              Dirancang untuk mendekatkan informasi dan partisipasi, agar warga
              dan instansi dapat berdialog dengan dasar yang lebih jelas.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Button
                asChild
                className="h-[46px] rounded-[10px] bg-blue-700 px-5 text-sm font-semibold text-white shadow-none transition-transform hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 focus-visible:outline-solid"
              >
                <Link
                  href="/#ecosystem-title"
                  aria-label="Kenali empat pilar Agoraya"
                >
                  Kenali empat pilar
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-[46px] rounded-[10px] border-slate-200 bg-white px-5 text-sm font-semibold text-blue-700 shadow-none hover:bg-blue-50 hover:text-blue-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 focus-visible:outline-solid"
              >
                <Link
                  href="/tracking"
                  aria-label="Cara berpartisipasi di Agoraya"
                >
                  Cara berpartisipasi
                  <ArrowRight className="size-5" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="relative z-0 aspect-[390/230] w-full lg:absolute lg:inset-0 lg:aspect-auto">
          <picture className="absolute inset-0 block">
            <source
              media="(max-width: 1023px)"
              srcSet="/landing/hero-mobile.png"
            />
            <Image
              src="/landing/hero-desktop.png"
              alt="Monumen Nasional di Jakarta dengan tulisan Data yang terbuka adalah langkah awal untuk perubahan nyata"
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
          </picture>
        </div>
      </section>

      <section
        aria-labelledby="mission-title"
        className="bg-white py-14 sm:py-16"
      >
        <div className="mx-auto max-w-[1320px] px-4 md:px-6">
          <div className="mb-8 grid gap-6 md:grid-cols-[5fr_7fr] md:gap-10">
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-[#405a78]">
                TUJUAN KAMI
              </p>
              <h2
                id="mission-title"
                className="mt-3 max-w-[500px] text-[28px] leading-[1.2] font-bold tracking-tight text-[#17263b] sm:text-[32px]"
              >
                Informasi yang jelas. Partisipasi yang bermakna.
              </h2>
            </div>
            <div className="text-[15px] leading-[1.8] text-slate-500 sm:text-base">
              <p>
                Kami ingin membantu warga memahami isu publik dan memberi
                masukan yang relevan. Bagi instansi, informasi yang tertata
                dapat menjadi bahan untuk menjelaskan proses dan melihat
                kebutuhan masyarakat.
              </p>
              <p className="mt-4 leading-[1.7] font-semibold text-[#17263b]">
                Keterbukaan bukan hanya menyediakan data, tetapi juga membuatnya
                dapat dipahami dan dipertanyakan.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {missionPillars.map(({ title, description, icon: Icon }, index) => (
              <article
                key={title}
                aria-labelledby={`mission-${index + 1}-title`}
                tabIndex={0}
                className="rounded-[14px] border border-[#dce6f1] bg-[#fbfcfe] p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-600 hover:shadow-md focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <Icon
                  aria-hidden="true"
                  className="size-6 text-blue-600"
                  strokeWidth={1.7}
                />
                <h3
                  id={`mission-${index + 1}-title`}
                  className="mt-4 text-[17px] font-bold text-[#17263b]"
                >
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-[1.65] text-slate-500">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <KeyFeaturesSection />
    </>
  );
}
