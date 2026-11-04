import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const serviceMocks = vi.hoisted(() => ({
  createPasswordResetToken: vi.fn(),
  resetPassword: vi.fn(),
}));

vi.mock("@/modules/identity/password-reset/service", () => ({
  createPasswordResetToken: serviceMocks.createPasswordResetToken,
  resetPassword: serviceMocks.resetPassword,
  forgotPasswordSchema: z.object({ identifier: z.string().min(1).max(255) }),
  resetPasswordSchema: z.object({
    token: z.string().length(64).regex(/^[a-f\d]{64}$/i),
    password: z
      .string()
      .min(12, "Kata sandi minimal 12 karakter.")
      .max(256, "Kata sandi maksimal 256 karakter.")
      .regex(/\d/, "Kata sandi harus mengandung minimal 1 angka.")
      .regex(/[^a-zA-Z0-9]/, "Kata sandi harus mengandung minimal 1 simbol."),
  }),
  resetPasswordTokenSchema: z.string().length(64).regex(/^[a-f\d]{64}$/i),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST as forgotPost } from "@/app/api/auth/forgot-password/route";
import { POST as resetPost } from "@/app/api/auth/reset-password/route";

function requestWith(path: string, body: unknown): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("security: password reset", () => {
  beforeEach(() => {
    serviceMocks.createPasswordResetToken.mockReset();
    serviceMocks.resetPassword.mockReset();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("AUTH_SECRET", "test-auth-secret-with-at-least-32-characters");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns identical response for existing and non-existing accounts (no enumeration)", async () => {
    serviceMocks.createPasswordResetToken.mockResolvedValue({ issued: false });

    const existing = await forgotPost(
      requestWith("/api/auth/forgot-password", {
        identifier: "budi@example.id",
      }),
    );
    const nonExisting = await forgotPost(
      requestWith("/api/auth/forgot-password", {
        identifier: "nobody@example.id",
      }),
    );

    expect(existing.status).toBe(200);
    expect(nonExisting.status).toBe(200);
    expect(await existing.json()).toEqual(await nonExisting.json());
  });

  it("rejects weak passwords at the API boundary even if frontend is bypassed", async () => {
    const weakPasswords = [
      "short",
      "1234567",
      "Password12345",
      "Password!!!!!",
    ];
    for (const password of weakPasswords) {
      const response = await resetPost(
        requestWith("/api/auth/reset-password", {
          token: "a".repeat(64),
          password,
        }),
      );
      expect(response.status).toBe(400);
    }
    expect(serviceMocks.resetPassword).not.toHaveBeenCalled();
  });

  it("accepts passwords that meet all reset requirements at the API boundary", async () => {
    serviceMocks.resetPassword.mockResolvedValue(undefined);

    const response = await resetPost(
      requestWith("/api/auth/reset-password", {
        token: "a".repeat(64),
        password: "Password123!",
      }),
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.resetPassword).toHaveBeenCalledWith(
      "a".repeat(64),
      "Password123!",
    );
  });

  it("applies rate limiting to reset requests", async () => {
    const error = new Error("Terlalu banyak permintaan reset.");
    (error as { statusCode?: number }).statusCode = 429;
    serviceMocks.createPasswordResetToken.mockRejectedValue(error);

    const response = await forgotPost(
      requestWith("/api/auth/forgot-password", {
        identifier: "budi@example.id",
      }),
    );

    expect(response.status).toBe(429);
    expect(serviceMocks.createPasswordResetToken).toHaveBeenCalledTimes(1);
  });
});
