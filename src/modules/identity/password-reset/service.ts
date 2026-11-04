import { createHmac, createHash, randomBytes, randomUUID } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hashPassword, normalizeIdentifier } from "@/modules/identity/password/service";
import { passwordResetTokens, users } from "@/modules/identity/db";
import { ValidationError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  PASSWORD_REQUIREMENTS,
  MAX_IDENTIFIER_LENGTH,
} from "./schema";

const RESET_TTL_SECONDS = 3600;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_RESET_REQUESTS_PER_WINDOW = 3;

export {
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  PASSWORD_REQUIREMENTS,
};

function isValidIdentifier(identifier: string): boolean {
  return identifier.includes("@")
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    : /^\d{16}$/.test(identifier);
}

function hashIdentifier(identifier: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return createHmac("sha256", secret).update(normalizeIdentifier(identifier)).digest("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createPasswordResetToken(
  identifier: string,
): Promise<{ issued: boolean; token?: string; expiresAt?: Date; recipientEmail?: string }> {
  const normalized = normalizeIdentifier(identifier);
  if (normalized.length > MAX_IDENTIFIER_LENGTH || !isValidIdentifier(normalized)) {
    throw new ValidationError("NIK harus 16 digit atau alamat email yang valid.");
  }

  const database = db();
  const identifierHash = hashIdentifier(normalized);

  const result = await database.transaction(async (transaction) => {
    await transaction.execute(
      sql`SELECT pg_advisory_xact_lock(hashtextextended(${identifierHash}, 0))`,
    );

    const windowStart = new Date(
      Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    );
    const recent = await transaction
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.identifierHash, identifierHash),
          gt(passwordResetTokens.createdAt, windowStart),
        ),
      );
    if (recent.length >= MAX_RESET_REQUESTS_PER_WINDOW) {
      logger.warn("password_reset.rate_limited", {
        identifierHash: identifierHash.substring(0, 8),
      });
      throw new ValidationError(
        "Terlalu banyak permintaan reset. Silakan coba lagi dalam beberapa menit.",
        { statusCode: 429 },
      );
    }

    const accountCondition = normalized.includes("@")
      ? sql`lower(${users.email}) = ${normalized}`
      : eq(users.nik, normalized);
    const [account] = await transaction
      .select({ id: users.id, passwordHash: users.passwordHash, email: users.email })
      .from(users)
      .where(accountCondition)
      .limit(1);

    if (!account || !account.passwordHash) {
      return { issued: false as const };
    }

    const token = generateToken();
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + RESET_TTL_SECONDS * 1000);
    await transaction.insert(passwordResetTokens).values({
      id: randomUUID(),
      userId: account.id,
      identifierHash,
      tokenHash,
      expiresAt,
    });

    return {
      issued: true as const,
      token,
      expiresAt,
      recipientEmail: account.email,
    };
  });

  if (result.issued) {
    logger.info("password_reset.token_created", {
      identifierHash: identifierHash.substring(0, 8),
    });
  }
  return result;
}

export type ConsumedResetToken = { valid: true; userId: string } | { valid: false };

async function claimPasswordResetToken(
  claim: (tokenHash: string) => Promise<{ userId: string } | undefined>,
  token: string,
): Promise<ConsumedResetToken> {
  const tokenHash = hashToken(token);
  const record = await claim(tokenHash);

  if (!record) {
    logger.warn("password_reset.token_invalid");
    return { valid: false };
  }

  logger.info("password_reset.token_consumed", {
    userId: record.userId,
  });

  return { valid: true, userId: record.userId };
}

export async function consumePasswordResetToken(
  token: string,
): Promise<ConsumedResetToken> {
  const database = db();
  return claimPasswordResetToken(
    async (tokenHash) => {
      const [record] = await database
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(passwordResetTokens.tokenHash, tokenHash),
            isNull(passwordResetTokens.usedAt),
            gt(passwordResetTokens.expiresAt, new Date()),
          ),
        )
        .returning({ userId: passwordResetTokens.userId });
      return record;
    },
    token,
  );
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const database = db();
  const reset = await database.transaction(async (transaction) => {
    const consumed = await claimPasswordResetToken(
      async (tokenHash) => {
        const [record] = await transaction
          .update(passwordResetTokens)
          .set({ usedAt: new Date() })
          .where(
            and(
              eq(passwordResetTokens.tokenHash, tokenHash),
              isNull(passwordResetTokens.usedAt),
              gt(passwordResetTokens.expiresAt, new Date()),
            ),
          )
          .returning({ userId: passwordResetTokens.userId });
        return record;
      },
      token,
    );
    if (!consumed.valid) return undefined;

    const passwordHash = await hashPassword(newPassword);
    await transaction
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, consumed.userId));
    return consumed.userId;
  });

  if (!reset) {
    throw new ValidationError("Token reset tidak valid atau telah kedaluwarsa.");
  }

  logger.info("password_reset.password_updated", {
    userId: reset,
  });
}
