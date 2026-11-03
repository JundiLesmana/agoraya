import { redirect } from "next/navigation";
import { getCurrentSession, type Session } from "./session";

export interface AuthOptions {
  roles?: string[];
}

export async function requireAuth(options: AuthOptions = {}) {
  const session: Session | null = await getCurrentSession();

  if (!session) {
    redirect("/login");
  }

  if (options.roles && options.roles.length > 0) {
    if (!session.roles.some((userRole) => options.roles?.includes(userRole))) {
      redirect("/forbidden");
    }
  }

  return session;
}

export async function getSession(): Promise<Session | null> {
  return getCurrentSession();
}

export function requireRole(allowedRoles: string[]) {
  return async () => {
    const session = await getSession();
    if (!session) {
      redirect("/login");
    }
    if (!session.roles.some((userRole) => allowedRoles.includes(userRole))) {
      redirect("/forbidden");
    }
    return session;
  };
}
