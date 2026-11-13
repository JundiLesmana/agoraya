import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { logger } from "@/lib/logger";
import {
  AsnDatasetError,
  getPendingAsnDatasetSubmissions,
  publishAsnDatasetSubmission,
} from "@/modules/asn-datasets/service";

export const dynamic = "force-dynamic";

function isDatasetReviewer(roles: readonly string[]): boolean {
  return roles.some((role) =>
    ["asn", "staff", "admin", "superadmin"].includes(role),
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

function errorResponse(error: unknown): Response {
  if (error instanceof AsnDatasetError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  logger.error("asn_dataset.submission_review_failed", {
    errorName: error instanceof Error ? error.name : "UnknownError",
  });
  return NextResponse.json(
    { error: "Tinjauan dataset tidak dapat diproses saat ini." },
    { status: 500 },
  );
}

export async function GET(): Promise<Response> {
  const authorization = await authorizeReviewer();
  if (!authorization.authorized) return authorization.response;

  try {
    const submissions = await getPendingAsnDatasetSubmissions(
      authorization.session,
    );
    return NextResponse.json({ submissions });
  } catch (error) {
    return errorResponse(error);
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
    .strictObject({
      action: z.literal("publish"),
      submissionId: z.string().uuid(),
    })
    .safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Aksi publikasi dataset tidak valid." },
      { status: 400 },
    );
  }

  try {
    const dataset = await publishAsnDatasetSubmission(
      authorization.session,
      parsed.data.submissionId,
    );
    return NextResponse.json({ published: true, dataset });
  } catch (error) {
    return errorResponse(error);
  }
}