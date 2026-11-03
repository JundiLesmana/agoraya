import { describe, expect, it } from "vitest";

import {
  accountCanReceiveAccess,
  isModuleAccessAllowed,
  MODULE_ACCESS_KEYS,
  parseModuleAccessKey,
} from "@/modules/rbac/module-access";

describe("RBAC module access policy", () => {
  it("requires an explicit module grant and an active account", () => {
    expect(isModuleAccessAllowed("active", ["kyc"], "kyc")).toBe(true);
    expect(isModuleAccessAllowed("active", ["kyc"], "ogd")).toBe(false);
    expect(isModuleAccessAllowed("active", [], "ogd")).toBe(false);
    expect(isModuleAccessAllowed("inactive", ["kyc"], "kyc")).toBe(false);
    expect(isModuleAccessAllowed("suspended", ["kyc"], "kyc")).toBe(false);
  });

  it("requires active account status before granting module or Executive observer access", () => {
    expect(accountCanReceiveAccess("active", ["pst"], "not_granted")).toBe(
      true,
    );
    expect(accountCanReceiveAccess("inactive", ["pst"], "not_granted")).toBe(
      false,
    );
    expect(accountCanReceiveAccess("inactive", [], "observer")).toBe(false);
    expect(accountCanReceiveAccess("inactive", [], "not_granted")).toBe(true);
  });

  it("accepts only supported stored module keys", () => {
    expect(MODULE_ACCESS_KEYS).toEqual([
      "ogd",
      "insight",
      "kyc",
      "pst",
      "civic_reporting",
    ]);
    expect(parseModuleAccessKey("civic_reporting")).toBe("civic_reporting");
    expect(() => parseModuleAccessKey("admin")).toThrow(
      "Stored module access key is invalid",
    );
  });
});
