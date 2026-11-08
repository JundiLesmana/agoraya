"use client";

import { useActionState } from "react";
import { Eye, LockKeyhole, Send, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReviewActionState } from "./actions";
import {
  publishReviewUpdate,
  saveInternalReviewNote,
  saveReviewAssignment,
} from "./actions";

type StaffOption = {
  id: string;
  name: string;
};

type ReviewWorkflowFormsProps = {
  itemType: "report" | "service_application";
  itemId: string;
  currentAssigneeId: string | null;
  staff: readonly StaffOption[];
  currentStatus: string;
  canPublishPublicUpdate: boolean;
  statusOptions: readonly { value: string; label: string }[];
};

const initialState: ReviewActionState = { error: null, success: null };

function ActionMessage({ state }: { state: ReviewActionState }) {
  if (state.error) {
    return (
      <p className="text-sm text-red-700 dark:text-red-300" role="alert">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p
        className="text-sm text-emerald-700 dark:text-emerald-300"
        role="status"
      >
        {state.success}
      </p>
    );
  }
  return null;
}

export function ReviewWorkflowForms({
  itemType,
  itemId,
  currentAssigneeId,
  staff,
  currentStatus,
  canPublishPublicUpdate,
  statusOptions,
}: ReviewWorkflowFormsProps) {
  const [assignmentState, assignmentAction, assignmentPending] = useActionState(
    saveReviewAssignment,
    initialState,
  );
  const [noteState, noteAction, notePending] = useActionState(
    saveInternalReviewNote,
    initialState,
  );
  const [updateState, updateAction, updatePending] = useActionState(
    publishReviewUpdate,
    initialState,
  );

  return (
    <div className="space-y-4">
      <section className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <UserRound className="text-primary size-4" aria-hidden="true" />
          Penugasan & serah terima
        </h2>
        <p className="text-muted-foreground mt-2 text-xs">
          Pilih petugas ASN aktif dari instansi ini.
        </p>
        <form action={assignmentAction} className="mt-3 space-y-3">
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemId" value={itemId} />
          <label className="block space-y-1">
            <span className="text-muted-foreground text-xs font-medium">
              Petugas pelaksana
            </span>
            <select
              name="assigneeId"
              defaultValue={currentAssigneeId ?? ""}
              className="border-input bg-background text-foreground h-10 w-full rounded-lg border px-3 text-sm"
            >
              <option value="">Belum ditugaskan</option>
              {staff.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="submit"
            variant="outline"
            disabled={assignmentPending}
            className="border-primary/30 text-primary hover:bg-primary/10 w-full"
          >
            <UserRound className="size-4" aria-hidden="true" />
            {assignmentPending ? "Menyimpan..." : "Simpan penugasan"}
          </Button>
          <ActionMessage state={assignmentState} />
        </form>
      </section>

      <section className="rounded-xl border border-sky-100 bg-sky-50 p-4 shadow-sm dark:border-sky-900 dark:bg-sky-950/30">
        <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
          <LockKeyhole className="text-primary size-4" aria-hidden="true" />
          Catatan internal
        </h2>
        <p className="text-primary mt-1 text-xs font-medium">
          Hanya petugas — tidak tampil ke warga
        </p>
        <form action={noteAction} className="mt-3 space-y-3">
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemId" value={itemId} />
          <label className="block space-y-1">
            <span className="text-muted-foreground text-xs font-medium">
              Catatan koordinasi
            </span>
            <textarea
              name="message"
              required
              minLength={3}
              maxLength={2000}
              rows={3}
              placeholder="Tulis catatan untuk petugas lain..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full resize-y rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <Button
            type="submit"
            variant="outline"
            disabled={notePending}
            className="border-primary/30 text-primary hover:bg-background"
          >
            <LockKeyhole className="size-4" aria-hidden="true" />
            {notePending ? "Menyimpan..." : "Simpan catatan internal"}
          </Button>
          <ActionMessage state={noteState} />
        </form>
      </section>

      <section className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Eye className="text-primary size-4" aria-hidden="true" />
          Pembaruan untuk warga
        </h2>
        <p className="text-muted-foreground mt-2 text-xs">
          Status saat ini:{" "}
          {statusOptions.find((option) => option.value === currentStatus)
            ?.label ?? currentStatus}
        </p>
        <form action={updateAction} className="mt-3 space-y-3">
          <input type="hidden" name="itemType" value={itemType} />
          <input type="hidden" name="itemId" value={itemId} />
          <label className="block space-y-1">
            <span className="text-muted-foreground text-xs font-medium">
              Status layanan
            </span>
            <select
              name="status"
              defaultValue={currentStatus}
              disabled={!canPublishPublicUpdate}
              className="border-input bg-background text-foreground h-10 w-full rounded-lg border px-3 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-muted-foreground text-xs font-medium">
              Pesan progres publik
            </span>
            <textarea
              name="message"
              required
              minLength={3}
              maxLength={2000}
              rows={4}
              disabled={!canPublishPublicUpdate}
              placeholder="Jelaskan progres yang boleh diketahui warga..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground w-full resize-y rounded-lg border px-3 py-2 text-sm"
            />
          </label>
          <p className="text-muted-foreground text-xs leading-5">
            Pesan ini akan tampil pada riwayat pengajuan warga. Jangan sertakan
            NIK, alamat kontak, atau catatan internal.
          </p>
          {!canPublishPublicUpdate ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Laporan ini bersifat privat dan tidak dapat dipublikasikan di
              pelacakan umum.
            </p>
          ) : null}
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs leading-5 text-blue-900 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
            Perubahan status akan tercatat dan terlihat oleh pemohon setelah
            dipublikasikan.
          </div>
          <Button
            type="submit"
            disabled={updatePending || !canPublishPublicUpdate}
            className="w-full"
          >
            <Send className="size-4" aria-hidden="true" />
            {updatePending ? "Mempublikasikan..." : "Tinjau & publikasikan"}
          </Button>
          <ActionMessage state={updateState} />
        </form>
      </section>
    </div>
  );
}
