import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import {
  ApbdBudgetError,
  getApbdDocumentDownloadUrl,
} from "@/modules/apbd-budget/service";

export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly documentId: string }>;
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }
  if (
    !session.roles.some((role) =>
      ["asn", "staff", "admin", "superadmin"].includes(role),
    )
  ) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses APBD." },
      { status: 403 },
    );
  }
  try {
    const { documentId } = await context.params;
    if (!z.string().uuid().safeParse(documentId).success) {
      return NextResponse.json(
        { error: "ID dokumen APBD tidak valid." },
        { status: 400 },
      );
    }
    const url = await getApbdDocumentDownloadUrl(session, documentId);
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof ApbdBudgetError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    throw error;
  }
}