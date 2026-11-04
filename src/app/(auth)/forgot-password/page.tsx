"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "Gagal mengirim link reset.");
      }
      setMessage(result.message ?? "Jika akun Anda terdaftar, link reset telah dikirim ke email Anda.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal mengirim link reset.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="h-16 shrink-0 border-b border-border bg-background">
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
              <span className="text-base font-bold tracking-[-0.04em] text-foreground">
                Agoraya
              </span>
              <span className="mt-0.5 text-[0.58rem] text-muted-foreground">
                Data Publik, Untuk Semua
              </span>
            </span>
          </Link>
          <nav aria-label="Navigasi bantuan" className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:text-primary sm:text-xs"
            >
              <ArrowLeft aria-hidden="true" className="size-3.5" />
              <span className="hidden sm:inline">Kembali ke beranda</span>
              <span className="sm:hidden">Kembali</span>
            </Link>
            <ThemeToggle compact />
            <Link
              href="/tentang#faq"
              className="hidden text-[0.7rem] font-medium text-primary transition-colors hover:opacity-80 sm:inline sm:text-xs"
            >
              Pusat bantuan
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
        <section
          aria-label="Lupa kata sandi Agoraya"
          className="grid w-full max-w-[930px] overflow-hidden rounded-xl bg-transparent lg:min-h-[510px] lg:grid-cols-2 lg:gap-[60px]"
        >
          <div className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-xl bg-secondary px-7 pt-7 text-secondary-foreground sm:px-9 sm:pt-8 lg:min-h-[510px] lg:px-[30px] lg:pt-[30px]">
            <div className="relative z-10 max-w-[370px]">
              <p className="text-[0.62rem] font-semibold text-primary">
                AKUN AGORAYA
              </p>
              <h1 className="max-w-[24ch] text-[1.65rem] leading-[1.17] font-bold tracking-[-0.035em] text-foreground sm:text-[1.8rem]">
                Satu akses untuk layanan yang lebih baik.
              </h1>
              <p className="mt-3 max-w-[350px] text-xs leading-5 text-muted-foreground sm:text-[0.8rem] sm:leading-6">
                Masuk untuk mengelola data, menindaklanjuti layanan, dan
                berkolaborasi bersama instansi Anda.
              </p>
              <p className="mt-4 inline-flex items-center gap-2 text-[0.66rem] font-medium text-primary">
                <ShieldCheck aria-hidden="true" className="size-4" />
                Akses instansi melalui verifikasi petugas
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
              <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-secondary to-transparent" />
            </div>
          </div>

          <div className="flex items-center justify-center px-1 py-10 sm:px-6 lg:px-0">
            <div className="w-full max-w-[435px]">
              <p className="text-[0.62rem] font-semibold text-primary">
                AKUN AGORAYA
              </p>
              <h2 className="mt-2 text-[1.55rem] leading-tight font-bold tracking-[-0.035em] text-foreground sm:text-[1.7rem]">
                Lupa kata sandi?
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-[0.8rem]">
                Masukkan NIK atau email yang terdaftar. Kami akan mengirimkan
                link untuk reset kata sandi.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
                <div>
                  <label
                    htmlFor="identifier"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-foreground"
                  >
                    NIK atau email
                  </label>
                  <input
                    autoComplete="username"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-xs text-foreground transition outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                    id="identifier"
                    name="identifier"
                    onChange={(event) => setIdentifier(event.target.value)}
                    placeholder="Masukkan NIK atau email"
                    required
                    value={identifier}
                  />
                </div>
              <p className="text-[0.62rem] text-muted-foreground">
                Gunakan NIK 16 digit atau alamat email akun Anda.
              </p>

              {message && (
                <p className="rounded-lg border border-border bg-secondary px-3.5 py-3 text-sm leading-5 text-primary">
                  {message}
                </p>
              )}

              {error && (
                  <p
                    aria-live="polite"
                    className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-3 text-sm leading-5 text-destructive"
                    role="alert"
                  >
                    {error}
                  </p>
                )}
                <button
                  className="group inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                  disabled={busy}
                  type="submit"
                >
                  {busy ? (
                    <>
                      <ArrowRight aria-hidden="true" className="size-4 animate-spin" />
                      Mengirim…
                    </>
                  ) : (
                    <>
                      Kirim link reset{" "}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-3 text-center">
                <Link
                  href="/login"
                  className="text-[0.65rem] font-semibold text-primary transition-colors hover:opacity-80"
                >
                  ← Kembali ke login
                </Link>
              </p>

              <div className="mt-8 rounded-lg border border-border bg-card px-4 py-4">
                <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                  <ShieldCheck aria-hidden="true" className="size-4 mt-0.5 flex-shrink-0" />
                  <span>
                    <span className="font-semibold">Pemulihan akses akun</span>{" "}
                    Link reset berlaku selama 1 jam. Periksa kotak masuk dan
                    folder spam email Anda.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer className="shrink-0 border-t border-border bg-background">
        <div className="mx-auto flex min-h-[46px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[0.62rem] text-muted-foreground sm:px-8 sm:text-[0.68rem]">
          <span>© 2026 Agoraya. Semua hak dilindungi.</span>
          <div className="flex items-center gap-4">
            <Link
              href="/tentang"
              className="transition-colors hover:text-primary"
            >
              Kebijakan privasi
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href="/tentang"
              className="transition-colors hover:text-primary"
            >
              Ketentuan penggunaan
            </Link>
            <span aria-hidden="true"> · </span>
            <Link
              href="/tentang"
              className="transition-colors hover:text-primary"
            >
              Aksesibilitas
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
