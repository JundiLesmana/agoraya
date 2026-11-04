import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const serviceMocks = vi.hoisted(() => ({
  resetPassword: vi.fn(),
}));

vi.mock("@/modules/identity/password-reset/service", () => ({
  resetPassword: serviceMocks.resetPassword,
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

import { POST as resetPost } from "@/app/api/auth/reset-password/route";

function requestWith(body: unknown): Request {
  return new Request("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    serviceMocks.resetPassword.mockReset();
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/test");
    vi.stubEnv("AUTH_SECRET", "test-auth-secret-with-at-least-32-characters");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns ok after a successful password reset", async () => {
    serviceMocks.resetPassword.mockResolvedValue(undefined);

    const response = await resetPost(
      requestWith({ token: "a".repeat(64), password: "Baru12345678!" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(serviceMocks.resetPassword).toHaveBeenCalledWith(
      "a".repeat(64),
      "Baru12345678!",
    );
  });

  it("returns 400 for a weak password", async () => {
    const response = await resetPost(
      requestWith({ token: "a".repeat(64), password: "short" }),
    );

    expect(response.status).toBe(400);
    expect(serviceMocks.resetPassword).not.toHaveBeenCalled();
  });

  it("returns 400 when the token is invalid or expired", async () => {
    const error = new Error("Token reset tidak valid atau telah kedaluwarsa.");
    (error as { statusCode?: number }).statusCode = 400;
    serviceMocks.resetPassword.mockRejectedValue(error);

    const response = await resetPost(
      requestWith({ token: "b".repeat(64), password: "Baru12345678!" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: "Token reset tidak valid atau telah kedaluwarsa.",
    });
  });

  it.each([
    ["expired", "Token reset tidak valid atau telah kedaluwarsa."],
    ["already used", "Token reset tidak valid atau telah kedaluwarsa."],
  ])("rejects a token that is %s", async (_state, message) => {
    const error = new Error(message);
    (error as { statusCode?: number }).statusCode = 400;
    serviceMocks.resetPassword.mockRejectedValue(error);

    const response = await resetPost(
      requestWith({ token: "c".repeat(64), password: "Password123!" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: message });
  });

  it("explains an invalid token separately from password requirements", async () => {
    const response = await resetPost(
      requestWith({ token: "", password: "Baru12345678!" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_RESET_TOKEN",
      error: expect.stringContaining("Link reset tidak valid"),
    });
    expect(serviceMocks.resetPassword).not.toHaveBeenCalled();
  });

  it("returns the specific unmet password requirement", async () => {
    const response = await resetPost(
      requestWith({ token: "a".repeat(64), password: "Abcdefgh1!" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      code: "INVALID_PASSWORD",
      error: "Kata sandi minimal 12 karakter.",
    });
    expect(serviceMocks.resetPassword).not.toHaveBeenCalled();
  });

  it("accepts passwords with the required length, number, and symbol", async () => {
    serviceMocks.resetPassword.mockResolvedValue(undefined);
    const response = await resetPost(
      requestWith({ token: "a".repeat(64), password: "Password123!" }),
    );

    expect(response.status).toBe(200);
    expect(serviceMocks.resetPassword).toHaveBeenCalledWith(
      "a".repeat(64),
      "Password123!",
    );
  });

  it("rejects passwords that do not contain a symbol", async () => {
    const response = await resetPost(
      requestWith({ token: "a".repeat(64), password: "Password12345" }),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_PASSWORD",
      error: "Kata sandi harus mengandung minimal 1 simbol.",
    });
  });
});
