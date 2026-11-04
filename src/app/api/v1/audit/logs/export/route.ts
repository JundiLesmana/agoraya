import { requireAsnAccessAdmin } from "@/modules/asn/access-api";
import { db } from "@/lib/db";
import { ValidationError } from "@/lib/errors";
import { exportAuditLogs } from "@/modules/audit";
import type { AuditExportFormat } from "@/modules/audit";

import { auditApiError, parseListQuery } from "../_utils";

export const dynamic = "force-dynamic";

function parseFormat(searchParams: URLSearchParams): AuditExportFormat {
  const format = searchParams.get("format") ?? "json";
  if (format !== "json" && format !== "csv") {
    throw new ValidationError("format must be either json or csv.");
  }
  return format;
}

export async function GET(request: Request): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const searchParams = new URL(request.url).searchParams;
    const format = parseFormat(searchParams);
    const result = await exportAuditLogs(db(), parseListQuery(searchParams), format);

    return new Response(result.body, {
      status: 200,
      headers: {
        "content-type": result.contentType,
        "content-disposition": `attachment; filename="audit-logs.${format}"`,
      },
    });
  } catch (error) {
    return auditApiError(error);
  }
}
