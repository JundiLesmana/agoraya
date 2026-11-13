import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const authMocks = vi.hoisted(() => ({
  authenticatePassword: vi.fn(),
  createSession: vi.fn(),
  destroySession: vi.fn(),
  validateSession: vi.fn(),
}));

vi.mock("@/modules/identity/password/service", () => ({
  authenticatePassword: authMocks.authenticatePassword,
}));

vi.mock("@/modules/identity/session/service", () => ({
  createSession: authMocks.createSession,
  destroySession: authMocks.destroySession,
  validateSession: authMocks.validateSession,
}));

import { POST } from "@/app/api/auth/route";

function requestWith(body: unknown): Request {
  return new Request("http://localhost/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth", () => {
  beforeEach(() => {
    authMocks.authenticatePassword.mockReset();
    authMocks.createSession.mockReset();
    authMocks.destroySession.mockReset();
    authMocks.validateSession.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("creates a secure HttpOnly session cookie after password authentication", async () => {
    vi.stubEnv("NODE_ENV", "production");
    authMocks.authenticatePassword.mockResolvedValue({
      authenticated: true,
      userId: "user-id",
    });
    authMocks.createSession.mockResolvedValue({
      token: "opaque-session-token",
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    authMocks.validateSession.mockResolvedValue({
      valid: true,
      roles: ["asn"],
    });

    const response = await POST(
      requestWith({ identifier: "citizen@example.id", password: "passphrase" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, roles: ["asn"] });
    expect(authMocks.authenticatePassword).toHaveBeenCalledWith(
      "citizen@example.id",
      "passphrase",
    );
    expect(authMocks.createSession).toHaveBeenCalledWith("user-id");
    expect(authMocks.validateSession).toHaveBeenCalledWith(
      "opaque-session-token",
    );
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("agoraya_session=opaque-session-token");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Secure");
  });

  it("does not issue a session cookie when the account has no active roles", async () => {
    authMocks.authenticatePassword.mockResolvedValue({
      authenticated: true,
      userId: "user-id",
    });
    authMocks.createSession.mockResolvedValue({
      token: "opaque-session-token",
      expiresAt: new Date("2030-01-01T00:00:00.000Z"),
    });
    authMocks.validateSession.mockResolvedValue({ valid: false, roles: [] });

    const response = await POST(
      requestWith({ identifier: "citizen@example.id", password: "passphrase" }),
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      error: "Akun belum memiliki akses aktif.",
    });
    expect(authMocks.destroySession).toHaveBeenCalledWith(
      "opaque-session-token",
    );
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("returns a generic authentication error and does not create a session", async () => {
    authMocks.authenticatePassword.mockResolvedValue({ authenticated: false });

    const response = await POST(
      requestWith({
        identifier: "1234567890123456",
        password: "wrong-password",
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: "NIK/email atau kata sandi tidak sesuai.",
    });
    expect(authMocks.createSession).not.toHaveBeenCalled();
  });

  it("rejects malformed credentials before running authentication", async () => {
    const response = await POST(
      requestWith({ identifier: "", password: "anything" }),
    );

    expect(response.status).toBe(400);
    expect(authMocks.authenticatePassword).not.toHaveBeenCalled();
  });

  it("reports throttling without issuing a session", async () => {
    authMocks.authenticatePassword.mockResolvedValue({
      authenticated: false,
      rateLimited: true,
    });

    const response = await POST(
      requestWith({ identifier: "citizen@example.id", password: "passphrase" }),
    );

    expect(response.status).toBe(429);
    expect(authMocks.createSession).not.toHaveBeenCalled();
  });
});
