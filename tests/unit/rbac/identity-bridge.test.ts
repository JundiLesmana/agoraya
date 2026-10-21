import { describe, it, expect, vi } from "vitest";

import {
  buildAccessRequest,
  subjectFromSession,
} from "@/modules/rbac/pdp/identity";
import type { SessionValidator } from "@/modules/rbac/pdp/identity";

describe("modules/rbac identity bridge", () => {
  it("resolves the subject of a valid session", async () => {
    const validate: SessionValidator = vi.fn().mockResolvedValue({
      valid: true,
      userId: "user-1",
      tenantId: "tenant-1",
    });

    const subject = await subjectFromSession("session-token", validate);

    expect(subject).toEqual({ userId: "user-1", tenantId: "tenant-1" });
    expect(validate).toHaveBeenCalledWith("session-token");
  });

  it("returns null for an invalid session", async () => {
    const validate: SessionValidator = vi
      .fn()
      .mockResolvedValue({ valid: false });

    expect(await subjectFromSession("session-token", validate)).toBeNull();
  });

  it("returns null when the session has no tenant", async () => {
    const validate: SessionValidator = vi.fn().mockResolvedValue({
      valid: true,
      userId: "user-1",
    });

    expect(await subjectFromSession("session-token", validate)).toBeNull();
  });

  it("returns null without calling the validator for an empty token", async () => {
    const validate: SessionValidator = vi.fn();

    expect(await subjectFromSession("", validate)).toBeNull();
    expect(validate).not.toHaveBeenCalled();
  });

  it("builds an access request from a subject", () => {
    const request = buildAccessRequest(
      { userId: "user-1", tenantId: "tenant-1" },
      { type: "tickets", id: "ticket-1", tenantId: "tenant-1" },
      "read",
      "req-1",
    );

    expect(request).toEqual({
      subject: { userId: "user-1", tenantId: "tenant-1" },
      resource: { type: "tickets", id: "ticket-1", tenantId: "tenant-1" },
      action: "read",
      requestId: "req-1",
    });
  });

  it("omits the request id when it is not given", () => {
    const request = buildAccessRequest(
      { userId: "user-1", tenantId: "tenant-1" },
      { type: "tickets" },
      "read",
    );

    expect("requestId" in request).toBe(false);
  });
});
