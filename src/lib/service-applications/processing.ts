import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { uploadToCloudinary } from "@/lib/cloudinary/upload";
import type { Session } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  reviewActivities,
  serviceApplications,
  users,
} from "@/lib/db/schema";

export const PROCESSING_STATUS = {
  submitted: "submitted",
  processing: "processing",
  waitingForCitizen: "waiting_for_citizen",
  completed: "completed",
} as const;

export type ProcessingStatus =
  (typeof PROCESSING_STATUS)[keyof typeof PROCESSING_STATUS];

export const COMPLETION_ACTIONS = [
  "save_progress",
  "request_completion",
  "complete_and_publish",
] as const;

export type CompletionAction = (typeof COMPLETION_ACTIONS)[number];

export interface ProcessingChecklistItem {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly completed: boolean;
}

export interface ProcessingDocumentRequirement {
  readonly id: string;
  readonly label: string;
  readonly required: boolean;
  readonly citizenDocument: {
    readonly fileName: string;
    readonly url: string | null;
    readonly mimeType: string | null;
  } | null;
  readonly verificationStatus: "pending" | "valid" | "invalid";
  readonly verificationNote: string | null;
}

export interface ProcessingOutputDocument {
  readonly id: string;
  readonly fileName: string;
  readonly mimeType: string | null;
  readonly size: number | null;
  readonly publicId: string;
  readonly secureUrl: string;
  readonly uploadedAt: string;
  readonly uploadedBy: string;
}

export interface ProcessingTimelineItem {
  readonly id: string;
  readonly type: string;
  readonly message: string;
  readonly createdAt: string;
  readonly actorId: string;
}

export interface SubmissionProcessingDetail {
  readonly id: string;
  readonly trackingNumber: string;
  readonly serviceName: string;
  readonly agency: string;
  readonly status: ProcessingStatus;
  readonly submittedAt: string;
  readonly assigneeId: string | null;
  readonly applicantName: string;
  readonly contactEmail: string;
  readonly routeKey: string;
  readonly payload: Record<string, unknown>;
  readonly sla: {
    readonly targetMinutes: number;
    readonly elapsedMinutes: number;
    readonly remainingMinutes: number;
    readonly paused: boolean;
    readonly state: "normal" | "warning" | "overdue";
    readonly startedAt: string;
    readonly pausedAt: string | null;
    readonly pausedTotalMinutes: number;
  };
  readonly checklist: readonly ProcessingChecklistItem[];
  readonly documents: readonly ProcessingDocumentRequirement[];
  readonly internalNote: string;
  readonly completionRequest: {
    readonly note: string | null;
    readonly requestedAt: string | null;
  };
  readonly outputDocuments: readonly ProcessingOutputDocument[];
  readonly timeline: readonly ProcessingTimelineItem[];
}

interface ProcessingStateRecord {
  readonly status: ProcessingStatus;
  readonly slaTargetMinutes: number;
  readonly processingStartedAt: string;
  readonly slaPausedAt: string | null;
  readonly slaPausedTotalMinutes: number;
  readonly checklist: readonly ProcessingChecklistItem[];
  readonly documents: readonly ProcessingDocumentRequirement[];
  readonly internalNote: string;
  readonly completionRequest: {
    readonly note: string | null;
    readonly requestedAt: string | null;
  };
  readonly outputDocuments: readonly ProcessingOutputDocument[];
}

interface ServiceApplicationRow {
  readonly id: string;
  readonly tenantId: string;
  readonly trackingNumber: string;
  readonly serviceName: string;
  readonly agency: string;
  readonly status: string;
  readonly submittedAt: Date;
  readonly assigneeId: string | null;
  readonly applicantName: string;
  readonly contactEmail: string;
  readonly routeKey: string;
  readonly payload: Record<string, unknown>;
}

const MAX_OUTPUT_SIZE = 5 * 1024 * 1024;
const OUTPUT_FILE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const OUTPUT_EXTENSIONS = new Set(["pdf", "jpg", "jpeg", "png"]);
const SUPERVISOR_ROLES = new Set(["admin", "superadmin"]);

const verificationStatusSchema = z.enum(["pending", "valid", "invalid"]);

const checklistItemSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(255),
  required: z.boolean().default(true),
  completed: z.boolean().default(false),
});

const documentSchema = z.object({
  id: z.string().min(1).max(120),
  label: z.string().min(1).max(255),
  required: z.boolean().default(true),
  citizenDocument: z
    .object({
      fileName: z.string().min(1).max(255),
      url: z.string().max(2048).nullable().default(null),
      mimeType: z.string().max(255).nullable().default(null),
    })
    .nullable()
    .default(null),
  verificationStatus: verificationStatusSchema.default("pending"),
  verificationNote: z.string().max(1000).nullable().default(null),
});

const outputDocumentSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().max(255).nullable().default(null),
  size: z.number().int().nonnegative().nullable().default(null),
  publicId: z.string().min(1),
  secureUrl: z.string().min(1),
  uploadedAt: z.string().datetime({ offset: true }),
  uploadedBy: z.string().uuid(),
});

const processingStateSchema = z.object({
  status: z.enum([
    PROCESSING_STATUS.submitted,
    PROCESSING_STATUS.processing,
    PROCESSING_STATUS.waitingForCitizen,
    PROCESSING_STATUS.completed,
  ]),
  slaTargetMinutes: z.number().int().positive().default(2_880),
  processingStartedAt: z.string().datetime({ offset: true }),
  slaPausedAt: z.string().datetime({ offset: true }).nullable().default(null),
  slaPausedTotalMinutes: z.number().int().nonnegative().default(0),
  checklist: z.array(checklistItemSchema).default([]),
  documents: z.array(documentSchema).default([]),
  internalNote: z.string().max(5_000).default(""),
  completionRequest: z
    .object({
      note: z.string().max(2_000).nullable().default(null),
      requestedAt: z.string().datetime({ offset: true }).nullable().default(null),
    })
    .default({ note: null, requestedAt: null }),
  outputDocuments: z.array(outputDocumentSchema).default([]),
});

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function createSlug(value: string, fallback: string): string {
  const normalized = value
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

function deriveChecklist(payload: Record<string, unknown>): ProcessingChecklistItem[] {
  const data = payload.data;
  if (!data || typeof data !== "object") {
    return [
      {
        id: "review-submission",
        label: "Tinjau kelengkapan pengajuan",
        required: true,
        completed: false,
      },
    ];
  }

  const record = data as Record<string, unknown>;
  const serviceSpecific = [
    asString(record.tujuanIzin) && "Verifikasi tujuan pengajuan",
    asString(record.detailKebutuhan) && "Validasi detail kebutuhan layanan",
    asString(record.uraian) && "Periksa uraian permohonan",
    asString(record.namaUsaha) && "Cek data usaha/instansi terkait",
  ].filter((value): value is string => Boolean(value));

  const labels = [
    "Tinjau data formulir warga",
    "Verifikasi seluruh dokumen wajib",
    ...serviceSpecific,
  ];

  return labels.map((label, index) => ({
    id: `${createSlug(label, `step-${index + 1}`)}-${index + 1}`,
    label,
    required: true,
    completed: false,
  }));
}

function extractCitizenDocuments(
  payload: Record<string, unknown>,
): ProcessingDocumentRequirement[] {
  const data = payload.data;
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, unknown>;

  return Object.entries(record)
    .flatMap(([key, value]) => {
      if (!value || typeof value !== "object") return [];
      const entry = value as Record<string, unknown>;
      const url = asString(entry.cloudinarySecureUrl) ?? asString(entry.secureUrl);
      const fileName =
        asString(entry.fileName) ??
        asString(entry.originalName) ??
        asString(entry.name) ??
        key;
      if (!url && !asString(entry.publicId)) return [];
      return [
        {
          id: createSlug(key, key),
          label: fileName,
          required: true,
          citizenDocument: {
            fileName,
            url,
            mimeType: asString(entry.mimeType),
          },
          verificationStatus: "pending" as const,
          verificationNote: null,
        },
      ];
    })
    .filter((value, index, array) =>
      array.findIndex((candidate) => candidate.id === value.id) === index,
    );
}

function normalizeStatus(status: string): ProcessingStatus {
  if (status === PROCESSING_STATUS.processing || status === "verified") {
    return PROCESSING_STATUS.processing;
  }
  if (status === PROCESSING_STATUS.waitingForCitizen || status === "rejected") {
    return PROCESSING_STATUS.waitingForCitizen;
  }
  if (status === PROCESSING_STATUS.completed || status === "resolved" || status === "closed") {
    return PROCESSING_STATUS.completed;
  }
  return PROCESSING_STATUS.submitted;
}

function parseProcessingState(row: ServiceApplicationRow): ProcessingStateRecord {
  const payloadState =
    row.payload.processingState && typeof row.payload.processingState === "object"
      ? row.payload.processingState
      : null;

  const parsed = processingStateSchema.safeParse(payloadState);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    status: normalizeStatus(row.status),
    slaTargetMinutes: 2_880,
    processingStartedAt: row.submittedAt.toISOString(),
    slaPausedAt: null,
    slaPausedTotalMinutes: 0,
    checklist: deriveChecklist(row.payload),
    documents: extractCitizenDocuments(row.payload),
    internalNote: "",
    completionRequest: { note: null, requestedAt: null },
    outputDocuments: [],
  };
}

function diffMinutes(start: string, end: string): number {
  return Math.max(
    0,
    Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 60_000),
  );
}

export function computeSlaSnapshot(state: Pick<
  ProcessingStateRecord,
  "processingStartedAt" | "slaPausedAt" | "slaPausedTotalMinutes" | "slaTargetMinutes"
>): SubmissionProcessingDetail["sla"] {
  const now = new Date().toISOString();
  const activeEnd = state.slaPausedAt ?? now;
  const elapsedMinutes = Math.max(
    0,
    diffMinutes(state.processingStartedAt, activeEnd) - state.slaPausedTotalMinutes,
  );
  const remainingMinutes = state.slaTargetMinutes - elapsedMinutes;
  return {
    targetMinutes: state.slaTargetMinutes,
    elapsedMinutes,
    remainingMinutes,
    paused: Boolean(state.slaPausedAt),
    state:
      remainingMinutes < 0
        ? "overdue"
        : remainingMinutes <= 240
          ? "warning"
          : "normal",
    startedAt: state.processingStartedAt,
    pausedAt: state.slaPausedAt,
    pausedTotalMinutes: state.slaPausedTotalMinutes,
  };
}

export function canManageSubmission(
  session: Session,
  application: Pick<ServiceApplicationRow, "tenantId" | "assigneeId">,
): boolean {
  if (session.tenantId !== application.tenantId) return false;
  if (session.roles.some((role) => SUPERVISOR_ROLES.has(role))) return true;
  return application.assigneeId === session.userId;
}

async function getApplicationRow(id: string): Promise<ServiceApplicationRow | null> {
  const [row] = await db()
    .select({
      id: serviceApplications.id,
      tenantId: serviceApplications.tenantId,
      trackingNumber: serviceApplications.trackingNumber,
      serviceName: serviceApplications.serviceName,
      agency: serviceApplications.agency,
      status: serviceApplications.status,
      submittedAt: serviceApplications.submittedAt,
      assigneeId: serviceApplications.assigneeId,
      applicantName: serviceApplications.applicantName,
      contactEmail: serviceApplications.contactEmail,
      routeKey: serviceApplications.routeKey,
      payload: serviceApplications.payload,
    })
    .from(serviceApplications)
    .where(eq(serviceApplications.id, id))
    .limit(1);
  return row ?? null;
}

export async function getSubmissionProcessingDetail(
  id: string,
  session: Session,
): Promise<SubmissionProcessingDetail | null> {
  const row = await getApplicationRow(id);
  if (!row || !canManageSubmission(session, row)) return null;

  const state = parseProcessingState(row);
  const activities = await db()
    .select({
      id: reviewActivities.id,
      activityType: reviewActivities.activityType,
      message: reviewActivities.message,
      createdAt: reviewActivities.createdAt,
      actorId: reviewActivities.actorId,
    })
    .from(reviewActivities)
    .where(
      and(
        eq(reviewActivities.tenantId, row.tenantId),
        eq(reviewActivities.itemType, "service_application"),
        eq(reviewActivities.itemId, row.id),
      ),
    )
    .orderBy(desc(reviewActivities.createdAt));

  return {
    id: row.id,
    trackingNumber: row.trackingNumber,
    serviceName: row.serviceName,
    agency: row.agency,
    status: state.status,
    submittedAt: row.submittedAt.toISOString(),
    assigneeId: row.assigneeId,
    applicantName: row.applicantName,
    contactEmail: row.contactEmail,
    routeKey: row.routeKey,
    payload: row.payload,
    sla: computeSlaSnapshot(state),
    checklist: state.checklist,
    documents: state.documents,
    internalNote: state.internalNote,
    completionRequest: state.completionRequest,
    outputDocuments: state.outputDocuments,
    timeline: activities.map((item) => ({
      id: item.id,
      type: item.activityType,
      message: item.message,
      createdAt: item.createdAt.toISOString(),
      actorId: item.actorId,
    })),
  };
}

function serializeState(state: ProcessingStateRecord): Record<string, unknown> {
  return {
    status: state.status,
    slaTargetMinutes: state.slaTargetMinutes,
    processingStartedAt: state.processingStartedAt,
    slaPausedAt: state.slaPausedAt,
    slaPausedTotalMinutes: state.slaPausedTotalMinutes,
    checklist: state.checklist,
    documents: state.documents,
    internalNote: state.internalNote,
    completionRequest: state.completionRequest,
    outputDocuments: state.outputDocuments,
  };
}

function mergePayload(
  payload: Record<string, unknown>,
  state: ProcessingStateRecord,
): Record<string, unknown> {
  return {
    ...payload,
    processingState: serializeState(state),
  };
}

async function appendActivity(
  tenantId: string,
  itemId: string,
  actorId: string,
  activityType: "internal_note" | "public_update" | "assignment",
  message: string,
  status: string,
): Promise<void> {
  await db().insert(reviewActivities).values({
    id: randomUUID(),
    tenantId,
    itemType: "service_application",
    itemId,
    activityType,
    status,
    message,
    actorId,
    createdAt: new Date(),
  });
}

function ensureOutputFile(file: File): void {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (
    !OUTPUT_FILE_TYPES.has(file.type) ||
    !OUTPUT_EXTENSIONS.has(extension) ||
    file.name.length > 255
  ) {
    throw new Error(`File ${file.name} harus PDF/JPG/PNG.`);
  }
  if (file.size < 1 || file.size > MAX_OUTPUT_SIZE) {
    throw new Error(`Ukuran file ${file.name} maksimal 5 MB.`);
  }
}

async function uploadOutputDocuments(
  files: readonly File[],
  tenantId: string,
  actorId: string,
): Promise<ProcessingOutputDocument[]> {
  const uploads: ProcessingOutputDocument[] = [];
  for (const file of files) {
    ensureOutputFile(file);
    const result = await uploadToCloudinary({
      buffer: Buffer.from(await file.arrayBuffer()),
      tenantId,
      fileName: file.name,
      mimeType: file.type,
      module: "service-applications",
    });
    uploads.push({
      id: randomUUID(),
      fileName: result.fileName,
      mimeType: result.mimeType,
      size: result.size,
      publicId: result.publicId,
      secureUrl: result.secureUrl,
      uploadedAt: new Date().toISOString(),
      uploadedBy: actorId,
    });
  }
  return uploads;
}

export async function updateSubmissionProcessing(
  input: {
    readonly id: string;
    readonly session: Session;
    readonly action: CompletionAction;
    readonly note: string;
    readonly checklistIds: readonly string[];
    readonly documentDecisions: ReadonlyArray<{
      readonly id: string;
      readonly status: "pending" | "valid" | "invalid";
      readonly note: string;
    }>;
    readonly outputFiles: readonly File[];
  },
): Promise<SubmissionProcessingDetail> {
  const row = await getApplicationRow(input.id);
  if (!row || !canManageSubmission(input.session, row)) {
    throw new Error("FORBIDDEN");
  }

  const state = parseProcessingState(row);
  const nextDocuments = state.documents.map((document) => {
    const decision = input.documentDecisions.find((item) => item.id === document.id);
    if (!decision) return document;
    return {
      ...document,
      verificationStatus: decision.status,
      verificationNote: decision.note.trim() || null,
    };
  });

  const completedIds = new Set(input.checklistIds);
  const nextChecklist = state.checklist.map((item) => ({
    ...item,
    completed: completedIds.has(item.id),
  }));

  let nextStatus: ProcessingStatus = PROCESSING_STATUS.processing;
  let pausedAt: string | null = state.slaPausedAt;
  let pausedTotalMinutes = state.slaPausedTotalMinutes;
  let completionRequest = state.completionRequest;
  let outputDocuments = state.outputDocuments;

  if (state.slaPausedAt && input.action !== "request_completion") {
    pausedTotalMinutes += diffMinutes(state.slaPausedAt, new Date().toISOString());
    pausedAt = null;
  }

  if (input.outputFiles.length > 0) {
    const uploaded = await uploadOutputDocuments(
      input.outputFiles,
      row.tenantId,
      input.session.userId,
    );
    outputDocuments = [...state.outputDocuments, ...uploaded];
  }

  switch (input.action) {
    case "save_progress":
      nextStatus = PROCESSING_STATUS.processing;
      completionRequest = { note: null, requestedAt: null };
      break;
    case "request_completion":
      nextStatus = PROCESSING_STATUS.waitingForCitizen;
      pausedAt = state.slaPausedAt ?? new Date().toISOString();
      completionRequest = {
        note: input.note.trim() || null,
        requestedAt: new Date().toISOString(),
      };
      break;
    case "complete_and_publish": {
      const incompleteChecklist = nextChecklist.some(
        (item) => item.required && !item.completed,
      );
      if (incompleteChecklist) {
        throw new Error("CHECKLIST_INCOMPLETE");
      }
      const invalidDocument = nextDocuments.some(
        (item) => item.required && item.verificationStatus !== "valid",
      );
      if (invalidDocument) {
        throw new Error("DOCUMENTS_INCOMPLETE");
      }
      if (outputDocuments.length === 0) {
        throw new Error("OUTPUT_REQUIRED");
      }
      nextStatus = PROCESSING_STATUS.completed;
      completionRequest = { note: null, requestedAt: null };
      pausedAt = null;
      break;
    }
  }

  const nextState: ProcessingStateRecord = {
    ...state,
    status: nextStatus,
    slaPausedAt: pausedAt,
    slaPausedTotalMinutes: pausedTotalMinutes,
    checklist: nextChecklist,
    documents: nextDocuments,
    internalNote: input.note.trim(),
    completionRequest,
    outputDocuments,
  };

  const persistedPayload = mergePayload(row.payload, nextState);
  await db()
    .update(serviceApplications)
    .set({
      status: nextStatus,
      payload: persistedPayload,
      updatedAt: new Date(),
    })
    .where(eq(serviceApplications.id, row.id));

  await appendActivity(
    row.tenantId,
    row.id,
    input.session.userId,
    input.action === "request_completion" ? "public_update" : "internal_note",
    input.action === "request_completion"
      ? input.note.trim() || "Petugas meminta kelengkapan tambahan dari warga."
      : input.action === "complete_and_publish"
        ? "Pengajuan diselesaikan dan hasil layanan diterbitkan."
        : input.note.trim() || "Progres penanganan diperbarui.",
    nextStatus,
  );

  const detail = await getSubmissionProcessingDetail(row.id, input.session);
  if (!detail) {
    throw new Error("NOT_FOUND");
  }
  return detail;
}

export const submissionProcessingFormSchema = z.object({
  action: z.enum(COMPLETION_ACTIONS),
  note: z.string().max(5_000).default(""),
  checklistIds: z.array(z.string()).default([]),
  documentDecisions: z
    .array(
      z.object({
        id: z.string().min(1),
        status: verificationStatusSchema,
        note: z.string().max(1_000).default(""),
      }),
    )
    .default([]),
});

export async function listAssignableStaff(
  tenantId: string,
): Promise<readonly { id: string; name: string }[]> {
  return db()
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(users.name);
}
