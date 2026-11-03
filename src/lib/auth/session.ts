import { cookies } from "next/headers";
import { validateSession } from "@/modules/identity/session";

export const SESSION_COOKIE_NAME = "agoraya_session";

export interface Session {
  userId: string;
  tenantId: string;
  role: string;
  roles: string[];
  email?: string;
}

export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const validation = await validateSession(token);
  if (
    !validation.valid ||
    !validation.userId ||
    !validation.tenantId ||
    !validation.roles?.length
  ) {
    return null;
  }

  const role =
    validation.roles.find((value) => value === "asn" || value === "staff") ??
    validation.roles[0];
  if (!role) return null;

  return {
    userId: validation.userId,
    tenantId: validation.tenantId,
    role,
    roles: validation.roles,
  };
}
