import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { ticketSubmissionDetails, tickets } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { resolveReportingTenantId } from "@/lib/tenancy/reporting";
import { reportSubmissionSchema } from "@/lib/validators/report";

export const dynamic = "force-dynamic";

function isAsnRole(roles: readonly string[]): boolean {
  return roles.some((role) =>
    ["asn", "staff", "admin", "superadmin"].includes(role),
  );
}

export async function GET(): Promise<Response> {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json(
        { error: "Autentikasi diperlukan." },
        { status: 401 },
      );
    }
    if (!isAsnRole(session.roles)) {
      return NextResponse.json(
        { error: "Akses ASN diperlukan." },
        { status: 403 },
      );
    }
    const reportingTenantId = await resolveReportingTenantId();
    if (!reportingTenantId) {
      return NextResponse.json(
        { error: "Tenant penerima laporan belum dikonfigurasi atau tidak aktif." },
        { status: 503 },
      );
    }
    if (reportingTenantId !== session.tenantId) {
      logger.error("reports.recipient_tenant_mismatch", {
        userId: session.userId,
        sessionTenantId: session.tenantId,
        reportingTenantId,
      });
      return NextResponse.json(
        { error: "Akun ASN tidak berada pada tenant penerima laporan." },
        { status: 403 },
      );
    }

    const rows = await db()
      .select({
        id: tickets.id,
        title: tickets.title,
        description: tickets.description,
        category: tickets.category,
        status: tickets.status,
        submittedAt: tickets.submittedAt,
        responseDueAt: tickets.responseDueAt,
        reportNumber: ticketSubmissionDetails.reportNumber,
        subcategory: ticketSubmissionDetails.subcategory,
        province: ticketSubmissionDetails.province,
        city: ticketSubmissionDetails.city,
        address: ticketSubmissionDetails.address,
        reporterName: ticketSubmissionDetails.reporterName,
        isPublic: ticketSubmissionDetails.isPublic,
        showIdentity: ticketSubmissionDetails.showIdentity,
        attachments: ticketSubmissionDetails.attachmentNames,
      })
      .from(tickets)
      .innerJoin(
        ticketSubmissionDetails,
        eq(ticketSubmissionDetails.ticketId, tickets.id),
      )
      .where(eq(tickets.tenantId, reportingTenantId))
      .orderBy(desc(tickets.submittedAt));

    return NextResponse.json({ reports: rows });
  } catch (error) {
    logger.error("reports.list_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Gagal memuat laporan dari basis data." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Isi laporan tidak valid." },
      { status: 400 },
    );
  }

  const parsed = reportSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Periksa kembali kategori dan kelengkapan laporan." },
      { status: 400 },
    );
  }

  try {
    const tenantId = await resolveReportingTenantId();
    if (!tenantId) {
      return NextResponse.json(
        { error: "Tenant tujuan laporan belum dikonfigurasi." },
        { status: 503 },
      );
    }

    const database = db();
    const now = new Date();
    const id = randomUUID();
    const reportNumber = `LP-${now.toISOString().slice(0, 10).replaceAll("-", "")}-${id.slice(0, 12).toUpperCase()}`;
    const responseDueAt = new Date(now.getTime() + 72 * 60 * 60 * 1000);
    const input = parsed.data;

    await database.transaction(async (transaction) => {
      await transaction.insert(tickets).values({
        id,
        tenantId,
        citizenId: null,
        category: input.category,
        title: input.title,
        description: input.description,
        status: "submitted",
        provenanceSource: "ACTUAL",
        urgency: "medium",
        location: {
          province: input.location.province,
          city: input.location.city,
          address: input.location.address,
          latitude: input.location.latitude,
          longitude: input.location.longitude,
        },
        submittedAt: now,
        responseDueAt,
        createdAt: now,
        updatedAt: now,
      });

      await transaction.insert(ticketSubmissionDetails).values({
        ticketId: id,
        reportNumber,
        subcategory: input.subcategory,
        province: input.location.province,
        city: input.location.city,
        address: input.location.address,
        reporterName: input.name,
        reporterEmail: null,
        reporterPhone: null,
        isPublic: input.isPublic,
        showIdentity: input.isPublic && input.showIdentity,
        attachmentNames: input.attachments,
        createdAt: now,
        updatedAt: now,
      });
    });

    return NextResponse.json(
      { reportNumber, submittedAt: now.toISOString() },
      { status: 201 },
    );
  } catch (error) {
    const dbError = error as { code?: string; detail?: string; cause?: { message?: string; code?: string; detail?: string } };
    logger.error("reports.submit_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCode: dbError.code ?? dbError.cause?.code,
      errorDetail: dbError.detail ?? dbError.cause?.detail,
      errorCause: dbError.cause?.message,
    });
    return NextResponse.json(
      { error: "Laporan gagal disimpan. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
