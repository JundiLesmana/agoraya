import { NextResponse } from "next/server";
import {
  accessApiError,
  invalidAccessRequest,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import {
  asnIdSchema,
  updateAsnAccessSchema,
} from "@/modules/asn/access-schema";
import { updateAsnAccess } from "@/modules/asn/access-service";

export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function PATCH(
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

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return invalidAccessRequest("Body JSON tidak valid.");
    }
    const parsedPayload = updateAsnAccessSchema.safeParse(payload);
    if (!parsedPayload.success) {
      return invalidAccessRequest("Perubahan akses ASN tidak valid.", {
        issues: parsedPayload.error.issues.map((issue) => issue.path.join(".")),
      });
    }

    const data = await updateAsnAccess(
      parsedId.data,
      authorization.session.tenantId,
      authorization.session.userId,
      parsedPayload.data,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return accessApiError(error);
  }
}
