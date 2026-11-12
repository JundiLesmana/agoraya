import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import { resolveReportingTenantId } from "@/lib/tenancy/reporting";
import { listAccessibleServiceCategories } from "@/modules/service-applications/access";

function getWaitingTimeMinutes(submittedAt: Date, now = new Date()): number {
  return Math.max(
    0,
    Math.floor((now.getTime() - submittedAt.getTime()) / (1000 * 60)),
  );
}

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
        {
          error:
            "Tenant penerima pengajuan layanan belum dikonfigurasi atau tidak aktif.",
        },
        { status: 503 },
      );
    }
    if (reportingTenantId !== session.tenantId) {
      logger.error("service_applications.recipient_tenant_mismatch", {
        userId: session.userId,
        sessionTenantId: session.tenantId,
        reportingTenantId,
      });
      return NextResponse.json(
        {
          error:
            "Akun ASN tidak berada pada tenant penerima pengajuan layanan.",
        },
        { status: 403 },
      );
    }

    const categories = await listAccessibleServiceCategories(session);
    if (categories.length === 0) {
      return NextResponse.json({ applications: [] });
    }

    const rows = await db()
      .select({
        id: serviceApplications.id,
        trackingNumber: serviceApplications.trackingNumber,
        category: serviceApplications.category,
        serviceType: serviceApplications.serviceType,
        serviceId: serviceApplications.serviceId,
        routeKey: serviceApplications.routeKey,
        serviceName: serviceApplications.serviceName,
        agency: serviceApplications.agency,
        status: serviceApplications.status,
        applicantName: serviceApplications.applicantName,
        contactEmail: serviceApplications.contactEmail,
        payload: serviceApplications.payload,
        submittedAt: serviceApplications.submittedAt,
        assigneeId: serviceApplications.assigneeId,
      })
      .from(serviceApplications)
      .where(
        and(
          eq(serviceApplications.tenantId, session.tenantId),
          inArray(serviceApplications.category, categories),
        ),
      )
      .orderBy(asc(serviceApplications.submittedAt));

    return NextResponse.json({
      applications: rows.map((row) => ({
        ...row,
        waitingTimeMinutes: getWaitingTimeMinutes(row.submittedAt),
      })),
    });
  } catch (error) {
    logger.error("service_applications.list_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Gagal memuat pengajuan layanan dari basis data." },
      { status: 500 },
    );
  }
}
