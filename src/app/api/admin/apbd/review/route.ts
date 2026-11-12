import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  ApbdBudgetError,
  getApbdReviewQueue,
  reviewApbdEntry,
} from "@/modules/apbd-budget/service";

export const dynamic = "force-dynamic";

const reviewSchema = z
  .strictObject({
    entryId: z.string().uuid(),
    decision: z.enum(["approve", "reject"]),
    reason: z.string().trim().max(500).default(""),
  })
  .superRefine((payload, context) => {
    if (payload.decision === "reject" && payload.reason.length < 10) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "Alasan penolakan minimal 10 karakter.",
      });
    }
  });

async function getAdministratorSession() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    };
  }
  if (!session.roles.some((role) => ["admin", "superadmin"].includes(role))) {
    return {
      session: null,
      response: NextResponse.json(
        { error: "Hanya administrator yang dapat meninjau APBD." },
        { status: 403 },
      ),
    };
  }
  return { session, response: null };
}

export async function GET(): Promise<Response> {
  const authorization = await getAdministratorSession();
  if (!authorization.session) return authorization.response;
  try {
    return NextResponse.json({
      entries: await getApbdReviewQueue(authorization.session),
    });
  } catch (error) {
    logger.error("admin.apbd.review_queue_failed", {
      tenantId: authorization.session.tenantId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Antrean tinjauan APBD tidak dapat dimuat." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  const authorization = await getAdministratorSession();
  if (!authorization.session) return authorization.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan tinjauan tidak valid." },
      { status: 400 },
    );
  }
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Keputusan tinjauan tidak valid.",
      },
      { status: 400 },
    );
  }
  try {
    return NextResponse.json(
      await reviewApbdEntry(
        authorization.session,
        parsed.data.entryId,
        parsed.data.decision,
        parsed.data.reason,
      ),
    );
  } catch (error) {
    if (error instanceof ApbdBudgetError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.error("admin.apbd.review_decision_failed", {
      tenantId: authorization.session.tenantId,
      actorId: authorization.session.userId,
      entryId: parsed.data.entryId,
      decision: parsed.data.decision,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Keputusan tinjauan APBD gagal diproses." },
      { status: 500 },
    );
  }
}