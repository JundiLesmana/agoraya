'use client';

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, ShieldCheck, Send } from "lucide-react";

export function DecisionForm() {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{
    kind: ("approve" | "reject" | "revision");
    message: string;
  } | null>(null);

  const handleSubmit = useCallback(
    async (kind: "approve" | "reject" | "revision") => {
      const needsReason = kind === "reject" || kind === "revision";
      if (needsReason && !message.trim()) {
        return;
      }
      setSubmitting(true);
      try {
        // TODO(#430): panggil POST /api/v1/kyc/applications/[id]/decision
        // dengan body { decision: kind, reason: message } dan sertakan idempotency key
        // agar tindakan ganda (double-action) tidak dapat terjadi.
        await new Promise((resolve) => setTimeout(resolve, 800));
        setSubmitted({ kind, message });
      } finally {
        setSubmitting(false);
      }
    },
    [message],
  );

  const kindLabel: Record<string, string> = {
    approve: "disetujui",
    reject: "ditolak",
    revision: "direvisi",
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold">Keputusan pengajuan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Lengkapi pemeriksaan sebelum menetukan keputusan. Pengajuan ini
            belum disetujui.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={submitting}>
          Belum ada keputusan
        </Button>
      </div>

      {submitted ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <div className="flex shrink-0 items-center justify-center h-5 w-5 rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-3 w-3" />
            </div>
            <div className="text-sm leading-relaxed">
              <p className="font-semibold text-emerald-800">
                Keputusan {kindLabel[submitted.kind]}.
              </p>
              <p className="mt-1 text-emerald-700">
                Pesan untuk pemohon: &quot;{submitted.message}&quot;
              </p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <Card>
            <CardHeader className="px-6 pb-2">
              <CardTitle className="text-sm font-medium">
                Pesan kepada pemohon
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 py-3">
              <Label htmlFor="pesan-pemohon">
                Jelaskan bagian yang harus diperbaiki atau alasan penolakan
                secara spesifik
              </Label>
              <Textarea
                id="pesan-pemohon"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Contoh: Foto KTP tidak terbaca, silakan unggah ulang berkas yang lebih jelas..."
                className="mt-1"
                rows={3}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Wajib diisi jika meminta perbaikan atau menolak pengajuan.
                Pesan ini akan dikirim ke akun pemohon.
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7">
              <Card className="border-info-200 bg-info-50">
                <CardHeader className="px-6 pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-info-700" />
                    Persetujuan buka verifikasi email
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-6 py-3">
                  <p className="text-sm text-info-800 leading-relaxed">
                    Email bukti <em>b***@gmail.com</em> masih perlu diverifikasi
                    oleh pemohon sebelum akun dapat diaktivasi sepenuhnya. Ajukan
                    verifikasi email setelah keputusan disetujui.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // TODO(#430): navigasi kembali ke daftar pengajuan verifikasi
                  }}
                >
                  Kembali ke daftar pengajuan
                </Button>
                <Button
                  onClick={() => handleSubmit("reject")}
                  variant="destructive"
                  disabled={submitting || !message.trim()}
                  className="w-full sm:w-auto"
                >
                  {submitting ? <Send className="h-4 w-4" /> : null} Tolak pengajuan
                </Button>
                <Button
                  onClick={() => handleSubmit("revision")}
                  variant="secondary"
                  disabled={submitting || !message.trim()}
                  className="w-full sm:w-auto"
                >
                  {submitting ? <Send className="h-4 w-4" /> : null} Minta perbaikan
                </Button>
                <Button
                  onClick={() => handleSubmit("approve")}
                  disabled={submitting}
                  className="w-full sm:w-auto"
                >
                  {submitting ? <Send className="h-4 w-4" /> : null} Setujui pengajuan warga
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
