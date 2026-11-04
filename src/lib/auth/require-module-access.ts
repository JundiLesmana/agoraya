import { NextResponse } from "next/server";

import { getCurrentSession } from "@/lib/auth/session";
import {
  hasModuleAccess,
  type ModuleAccessKey,
} from "@/modules/rbac/module-access";

export async function requireModuleAccess(moduleKey: ModuleAccessKey) {
  const session = await getCurrentSession();
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      ),
    } as const;
  }
  if (!(await hasModuleAccess(session.userId, session.tenantId, moduleKey))) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "Module access is not granted" },
        { status: 403 },
      ),
    } as const;
  }
  return { authorized: true, session } as const;
}
