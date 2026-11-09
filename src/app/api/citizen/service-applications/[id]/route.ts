import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Autentikasi diperlukan." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await params;

  try {
    const [application] = await db()
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
          eq(serviceApplications.id, id),
          eq(serviceApplications.tenantId, session.tenantId),
          eq(serviceApplications.applicantUserId, session.userId),
        ),
      )
      .limit(1);

    if (!application) {
      return NextResponse.json(
        { error: "Pengajuan tidak ditemukan." },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    return NextResponse.json(
      { application },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logger.error("citizen_service_applications.detail_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
      errorMessage: error instanceof Error ? error.message : String(error),
      userId: session.userId,
      applicationId: id,
    });
    return NextResponse.json(
      { error: "Gagal memuat detail pengajuan Anda." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
