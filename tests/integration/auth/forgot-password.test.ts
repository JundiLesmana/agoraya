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
    token: z.string().min(1),
    password: z
      .string()
      .min(12)
      .max(256)
      .regex(/\d/)
      .regex(/[^a-zA-Z0-9]/),
  }),
  resetPasswordTokenSchema: z.string().min(1),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST as forgotPost } from "@/app/api/auth/forgot-password/route";

function requestWith(body: unknown): Request {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/forgot-password", () => {
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

  it("returns generic success and never reveals whether the account exists", async () => {
    serviceMocks.createPasswordResetToken.mockResolvedValue({ issued: false });

    const response = await forgotPost(
      requestWith({ identifier: "nobody@example.id" }),
    );

    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.message).toBeDefined();
    expect(serviceMocks.createPasswordResetToken).toHaveBeenCalledWith(
      "nobody@example.id",
    );
  });

  it("issues a token and returns generic success for a registered account", async () => {
    serviceMocks.createPasswordResetToken.mockResolvedValue({
      issued: true,
      token: "reset-token-123",
      recipientEmail: "budi@example.id",
    });

    const response = await forgotPost(
      requestWith({ identifier: "budi@example.id" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: expect.any(String) });
    expect(serviceMocks.createPasswordResetToken).toHaveBeenCalledWith(
      "budi@example.id",
    );
  });

  it("returns 400 for an invalid identifier", async () => {
    const response = await forgotPost(requestWith({ identifier: "" }));

    expect(response.status).toBe(400);
    expect(serviceMocks.createPasswordResetToken).not.toHaveBeenCalled();
  });

  it("returns 429 when the service reports rate limiting", async () => {
    const error = new Error(
      "Terlalu banyak permintaan reset. Silakan coba lagi dalam beberapa menit.",
    );
    (error as { statusCode?: number }).statusCode = 429;
    serviceMocks.createPasswordResetToken.mockRejectedValue(error);

    const response = await forgotPost(
      requestWith({ identifier: "budi@example.id" }),
    );

    expect(response.status).toBe(429);
  });

  it("returns 503 for unexpected service errors", async () => {
    serviceMocks.createPasswordResetToken.mockRejectedValue(new Error("down"));

    const response = await forgotPost(
      requestWith({ identifier: "budi@example.id" }),
    );

    expect(response.status).toBe(503);
  });
});
