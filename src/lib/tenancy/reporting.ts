import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";

export async function resolveReportingTenantId(): Promise<string | null> {
  const configuredTenantId = process.env.REPORTING_TENANT_ID?.trim();
  if (configuredTenantId) {
    if (!z.string().uuid().safeParse(configuredTenantId).success) return null;
    const [tenant] = await db()
      .select({ id: tenants.id })
      .from(tenants)
      .where(
        and(
          eq(tenants.id, configuredTenantId),
          eq(tenants.status, "active"),
        ),
      )
      .limit(1);
    return tenant?.id ?? null;
  }

  if (process.env.NODE_ENV === "production") return null;

  const [tenant] = await db()
    .select({ id: tenants.id })
    .from(tenants)
    .where(
      and(
        eq(tenants.slug, "agoraya-local-testing"),
        eq(tenants.status, "active"),
      ),
    )
    .limit(1);
  return tenant?.id ?? null;
}