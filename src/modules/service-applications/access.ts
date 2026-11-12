import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Session } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { applicationRoles, userApplicationRoles } from "@/lib/db/schema";
import {
  SERVICE_APPLICATION_CATEGORIES,
  type ServiceApplicationCategory,
} from "./catalog";

export {
  SERVICE_APPLICATION_CATEGORIES,
  SERVICE_APPLICATION_CATALOG,
  type ServiceApplicationCategory,
} from "./catalog";

export const SERVICE_APPLICATION_CATEGORY_ROLE = {
  permit: "service_permit",
  education: "service_education",
  social: "service_social",
  health: "service_health",
} as const satisfies Record<ServiceApplicationCategory, string>;

const SUPERVISOR_ROLES = new Set(["admin", "superadmin"]);

export function isServiceApplicationSupervisor(session: Session): boolean {
  return session.roles.some((role) => SUPERVISOR_ROLES.has(role));
}

export async function canManageServiceApplication(
  session: Session,
  application: {
    readonly tenantId: string;
    readonly category: string;
    readonly assigneeId: string | null;
  },
): Promise<boolean> {
  if (session.tenantId !== application.tenantId) return false;
  if (
    !isServiceApplicationSupervisor(session) &&
    application.assigneeId !== session.userId
  ) {
    return false;
  }
  return hasServiceApplicationCategoryAccess(session, application.category);
}

export function isServiceApplicationCategory(
  value: string,
): value is ServiceApplicationCategory {
  return SERVICE_APPLICATION_CATEGORIES.some((category) => category === value);
}

export async function listAccessibleServiceCategories(
  session: Session,
): Promise<readonly ServiceApplicationCategory[]> {
  if (isServiceApplicationSupervisor(session)) {
    return SERVICE_APPLICATION_CATEGORIES;
  }

  const rows = await db()
    .select({ key: applicationRoles.key })
    .from(userApplicationRoles)
    .innerJoin(
      applicationRoles,
      eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
    )
    .where(
      and(
        eq(userApplicationRoles.tenantId, session.tenantId),
        eq(userApplicationRoles.userId, session.userId),
        isNull(userApplicationRoles.revokedAt),
        inArray(
          applicationRoles.key,
          Object.values(SERVICE_APPLICATION_CATEGORY_ROLE),
        ),
      ),
    );

  const roleKeys = new Set(rows.map((row) => row.key));
  return SERVICE_APPLICATION_CATEGORIES.filter((category) =>
    roleKeys.has(SERVICE_APPLICATION_CATEGORY_ROLE[category]),
  );
}

export async function hasServiceApplicationCategoryAccess(
  session: Session,
  category: string,
): Promise<boolean> {
  if (!isServiceApplicationCategory(category)) return false;
  if (isServiceApplicationSupervisor(session)) return true;

  const [role] = await db()
    .select({ id: userApplicationRoles.id })
    .from(userApplicationRoles)
    .innerJoin(
      applicationRoles,
      eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
    )
    .where(
      and(
        eq(userApplicationRoles.tenantId, session.tenantId),
        eq(userApplicationRoles.userId, session.userId),
        eq(applicationRoles.key, SERVICE_APPLICATION_CATEGORY_ROLE[category]),
        isNull(userApplicationRoles.revokedAt),
      ),
    )
    .limit(1);

  return Boolean(role);
}