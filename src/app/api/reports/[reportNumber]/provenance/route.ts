import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  reviewActivities,
  auditEvents,
  ticketSubmissionDetails,
  tickets,
  tenants,
} from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

const reportNumberSchema = z.string().trim().min(1).max(40);
const statusLabels: Record<string, string> = {
  verified: "Diverifikasi",
  in_progress: "Tindak lanjut dimulai",
  resolved: "Diselesaikan",
  rejected: "Ditolak",
  closed: "Ditutup",
};
const publicStaffRoles = new Set([
  "maker",
  "checker",
  "asn",
  "staff",
  "admin",
  "superadmin",
]);

function publicActorRole(metadata: unknown): string {
  if (typeof metadata !== "object" || metadata === null) return "PETUGAS";
  const actorRole = (metadata as { actorRole?: unknown }).actorRole;
  if (typeof actorRole !== "string") return "PETUGAS";
  const role = actorRole
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .find((value) => publicStaffRoles.has(value));
  return role?.toUpperCase() ?? "PETUGAS";
}

interface RouteContext {
  readonly params: Promise<{ readonly reportNumber: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const parsedReportNumber = reportNumberSchema.safeParse(
    (await context.params).reportNumber,
  );
  if (!parsedReportNumber.success) {
    return NextResponse.json(
      { error: "Nomor laporan tidak valid." },
      { status: 400 },
    );
  }

  try {
    const database = db();
    const [report] = await database
      .select({
        id: tickets.id,
        tenantId: tickets.tenantId,
        submittedAt: tickets.submittedAt,
        createdAt: tickets.createdAt,
        source: tickets.provenanceSource,
      })
      .from(ticketSubmissionDetails)
      .innerJoin(tickets, eq(ticketSubmissionDetails.ticketId, tickets.id))
      .innerJoin(tenants, eq(tickets.tenantId, tenants.id))
      .where(
        and(
          eq(ticketSubmissionDetails.reportNumber, parsedReportNumber.data),
          eq(ticketSubmissionDetails.isPublic, true),
          eq(tenants.status, "active"),
        ),
      )
      .limit(1);

    if (!report) {
      return NextResponse.json(
        { error: "Laporan tidak ditemukan atau tidak tersedia untuk publik." },
        { status: 404 },
      );
    }

    const updates = await database
      .select({
        status: reviewActivities.status,
        actorId: reviewActivities.actorId,
        createdAt: reviewActivities.createdAt,
      })
      .from(reviewActivities)
      .where(
        and(
          eq(reviewActivities.tenantId, report.tenantId),
          eq(reviewActivities.itemType, "report"),
          eq(reviewActivities.itemId, report.id),
          eq(reviewActivities.activityType, "public_update"),
        ),
      )
      .orderBy(asc(reviewActivities.createdAt));

    const auditRows = await database
      .select({
        actorId: auditEvents.actorId,
        metadata: auditEvents.metadata,
        createdAt: auditEvents.createdAt,
      })
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.targetTable, "tickets"),
          eq(auditEvents.targetId, report.id),
          eq(auditEvents.action, "review.status.updated"),
          sql`${auditEvents.metadata}->>'tenantId' = ${report.tenantId}`,
        ),
      )
      .orderBy(asc(auditEvents.createdAt));
    const rolesByActorAndStatus = new Map<string, string[]>();
    for (const audit of auditRows) {
      if (!audit.actorId || typeof audit.metadata !== "object" || !audit.metadata) {
        continue;
      }
      const metadata = audit.metadata as { status?: unknown };
      if (typeof metadata.status !== "string") continue;
      const key = `${audit.actorId}:${metadata.status}`;
      const roles = rolesByActorAndStatus.get(key) ?? [];
      roles.push(publicActorRole(audit.metadata));
      rolesByActorAndStatus.set(key, roles);
    }

    const timeline = [
      {
        stage: "Dikirim",
        role: "WARGA",
        status: "submitted",
        timestamp: (report.submittedAt ?? report.createdAt).toISOString(),
      },
      ...updates
        .filter(
          (update): update is typeof update & { status: string } =>
            Boolean(update.status && statusLabels[update.status]),
        )
        .map((update) => ({
          stage: statusLabels[update.status],
          role:
            rolesByActorAndStatus
              .get(`${update.actorId}:${update.status}`)
              ?.shift() ?? "PETUGAS",
          status: update.status,
          timestamp: update.createdAt.toISOString(),
        })),
    ];

    return NextResponse.json(
      {
        source: report.source,
        validationTimeline: timeline,
        aiConfidence: null,
        aiConfidenceNote:
          "Tidak ada confidence klasifikasi AI yang tercatat untuk laporan ini.",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=180",
        },
      },
    );
  } catch (error) {
    logger.error("reports.provenance_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Gagal memuat sumber dan riwayat validasi laporan." },
      { status: 500 },
    );
  }
}
