import { NextResponse } from "next/server";

import {
  accessApiError,
  requireAsnAccessAdmin,
} from "@/modules/asn/access-api";
import { listAsnAccessOptions } from "@/modules/asn/access-service";
import { ASN_ACCESS_MODULES } from "@/modules/asn/access-catalog";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  try {
    const authorization = await requireAsnAccessAdmin();
    if (!authorization.authorized) return authorization.response;

    const applicationRoles = await listAsnAccessOptions();
    return NextResponse.json({
      data: {
        applicationRoles,
        modules: ASN_ACCESS_MODULES,
      },
    });
  } catch (error) {
    return accessApiError(error);
  }
}
