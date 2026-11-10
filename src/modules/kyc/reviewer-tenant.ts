import { eq } from "drizzle-orm";
import { z } from "zod";

import type { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema/foundation";
import { DatabaseError } from "@/lib/errors";

export async function resolveKycReviewerTenantId(
  database: ReturnType<typeof db>,
  tenantId: string | undefined,
  configurationName: string,
): Promise<string> {
  const configuredTenantId = tenantId?.trim();
  if (configuredTenantId) {
    if (!z.string().uuid().safeParse(configuredTenantId).success) {
      throw new DatabaseError(`${configurationName} must be a valid tenant UUID.`);
    }

    const [tenant] = await database
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.id, configuredTenantId))
      .limit(1);
    if (tenant) return tenant.id;
  } else if (process.env.NODE_ENV !== "production") {
    const [tenant] = await database
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.slug, "agoraya-local-testing"))
      .limit(1);
    if (tenant) return tenant.id;
  }

  throw new DatabaseError(
    `${configurationName} is not configured or does not exist. Set it to the ASN reviewer tenant UUID.`,
  );
}