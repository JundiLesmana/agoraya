import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModuleAccess = vi.fn();
const getStatisticsWorkspace = vi.fn();
const getStatisticDocumentDownloadUrl = vi.fn();

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess,
}));

vi.mock("@/modules/statistics-input/service", () => ({
  getStatisticsWorkspace,
  getStatisticDocumentDownloadUrl,
  saveStatisticsInput: vi.fn(),
  StatisticsInputError: class StatisticsInputError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
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
});
