import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const passwordServiceMocks = vi.hoisted(() => ({
  hashPassword: vi.fn(),
  normalizeIdentifier: vi.fn(),
}));

vi.mock("@/modules/identity/password/service", () => ({
  hashPassword: passwordServiceMocks.hashPassword,
  normalizeIdentifier: passwordServiceMocks.normalizeIdentifier,
}));

const dbMocks = vi.hoisted(() => ({
  select: vi.fn(() => makeQuery()),
  insert: vi.fn(() => makeQuery()),
  update: vi.fn(() => makeQuery()),
  delete: vi.fn(() => makeQuery()),
  execute: vi.fn(async () => []),
  transaction: vi.fn(),
  configuredRows: [] as unknown[],
  returnedRows: [] as { userId: string }[],
}));

function makeQuery() {
  const query = {
    from: vi.fn(() => query),
    where: vi.fn(() => query),
    orderBy: vi.fn(() => query),
    limit: vi.fn(() => query),
    returning: vi.fn(async () => dbMocks.returnedRows),
    onConflictDoUpdate: vi.fn(() => query),
    values: vi.fn(() => query),
    set: vi.fn(() => query),
    then: (resolve: (value: unknown[]) => void) =>
      resolve(dbMocks.configuredRows),
  };
  return query;
}

dbMocks.transaction.mockImplementation(
  async (callback: (transaction: unknown) => Promise<unknown>) =>
    callback(dbMocks),
);

vi.mock("@/lib/db", () => ({
  db: () => dbMocks,
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "test-auth-secret-with-at-least-32-characters");
});

import {
  createPasswordResetToken,
  consumePasswordResetToken,
  forgotPasswordSchema,
  resetPassword,
  resetPasswordSchema,
} from "@/modules/identity/password-reset/service";

describe("password-reset schemas", () => {
  it("accepts a 16-digit NIK", () => {
    expect(forgotPasswordSchema.parse({ identifier: "0123456789012345" })).toEqual({
      identifier: "0123456789012345",
    });
  });

  it("accepts a valid email", () => {
    expect(forgotPasswordSchema.parse({ identifier: "budi@example.id" })).toEqual({
      identifier: "budi@example.id",
    });
  });

  it("rejects an empty identifier", () => {
    expect(() => forgotPasswordSchema.parse({ identifier: "" })).toThrow();
  });

  it("rejects an identifier longer than 255 characters", () => {
    expect(() =>
      forgotPasswordSchema.parse({ identifier: "a".repeat(256) }),
    ).toThrow();
  });

  it("accepts a strong password", () => {
    expect(
      resetPasswordSchema.parse({
        token: "a".repeat(64),
        password: "Abcdefghijk1!",
      }),
    ).toEqual({ token: "a".repeat(64), password: "Abcdefghijk1!" });
  });

  it("rejects malformed or oversized reset tokens", () => {
    expect(() =>
      resetPasswordSchema.parse({ token: "short", password: "Abcdefghijk1!" }),
    ).toThrow();
    expect(() =>
      resetPasswordSchema.parse({
        token: "a".repeat(65),
        password: "Abcdefghijk1!",
      }),
    ).toThrow();
  });

  it("rejects a short password", () => {
    expect(() =>
      resetPasswordSchema.parse({
        token: "a".repeat(64),
        password: "Abc1!",
      }),
    ).toThrow();
  });

  it("requires a number and a symbol in addition to the minimum length", () => {
    expect(() =>
      resetPasswordSchema.parse({
        token: "a".repeat(64),
        password: "Password12345",
      }),
    ).toThrow(/simbol/);
    expect(() =>
      resetPasswordSchema.parse({
        token: "a".repeat(64),
        password: "Password!!!!!",
      }),
    ).toThrow(/angka/);
  });
});

describe("createPasswordResetToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.configuredRows = [];
    dbMocks.returnedRows = [];
    passwordServiceMocks.hashPassword.mockReset();
    passwordServiceMocks.normalizeIdentifier.mockImplementation((identifier: string) =>
      identifier.includes("@") ? identifier.trim().toLowerCase() : identifier.trim(),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("issues a token for an existing account with an enrolled password", async () => {
    passwordServiceMocks.hashPassword.mockResolvedValue("mock-hash");
    dbMocks.configuredRows = [
      { id: "user-1", passwordHash: "existing-hash", email: "budi@example.id" },
    ];

    const result = await createPasswordResetToken("budi@example.id");

    expect(result.issued).toBe(true);
    expect(typeof result.token).toBe("string");
    if (!result.token) throw new Error("token should be defined");
    expect(result.token.length).toBe(64);
    expect(result.recipientEmail).toBe("budi@example.id");
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(dbMocks.insert).toHaveBeenCalled();
  });

  it("does not issue a token for an account without an enrolled password", async () => {
    dbMocks.configuredRows = [{ id: "user-1", passwordHash: null, email: "budi@example.id" }];

    const result = await createPasswordResetToken("budi@example.id");

    expect(result.issued).toBe(false);
    expect(dbMocks.insert).not.toHaveBeenCalled();
  });

  it("does not issue a token for a non-existent account", async () => {
    dbMocks.configuredRows = [];

    const result = await createPasswordResetToken("nobody@example.id");

    expect(result.issued).toBe(false);
    expect(dbMocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid NIK", async () => {
    await expect(createPasswordResetToken("123456")).rejects.toThrow();
    expect(dbMocks.insert).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    await expect(createPasswordResetToken("not-an-email")).rejects.toThrow();
    expect(dbMocks.insert).not.toHaveBeenCalled();
  });

  it("rate limits repeated reset requests", async () => {
    dbMocks.configuredRows = Array.from({ length: 3 }, () => ({
      createdAt: new Date(),
    }));

    await expect(createPasswordResetToken("budi@example.id")).rejects.toThrow(
      /Terlalu banyak permintaan reset/,
    );
    expect(dbMocks.execute).toHaveBeenCalled();
  });
});

describe("consumePasswordResetToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.configuredRows = [];
    dbMocks.returnedRows = [];
    passwordServiceMocks.normalizeIdentifier.mockImplementation((identifier: string) =>
      identifier.includes("@") ? identifier.trim().toLowerCase() : identifier.trim(),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("consumes a fresh, unused, unexpired token", async () => {
    dbMocks.returnedRows = [{ userId: "user-1" }];

    const result = await consumePasswordResetToken("valid-token");

    expect(result).toEqual({ valid: true, userId: "user-1" });
    expect(dbMocks.update).toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    const result = await consumePasswordResetToken("expired-token");

    expect(result).toEqual({ valid: false });
    expect(dbMocks.update).toHaveBeenCalled();
  });

  it("rejects an already-used token", async () => {
    const result = await consumePasswordResetToken("used-token");

    expect(result).toEqual({ valid: false });
  });

  it("rejects an unknown token", async () => {
    dbMocks.configuredRows = [];

    const result = await consumePasswordResetToken("unknown-token");

    expect(result).toEqual({ valid: false });
  });

  it("allows only the first concurrent claim of a token", async () => {
    dbMocks.returnedRows = [{ userId: "user-1" }];
    await expect(consumePasswordResetToken("single-use-token")).resolves.toEqual({
      valid: true,
      userId: "user-1",
    });

    dbMocks.returnedRows = [];
    await expect(consumePasswordResetToken("single-use-token")).resolves.toEqual({
      valid: false,
    });
  });
});

describe("resetPassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMocks.configuredRows = [];
    dbMocks.returnedRows = [];
    passwordServiceMocks.hashPassword.mockResolvedValue("new-hash");
    passwordServiceMocks.normalizeIdentifier.mockImplementation((identifier: string) =>
      identifier.includes("@") ? identifier.trim().toLowerCase() : identifier.trim(),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("updates the password hash for a valid token", async () => {
    dbMocks.returnedRows = [{ userId: "user-1" }];

    await resetPassword("valid-token", "Baru12345678!");

    expect(passwordServiceMocks.hashPassword).toHaveBeenCalledWith("Baru12345678!");
    expect(dbMocks.update).toHaveBeenCalledTimes(2);
    expect(dbMocks.transaction).toHaveBeenCalledOnce();
  });

  it("throws for an invalid token", async () => {
    await expect(
      resetPassword("invalid-token", "Baru12345678!"),
    ).rejects.toThrow(/tidak valid atau telah kedaluwarsa/);
    expect(passwordServiceMocks.hashPassword).not.toHaveBeenCalled();
  });

  it("rolls back the token claim if hashing fails", async () => {
    dbMocks.returnedRows = [{ userId: "user-1" }];
    passwordServiceMocks.hashPassword.mockRejectedValueOnce(new Error("hash failed"));

    await expect(
      resetPassword("valid-token", "Baru12345678!"),
    ).rejects.toThrow("hash failed");
    expect(dbMocks.transaction).toHaveBeenCalledOnce();
  });
});
