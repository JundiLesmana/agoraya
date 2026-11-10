import { describe, expect, it } from "vitest";

import { getPostLoginRoute } from "@/lib/auth/post-login-route";

describe("post-login route", () => {
  it("sends ASN accounts directly to the ASN dashboard", () => {
    expect(getPostLoginRoute(["asn"])).toBe("/asn/dashboard");
  });

  it("preserves the existing destinations for other roles", () => {
    expect(getPostLoginRoute(["citizen"])).toBe("/reporting");
    expect(getPostLoginRoute(["staff"])).toBe("/asn/dashboard");
    expect(getPostLoginRoute(["executive", "asn"])).toBe(
      "/executive/dashboard",
    );
  });
});
