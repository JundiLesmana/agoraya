import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  getCurrentSession: vi.fn(),
  resolveReportingTenantId: vi.fn(),
  insertValues: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: testState.getCurrentSession,
}));

vi.mock("@/lib/tenancy/reporting", () => ({
  resolveReportingTenantId: testState.resolveReportingTenantId,
}));

vi.mock("@/lib/db", () => ({
  db: () => ({
    insert: () => ({ values: testState.insertValues }),
  }),
}));

vi.mock("@/lib/db/schema", () => ({
  serviceApplications: {},
}));

import { persistServiceApplication } from "@/lib/service-applications/persistence";

describe("persistServiceApplication", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    testState.getCurrentSession.mockResolvedValue({
      userId: "citizen-1",
      tenantId: "citizen-tenant",
    });
    testState.resolveReportingTenantId.mockResolvedValue("asn-tenant");
    testState.insertValues.mockResolvedValue(undefined);
  });

  it("stores citizen submissions in the configured ASN receiving tenant", async () => {
    const result = await persistServiceApplication({
      category: "education",
      serviceType: "assistance",
      serviceId: "bantuan-biaya",
      data: {
        namaPemohon: "Warga",
        kontakNotifikasi: "warga@example.test",
      },
    });

    expect(result.ok).toBe(true);
    expect(testState.insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "asn-tenant",
        applicantUserId: "citizen-1",
      }),
    );
  });

  it("does not save a submission when the receiving tenant is unavailable", async () => {
    testState.resolveReportingTenantId.mockResolvedValue(null);

    const result = await persistServiceApplication({
      category: "education",
      serviceType: "assistance",
      serviceId: "bantuan-biaya",
      data: {
        namaPemohon: "Warga",
        kontakNotifikasi: "warga@example.test",
      },
    });

    expect(result).toMatchObject({ ok: false, status: 503 });
    expect(testState.insertValues).not.toHaveBeenCalled();
  });
});