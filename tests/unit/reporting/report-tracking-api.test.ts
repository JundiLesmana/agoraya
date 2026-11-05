import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/reports/track/route";

const { mockDb } = vi.hoisted(() => ({ mockDb: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: mockDb }));

function mockPublicReportQuery(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn().mockReturnValue({ limit });
  const innerJoin = vi.fn().mockReturnValue({ where });
  const from = vi.fn().mockReturnValue({ innerJoin });
  const select = vi.fn().mockReturnValue({ from });
  mockDb.mockReturnValue({ select });
}

describe("GET /api/reports/track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("accepts the report number format created by the submission endpoint", async () => {
    mockPublicReportQuery([
      {
        reportNumber: "LP-20261105-BC7AEEF0-E1C",
        title: "Laporan uji",
        description: "Deskripsi laporan",
        category: "Infrastruktur",
        status: "submitted",
        submittedAt: new Date("2026-11-05T18:31:49.823Z"),
        responseDueAt: new Date("2026-11-08T18:31:49.823Z"),
        firstRespondedAt: null,
        resolvedAt: null,
        closedAt: null,
        subcategory: "Jalan rusak",
        province: "Jawa Barat",
        city: "Cianjur",
        address: "Jl. Cianjur 10",
        reporterName: null,
        showIdentity: false,
        attachmentNames: ["bukti.jpg"],
      },
    ]);

    const response = await GET(
      new Request(
        "http://localhost/api/reports/track?reportNumber=LP-20261105-BC7AEEF0-E1C",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      report: {
        reportNumber: "LP-20261105-BC7AEEF0-E1C",
        title: "Laporan uji",
        identityVisible: false,
        reporterName: null,
        attachmentNames: ["bukti.jpg"],
      },
    });
  });

  it("returns paginated report cards with public fields and filters", async () => {
    const offset = vi.fn().mockResolvedValue([
      {
        reportNumber: "LP-20261105-BC7AEEF0-E1C",
        title: "Laporan uji",
        description: "Deskripsi laporan",
        category: "Infrastruktur",
        status: "submitted",
        submittedAt: new Date("2026-11-05T18:31:49.823Z"),
        responseDueAt: new Date("2026-11-08T18:31:49.823Z"),
        firstRespondedAt: null,
        resolvedAt: null,
        closedAt: null,
        subcategory: "Jalan rusak",
        province: "Jawa Barat",
        city: "Cianjur",
        address: "Jl. Cianjur 10",
        reporterName: "Rahasia",
        showIdentity: false,
        attachmentNames: ["bukti.jpg"],
      },
    ]);
    const limit = vi.fn().mockReturnValue({ offset });
    const orderBy = vi.fn().mockReturnValue({ limit });
    const where = vi.fn().mockReturnValue({ orderBy });
    const innerJoin = vi.fn().mockReturnValue({ where });
    const from = vi.fn().mockReturnValue({ innerJoin });
    const select = vi.fn().mockReturnValue({ from });
    mockDb.mockReturnValue({ select });

    const response = await GET(
      new Request(
        "http://localhost/api/reports/track?category=Infrastruktur&status=submitted&search=Cianjur&limit=12&offset=0",
      ),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reports: [
        {
          reportNumber: "LP-20261105-BC7AEEF0-E1C",
          category: "Infrastruktur",
          reporterName: null,
          identityVisible: false,
          attachmentNames: ["bukti.jpg"],
        },
      ],
      limit: 12,
      offset: 0,
      hasMore: false,
    });
    expect(orderBy).toHaveBeenCalledOnce();
    expect(offset).toHaveBeenCalledWith(0);
  });

  it("rejects report numbers that do not match the generated format", async () => {
    const response = await GET(
      new Request(
        "http://localhost/api/reports/track?reportNumber=LP-20261105-BC7AEEF0-E1C0",
      ),
    );

    expect(response.status).toBe(400);
    expect(mockDb).not.toHaveBeenCalled();
  });
});
