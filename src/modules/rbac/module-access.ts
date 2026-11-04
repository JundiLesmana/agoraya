import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { moduleAccess } from "./db";
import { users } from "@/modules/identity/db";

export const MODULE_ACCESS_KEYS = [
  "ogd",
  "insight",
  "kyc",
  "pst",
  "civic_reporting",
] as const;

export type ModuleAccessKey = (typeof MODULE_ACCESS_KEYS)[number];

export function parseModuleAccessKey(value: string): ModuleAccessKey {
  const key = MODULE_ACCESS_KEYS.find((candidate) => candidate === value);
  if (!key) throw new Error("Stored module access key is invalid");
  return key;
}

export function isModuleAccessAllowed(
  accountStatus: string | null | undefined,
  grantedModules: readonly string[],
  requiredModule: ModuleAccessKey,
): boolean {
  return accountStatus === "active" && grantedModules.includes(requiredModule);
}

export function accountCanReceiveAccess(
  accountStatus: string,
  requestedModules: readonly string[],
  executiveStatus: "observer" | "not_granted",
): boolean {
  return (
    accountStatus === "active" ||
    (requestedModules.length === 0 && executiveStatus === "not_granted")
  );
}

export async function hasModuleAccess(
  userId: string,
  tenantId: string,
  requiredModule: ModuleAccessKey,
): Promise<boolean> {
  const rows = await db()
    .select({
      accountStatus: users.status,
      moduleKey: moduleAccess.moduleKey,
    })
    .from(users)
    .leftJoin(
      moduleAccess,
      and(
        eq(moduleAccess.userId, users.id),
        eq(moduleAccess.tenantId, tenantId),
        eq(moduleAccess.moduleKey, requiredModule),
        isNull(moduleAccess.revokedAt),
      ),
    )
    .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
    .limit(1);
  const row = rows[0];
  return isModuleAccessAllowed(
    row?.accountStatus,
    row?.moduleKey ? [row.moduleKey] : [],
    requiredModule,
  );
}
