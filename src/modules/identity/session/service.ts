import crypto from "crypto";
import { db } from "@/lib/db";
import { asnProfiles, userSessions, users } from "@/modules/identity/db";
import { applicationRoles, roles, userApplicationRoles, userRoles } from "@/lib/db/schema";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { logger } from "@/lib/logger";

const SESSION_TTL_HOURS = 24;

export function resolveSessionRoles(
  activeRoleKeys: readonly string[],
  hasAsnProfile: boolean,
): string[] {
  return [...new Set([...activeRoleKeys, ...(hasAsnProfile ? ["asn"] : [])])];
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(
  userId: string,
): Promise<{ sessionId: string; token: string; expiresAt: Date }> {
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

  logger.info("session.created");

  return { sessionId, token, expiresAt };
}

export async function validateSession(token: string): Promise<{
  valid: boolean;
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  roles?: string[];
  applicationRoles?: string[];
}> {
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
    logger.warn("session.invalid");
    return { valid: false };
  }

  if (new Date() > session.expiresAt) {
    logger.warn("session.expired");
    await database.delete(userSessions).where(eq(userSessions.id, session.id));
    return { valid: false };
  }

  const [user] = await database
    .select({ status: users.status, tenantId: users.tenantId })
    .from(users)
    .where(eq(users.id, session.userId));
  if (!user || user.status !== "active") {
    logger.warn("session.user_inactive");
    await database.delete(userSessions).where(eq(userSessions.id, session.id));
    return { valid: false };
  }

  const activeRoles = await database
    .select({ key: roles.key })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .where(
      and(
        eq(userRoles.userId, session.userId),
        eq(roles.tenantId, user.tenantId),
        isNull(userRoles.revokedAt),
        or(isNull(userRoles.expiresAt), gt(userRoles.expiresAt, new Date())),
      ),
    );

  const activeApplicationRoles = await database
    .select({ key: applicationRoles.key })
    .from(userApplicationRoles)
    .innerJoin(
      applicationRoles,
      eq(userApplicationRoles.applicationRoleId, applicationRoles.id),
    )
    .where(
      and(
        eq(userApplicationRoles.userId, session.userId),
        eq(userApplicationRoles.tenantId, user.tenantId),
        isNull(userApplicationRoles.revokedAt),
      ),
    );

  const [asnProfile] = await database
    .select({ userId: asnProfiles.userId })
    .from(asnProfiles)
    .where(
      and(
        eq(asnProfiles.userId, session.userId),
        eq(asnProfiles.tenantId, user.tenantId),
      ),
    )
    .limit(1);
  const sessionRoles = resolveSessionRoles(
    activeRoles.map((role) => role.key),
    Boolean(asnProfile),
  );

  return {
    valid: sessionRoles.length > 0,
    userId: session.userId,
    sessionId: session.id,
    tenantId: user.tenantId,
    roles: sessionRoles,
    applicationRoles: activeApplicationRoles.map((r) => r.key),
  };
}

export async function destroySession(token: string): Promise<void> {
  if (!token) return;

  const database = db();
  const tokenHash = hashToken(token);
  await database
    .delete(userSessions)
    .where(eq(userSessions.tokenHash, tokenHash));
  logger.info("session.destroyed");
}

export async function refreshSession(
  token: string,
): Promise<{ valid: boolean; newToken?: string; expiresAt?: Date }> {
  const validation = await validateSession(token);
  if (!validation.valid || !validation.userId || !validation.sessionId) {
    return { valid: false };
  }

  const result = await createSession(validation.userId);
  await destroySession(token);
  return { valid: true, newToken: result.token, expiresAt: result.expiresAt };
}
