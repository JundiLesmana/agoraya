import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  createInfrastructureProject,
  listInfrastructureProjectsForAdmin,
  ProgressServiceError,
} from "@/modules/project-progress/service";

export const dynamic = "force-dynamic";

const projectSchema = z
  .strictObject({
    assignedUserId: z.string().uuid(),
    externalProjectId: z.string().trim().min(1).max(160),
    packageName: z.string().trim().min(1).max(255),
    location: z.string().trim().min(1).max(255),
    sector: z.string().trim().min(1).max(100),
    contractValue: z.number().finite().min(0),
    providerName: z.string().trim().min(1).max(255),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    fiscalYear: z.number().int().min(2000).max(2100),
    initialPhysicalProgress: z.number().finite().min(0).max(100),
    initialFinancialProgress: z.number().finite().min(0).max(100),
    status: z.enum(["ongoing", "completed", "delayed"]),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "Tanggal selesai harus sama atau setelah tanggal mulai.",
    path: ["endDate"],
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
        { error: "Hanya administrator yang dapat mengelola proyek." },
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
    const projects = await listInfrastructureProjectsForAdmin(
      authorization.session,
    );
    return NextResponse.json({ projects });
  } catch (error) {
    if (error instanceof ProgressServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.error("admin.projects.list_failed", {
      tenantId: authorization.session.tenantId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Daftar proyek tidak dapat dimuat." },
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
      { error: "Permintaan tidak valid." },
      { status: 400 },
    );
  }
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Data proyek tidak valid.",
      },
      { status: 400 },
    );
  }
  try {
    const result = await createInfrastructureProject(
      authorization.session,
      parsed.data,
    );
    return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ProgressServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.error("admin.projects.create_failed", {
      tenantId: authorization.session.tenantId,
      actorId: authorization.session.userId,
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Proyek gagal dibuat." },
      { status: 500 },
    );
  }
}
