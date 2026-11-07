import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getCurrentSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { serviceApplications } from "@/lib/db/schema";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Autentikasi diperlukan." },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;

  try {
    const application = await db().query.serviceApplications.findFirst({
      columns: {
        id: true,
        trackingNumber: true,
        category: true,
        serviceType: true,
        serviceId: true,
        routeKey: true,
        serviceName: true,
        agency: true,
        status: true,
        applicantName: true,
        contactEmail: true,
        payload: true,
        submittedAt: true,
        updatedAt: true,
      },
      where: and(
        eq(serviceApplications.id, id),
        eq(serviceApplications.tenantId, session.tenantId),
        eq(serviceApplications.applicantUserId, session.userId),
      ),
    });

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
