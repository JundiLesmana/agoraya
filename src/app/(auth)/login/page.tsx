"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "./_components/login-form";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(action: "request-otp" | "verify-otp") {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          action === "request-otp"
            ? { action, identifier: email }
            : { action, identifier: email, code },
        ),
      });
      const result: unknown = await response.json();
      const resultMessage =
        result && typeof result === "object" && "message" in result
          ? result.message
          : null;
      const resultError =
        result && typeof result === "object" && "error" in result
          ? result.error
          : null;
      if (!response.ok) {
        throw new Error(
          typeof resultError === "string" ? resultError : "Login gagal.",
        );
      }

      if (action === "request-otp") {
        setCodeRequested(true);
        setMessage(
          typeof resultMessage === "string"
            ? resultMessage
            : "Periksa email untuk kode verifikasi.",
        );
      } else {
        router.replace("/asn/project");
        router.refresh();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Login gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#f8fafc] text-[#192b40]">
      <header className="h-16 shrink-0 border-b border-[#e5ebf1] bg-white">
        <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
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
            className="flex items-center gap-4 sm:gap-6"
          >
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-[#66788b] transition-colors hover:text-[#1265c9] sm:text-xs"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Kembali ke beranda</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
            <Link
              href="/tentang#faq"
              className="hidden text-[0.7rem] font-medium text-[#1265c9] transition-colors hover:text-[#0f4fa0] sm:inline sm:text-xs"
            >
              Pusat bantuan
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
        <section
          aria-label="Masuk ke Agoraya"
          className="grid w-full max-w-[930px] overflow-hidden rounded-xl bg-transparent lg:min-h-[510px] lg:grid-cols-2 lg:gap-[60px]"
        >
          <div className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-xl bg-[#eaf4fb] px-7 pt-7 sm:px-9 sm:pt-8 lg:min-h-[510px] lg:px-[30px] lg:pt-[30px]">
            <div className="relative z-10 max-w-[370px]">
              <h1 className="max-w-[24ch] text-[1.65rem] leading-[1.17] font-bold tracking-[-0.035em] text-[#192b40] sm:text-[1.8rem]">
                Satu akses untuk layanan yang lebih baik.
              </h1>
              <p className="mt-3 max-w-[350px] text-xs leading-5 text-[#65788d] sm:text-[0.8rem] sm:leading-6">
                Masuk untuk mengelola data, menindaklanjuti layanan, dan
                mengakses fitur yang Anda butuhkan.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-[0.66rem] font-medium text-[#1265c9]">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Akses aman melalui verifikasi akun
              </p>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] overflow-hidden sm:h-[47%]"
            >
              <Image
                src="/landing/hero-mobile.png"
                alt=""
                fill
                priority
                sizes="(max-width: 1023px) 100vw, 435px"
                className="object-cover object-[50%_68%]"
              />
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-[#eaf4fb] to-transparent" />
            </div>
          </div>

          <div className="flex items-center justify-center px-1 py-10 sm:px-6 lg:px-0">
            <div className="w-full max-w-[435px]">
              <p className="text-[0.62rem] font-semibold text-[#1265c9]">
                AKUN AGORAYA
              </p>
              <h2 className="mt-2 text-[1.55rem] leading-tight font-bold tracking-[-0.035em] text-[#192b40] sm:text-[1.7rem]">
                Selamat datang kembali
              </h2>
              <p className="mt-2 text-xs leading-5 text-[#718196] sm:text-[0.8rem]">
                Masuk dengan NIK atau email yang terdaftar.
              </p>
              <LoginForm />
            </div>
          </div>
        </section>
      </div>

      <footer className="shrink-0 border-t border-[#e5ebf1] bg-white">
        <div className="mx-auto flex min-h-[46px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[0.62rem] text-[#738397] sm:px-8 sm:text-[0.68rem]">
          <span>© 2026 Agoraya. Semua hak dilindungi.</span>
          <Link
            href="/tentang"
            className="transition-colors hover:text-[#1265c9]"
          >
            Tentang Agoraya
          </Link>
        </div>
      </footer>
    </main>
  );
}
