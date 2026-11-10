"use server";

import { randomUUID } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  asnProfiles,
  reviewActivities,
  serviceApplications,
  ticketEvidence,
  ticketSubmissionDetails,
  tickets,
  users,
} from "@/lib/db/schema";
import {
  canChangeReviewStatus,
  isReviewStatus,
  type ReviewStatus,
} from "@/modules/review-workflow/status";

export interface ReviewActionState {
  error: string | null;
  success: string | null;
}

const initialState: ReviewActionState = { error: null, success: null };
const uuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
const itemTypeSchema = z.enum(["report", "service_application"]);

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function commonFields(formData: FormData) {
  return {
    itemType: getString(formData, "itemType"),
    itemId: getString(formData, "itemId"),
  };
}

export async function saveReviewAssignment(
  _previousState: ReviewActionState = initialState,
  formData: FormData,
): Promise<ReviewActionState> {
  void _previousState;
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });
  const parsed = z
    .object({
      itemType: itemTypeSchema,
      itemId: uuidLike,
      assigneeId: z.union([uuidLike, z.literal("self")]).nullable(),
    })
    .safeParse({
      ...commonFields(formData),
      assigneeId: getString(formData, "assigneeId") || null,
    });

  if (!parsed.success) {
    return { error: "Pilihan petugas tidak valid.", success: null };
  }

  const { itemType, itemId } = parsed.data;
  const database = db();
  const requestedAssigneeId = parsed.data.assigneeId;
  const assigneeId = requestedAssigneeId === "self" ? session.userId : requestedAssigneeId;
  let assignedName: string | null = null;

  if (assigneeId) {
    const [staff] = await database
      .select({ id: users.id, name: users.name })
      .from(users)
      .innerJoin(asnProfiles, eq(asnProfiles.userId, users.id))
      .where(
        and(
          eq(users.id, assigneeId),
          eq(users.tenantId, session.tenantId),
          eq(users.status, "active"),
          eq(asnProfiles.tenantId, session.tenantId),
        ),
      )
      .limit(1);
    if (!staff) {
      return {
        error: "Petugas harus merupakan ASN aktif pada instansi ini.",
        success: null,
      };
    }
    assignedName = staff.name;
  }

  const outcome = await database.transaction(async (transaction) => {
    let previousAssigneeId: string | null;
    if (itemType === "report") {
      const [current] = await transaction
        .select({ assigneeId: tickets.assigneeId })
        .from(tickets)
        .where(
          and(eq(tickets.id, itemId), eq(tickets.tenantId, session.tenantId)),
        )
        .limit(1);
      if (!current) return "not_found" as const;
      previousAssigneeId = current.assigneeId;
      if (previousAssigneeId !== assigneeId) {
        const [updated] = await transaction
          .update(tickets)
          .set({ assigneeId, updatedAt: new Date() })
          .where(
            and(
              eq(tickets.id, itemId),
              eq(tickets.tenantId, session.tenantId),
              previousAssigneeId
                ? eq(tickets.assigneeId, previousAssigneeId)
                : isNull(tickets.assigneeId),
            ),
          )
          .returning({ id: tickets.id });
        if (!updated) return "conflict" as const;
      }
    } else {
      const [current] = await transaction
        .select({ assigneeId: serviceApplications.assigneeId })
        .from(serviceApplications)
        .where(
          and(
            eq(serviceApplications.id, itemId),
            eq(serviceApplications.tenantId, session.tenantId),
          ),
        )
        .limit(1);
      if (!current) return "not_found" as const;
      previousAssigneeId = current.assigneeId;
      if (previousAssigneeId !== assigneeId) {
        const [updated] = await transaction
          .update(serviceApplications)
          .set({ assigneeId, updatedAt: new Date() })
          .where(
            and(
              eq(serviceApplications.id, itemId),
              eq(serviceApplications.tenantId, session.tenantId),
              previousAssigneeId
                ? eq(serviceApplications.assigneeId, previousAssigneeId)
                : isNull(serviceApplications.assigneeId),
            ),
          )
          .returning({ id: serviceApplications.id });
        if (!updated) return "conflict" as const;
      }
    }

    if (previousAssigneeId !== assigneeId) {
      await transaction.insert(reviewActivities).values({
        id: randomUUID(),
        tenantId: session.tenantId,
        itemType,
        itemId,
        activityType: "assignment",
        status: null,
        message: assigneeId
          ? `Penugasan diteruskan kepada ${assignedName}.`
          : "Penugasan dicabut.",
        actorId: session.userId,
        createdAt: new Date(),
      });
    }
    return "saved" as const;
  });

  if (outcome === "not_found") {
    return {
      error:
        itemType === "report"
          ? "Laporan tidak ditemukan."
          : "Pengajuan layanan tidak ditemukan.",
      success: null,
    };
  }
  if (outcome === "conflict") {
    return {
      error:
        "Penugasan berubah saat disimpan. Muat ulang halaman lalu coba kembali.",
      success: null,
    };
  }

  revalidatePath("/review");
  if (itemType === "service_application") {
    revalidatePath("/asn/dashboard");
    revalidatePath("/asn/queue");
    revalidatePath("/asn/submission");
    revalidatePath(`/asn/submission/${itemId}`);
    revalidatePath(`/asn/dashboard/submission?id=${itemId}`);
    revalidatePath(`/asn/dashboard/submissions/${itemId}`);
  }
  return { error: null, success: "Penugasan berhasil disimpan." };
}

export async function saveInternalReviewNote(
  _previousState: ReviewActionState = initialState,
  formData: FormData,
): Promise<ReviewActionState> {
  void _previousState;
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });
  const parsed = z
    .object({
      itemType: itemTypeSchema,
      itemId: uuidLike,
      message: z.string().trim().min(3).max(2_000),
    })
    .safeParse({
      ...commonFields(formData),
      message: getString(formData, "message"),
    });

  if (!parsed.success) {
    return {
      error: "Catatan internal wajib diisi (3–2.000 karakter).",
      success: null,
    };
  }

  const { itemType, itemId, message } = parsed.data;
  const database = db();
  const [item] =
    itemType === "report"
      ? await database
          .select({ id: tickets.id })
          .from(tickets)
          .where(
            and(eq(tickets.id, itemId), eq(tickets.tenantId, session.tenantId)),
          )
          .limit(1)
      : await database
          .select({ id: serviceApplications.id })
          .from(serviceApplications)
          .where(
            and(
              eq(serviceApplications.id, itemId),
              eq(serviceApplications.tenantId, session.tenantId),
            ),
          )
          .limit(1);

  if (!item) {
    return { error: "Item review tidak ditemukan.", success: null };
  }

  await database.insert(reviewActivities).values({
    id: randomUUID(),
    tenantId: session.tenantId,
    itemType,
    itemId,
    activityType: "internal_note",
    status: null,
    message,
    actorId: session.userId,
    createdAt: new Date(),
  });

  revalidatePath("/review");
  return { error: null, success: "Catatan internal tersimpan." };
}

export async function publishReviewUpdate(
  _previousState: ReviewActionState = initialState,
  formData: FormData,
): Promise<ReviewActionState> {
  void _previousState;
  const session = await requireAuth({
    roles: ["asn", "staff", "admin", "superadmin"],
  });
  const rawStatus = getString(formData, "status");
  const parsed = z
    .object({
      itemType: itemTypeSchema,
      itemId: uuidLike,
      status: z.string(),
      message: z.string().trim().min(3).max(2_000),
    })
    .safeParse({
      ...commonFields(formData),
      status: rawStatus,
      message: getString(formData, "message"),
    });

  if (!parsed.success || !isReviewStatus(parsed.data.status)) {
    return {
      error: "Pilih status dan isi pesan publik (3–2.000 karakter).",
      success: null,
    };
  }

  const { itemType, itemId, message } = parsed.data;
  const targetStatus: ReviewStatus = parsed.data.status;
  const database = db();
  const now = new Date();

  const saved = await database.transaction(async (transaction) => {
    if (itemType === "report") {
      const [report] = await transaction
        .select({
          status: tickets.status,
          assigneeId: tickets.assigneeId,
          firstRespondedAt: tickets.firstRespondedAt,
          isPublic: ticketSubmissionDetails.isPublic,
        })
        .from(tickets)
        .innerJoin(
          ticketSubmissionDetails,
          eq(ticketSubmissionDetails.ticketId, tickets.id),
        )
        .where(
          and(eq(tickets.id, itemId), eq(tickets.tenantId, session.tenantId)),
        )
        .limit(1);
      if (!report) return "not_found" as const;
      if (!report.isPublic) return "private_report" as const;
      if (!canChangeReviewStatus(itemType, report.status, targetStatus)) {
        return "invalid_transition" as const;
      }
      if (
        targetStatus === "in_progress" &&
        targetStatus !== report.status &&
        !report.assigneeId
      ) {
        return "assignee_required" as const;
      }
      if (targetStatus === "resolved" && report.status !== "resolved") {
        const [evidence] = await transaction
          .select({ id: ticketEvidence.id })
          .from(ticketEvidence)
          .where(
            and(
              eq(ticketEvidence.ticketId, itemId),
              eq(ticketEvidence.tenantId, session.tenantId),
              eq(ticketEvidence.purpose, "qc"),
            ),
          )
          .limit(1);
        if (!evidence) return "evidence_required" as const;
      }

      if (report.status !== targetStatus) {
        const [updated] = await transaction
          .update(tickets)
          .set({
            status: targetStatus,
            firstRespondedAt:
              targetStatus === "in_progress" && !report.firstRespondedAt
                ? now
                : report.firstRespondedAt,
            resolvedAt: targetStatus === "resolved" ? now : undefined,
            closedAt: targetStatus === "closed" ? now : undefined,
            updatedAt: now,
          })
          .where(
            and(
              eq(tickets.id, itemId),
              eq(tickets.tenantId, session.tenantId),
              eq(tickets.status, report.status),
            ),
          )
          .returning({ id: tickets.id });
        if (!updated) return "conflict" as const;
      }
    } else {
      const [application] = await transaction
        .select({
          status: serviceApplications.status,
          assigneeId: serviceApplications.assigneeId,
        })
        .from(serviceApplications)
        .where(
          and(
            eq(serviceApplications.id, itemId),
            eq(serviceApplications.tenantId, session.tenantId),
          ),
        )
        .limit(1);
      if (!application) return "not_found" as const;
      if (!canChangeReviewStatus(itemType, application.status, targetStatus)) {
        return "invalid_transition" as const;
      }
      if (
        targetStatus === "in_progress" &&
        targetStatus !== application.status &&
        !application.assigneeId
      ) {
        return "assignee_required" as const;
      }
      if (targetStatus !== application.status) {
        const [updated] = await transaction
          .update(serviceApplications)
          .set({ status: targetStatus, updatedAt: now })
          .where(
            and(
              eq(serviceApplications.id, itemId),
              eq(serviceApplications.tenantId, session.tenantId),
              eq(serviceApplications.status, application.status),
            ),
          )
          .returning({ id: serviceApplications.id });
        if (!updated) return "conflict" as const;
      }
    }

    await transaction.insert(reviewActivities).values({
      id: randomUUID(),
      tenantId: session.tenantId,
      itemType,
      itemId,
      activityType: "public_update",
      status: targetStatus,
      message,
      actorId: session.userId,
      createdAt: now,
    });
    return "saved" as const;
  });

  if (saved !== "saved") {
    let error: string;
    switch (saved) {
      case "not_found":
        error = "Item review tidak ditemukan.";
        break;
      case "private_report":
        error =
          "Laporan privat tidak dapat dipublikasikan melalui pelacakan umum.";
        break;
      case "invalid_transition":
        error = "Perubahan status tidak sesuai dengan alur review.";
        break;
      case "assignee_required":
        error = "Tetapkan petugas sebelum mengubah status menjadi Diproses.";
        break;
      case "evidence_required":
        error = "Bukti QC wajib tersedia sebelum laporan dinyatakan selesai.";
        break;
      case "conflict":
        error =
          "Item berubah saat disimpan. Muat ulang halaman lalu coba kembali.";
        break;
    }
    return { error, success: null };
  }

  revalidatePath("/review");
  if (itemType === "service_application") {
    revalidatePath("/asn/dashboard");
    revalidatePath("/asn/queue");
    revalidatePath("/asn/submission");
    revalidatePath(`/asn/submission/${itemId}`);
    revalidatePath(`/asn/dashboard/submission?id=${itemId}`);
    revalidatePath(`/asn/dashboard/submissions/${itemId}`);
    revalidatePath(`/citizen/service/${itemId}`);
  }
  return {
    error: null,
    success: "Pembaruan berhasil dipublikasikan kepada warga.",
  };
}
