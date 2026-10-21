export interface Session {
  userId: string;
  role: string;
  email?: string;
}

export async function getCurrentSession(): Promise<Session | null> {
  return null;
}
