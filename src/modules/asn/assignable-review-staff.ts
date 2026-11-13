import { and, asc, eq, exists, gt, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { asnProfiles, users } from "@/modules/identity/db";
import {
  applicationRoles,
  roles,
  userApplicationRoles,
  userRoles,
} from "@/modules/rbac/db";
import {
  SERVICE_APPLICATION_CATEGORY_ROLE,
  type ServiceApplicationCategory,
} from "@/modules/service-applications/access";

export async function listAssignableReviewStaff(
  tenantId: string,
  serviceCategory?: ServiceApplicationCategory,
) {
  const database = db();
  const conditions = [
    eq(users.tenantId, tenantId),
    eq(users.status, "active"),
    or(isNotNull(asnProfiles.userId), eq(roles.key, "asn")),
  ];
  if (serviceCategory) {
    conditions.push(
      exists(
        database
          .select({ id: userApplicationRoles.id })
          .from(userApplicationRoles)
          .innerJoin(
            applicationRoles,
            eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
          )
          .where(
            and(
              eq(userApplicationRoles.tenantId, tenantId),
              eq(userApplicationRoles.userId, users.id),
              eq(
                applicationRoles.key,
                SERVICE_APPLICATION_CATEGORY_ROLE[serviceCategory],
              ),
              isNull(userApplicationRoles.revokedAt),
            ),
          ),
      ),
    );
  }

  return database
    .selectDistinct({ id: users.id, name: users.name })
    .from(users)
    .leftJoin(
      asnProfiles,
      and(eq(asnProfiles.userId, users.id), eq(asnProfiles.tenantId, tenantId)),
    )
    .leftJoin(
      userRoles,
      and(
        eq(userRoles.userId, users.id),
        isNull(userRoles.revokedAt),
        or(isNull(userRoles.expiresAt), gt(userRoles.expiresAt, new Date())),
      ),
    )
    .leftJoin(
      roles,
      and(eq(roles.id, userRoles.roleId), eq(roles.tenantId, tenantId)),
    )
    .where(and(...conditions))
    .orderBy(asc(users.name));
}