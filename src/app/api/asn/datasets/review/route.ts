import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { appendAuditEvent } from "@/modules/audit/service";
import { uuidOrNull } from "@/modules/rbac/audit";
import {
  getPendingBpsDatasetReview,
  publishBpsDatasetReview,
} from "@/modules/integrations/bps/catalog";

export const dynamic = "force-dynamic";

function isDatasetReviewer(roles: readonly string[]): boolean {
  return roles.some(
    (role) =>
      role === "asn" ||
      role === "staff" ||
      role === "admin" ||
      role === "superadmin",
  );
}

async function authorizeReviewer() {
  const authorization = await requireModuleAccess("insight");
  if (!authorization.authorized) return authorization;
  if (
    !authorization.session ||
    !isDatasetReviewer(authorization.session.roles)
  ) {
    return {
      authorized: false as const,
      response: NextResponse.json(
        { error: "Anda tidak memiliki akses untuk meninjau dataset." },
        { status: 403 },
      ),
    };
  }
  return authorization;
}

export async function GET(): Promise<Response> {
  const authorization = await authorizeReviewer();
  if (!authorization.authorized) return authorization.response;

  try {
    return NextResponse.json({
      dataset: await getPendingBpsDatasetReview(),
    });
  } catch (error) {
    logger.error("bps_dataset_review.load_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Dataset BPS tidak dapat dimuat untuk ditinjau." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const authorization = await authorizeReviewer();
  if (!authorization.authorized) return authorization.response;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format permintaan publikasi tidak valid." },
      { status: 400 },
    );
  }
  const parsed = z
    .strictObject({ action: z.literal("publish") })
    .safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Aksi publikasi dataset tidak valid." },
      { status: 400 },
    );
  }

  try {
    const published = await publishBpsDatasetReview();
    if (!published) {
      return NextResponse.json(
        { error: "Tidak ada dataset BPS yang menunggu tinjauan." },
        { status: 404 },
      );
    }
    await appendAuditEvent(db(), {
      actorId: uuidOrNull(authorization.session.userId),
      action: "asn.dataset.bps_published",
      targetTable: "datasets",
      targetId: null,
      metadata: {
        slug: "statistik-bps",
        result: "success",
      },
      occurredAt: new Date(),
    });
    return NextResponse.json({ published: true });
  } catch (error) {
    logger.error("bps_dataset_review.publish_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Dataset BPS tidak dapat dipublikasikan saat ini." },
      { status: 500 },
    );
  }
}
