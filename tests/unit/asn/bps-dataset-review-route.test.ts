import { beforeEach, describe, expect, it, vi } from "vitest";

const requireModuleAccess = vi.fn();
const getPendingBpsDatasetReview = vi.fn();
const publishBpsDatasetReview = vi.fn();

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess,
}));

vi.mock("@/modules/integrations/bps/catalog", () => ({
  getPendingBpsDatasetReview,
  publishBpsDatasetReview,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("BPS dataset review route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireModuleAccess.mockResolvedValue({
      authorized: true,
      session: {
        userId: "user-1",
        roles: ["asn"],
      },
    });
    getPendingBpsDatasetReview.mockResolvedValue({
      slug: "statistik-bps",
      title: "Statistik BPS",
      summary: "Agregat BPS",
      lastUpdatedAt: new Date("2026-11-06T00:00:00.000Z"),
      recordCount: 4,
      preview: [],
    });
    publishBpsDatasetReview.mockResolvedValue(true);
  });

  it("mengizinkan operator ASN meninjau dataset yang menunggu publikasi", async () => {
    const { GET } = await import("@/app/api/asn/datasets/review/route");
    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      dataset: { slug: "statistik-bps", title: "Statistik BPS" },
    });
  });

  it("menolak publikasi untuk pengguna tanpa akses", async () => {
    requireModuleAccess.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });
    const { POST } = await import("@/app/api/asn/datasets/review/route");
    const response = await POST(
      new Request("http://localhost/api/asn/datasets/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      }),
    );

    expect(response.status).toBe(403);
    expect(publishBpsDatasetReview).not.toHaveBeenCalled();
  });

  it("memvalidasi aksi dan memublikasikan metadata hanya setelah submit ASN", async () => {
    const { POST } = await import("@/app/api/asn/datasets/review/route");
    const invalidResponse = await POST(
      new Request("http://localhost/api/asn/datasets/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "delete" }),
      }),
    );
    expect(invalidResponse.status).toBe(400);

    const response = await POST(
      new Request("http://localhost/api/asn/datasets/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      }),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ published: true });
    expect(publishBpsDatasetReview).toHaveBeenCalledOnce();
  });
});
