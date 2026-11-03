import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  getStatisticDocumentDownloadUrl,
  StatisticsInputError,
} from "@/modules/statistics-input/service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
): Promise<Response> {
  const session = await getCurrentSession();
  if (
    !session ||
    !session.roles.some((role) => role === "asn" || role === "staff")
  ) {
    return NextResponse.json(
      { error: "Sesi tidak valid atau Anda tidak memiliki akses." },
      { status: 401 },
    );
  }
  const { documentId } = await params;
  const parsedId = z.string().uuid().safeParse(documentId);
  if (!parsedId.success) {
    return NextResponse.json(
      { error: "Identitas dokumen tidak valid." },
      { status: 400 },
    );
  }
  try {
    const url = await getStatisticDocumentDownloadUrl(session, parsedId.data);
    return NextResponse.redirect(url);
  } catch (error) {
    if (error instanceof StatisticsInputError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    logger.error("statistics_input.document_download_failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Dokumen tidak dapat diunduh. Silakan coba kembali." },
      { status: 500 },
    );
  }
}
