import { redirect } from 'next/navigation';

type Session = {
  role?: string;
} | null;

export interface AuthOptions {
  roles?: string[];
}

export async function requireAuth(options: AuthOptions = {}) {
  const session: Session = null;

  if (!session) {
    redirect('/login');
  }

  if (options.roles && options.roles.length > 0) {
    const userRole = session?.role;
    if (!userRole || !options.roles.includes(userRole)) {
      redirect('/forbidden');
    }
  }

  return session;
}

export async function getSession(): Promise<Session> {
  return null;
}

export function requireRole(allowedRoles: string[]) {
  return async () => {
    const session = await getSession();
    if (!session) {
      redirect('/login');
    }
    const userRole = session?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      redirect('/forbidden');
    }
    return session;
  };
}