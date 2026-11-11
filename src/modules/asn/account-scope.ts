import { and, eq, exists, gt, isNull, or, sql } from "drizzle-orm";

import type { db } from "@/lib/db";
import {
  applicationRoles,
  roles,
  userApplicationRoles,
  userRoles,
} from "@/modules/rbac/db";
import { users } from "@/modules/identity/db";

export function hasNonCitizenAccountRole(
  database: ReturnType<typeof db>,
  tenantId: string,
) {
  const applicationRole = exists(
    database
      .select({ id: userApplicationRoles.id })
      .from(userApplicationRoles)
      .innerJoin(
        applicationRoles,
        eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
      )
      .where(
        and(
          eq(userApplicationRoles.userId, users.id),
          eq(userApplicationRoles.tenantId, tenantId),
          isNull(userApplicationRoles.revokedAt),
          sql`lower(${applicationRoles.key}) <> 'citizen'`,
        ),
      ),
  );
  const legacyRole = exists(
    database
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          eq(userRoles.userId, users.id),
          eq(roles.tenantId, tenantId),
          isNull(userRoles.revokedAt),
          or(
            isNull(userRoles.expiresAt),
            gt(userRoles.expiresAt, new Date()),
          ),
          sql`lower(${roles.key}) <> 'citizen'`,
        ),
      ),
  );
  const condition = or(applicationRole, legacyRole);
  if (!condition) throw new Error("Non-citizen role filter was not built");
  return condition;
}