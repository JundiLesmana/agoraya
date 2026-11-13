import { beforeEach, describe, expect, it, vi } from "vitest";

const testState = vi.hoisted(() => ({
  requireModuleAccess: vi.fn(),
  getPendingAsnDatasetSubmissions: vi.fn(),
  publishAsnDatasetSubmission: vi.fn(),
}));

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess: testState.requireModuleAccess,
}));

vi.mock("@/modules/asn-datasets/service", () => ({
  AsnDatasetError: class AsnDatasetError extends Error {
    constructor(
      message: string,
      readonly status: number,
    ) {
      super(message);
    }
  },
  getPendingAsnDatasetSubmissions: testState.getPendingAsnDatasetSubmissions,
  publishAsnDatasetSubmission: testState.publishAsnDatasetSubmission,
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

describe("ASN dataset submission review route", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    testState.requireModuleAccess.mockResolvedValue({
      authorized: true,
      session: { userId: "reviewer-1", roles: ["staff"] },
    });
    testState.getPendingAsnDatasetSubmissions.mockResolvedValue([]);
    testState.publishAsnDatasetSubmission.mockResolvedValue({
      submissionId: "11111111-1111-4111-8111-111111111111",
      datasetId: "22222222-2222-4222-8222-222222222222",
      title: "Statistik daerah",
      slug: "statistik-daerah",
    });
  });

  it("returns pending submissions to an authorized reviewer", async () => {
    const { GET } = await import(
      "@/app/api/asn/datasets/submissions/review/route"
    );
    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ submissions: [] });
    expect(testState.getPendingAsnDatasetSubmissions).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "reviewer-1" }),
    );
  });

  it("rejects malformed or unauthorized publication requests", async () => {
    const { POST } = await import(
      "@/app/api/asn/datasets/submissions/review/route"
    );
    const invalid = await POST(
      new Request("http://localhost/api/asn/datasets/submissions/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "publish", submissionId: "invalid" }),
      }),
    );
    expect(invalid.status).toBe(400);

    testState.requireModuleAccess.mockResolvedValue({
      authorized: false,
      response: Response.json({ error: "Forbidden" }, { status: 403 }),
    });
    const forbidden = await POST(
      new Request("http://localhost/api/asn/datasets/submissions/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          submissionId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(forbidden.status).toBe(403);
    expect(testState.publishAsnDatasetSubmission).not.toHaveBeenCalled();
  });

  it("publishes only the requested submission through the service", async () => {
    const { POST } = await import(
      "@/app/api/asn/datasets/submissions/review/route"
    );
    const response = await POST(
      new Request("http://localhost/api/asn/datasets/submissions/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "publish",
          submissionId: "11111111-1111-4111-8111-111111111111",
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ published: true });
    expect(testState.publishAsnDatasetSubmission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "reviewer-1" }),
      "11111111-1111-4111-8111-111111111111",
    );
  });
});