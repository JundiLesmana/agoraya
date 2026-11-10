"use client";

import { useActionState, useMemo } from "react";
import {
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileUp,
  MessageSquareMore,
  PauseCircle,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProcessingDocumentRequirement,
  SubmissionProcessingDetail,
} from "@/lib/service-applications/processing";
import type { SubmissionProcessingActionState } from "../processing-actions";
import { saveSubmissionProcessing } from "../processing-actions";

const INITIAL_STATE: SubmissionProcessingActionState = {
  error: null,
  success: null,
};

function ActionMessage({
  state,
}: {
  state: SubmissionProcessingActionState;
}) {
  if (state.error) {
    return (
      <p role="alert" className="text-sm text-red-700 dark:text-red-300">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p role="status" className="text-sm text-emerald-700 dark:text-emerald-300">
        {state.success}
      </p>
    );
  }
  return null;
}

function documentOptions(document: ProcessingDocumentRequirement) {
  return [
    { value: "pending", label: "Belum dicek" },
    { value: "valid", label: "Valid" },
    { value: "invalid", label: "Tidak Valid" },
  ] as const satisfies readonly { value: string; label: string }[];
}

export function SubmissionProcessingForms({
  detail,
}: {
  detail: SubmissionProcessingDetail;
}) {
  const [state, formAction, pending] = useActionState(
    saveSubmissionProcessing,
    INITIAL_STATE,
  );
  const checklistSummary = useMemo(
    () =>
      `${detail.checklist.filter((item) => item.completed).length}/${detail.checklist.length}`,
    [detail.checklist],
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={detail.id} />

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-blue-100 p-2 text-blue-700 dark:bg-blue-950 dark:text-blue-200">
            <FileCheck2 className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Checklist pemrosesan</h2>
            <p className="text-muted-foreground text-xs">
              Tandai seluruh langkah wajib sebelum penerbitan hasil layanan.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <p className="text-muted-foreground text-xs font-medium">
            Progress checklist: {checklistSummary}
          </p>
          {detail.checklist.map((item) => (
            <Label
              key={item.id}
              htmlFor={`checklist-${item.id}`}
              className="flex items-start gap-3 rounded-xl border p-3 leading-5"
            >
              <input
                id={`checklist-${item.id}`}
                type="checkbox"
                name="checklistIds"
                value={item.id}
                defaultChecked={item.completed}
                className="mt-0.5 size-4 rounded border-input"
              />
              <span>
                <span className="block text-sm font-medium">{item.label}</span>
                <span className="text-muted-foreground text-xs">
                  {item.required ? "Wajib" : "Opsional"}
                </span>
              </span>
            </Label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-200">
            <CheckCircle2 className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Verifikasi dokumen warga</h2>
            <p className="text-muted-foreground text-xs">
              Periksa setiap dokumen secara terpisah lalu beri keputusan validasi.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {detail.documents.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-3 text-sm">
              Tidak ada dokumen warga yang terdeteksi dari payload pengajuan.
            </p>
          ) : null}
          {detail.documents.map((document, index) => (
            <div key={document.id} className="rounded-xl border p-3">
              <input
                type="hidden"
                name={`documentDecisions.${index}.id`}
                value={document.id}
              />
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-medium">{document.label}</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {document.citizenDocument?.fileName ?? "Dokumen warga"}
                    {document.citizenDocument?.mimeType
                      ? ` · ${document.citizenDocument.mimeType}`
                      : ""}
                  </p>
                  {document.citizenDocument?.url ? (
                    <a
                      href={document.citizenDocument.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex text-xs font-medium text-blue-700 underline underline-offset-2 dark:text-blue-300"
                    >
                      Lihat dokumen
                    </a>
                  ) : null}
                </div>
                <div className="grid gap-3 lg:min-w-72">
                  <Label className="space-y-1 text-sm font-medium">
                    <span>Status verifikasi</span>
                    <select
                      name={`documentDecisions.${index}.status`}
                      defaultValue={document.verificationStatus}
                      className="bg-background h-10 w-full rounded-md border border-input px-3 text-sm"
                    >
                      {documentOptions(document).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Label>
                  <Label className="space-y-1 text-sm font-medium">
                    <span>Catatan verifikasi</span>
                    <Textarea
                      name={`documentDecisions.${index}.note`}
                      defaultValue={document.verificationNote ?? ""}
                      rows={3}
                      maxLength={1000}
                      placeholder="Tulis alasan jika dokumen belum valid..."
                    />
                  </Label>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-950 dark:text-sky-200">
            <MessageSquareMore className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Catatan internal & kelengkapan</h2>
            <p className="text-muted-foreground text-xs">
              Gunakan catatan ini untuk progres internal atau pesan saat meminta kelengkapan.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <Label className="space-y-1 text-sm font-medium">
            <span>Catatan petugas</span>
            <Textarea
              name="note"
              defaultValue={detail.completionRequest.note ?? detail.internalNote}
              rows={5}
              maxLength={5000}
              placeholder="Tulis catatan progres, alasan penolakan dokumen, atau instruksi kelengkapan..."
            />
          </Label>
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200">
            <FileUp className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Unggah hasil layanan</h2>
            <p className="text-muted-foreground text-xs">
              Unggah PDF/JPG/PNG maksimal 5 MB per file sebelum menyelesaikan pengajuan.
            </p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <Label className="space-y-1 text-sm font-medium">
            <span>Berkas hasil layanan</span>
            <input
              name="outputFiles"
              type="file"
              multiple
              accept="application/pdf,image/jpeg,image/png"
              className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Label>
          {detail.outputDocuments.length > 0 ? (
            <div className="rounded-xl border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dokumen terunggah
              </p>
              <ul className="mt-2 space-y-2 text-sm">
                {detail.outputDocuments.map((document) => (
                  <li key={document.id} className="flex items-center justify-between gap-3">
                    <span className="truncate">{document.fileName}</span>
                    <a
                      href={document.secureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-700 underline underline-offset-2 dark:text-blue-300"
                    >
                      Buka
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="rounded-xl bg-violet-100 p-2 text-violet-700 dark:bg-violet-950 dark:text-violet-200">
            <Clock3 className="size-4" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h2 className="text-sm font-semibold">Aksi status</h2>
            <p className="text-muted-foreground text-xs">
              Pilih satu aksi untuk menyimpan progres, meminta kelengkapan, atau menyelesaikan penerbitan.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Button type="submit" name="action" value="save_progress" disabled={pending} variant="outline">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Simpan Progres
          </Button>
          <Button
            type="submit"
            name="action"
            value="request_completion"
            disabled={pending}
            variant="outline"
            className="border-amber-300 text-amber-800 hover:bg-amber-50 dark:border-amber-900 dark:text-amber-200 dark:hover:bg-amber-950/40"
          >
            <PauseCircle className="size-4" aria-hidden="true" />
            Minta Kelengkapan
          </Button>
          <Button type="submit" name="action" value="complete_and_publish" disabled={pending}>
            <Send className="size-4" aria-hidden="true" />
            Selesaikan &amp; Terbitkan
          </Button>
        </div>
        <ActionMessage state={state} />
      </section>
    </form>
  );
}
