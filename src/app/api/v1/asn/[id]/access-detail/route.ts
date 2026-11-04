import { NextResponse } from "next/server";
import {
  accessApiError,
  invalidAccessRequest,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import { asnIdSchema } from "@/modules/asn/access-schema";
import { getAsnAccessDetail } from "@/modules/asn/access-service";

export const dynamic = "force-dynamic";

interface RouteContext {
  readonly params: Promise<{ readonly id: string }>;
}

export async function GET(
  _request: Request,
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

    const data = await getAsnAccessDetail(
      parsedId.data,
      authorization.session.tenantId,
    );
    return NextResponse.json({ data });
  } catch (error) {
    return accessApiError(error);
  }
}
