"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/guards";
import {
  submissionProcessingFormSchema,
  updateSubmissionProcessing,
} from "@/lib/service-applications/processing";

export interface SubmissionProcessingActionState {
  error: string | null;
  success: string | null;
}

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function collectChecklistIds(formData: FormData): string[] {
  return formData
    .getAll("checklistIds")
    .flatMap((value) => (typeof value === "string" && value.trim() ? [value] : []));
}

function collectDocumentDecisions(formData: FormData) {
  const grouped = new Map<string, { id: string; status: string; note: string }>();

  for (const [key, value] of formData.entries()) {
    const match = /^documentDecisions\.(\d+)\.(id|status|note)$/.exec(key);
    if (!match) continue;
    const index = match[1];
    const field = match[2] as "id" | "status" | "note";
    const entry = grouped.get(index) ?? { id: "", status: "pending", note: "" };
    entry[field] = typeof value === "string" ? value : "";
    grouped.set(index, entry);
  }

  return [...grouped.values()].filter((entry) => entry.id.trim());
}

function collectOutputFiles(formData: FormData): File[] {
  return formData
    .getAll("outputFiles")
    .flatMap((value) => (value instanceof File && value.size > 0 ? [value] : []));
}

function toErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Gagal menyimpan perubahan penanganan pengajuan.";
  }
  switch (error.message) {
    case "FORBIDDEN":
      return "Anda tidak memiliki akses untuk mengelola pengajuan ini.";
    case "CHECKLIST_INCOMPLETE":
      return "Checklist wajib belum lengkap. Selesaikan seluruh langkah sebelum menerbitkan hasil layanan.";
    case "DOCUMENTS_INCOMPLETE":
      return "Masih ada dokumen wajib yang belum ditandai valid.";
    case "OUTPUT_REQUIRED":
      return "Unggah minimal satu hasil layanan sebelum menyelesaikan pengajuan.";
    case "NOT_FOUND":
      return "Pengajuan tidak ditemukan atau sudah tidak dapat diakses.";
    default:
      return error.message || "Gagal menyimpan perubahan penanganan pengajuan.";
  }
}

function toSuccessMessage(action: string): string {
  if (action === "request_completion") {
    return "Permintaan kelengkapan berhasil dikirim dan SLA dijeda.";
  }
  if (action === "complete_and_publish") {
    return "Pengajuan berhasil diselesaikan dan hasil layanan diterbitkan.";
  }
  return "Progres penanganan berhasil disimpan.";
}

export async function saveSubmissionProcessing(
  _previousState: SubmissionProcessingActionState,
  formData: FormData,
): Promise<SubmissionProcessingActionState> {
  void _previousState;

  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });
  const id = getString(formData, "id");

  const parsed = submissionProcessingFormSchema.safeParse({
    action: getString(formData, "action"),
    note: getString(formData, "note"),
    checklistIds: collectChecklistIds(formData),
    documentDecisions: collectDocumentDecisions(formData),
  });

  if (!id) {
    return { error: "ID pengajuan tidak valid.", success: null };
  }
  if (!parsed.success) {
    return {
      error: "Form penanganan tidak valid. Periksa checklist, verifikasi dokumen, dan catatan.",
      success: null,
    };
  }

  try {
    await updateSubmissionProcessing({
      id,
      session,
      action: parsed.data.action,
      note: parsed.data.note,
      checklistIds: parsed.data.checklistIds,
      documentDecisions: parsed.data.documentDecisions,
      outputFiles: collectOutputFiles(formData),
    });
  } catch (error) {
    return { error: toErrorMessage(error), success: null };
  }

  revalidatePath("/asn/dashboard");
  revalidatePath("/asn/management");
  revalidatePath(`/asn/management/${id}`);
  revalidatePath(`/asn/dashboard/submission?id=${id}`);
  revalidatePath(`/asn/dashboard/submissions/${id}`);

  return {
    error: null,
    success: toSuccessMessage(parsed.data.action),
  };
}
