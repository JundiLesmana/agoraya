"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  PASSWORD_REQUIREMENTS,
  resetPasswordPasswordSchema,
} from "@/modules/identity/password-reset/schema";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const strength = PASSWORD_REQUIREMENTS.map(({ test }) => test(password));
  const validToken = /^[a-f\d]{64}$/i.test(token);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passwordValidation = resetPasswordPasswordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setError(
        passwordValidation.error.issues[0]?.message ??
          "Kata sandi belum memenuhi persyaratan.",
      );
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak sama.");
      return;
    }
    if (!validToken) {
      setError("Link reset tidak valid atau sudah kedaluwarsa. Minta link reset baru.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        throw new Error(result.error ?? "Gagal memperbarui kata sandi.");
      }
      setSuccess(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Gagal memperbarui kata sandi.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <SuccessHeader />
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
          <div className="w-full max-w-[435px]">
            <div className="rounded-lg border border-border bg-card px-7 pt-7 sm:px-9 sm:pt-8">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary bg-secondary">
                  <CheckCircle2 className="size-5 text-primary" aria-hidden="true" />
                </div>
                <span className="text-[0.62rem] font-semibold text-primary">Reset berhasil</span>
              </div>
              <p className="mt-2 text-[0.62rem] font-semibold text-primary">AKUN AGORAYA</p>
              <h1 className="mt-2 text-[1.55rem] leading-tight font-bold tracking-[-0.035em] text-foreground sm:text-[1.7rem]">
                Kata sandi diperbarui
              </h1>
              <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-[0.8rem]">
                Kata sandi berhasil direset. Silakan login dengan kata sandi baru.
              </p>
              <p className="text-[0.62rem] text-muted-foreground">
                Gunakan kata sandi baru saat masuk kembali ke akun Agoraya.
              </p>
              <Link
                href="/login"
                className="mt-8 inline-flex items-center gap-2 rounded-lg border border-primary bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Login{" "}
                <ArrowRight className="size-4 transition-transform hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
        <SuccessFooter />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <AuthHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 sm:py-10">
        <section
          aria-label="Buat kata sandi baru Agoraya"
          className="grid w-full max-w-[930px] overflow-hidden rounded-xl bg-transparent lg:min-h-[510px] lg:grid-cols-2 lg:gap-[60px]"
        >
          <div className="relative isolate flex min-h-[460px] flex-col overflow-hidden rounded-xl bg-secondary px-7 pt-7 text-secondary-foreground sm:px-9 sm:pt-8 lg:min-h-[510px] lg:px-[30px] lg:pt-[30px]">
            <div className="relative z-10 max-w-[370px]">
              <p className="text-[0.62rem] font-semibold text-primary">
                RUANG INSTANSI
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
                Buat kata sandi baru
              </h2>
              <p className="mt-2 text-xs leading-5 text-muted-foreground sm:text-[0.8rem]">
                Buat kata sandi yang aman dan berbeda dari kata sandi
                sebelumnya.
              </p>

              <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-foreground"
                  >
                    Kata sandi baru
                  </label>
                  <div className="relative">
                    <input
                      autoComplete="new-password"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-12 text-xs text-foreground transition outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                      id="password"
                      name="password"
                      onChange={(event) => setPassword(event.target.value)}
                      maxLength={256}
                      placeholder="Masukkan kata sandi baru"
                      required
                      type={showPassword ? "text" : "password"}
                      value={password}
                    />
                    <button
                      aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                      onClick={() => setShowPassword((visible) => !visible)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" className="size-[18px]" />
                      ) : (
                        <Eye aria-hidden="true" className="size-[18px]" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 space-y-2">
                    {PASSWORD_REQUIREMENTS.map((requirement, index) => (
                      <div key={requirement.key} className="flex items-center gap-2">
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${strength[index] ? "border-primary bg-primary" : "border-input bg-transparent"}`}
                        >
                          {strength[index] && (
                            <CheckCircle2
                              className="size-3 text-white"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                        <span
                          className={`text-[0.62rem] leading-none ${strength[index] ? "font-medium text-primary" : "text-muted-foreground"}`}
                        >
                          {requirement.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-1.5 block text-[0.68rem] font-semibold text-foreground"
                  >
                    Konfirmasi kata sandi baru
                  </label>
                  <div className="relative">
                    <input
                      autoComplete="new-password"
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 pr-12 text-xs text-foreground transition outline-none placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20"
                      id="confirmPassword"
                      name="confirmPassword"
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      maxLength={256}
                      placeholder="Ulangi kata sandi baru"
                      required
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                    />
                    <button
                      aria-label={showConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      aria-pressed={showConfirmPassword}
                      className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                      onClick={() => setShowConfirmPassword((visible) => !visible)}
                      type="button"
                    >
                      {showConfirmPassword ? (
                        <EyeOff aria-hidden="true" className="size-[18px]" />
                      ) : (
                        <Eye aria-hidden="true" className="size-[18px]" />
                      )}
                    </button>
                  </div>
                </div>

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
                      Mengubah…
                    </>
                  ) : (
                    <>
                      Reset kata sandi{" "}
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
                    <span className="font-semibold">Jaga kerahasiaan kata sandi</span>{" "}
                    Jangan bagikan kata sandi atau link reset kepada siapa pun.
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <AuthFooter />
    </main>
  );
}

function AuthHeader() {
  return (
    <header className="h-16 shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="Agoraya — beranda">
          <Image src="/logo/brand.svg" alt="" width={30} height={32} priority />
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-[-0.04em] text-foreground">Agoraya</span>
            <span className="mt-0.5 text-[0.58rem] text-muted-foreground">Data Publik, Untuk Semua</span>
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
          <Link href="/tentang#faq" className="hidden text-[0.7rem] font-medium text-primary transition-colors hover:opacity-80 sm:inline sm:text-xs">
            Pusat bantuan
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SuccessHeader() {
  return (
    <header className="h-16 shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="Agoraya — beranda">
          <span className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-[-0.04em] text-foreground">Agoraya</span>
            <span className="mt-0.5 text-[0.58rem] text-muted-foreground">Data Publik, Untuk Semua</span>
          </span>
        </Link>
        <nav aria-label="Navigasi bantuan" className="flex items-center gap-4 sm:gap-6">
          <ThemeToggle compact />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground transition-colors hover:text-primary sm:text-xs"
          >
            Kembali ke beranda
          </Link>
        </nav>
      </div>
    </header>
  );
}

function SuccessFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-background">
      <div className="mx-auto flex min-h-[46px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[0.62rem] text-muted-foreground sm:px-8 sm:text-[0.68rem]">
        <span>© 2026 Agoraya. Semua hak dilindungi.</span>
        <div className="flex items-center gap-4">
          <Link href="/tentang" className="text-primary transition-colors hover:opacity-80">
            Kebijakan privasi
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/tentang" className="text-primary transition-colors hover:opacity-80">
            Ketentuan penggunaan
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/tentang" className="text-primary transition-colors hover:opacity-80">
            Aksesibilitas
          </Link>
        </div>
      </div>
    </footer>
  );
}

function AuthFooter() {
  return (
    <footer className="shrink-0 border-t border-border bg-background">
      <div className="mx-auto flex min-h-[46px] max-w-[1200px] items-center justify-between gap-4 px-5 text-[0.62rem] text-muted-foreground sm:px-8 sm:text-[0.68rem]">
        <span>© 2026 Agoraya. Semua hak dilindungi.</span>
        <div className="flex items-center gap-4">
          <Link href="/tentang" className="text-primary transition-colors hover:opacity-80">
            Kebijakan privasi
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/tentang" className="text-primary transition-colors hover:opacity-80">
            Ketentuan penggunaan
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/tentang" className="text-primary transition-colors hover:opacity-80">
            Aksesibilitas
          </Link>
        </div>
      </div>
    </footer>
  );
}
