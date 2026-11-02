import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import {
  getProjectProgress,
  handleSubmit,
} from "@/modules/project-progress/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (
    !session ||
    !session.roles.some((role) => ["asn", "staff"].includes(role))
  ) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau kedaluwarsa." },
      { status: 401 },
    );
  }

  const projectId = new URL(request.url).searchParams.get("project_id");
  const parsedId = z.string().uuid().safeParse(projectId);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "ID proyek tidak valid." },
      { status: 400 },
    );
  }

  const data = await getProjectProgress(session, parsedId.data);
  if (!data) {
    return NextResponse.json(
      { error: "Anda tidak berwenang melihat proyek ini." },
      { status: 403 },
    );
  }
  return NextResponse.json(data);
}

export async function POST(request: Request): Promise<Response> {
  const session = await getCurrentSession();
  if (
    !session ||
    !session.roles.some((role) => ["asn", "staff"].includes(role))
  ) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau kadaluarsa." },
      { status: 401 },
    );
  }
  return handleSubmit(request, session);
}
