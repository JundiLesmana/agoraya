import {
  createHmac,
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { eq, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { loginAttempts, users } from "@/modules/identity/db";

const SCRYPT_COST = 32_768;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;
const MAX_ATTEMPTS = 6;
const MAX_IDENTIFIER_LENGTH = 255;
const MAX_PASSWORD_LENGTH = 256;
const DUMMY_HASH = hashPassword(randomBytes(32).toString("hex"));

function normalizeIdentifier(identifier: string): string {
  const trimmed = identifier.trim();
  return trimmed.includes("@") ? trimmed.toLowerCase() : trimmed;
}

function hashIdentifier(identifier: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must contain at least 32 characters.");
  }
  return createHmac("sha256", secret)
    .update(normalizeIdentifier(identifier))
    .digest("hex");
}

async function deriveKey(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    nodeScrypt(
      password,
      salt,
      KEY_LENGTH,
      {
        N: SCRYPT_COST,
        r: SCRYPT_BLOCK_SIZE,
        p: SCRYPT_PARALLELIZATION,
        maxmem: 64 * 1024 * 1024,
      },
      (error, key) => {
        if (error) reject(error);
        else resolve(key);
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt);
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split("$");
  if (
    parts.length !== 6 ||
    parts[0] !== "scrypt" ||
    parts[1] !== String(SCRYPT_COST) ||
    parts[2] !== String(SCRYPT_BLOCK_SIZE) ||
    parts[3] !== String(SCRYPT_PARALLELIZATION) ||
    !/^[a-f\d]{32}$/i.test(parts[4] ?? "") ||
    !/^[a-f\d]{128}$/i.test(parts[5] ?? "")
  ) {
    await deriveKey(password, Buffer.alloc(16));
    return false;
  }

  const expected = Buffer.from(parts[5] as string, "hex");
  const actual = await deriveKey(
    password,
    Buffer.from(parts[4] as string, "hex"),
  );
  return timingSafeEqual(actual, expected);
}

function isValidIdentifier(identifier: string): boolean {
  return identifier.includes("@")
    ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)
    : /^\d{8,32}$/.test(identifier);
}

async function registerAttempt(identifier: string): Promise<boolean> {
  const database = db();
  const identifierHash = hashIdentifier(identifier);
  await database
    .delete(loginAttempts)
    .where(
      lt(loginAttempts.windowStartedAt, sql`NOW() - INTERVAL '15 minutes'`),
    );
  const [attempt] = await database
    .insert(loginAttempts)
    .values({ identifierHash, attempts: 1 })
    .onConflictDoUpdate({
      target: loginAttempts.identifierHash,
      set: {
        attempts: sql`CASE WHEN ${loginAttempts.windowStartedAt} <= NOW() - INTERVAL '15 minutes' THEN 1 ELSE ${loginAttempts.attempts} + 1 END`,
        windowStartedAt: sql`CASE WHEN ${loginAttempts.windowStartedAt} <= NOW() - INTERVAL '15 minutes' THEN NOW() ELSE ${loginAttempts.windowStartedAt} END`,
      },
    })
    .returning({ attempts: loginAttempts.attempts });

  return (attempt?.attempts ?? MAX_ATTEMPTS + 1) <= MAX_ATTEMPTS;
}

export async function authenticatePassword(
  identifier: string,
  password: string,
): Promise<
  | { authenticated: true; userId: string }
  | { authenticated: false; rateLimited?: boolean }
> {
  const normalizedIdentifier = normalizeIdentifier(identifier);
  if (
    normalizedIdentifier.length > MAX_IDENTIFIER_LENGTH ||
    password.length === 0 ||
    password.length > MAX_PASSWORD_LENGTH ||
    !isValidIdentifier(normalizedIdentifier)
  ) {
    return { authenticated: false };
  }

  if (!(await registerAttempt(normalizedIdentifier))) {
    return { authenticated: false, rateLimited: true };
  }

  const database = db();
  const accountCondition = normalizedIdentifier.includes("@")
    ? sql`lower(${users.email}) = ${normalizedIdentifier}`
    : eq(users.nik, normalizedIdentifier);
  const matchingAccounts = await database
    .select({
      id: users.id,
      status: users.status,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(accountCondition)
    .limit(2);
  const account =
    matchingAccounts.length === 1 ? matchingAccounts[0] : undefined;

  const hashToCheck = account?.passwordHash ?? (await DUMMY_HASH);
  const passwordMatches = await verifyPassword(password, hashToCheck);

  if (
    !account ||
    !account.passwordHash ||
    account.status !== "active" ||
    !passwordMatches
  ) {
    return { authenticated: false };
  }

  await database
    .delete(loginAttempts)
    .where(
      eq(loginAttempts.identifierHash, hashIdentifier(normalizedIdentifier)),
    );
  return { authenticated: true, userId: account.id };
}
