import { describe, expect, it } from "vitest";

import { resolveSessionRoles } from "@/modules/identity/session/service";

describe("identity session roles", () => {
  it("adds the ASN identity role for an ASN profile without deriving module permissions", () => {
    expect(resolveSessionRoles([], true)).toEqual(["asn"]);
    expect(resolveSessionRoles(["staff"], true)).toEqual(["staff", "asn"]);
    expect(resolveSessionRoles([], false)).toEqual([]);
    expect(resolveSessionRoles(["operator"], false)).toEqual(["operator"]);
  });

  it("deduplicates roles without changing the existing role order", () => {
    expect(resolveSessionRoles(["asn", "staff", "staff"], true)).toEqual([
      "asn",
      "staff",
    ]);
  });
});
