import { describe, expect, it } from "vitest";

import {
  asnAccessFiltersSchema,
  executiveAccessConfirmSchema,
  executiveAccessDraftSchema,
  updateAsnAccessSchema,
} from "@/modules/asn/access-schema";
import { isAsnAccessAdmin } from "@/modules/asn/access-policy";

describe("ASN access administration policy", () => {
  it("allows access administration only to Superadmins", () => {
    expect(isAsnAccessAdmin(["superadmin"])).toBe(true);
    expect(isAsnAccessAdmin(["operator"])).toBe(false);
    expect(isAsnAccessAdmin(["superadmin", "operator"])).toBe(true);
  });
});

describe("ASN access API schemas", () => {
  it("accepts supported list filters and bounds pagination", () => {
    expect(
      asnAccessFiltersSchema.safeParse({
        q: "Siti",
        name: "Siti",
        nip: "19850101",
        opd: "Dinas",
        position: "Analis",
        accountStatus: "active",
        applicationRole: "verifikator",
        module: "kyc",
        limit: "50",
      }).success,
    ).toBe(true);
    expect(asnAccessFiltersSchema.safeParse({ limit: "1000" }).success).toBe(
      false,
    );
    expect(
      asnAccessFiltersSchema.safeParse({ module: "unknown" }).success,
    ).toBe(false);
  });

  it("requires at least one valid access field and rejects account status updates", () => {
    expect(updateAsnAccessSchema.safeParse({}).success).toBe(false);
    expect(
      updateAsnAccessSchema.safeParse({ modules: ["kyc", "unknown"] }).success,
    ).toBe(false);
    expect(
      updateAsnAccessSchema.safeParse({ modules: ["kyc"], status: "active" })
        .success,
    ).toBe(false);
    expect(
      updateAsnAccessSchema.safeParse({
        applicationRoles: ["operator", "verifikator"],
        modules: ["ogd", "kyc"],
        executiveStatus: "observer",
      }).success,
    ).toBe(true);
    expect(
      updateAsnAccessSchema.safeParse({ executiveStatus: "admin" }).success,
    ).toBe(false);
  });

  it("accepts executive access drafts with optional account status", () => {
    expect(executiveAccessDraftSchema.safeParse({}).success).toBe(false);
    expect(
      executiveAccessDraftSchema.safeParse({
        accountStatus: "active",
        applicationRoles: ["operator"],
        modules: ["ogd", "kyc"],
        executiveStatus: "observer",
      }).success,
    ).toBe(true);
    expect(
      executiveAccessDraftSchema.safeParse({ accountStatus: "deleted" }).success,
    ).toBe(false);
  });

  it("requires a draft token to confirm executive access", () => {
    expect(executiveAccessConfirmSchema.safeParse({}).success).toBe(false);
    expect(
      executiveAccessConfirmSchema.safeParse({ draftToken: "token-123" }).success,
    ).toBe(true);
  });
});
