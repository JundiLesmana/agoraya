import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";

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
      .where(eq(serviceApplications.tenantId, session.tenantId))
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
