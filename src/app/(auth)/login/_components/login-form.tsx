"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const result = (await response.json()) as {
        error?: string;
        ok?: boolean;
      };
      if (!response.ok || !result.ok) {
        setError(result.error ?? "NIK/email atau kata sandi tidak sesuai.");
        return;
      }

      router.replace("/citizen/dashboard");
      router.refresh();
    } catch {
      setError(
        "Tidak dapat terhubung. Periksa koneksi Anda lalu coba kembali.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
      <div>
        <label
          htmlFor="identifier"
          className="mb-1.5 block text-[0.68rem] font-semibold text-[#344256]"
        >
          NIK atau email
        </label>
        <input
          autoComplete="username"
          className="h-10 w-full rounded-lg border border-[#cfdeeb] bg-transparent px-3 text-xs text-[#192b40] transition outline-none placeholder:text-[#718196] focus:border-[#2778e5] focus:ring-2 focus:ring-[#2778e5]/15"
          id="identifier"
          name="identifier"
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Masukkan NIK atau email"
          required
          value={identifier}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <label
            htmlFor="password"
            className="block text-[0.68rem] font-semibold text-[#344256]"
          >
            Kata sandi
          </label>
          <Link
            href="/forgot-password"
            className="text-[0.65rem] font-semibold text-[#1265c9] transition-colors hover:text-[#0f4fa0]"
          >
            Lupa kata sandi?
          </Link>
        </div>
        <div className="relative">
          <input
            autoComplete="current-password"
            className="h-10 w-full rounded-lg border border-[#cfdeeb] bg-transparent px-3 pr-12 text-xs text-[#192b40] transition outline-none placeholder:text-[#718196] focus:border-[#2778e5] focus:ring-2 focus:ring-[#2778e5]/15"
            id="password"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Masukkan kata sandi"
            required
            type={showPassword ? "text" : "password"}
            value={password}
          />
          <button
            aria-label={
              showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center rounded-r-lg text-[#758693] transition-colors hover:text-[#1265c9] focus-visible:ring-2 focus-visible:ring-[#2778e5] focus-visible:outline-none focus-visible:ring-inset"
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
      </div>

      {error && (
        <p
          aria-live="polite"
          className="rounded-lg border border-[#edc8c0] bg-[#fff4f1] px-3.5 py-3 text-sm leading-5 text-[#a13c2a]"
          role="alert"
        >
          {error}
        </p>
      )}

      <button
        className="group inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-[#1767cf] px-5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#1258b4] focus-visible:ring-4 focus-visible:ring-[#2778e5]/25 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
        disabled={pending}
        type="submit"
      >
        {pending ? (
          <>
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            Memeriksa akun…
          </>
        ) : (
          <>
            Masuk
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </button>

      <p className="pt-0.5 text-center text-[0.68rem] text-[#68798d]">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-semibold text-[#1265c9] transition-colors hover:text-[#0f4fa0]"
        >
          Daftar akun ASN
        </Link>
        <span aria-hidden="true"> · </span>
        <Link
          href="/register-citizen"
          className="font-semibold text-[#1265c9] transition-colors hover:text-[#0f4fa0]"
        >
          Daftar akun warga
        </Link>
      </p>
    </form>
  );
}
