"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  apbdReviewQueueResponseSchema,
  type ApbdReviewQueueResponse,
} from "@/modules/apbd-budget/contract";
import { formatRupiahInteger } from "@/modules/apbd-budget/domain";

function messageFrom(payload: unknown): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }
  return "Permintaan tidak dapat diproses.";
}

export function ApbdReviewQueue() {
  const [entries, setEntries] = useState<ApbdReviewQueueResponse["entries"]>(
    [],
  );
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/apbd/review", {
        cache: "no-store",
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(messageFrom(payload));
      const parsed = apbdReviewQueueResponseSchema.safeParse(payload);
      if (!parsed.success) throw new Error("Data antrean APBD tidak valid.");
      setEntries(parsed.data.entries);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Antrean gagal dimuat.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const decide = async (entryId: string, decision: "approve" | "reject") => {
    const reason = reasons[entryId]?.trim() ?? "";
    if (decision === "reject" && reason.length < 10) {
      setError("Alasan penolakan minimal 10 karakter.");
      return;
    }
    if (
      decision === "approve" &&
      !window.confirm("Setujui dan publikasikan data APBD ini?")
    ) {
      return;
    }
    setBusyId(entryId);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/apbd/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId, decision, reason }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(messageFrom(payload));
      setNotice(
        decision === "approve"
          ? "APBD disetujui dan dipublikasikan."
          : "APBD ditolak; data operasional dan dokumen bukti telah dihapus.",
      );
      await loadQueue();
    } catch (decisionError) {
      setError(
        decisionError instanceof Error
          ? decisionError.message
          : "Keputusan tinjauan gagal disimpan.",
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-medium">Pengelolaan APBD</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Tinjauan &amp; Publikasi
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Periksa kiriman dalam tenant Anda. Hanya data yang disetujui yang
            ditampilkan ke publik.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadQueue()}
          disabled={loading}
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Muat ulang
        </Button>
      </header>

      {error ? (
        <p
          role="alert"
          className="border-destructive/40 text-destructive rounded-md border p-3 text-sm"
        >
          {error}
        </p>
      ) : null}
      {notice ? (
        <p
          role="status"
          className="border-primary/30 bg-primary/5 rounded-md border p-3 text-sm"
        >
          {notice}
        </p>
      ) : null}
      {loading ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Memuat antrean…
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-10 text-center text-sm">
            Tidak ada kiriman APBD yang menunggu tinjauan.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {entries.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {entry.recordMetadata.opdName || entry.agencyId} ·{" "}
                      {entry.referenceYear}
                    </CardTitle>
                    <CardDescription>
                      {entry.regionName} · {entry.sectorId} · Dikirim{" "}
                      {new Date(entry.submittedAt).toLocaleString("id-ID")} oleh{" "}
                      {entry.submitter}
                    </CardDescription>
                  </div>
                  <Badge variant="outline">Menunggu tinjauan</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <section
                  aria-label="Identitas dan klasifikasi"
                  className="grid gap-3 rounded-md border p-4 text-sm sm:grid-cols-2 lg:grid-cols-4"
                >
                  <p>
                    <span className="text-muted-foreground">ID anggaran:</span>{" "}
                    {entry.recordMetadata.budgetId || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Unit:</span>{" "}
                    {entry.recordMetadata.unitName || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Wilayah:</span>{" "}
                    {entry.recordMetadata.city || entry.regionName}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Jenis:</span>{" "}
                    {entry.recordMetadata.budgetType}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Pagu awal:</span>{" "}
                    {formatRupiahInteger(
                      entry.recordMetadata.initialBudget ?? "0",
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Pagu revisi:</span>{" "}
                    {formatRupiahInteger(
                      entry.recordMetadata.revisedBudget ?? "0",
                    )}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Sumber dana:</span>{" "}
                    {entry.items
                      .map((item) => item.fundingSource)
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </p>
                  <p>
                    <span className="text-muted-foreground">
                      Penanggung jawab:
                    </span>{" "}
                    {entry.recordMetadata.responsiblePerson || "—"}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-semibold">Ringkasan publik</h2>
                  <p className="bg-muted/40 rounded-md p-3 text-sm">
                    {entry.recordMetadata.publicSummary ||
                      "Belum ada ringkasan."}
                  </p>
                </section>

                <section className="space-y-2">
                  <h2 className="text-sm font-semibold">
                    Rincian kegiatan dan realisasi
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] text-left text-xs">
                      <thead>
                        <tr className="text-muted-foreground border-b">
                          <th className="p-2">
                            Program / kegiatan / sub-kegiatan
                          </th>
                          <th className="p-2">Kode</th>
                          <th className="p-2">
                            Target / realisasi per triwulan
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items.map((item) => (
                          <tr key={item.id} className="border-b align-top">
                            <td className="p-2">
                              <p className="font-medium">{item.programName}</p>
                              <p>
                                {item.activityName || "—"} ·{" "}
                                {item.subactivityName}
                              </p>
                            </td>
                            <td className="p-2">
                              {[
                                item.affairCode,
                                item.programCode,
                                item.activityCode,
                                item.code,
                              ]
                                .filter(Boolean)
                                .join(" / ")}
                            </td>
                            <td className="p-2">
                              {item.periods.map((period) => (
                                <span
                                  key={period.periodValue}
                                  className="mr-3 inline-block"
                                >
                                  {period.periodValue}:{" "}
                                  {formatRupiahInteger(period.realisasi ?? "0")}{" "}
                                  /{" "}
                                  {formatRupiahInteger(
                                    period.targetValue ?? period.pagu ?? "0",
                                  )}
                                </span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold">
                      Revisi &amp; validasi
                    </h2>
                    <p className="text-muted-foreground text-sm">
                      {entry.revisionReason ||
                        entry.recordMetadata.varianceReason ||
                        "Tidak ada catatan revisi/selisih."}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Tindakan koreksi:{" "}
                      {entry.recordMetadata.correctiveAction || "—"}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      PIC verifikasi:{" "}
                      {entry.recordMetadata.verificationPic || "—"} · Approver
                      anggaran: {entry.recordMetadata.financialApprover || "—"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-sm font-semibold">
                      Sumber &amp; dokumen verifikasi
                    </h2>
                    {entry.recordMetadata.sourceUrl ? (
                      <a
                        className="text-primary text-sm break-all underline"
                        href={entry.recordMetadata.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Buka sumber resmi
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Tidak ada URL sumber resmi.
                      </p>
                    )}
                    <p className="text-muted-foreground text-xs">
                      Dataset terpilih {entry.sourceDatasetSubmissionId ?? "—"}{" "}
                      · ID dataset {entry.recordMetadata.datasetId || "—"} ·
                      versi {entry.recordMetadata.datasetVersion || "—"} ·
                      validasi{" "}
                      {entry.recordMetadata.validatedAt
                        ? new Date(
                            entry.recordMetadata.validatedAt,
                          ).toLocaleString("id-ID")
                        : "belum dicatat"}
                    </p>
                    {entry.documents.length ? (
                      <ul className="space-y-1">
                        {entry.documents.map((document) => (
                          <li key={document.id}>
                            <a
                              className="text-primary inline-flex items-center gap-2 text-sm underline"
                              href={`/api/asn/apbd/documents/${document.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <FileText className="size-4" aria-hidden="true" />
                              {document.originalName}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="flex items-center gap-2 text-sm text-amber-700">
                        <AlertTriangle className="size-4" aria-hidden="true" />
                        Belum ada dokumen bukti.
                      </p>
                    )}
                  </div>
                </section>

                <label className="block space-y-1.5 text-sm font-medium">
                  Alasan penolakan (wajib bila ditolak)
                  <textarea
                    value={reasons[entry.id] ?? ""}
                    onChange={(event) =>
                      setReasons((current) => ({
                        ...current,
                        [entry.id]: event.target.value,
                      }))
                    }
                    maxLength={500}
                    rows={2}
                    className="border-input bg-background w-full rounded-md border px-3 py-2 font-normal"
                    placeholder="Jelaskan alasan agar tercatat di audit."
                  />
                </label>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => void decide(entry.id, "reject")}
                    disabled={busyId === entry.id}
                  >
                    {busyId === entry.id ? "Memproses…" : "Tolak & hapus data"}
                  </Button>
                  <Button
                    onClick={() => void decide(entry.id, "approve")}
                    disabled={busyId === entry.id}
                  >
                    <CheckCircle2 className="size-4" aria-hidden="true" />
                    Setujui &amp; publikasikan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}