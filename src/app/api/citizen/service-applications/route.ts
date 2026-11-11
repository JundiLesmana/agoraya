import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";
import { logger } from "@/lib/logger";
import { resolveReportingTenantId } from "@/lib/tenancy/reporting";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Autentikasi diperlukan." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const reportingTenantId = await resolveReportingTenantId();
    const tenantIds = [
      ...new Set(
        [session.tenantId, reportingTenantId].filter(
          (tenantId): tenantId is string => tenantId !== null,
        ),
      ),
    ];
    const applications = await db()
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
        updatedAt: serviceApplications.updatedAt,
      })
      .from(serviceApplications)
      .where(
        and(
          inArray(serviceApplications.tenantId, tenantIds),
          eq(serviceApplications.applicantUserId, session.userId),
        ),
      )
      .orderBy(desc(serviceApplications.submittedAt));

    return NextResponse.json(
      { applications },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("citizen_service_applications.list_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
      userId: session.userId,
    });
    return NextResponse.json(
      { error: "Gagal memuat pengajuan Anda." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
