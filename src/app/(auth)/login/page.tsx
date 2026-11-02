"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

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
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="mb-4 text-2xl font-bold">Masuk ke Agoraya</h1>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(codeRequested ? "verify-otp" : "request-otp");
        }}
      >
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email ASN
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={codeRequested}
            className="mt-1 block w-full rounded border p-2"
          />
        </div>
        {codeRequested ? (
          <div>
            <label htmlFor="code" className="block text-sm font-medium">
              Kode verifikasi
            </label>
            <input
              id="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="mt-1 block w-full rounded border p-2"
            />
          </div>
        ) : null}
        {message ? <p role="status">{message}</p> : null}
        {error ? (
          <p role="alert" className="text-destructive">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy
            ? "Memproses..."
            : codeRequested
              ? "Verifikasi dan masuk"
              : "Kirim kode verifikasi"}
        </Button>
      </form>
    </main>
  );
}
