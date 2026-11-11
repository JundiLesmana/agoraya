import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireModuleAccess,
  getStatisticsWorkspace,
  getStatisticDocumentDownloadUrl,
  saveStatisticsInput,
  appendAuditEvent,
  mockDb,
  loggerError,
} = vi.hoisted(() => ({
  requireModuleAccess: vi.fn(),
  getStatisticsWorkspace: vi.fn(),
  getStatisticDocumentDownloadUrl: vi.fn(),
  saveStatisticsInput: vi.fn(),
  appendAuditEvent: vi.fn(),
  mockDb: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess,
}));

vi.mock("@/lib/db", () => ({ db: mockDb }));

vi.mock("@/modules/audit", () => ({ appendAuditEvent }));

vi.mock("@/modules/statistics-input/service", () => ({
  getStatisticsWorkspace,
  getStatisticDocumentDownloadUrl,
  saveStatisticsInput,
  StatisticsInputError: class StatisticsInputError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: loggerError },
}));

describe("statistics input routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireModuleAccess.mockResolvedValue({
      authorized: true,
      session: {
        userId: "user-1",
        tenantId: "tenant-1",
        role: "superadmin",
        roles: ["superadmin"],
      },
    });
    getStatisticsWorkspace.mockResolvedValue({
      assignments: [],
      indicators: [],
      entry: null,
    });
    getStatisticDocumentDownloadUrl.mockResolvedValue(
      "http://localhost/statistic.pdf",
    );
    saveStatisticsInput.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      status: "draft",
    });
    appendAuditEvent.mockResolvedValue(undefined);
    mockDb.mockReturnValue({});
  });

  it("allows a superadmin to load the statistics workspace", async () => {
    const { GET } = await import("@/app/api/asn/statistik/route");

    const response = await GET(
      new Request("http://localhost/api/asn/statistik"),
    );

    expect(response.status).toBe(200);
    expect(getStatisticsWorkspace).toHaveBeenCalledOnce();
  });

  it("allows a superadmin to download an assigned statistic document", async () => {
    const { GET } =
      await import("@/app/api/asn/statistik/documents/[documentId]/route");

    const response = await GET(
      new Request(
        "http://localhost/api/asn/statistik/documents/11111111-1111-4111-8111-111111111111",
      ),
      {
        params: Promise.resolve({
          documentId: "11111111-1111-4111-8111-111111111111",
        }),
      },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/statistic.pdf",
    );
    expect(getStatisticDocumentDownloadUrl).toHaveBeenCalledOnce();
  });

  it("continues to reject roles outside the statistics operators", async () => {
    requireModuleAccess.mockResolvedValue({
      authorized: true,
      session: {
        userId: "user-1",
        tenantId: "tenant-1",
        role: "citizen",
        roles: ["citizen"],
      },
    });
    const { GET } = await import("@/app/api/asn/statistik/route");

    const response = await GET(
      new Request("http://localhost/api/asn/statistik"),
    );

    expect(response.status).toBe(401);
    expect(getStatisticsWorkspace).not.toHaveBeenCalled();
  });

  it("does not report a saved entry as failed when audit logging fails", async () => {
    appendAuditEvent.mockRejectedValue(new Error("audit database unavailable"));
    const formData = new FormData();
    formData.set("payload", "{}");
    const { POST } = await import("@/app/api/asn/statistik/route");

    const response = await POST(
      new Request("http://localhost/api/asn/statistik", {
        method: "POST",
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "11111111-1111-4111-8111-111111111111",
      status: "draft",
      auditWarning: expect.stringContaining("Data tersimpan"),
    });
    expect(loggerError).toHaveBeenCalledWith(
      "asn.statistics.audit_failed_after_save",
      expect.objectContaining({
        entryId: "11111111-1111-4111-8111-111111111111",
      }),
    );
  });
});