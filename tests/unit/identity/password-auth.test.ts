import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const dbState = vi.hoisted(() => ({
  attempts: 1,
  account: null as null | {
    id: string;
    status: "active" | "inactive";
    passwordHash: string | null;
  },
  deleteCalls: 0,
  selectCalls: 0,
}));

vi.mock("@/lib/db", () => ({
  db: () => ({
    insert: () => ({
      values: () => ({
        onConflictDoUpdate: () => ({
          returning: async () => [{ attempts: dbState.attempts }],
        }),
      }),
    }),
    select: () => {
      dbState.selectCalls += 1;
      return {
        from: () => ({
          where: () => ({
            limit: async () => (dbState.account ? [dbState.account] : []),
          }),
        }),
      };
    },
    delete: () => ({
      where: async () => {
        dbState.deleteCalls += 1;
      },
    }),
  }),
}));

import {
  authenticatePassword,
  hashPassword,
} from "@/modules/identity/password/service";

describe("password authentication", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-auth-secret-with-at-least-32-characters");
    dbState.attempts = 1;
    dbState.account = null;
    dbState.deleteCalls = 0;
    dbState.selectCalls = 0;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("authenticates an active registered account by case-insensitive email", async () => {
    const passwordHash = await hashPassword("correct-horse-battery");
    dbState.account = { id: "existing-user", status: "active", passwordHash };

    await expect(
      authenticatePassword("Citizen@Example.ID", "correct-horse-battery"),
    ).resolves.toEqual({
      authenticated: true,
      userId: "existing-user",
    });
    expect(dbState.deleteCalls).toBe(2);
  });

  it("authenticates a registered account using its NIK", async () => {
    const passwordHash = await hashPassword("correct-horse-battery");
    dbState.account = { id: "existing-user", status: "active", passwordHash };

    await expect(
      authenticatePassword("0123456789012345", "correct-horse-battery"),
    ).resolves.toEqual({
      authenticated: true,
      userId: "existing-user",
    });
  });

  it("does not authenticate inactive accounts or accounts without an enrolled password", async () => {
    const passwordHash = await hashPassword("correct-horse-battery");
    dbState.account = { id: "existing-user", status: "inactive", passwordHash };
    await expect(
      authenticatePassword("citizen@example.id", "correct-horse-battery"),
    ).resolves.toEqual({
      authenticated: false,
    });

    dbState.account = {
      id: "existing-user",
      status: "active",
      passwordHash: null,
    };
    await expect(
      authenticatePassword("citizen@example.id", "correct-horse-battery"),
    ).resolves.toEqual({
      authenticated: false,
    });
  });

  it("stops database account lookup after the identifier reaches its attempt limit", async () => {
    dbState.attempts = 7;

    await expect(
      authenticatePassword("citizen@example.id", "wrong-password"),
    ).resolves.toEqual({
      authenticated: false,
      rateLimited: true,
    });
    expect(dbState.selectCalls).toBe(0);
  });
});
