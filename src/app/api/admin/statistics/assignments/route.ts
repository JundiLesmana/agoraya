import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  createStatisticOperatorAssignment,
  deleteStatisticOperatorAssignment,
  listStatisticOperatorAssignments,
  StatisticsInputError,
} from "@/modules/statistics-input/service";
import { STATISTIC_SECTORS } from "@/modules/statistics-input/contract";

export const dynamic = "force-dynamic";

const assignmentSchema = z.strictObject({
  userId: z.string().uuid(),
  agencyId: z.string().trim().min(1).max(120),
  regionId: z.string().trim().min(1).max(120),
  regionName: z.string().trim().min(1).max(160),
  sectorId: z.enum(["economy", "agriculture", "social"]),
});

const deleteAssignmentSchema = z.strictObject({
  userId: z.string().uuid(),
  agencyId: z.string().trim().min(1).max(120),
  regionId: z.string().trim().min(1).max(120),
  sectorId: z.enum(["economy", "agriculture", "social"]),
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
        {
          error:
            "Hanya administrator yang dapat mengelola penugasan statistik.",
        },
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
    const assignments = await listStatisticOperatorAssignments(
      authorization.session,
    );
    return NextResponse.json({ assignments });
  } catch (error) {
    logger.error("admin.statistics.assignments_list_failed", {
      tenantId: authorization.session.tenantId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Daftar penugasan statistik tidak dapat dimuat." },
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
      { error: "Permintaan penugasan tidak valid." },
      { status: 400 },
    );
  }
  const parsed = assignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Data penugasan tidak valid.",
      },
      { status: 400 },
    );
  }
  try {
    await createStatisticOperatorAssignment(
      authorization.session,
      parsed.data,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StatisticsInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.error("admin.statistics.assignment_create_failed", {
      tenantId: authorization.session.tenantId,
      actorId: authorization.session.userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Penugasan statistik gagal dibuat." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const authorization = await getAdministratorSession();
  if (!authorization.session) return authorization.response;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Permintaan penghapusan tidak valid." },
      { status: 400 },
    );
  }
  const parsed = deleteAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Data penugasan tidak valid.",
      },
      { status: 400 },
    );
  }
  try {
    await deleteStatisticOperatorAssignment(
      authorization.session,
      parsed.data,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof StatisticsInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.error("admin.statistics.assignment_delete_failed", {
      tenantId: authorization.session.tenantId,
      actorId: authorization.session.userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Penugasan statistik gagal dihapus." },
      { status: 500 },
    );
  }
}
