import crypto from 'crypto';
import { db } from '@/lib/db';
import { otpCodes } from '@/lib/db/schema';
import { eq, and, gt, desc } from 'drizzle-orm';
import { logger } from '@/lib/logger';

const OTP_TTL_MINUTES = 5;
const MAX_ATTEMPTS = 3;
const RATE_LIMIT_WINDOW_MINUTES = 10;
const MAX_REQUESTS_PER_WINDOW = 3;

function hashValue(value: string): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateCode(): string {
  const buffer = crypto.randomBytes(3);
  const code = (buffer.readUIntBE(0, 3) % 1000000).toString().padStart(6, '0');
  return code;
}

export async function generateOtp(identifier: string): Promise<{ success: boolean; message: string }> {
  const database = db();
  const identifierHash = hashValue(identifier.toLowerCase().trim());

  // Rate limiting: count recent requests
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);
  const recentRequests = await database
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.identifierHash, identifierHash), gt(otpCodes.createdAt, windowStart)));

  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    logger.warn('otp.rate_limited', { identifierHash: identifierHash.substring(0, 8) });
    throw new Error('Too many OTP requests. Please try again later.');
  }

  const code = generateCode();
  const codeHash = hashValue(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  const id = crypto.randomUUID();

  await database.insert(otpCodes).values({
    id,
    identifierHash,
    codeHash,
    expiresAt,
    attempts: 0 as number,
  });

  logger.info('otp.generated', { identifierHash: identifierHash.substring(0, 8) });

  // In production, send via email/SMS; for dev/testing, code would be logged in secure context
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEV] OTP for ${identifier}: ${code}`);
  }

  return { success: true, message: 'OTP sent successfully' };
}

export async function verifyOtp(identifier: string, code: string): Promise<{ valid: boolean; message: string }> {
  const database = db();
  const identifierHash = hashValue(identifier.toLowerCase().trim());
  const codeHash = hashValue(code);

  const [otpRecord] = await database
    .select()
    .from(otpCodes)
    .where(eq(otpCodes.identifierHash, identifierHash))
    .orderBy(desc(otpCodes.createdAt))
    .limit(1);

  if (!otpRecord) {
    logger.warn('otp.not_found', { identifierHash: identifierHash.substring(0, 8) });
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  if (new Date() > new Date(otpRecord.expiresAt as Date)) {
    logger.warn('otp.expired', { identifierHash: identifierHash.substring(0, 8) });
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  if ((otpRecord.attempts as number) >= MAX_ATTEMPTS) {
    logger.warn('otp.max_attempts', { identifierHash: identifierHash.substring(0, 8) });
    return { valid: false, message: 'Too many attempts' };
  }

  if (otpRecord.codeHash !== codeHash) {
    await database
      .update(otpCodes)
      .set({ attempts: (otpRecord.attempts as number) + 1 })
      .where(eq(otpCodes.id, otpRecord.id));
    logger.warn('otp.invalid_code', { identifierHash: identifierHash.substring(0, 8) });
    return { valid: false, message: 'Invalid or expired OTP' };
  }

  // Mark as used by deleting or incrementing attempts to prevent reuse
  await database.delete(otpCodes).where(eq(otpCodes.id, otpRecord.id));
  logger.info('otp.verified', { identifierHash: identifierHash.substring(0, 8) });

  return { valid: true, message: 'OTP verified successfully' };
}
