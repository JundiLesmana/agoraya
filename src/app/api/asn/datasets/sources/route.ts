import { NextResponse } from "next/server";
import { z } from "zod";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { logger } from "@/lib/logger";
import {
  AsnDatasetError,
  getApbdDatasetSources,
  getProjectDatasetSources,
} from "@/modules/asn-datasets/service";

export const dynamic = "force-dynamic";

const apbdScopeSchema = z.strictObject({
  assignmentType: z.literal("apbd"),
  agencyId: z.string().trim().min(1).max(120),
  regionId: z.string().trim().min(1).max(120),
  sectorId: z.string().trim().min(1).max(100),
  referenceYear: z.coerce.number().int().min(2000).max(2100),
});
const projectScopeSchema = z.strictObject({
  projectId: z.string().uuid(),
});

function isDatasetOperator(roles: readonly string[]): boolean {
  return roles.some((role) =>
    ["asn", "staff", "admin", "superadmin"].includes(role),
  );
}

export async function GET(request: Request): Promise<Response> {
  const authorization = await requireModuleAccess("insight");
  if (!authorization.authorized) return authorization.response;
  if (
    !authorization.session ||
    !isDatasetOperator(authorization.session.roles)
  ) {
    return NextResponse.json(
      { error: "Anda tidak memiliki akses ke sumber dataset." },
      { status: 403 },
    );
  }

  const params = Object.fromEntries(new URL(request.url).searchParams);
  try {
    if ("projectId" in params) {
      const parsed = projectScopeSchema.safeParse(params);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Penugasan proyek tidak valid." },
          { status: 400 },
        );
      }
      return NextResponse.json({
        sources: await getProjectDatasetSources(
          authorization.session,
          parsed.data.projectId,
        ),
      });
    }

    const parsed = apbdScopeSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Konteks APBD tidak valid." },
        { status: 400 },
      );
    }
    return NextResponse.json({
      sources: await getApbdDatasetSources(authorization.session, parsed.data),
    });
  } catch (error) {
    if (error instanceof AsnDatasetError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error("asn_dataset.sources_failed", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "Sumber dataset tidak dapat dimuat saat ini." },
      { status: 500 },
    );
  }
}
