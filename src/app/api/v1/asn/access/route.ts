import { NextResponse } from "next/server";
import {
  accessApiError,
  invalidAccessRequest,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import { listAsnAccess } from "@/modules/asn/access-service";
import { asnAccessFiltersSchema } from "@/modules/asn/access-schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const query = Object.fromEntries(new URL(request.url).searchParams);
    const parsed = asnAccessFiltersSchema.safeParse(query);
    if (!parsed.success) {
      return invalidAccessRequest("Filter akses ASN tidak valid.", {
        issues: parsed.error.issues.map((issue) => issue.path.join(".")),
      });
    }

    const result = await listAsnAccess(
      authorization.session.tenantId,
      parsed.data,
    );
    return NextResponse.json(result);
  } catch (error) {
    return accessApiError(error);
  }
}
