import { NextResponse } from "next/server";
import {
  accessApiError,
  invalidAccessRequest,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import {
  asnIdSchema,
  executiveAccessConfirmSchema,
} from "@/modules/asn/access-schema";
import { getExecutiveAccessPreview } from "@/modules/asn/access-service";

export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const { id } = await context.params;
    const parsedId = asnIdSchema.safeParse(id);
    if (!parsedId.success) {
      return invalidAccessRequest("ID ASN tidak valid.");
    }

    const parsedQuery = executiveAccessConfirmSchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsedQuery.success) {
      return invalidAccessRequest("Draft akses executive tidak valid.", {
        issues: parsedQuery.error.issues.map((issue) => issue.path.join(".")),
      });
    }

    const data = await getExecutiveAccessPreview(
      parsedId.data,
      authorization.session.tenantId,
      authorization.session.userId,
      parsedQuery.data.draftToken,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return accessApiError(error);
  }
}
