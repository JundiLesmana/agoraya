import crypto from 'crypto';
import { db } from '@/lib/db';
import { userSessions, users } from '@/modules/identity/db';
import { eq, and, gt } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const SESSION_TTL_HOURS = 24;

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function createSession(userId: string): Promise<{ sessionId: string; token: string; expiresAt: Date }> {
  const database = db();
  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000);
  const sessionId = crypto.randomUUID();

  await database.insert(userSessions).values({
    id: sessionId,
    userId,
    tokenHash,
    expiresAt,
  });

  logger.info('session.created', { userId, sessionId });

  return { sessionId, token, expiresAt };
}

export async function validateSession(token: string): Promise<{ valid: boolean; userId?: string; sessionId?: string; tenantId?: string }> {
  if (!token) {
    return { valid: false };
  }

  const database = db();
  const tokenHash = hashToken(token);

  const [session] = await database
    .select({
      id: userSessions.id,
      userId: userSessions.userId,
      expiresAt: userSessions.expiresAt,
    })
    .from(userSessions)
    .where(eq(userSessions.tokenHash, tokenHash));

  if (!session) {
    logger.warn('session.invalid', { tokenHash: tokenHash.substring(0, 8) });
    return { valid: false };
  }

  if (new Date() > session.expiresAt) {
    logger.warn('session.expired', { sessionId: session.id, userId: session.userId });
    await database.delete(userSessions).where(eq(userSessions.id, session.id));
    return { valid: false };
  }

  const [user] = await database.select({ status: users.status, tenantId: users.tenantId }).from(users).where(eq(users.id, session.userId));
  if (!user || user.status !== 'active') {
    logger.warn('session.user_inactive', { sessionId: session.id, userId: session.userId });
    await database.delete(userSessions).where(eq(userSessions.id, session.id));
    return { valid: false };
  }

  // The tenant is part of the session context: authorization decisions are
  // scoped to it (see the RBAC module's policy decision point).
  return { valid: true, userId: session.userId, sessionId: session.id, tenantId: user.tenantId };
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return;

  const database = db();
  const tokenHash = hashToken(token);
  await database.delete(userSessions).where(eq(userSessions.tokenHash, tokenHash));
  logger.info('session.destroyed', { tokenHash: tokenHash.substring(0, 8) });
}

export async function refreshSession(token: string): Promise<{ valid: boolean; newToken?: string; expiresAt?: Date }> {
  const validation = await validateSession(token);
  if (!validation.valid || !validation.userId || !validation.sessionId) {
    return { valid: false };
  }

  // Generate new session
  const result = await createSession(validation.userId);
  // Destroy old session
  await destroySession(token);
  return { valid: true, newToken: result.token, expiresAt: result.expiresAt };
}
