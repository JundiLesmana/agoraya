export interface AuthUser {
  id: string;
  email: string;
  role: string;
}

export interface AuthSession {
  user: AuthUser | null;
  isAuthenticated: boolean;
}
