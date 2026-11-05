// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ExecutiveDashboardPage from "@/app/(executive)/executive/dashboard/page";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ExecutiveDashboardPage", () => {
  it("renders the ASN access directory and its empty state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.endsWith("/api/v1/asn/access/options")) {
          return Response.json({ data: { applicationRoles: [], modules: [] } });
        }
        if (url.endsWith("/api/v1/asn/access/summary")) {
          return Response.json({
            data: {
              total: 0,
              activeAndVerified: 0,
              executiveAccess: 0,
              requirementsIncomplete: 0,
            },
          });
        }
        return Response.json({ data: [], total: 0, limit: 7, offset: 0 });
      }),
    );

    render(<ExecutiveDashboardPage />);

    expect(await screen.findByRole("heading", { name: "Kontrol akses ASN" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Direktori ASN" })).toBeTruthy();
    expect(screen.getByText("Tidak ada ASN yang sesuai")).toBeTruthy();
  });
});
