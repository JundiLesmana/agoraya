import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AppError, ForbiddenError } from "@/lib/errors";
import {
  isKycReviewer,
  kycReviewerApiError,
  requireKycReviewerApi,
} from "@/modules/kyc/reviewer-access";

const sessionState = vi.hoisted(() => ({
  value: {
    userId: "reviewer-1",
    tenantId: "tenant-1",
    role: "admin",
    roles: ["admin"],
    email: "reviewer@example.com",
  } as {
    userId: string;
    tenantId: string;
    role: string;
    roles: string[];
    email?: string;
  } | null,
}));

const loggerState = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: vi.fn(async () => sessionState.value),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: loggerState.error,
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

describe("KYC reviewer access", () => {
  beforeEach(() => {
    sessionState.value = {
      userId: "reviewer-1",
      tenantId: "tenant-1",
      role: "admin",
      roles: ["admin"],
      email: "reviewer@example.com",
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("recognizes admin and kyc_verifikator roles", () => {
    expect(isKycReviewer(["admin"])).toBe(true);
    expect(isKycReviewer(["kyc_verifikator"])).toBe(true);
    expect(isKycReviewer(["operator", "kyc_verifikator"])).toBe(true);
    expect(isKycReviewer(["operator"])).toBe(false);
  });

  it("returns the current session for authorized reviewers", async () => {
    const result = await requireKycReviewerApi();

    expect(result.authorized).toBe(true);
    expect(result.session).toEqual(sessionState.value);
  });

  it("returns 401 when the request is unauthenticated", async () => {
    sessionState.value = null;

    const result = await requireKycReviewerApi();

    expect(result.authorized).toBe(false);
    if (result.authorized) {
      throw new Error("Expected unauthorized result");
    }
    expect(result.response.status).toBe(401);
    expect(await result.response.json()).toEqual({ error: "Authentication required" });
  });

  it("returns 403 when the user lacks reviewer access", async () => {
    sessionState.value = {
      userId: "operator-1",
      tenantId: "tenant-1",
      role: "operator",
      roles: ["operator"],
      email: "operator@example.com",
    };

    const result = await requireKycReviewerApi();

    expect(result.authorized).toBe(false);
    if (result.authorized) {
      throw new Error("Expected unauthorized result");
    }
    expect(result.response.status).toBe(403);
    expect(await result.response.json()).toEqual({ error: "KYC reviewer access required" });
  });

  it("formats app errors without logging expected client failures", async () => {
    const response = kycReviewerApiError(new ForbiddenError("No access"));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({
      code: "FORBIDDEN",
      statusCode: 403,
      message: "No access",
    });
    expect(loggerState.error).not.toHaveBeenCalled();
  });

  it("logs unexpected errors and returns a 500 payload", async () => {
    const response = kycReviewerApiError(new Error("boom"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      message: "Internal server error",
    });
    expect(loggerState.error).toHaveBeenCalledWith("kyc.reviewer.request_failed", {
      errorName: "Error",
    });
  });

  it("logs operational app errors when they resolve to server failures", async () => {
    const response = kycReviewerApiError(new AppError("BROKEN", "Broken", { statusCode: 503 }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      code: "BROKEN",
      statusCode: 503,
      message: "Broken",
    });
    expect(loggerState.error).toHaveBeenCalledWith("kyc.reviewer.request_failed", {
      errorName: "AppError",
    });
  });
});
