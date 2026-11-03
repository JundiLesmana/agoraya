"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  RegisterAsnForm,
  RegisterAsnConfirmation,
  type RegistrationConfirmationDetails,
} from "./_components/register-asn-form";
import { ArrowLeft, Check, MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import themeStyles from "./register-asn-theme.module.css";

const steps = [
  {
    id: 1,
    title: "Mari mulai dari identitas Anda",
    description:
      "Gunakan data sesuai KTP dan kontak aktif agar proses verifikasi lebih mudah.",
    label: "Identitas & akun",
  },
  {
    id: 2,
    title: "Hubungkan dengan instansi Anda",
    description:
      "Data ini membantu admin mencocokkan penempatan dan menentukan akses yang sesuai.",
    label: "Instansi & kepegawaian",
  },
  {
    id: 3,
    title: "Lengkapi informasi alamat",
    description:
      "Pisahkan alamat sesuai KTP dan tempat tinggal saat ini agar data administrasi tetap akurat.",
    label: "Alamat",
  },
  {
    id: 4,
    title: "Unggah dokumen verifikasi",
    description:
      "Unggah dokumen yang jelas dan terbaca agar petugas dapat memverifikasi data Anda.",
    label: "Dokumen",
  },
  {
    id: 5,
    title: "Tinjau & persetujuan",
    description:
      "Periksa kembali data Anda sebelum mengirim pengajuan. Anda masih dapat mengedit setiap bagian.",
    label: "Tinjau & persetujuan",
  },
];

export default function RegisterAsnPage() {
  const { theme, toggleTheme } = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [registrationConfirmation, setRegistrationConfirmation] =
    useState<RegistrationConfirmationDetails | null>(null);
  const currentStepContent =
    steps.find((step) => step.id === currentStep) ?? steps[0];

  const handleStepChange = (step: number, completed: number[]) => {
    setCurrentStep(step);
    setCompletedSteps(completed);
  };

  if (registrationConfirmation) {
    return (
      <div className={themeStyles.page}>
        <RegisterAsnConfirmation details={registrationConfirmation} />
      </div>
    );
  }

  return (
    <main
      className={`${themeStyles.page} min-h-screen bg-[#f8fafc] text-[#192b40]`}
    >
      <header className="border-b border-[#e5ebf1] bg-white">
        <div className="mx-auto flex h-16 max-w-[1380px] items-center justify-between gap-4 px-5 sm:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2"
            aria-label="Agoraya — beranda"
          >
            <Image
              src="/logo/brand.svg"
              alt=""
              width={30}
              height={32}
              priority
            />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-[-0.04em] text-[#192b40]">
                Agoraya
              </span>
              <span className="mt-0.5 text-[0.58rem] text-[#738397]">
                Data Publik, Untuk Semua
              </span>
            </span>
          </Link>
          <nav
            aria-label="Navigasi bantuan"
            className="flex items-center gap-3 sm:gap-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#66788b] transition-colors hover:text-[#1265c9] focus-visible:ring-2 focus-visible:ring-[#1265c9] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Kembali ke beranda</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Beralih ke tema ${theme === "light" ? "gelap" : "terang"}`}
              aria-pressed={theme === "dark"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#e6f0ff] px-3 py-2 text-xs font-medium text-[#1265c9] transition-colors hover:bg-[#d8e8ff] focus-visible:ring-2 focus-visible:ring-[#1265c9] focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {theme === "light" ? (
                <SunMedium aria-hidden="true" className="size-4" />
              ) : (
                <MoonStar aria-hidden="true" className="size-4" />
              )}
              {theme === "light" ? "Terang" : "Gelap"}
            </button>
            <Link
              href="/tentang#faq"
              className="hidden text-xs font-medium text-[#1265c9] transition-colors hover:text-[#0f4fa0] focus-visible:ring-2 focus-visible:ring-[#1265c9] focus-visible:ring-offset-2 focus-visible:outline-none sm:inline"
            >
              Pusat bantuan
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-[1380px] px-5 py-7 sm:px-8 lg:py-9">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-3 text-xs text-[#738397]">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/" className="hover:text-[#1265c9]">
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true">›</li>
              <li aria-current="page">Daftar akun ASN</li>
            </ol>
          </nav>
          <p>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#1265c9] hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>

        <section
          aria-labelledby="registration-step-title"
          className="mb-8 grid gap-5 md:grid-cols-[minmax(230px,0.28fr)_minmax(0,0.72fr)] md:gap-8 lg:mb-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:gap-8"
        >
          <div className="max-w-[300px]">
            <p className="mb-2 text-xs font-semibold text-[#1265c9]">
              AKUN INSTANSI
            </p>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-[#192b40] sm:text-[1.65rem]">
              Daftar akun ASN
            </h2>
            <p className="mt-2 text-sm leading-5 text-[#65788d]">
              Lengkapi profil untuk mengajukan akses ke ruang instansi.
            </p>
          </div>
          <div className="min-w-0 pt-0.5 md:pt-0">
            <p className="text-xs font-semibold text-[#1265c9]">
              LANGKAH {currentStep} DARI 5
            </p>
            <h1
              id="registration-step-title"
              className="mt-2 text-[1.75rem] leading-tight font-bold tracking-[-0.035em] text-[#192b40] sm:text-[2rem] lg:text-[2.1rem]"
            >
              {currentStepContent.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#65788d] sm:text-base">
              {currentStepContent.description}
            </p>
          </div>
        </section>

        <div className="mb-6 overflow-x-auto md:hidden">
          <nav aria-label="Langkah pendaftaran">
            <ol className="flex min-w-max gap-4">
              {steps.map((step) => {
                const isCompleted = completedSteps.includes(step.id);
                const isActive = currentStep === step.id;
                return (
                  <li key={step.id} className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                        isCompleted
                          ? "border-green-600 bg-green-600 text-white"
                          : isActive
                            ? "border-[#2563eb] bg-[#2563eb] text-white"
                            : "border-[#cbd5e1] bg-white text-[#64748b]"
                      }`}
                    >
                      {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm whitespace-nowrap ${
                          isCompleted
                            ? "text-green-700"
                            : isActive
                              ? "font-medium text-[#2563eb]"
                              : "text-[#64748b]"
                        }`}
                      >
                        {step.label}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)] lg:gap-8">
          <aside className="order-first hidden rounded-xl border border-[#e5ebf1] bg-white p-6 md:block lg:order-none">
            <nav aria-label="Langkah pendaftaran">
              <ol className="space-y-4">
                {steps.map((step) => {
                  const isCompleted = completedSteps.includes(step.id);
                  const isActive = currentStep === step.id;
                  return (
                    <li key={step.id} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
                          isCompleted
                            ? "border-green-600 bg-green-600 text-white"
                            : isActive
                              ? "border-[#2563eb] bg-[#2563eb] text-white"
                              : "border-[#cbd5e1] bg-white text-[#64748b]"
                        }`}
                      >
                        {isCompleted ? <Check className="h-4 w-4" /> : step.id}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm ${
                            isCompleted
                              ? "font-medium text-green-700"
                              : isActive
                                ? "font-medium text-[#2563eb]"
                                : "text-[#64748b]"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </nav>
            <div className="mt-8 space-y-3 border-t border-[#e5ebf1] pt-6 text-sm">
              <Link href="#" className="block text-[#2563eb] hover:underline">
                Baca panduan pendaftaran
              </Link>
              <Link
                href="/login"
                className="block text-[#2563eb] hover:underline"
              >
                Sudah punya akun? Masuk
              </Link>
            </div>
            <div className="mt-6 space-y-2 rounded-lg bg-[#f8fafc] p-4 text-xs text-[#5f6f85]">
              <p className="font-medium text-[#192b40]">Kebijakan instansi</p>
              <p>
                Akun memerlukan persetujuan admin instansi setelah pendaftaran.
              </p>
              <p className="mt-2">
                Identitas dan dokumen hanya untuk verifikasi oleh petugas
                berwenang, tidak ditampilkan publik.
              </p>
            </div>
          </aside>

          <section className="rounded-xl border border-[#e5ebf1] bg-white p-6 shadow-sm sm:p-8">
            <RegisterAsnForm
              onStepChange={handleStepChange}
              onSuccess={setRegistrationConfirmation}
            />
            <div className="mt-6 text-center text-xs text-[#5f6f85]">
              Identitas dan dokumen hanya untuk verifikasi oleh petugas
              berwenang, tidak ditampilkan publik.
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
