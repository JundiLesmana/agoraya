import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSession, reviewApbdEntry, getApbdReviewQueue } = vi.hoisted(
  () => ({
    getCurrentSession: vi.fn(),
    reviewApbdEntry: vi.fn(),
    getApbdReviewQueue: vi.fn(),
  }),
);

vi.mock("@/lib/auth/session", () => ({ getCurrentSession }));
vi.mock("@/modules/apbd-budget/service", () => ({
  ApbdBudgetError: class ApbdBudgetError extends Error {
    status: number;
    constructor(message: string, status: number) {
      super(message);
      this.status = status;
    }
  },
  reviewApbdEntry,
  getApbdReviewQueue,
}));
vi.mock("@/lib/logger", () => ({ logger: { error: vi.fn() } }));

describe("APBD review route access", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("rejects non-administrators before processing a review decision", async () => {
    getCurrentSession.mockResolvedValue({
      userId: "11111111-1111-4111-8111-111111111111",
      tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      roles: ["asn"],
    });
    const { POST } = await import("@/app/api/admin/apbd/review/route");
    const response = await POST(
      new Request("http://localhost/api/admin/apbd/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entryId: "22222222-2222-4222-8222-222222222222",
          decision: "approve",
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(reviewApbdEntry).not.toHaveBeenCalled();
  });

  it("requires a reason before a rejection", async () => {
    getCurrentSession.mockResolvedValue({
      userId: "11111111-1111-4111-8111-111111111111",
      tenantId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      roles: ["admin"],
    });
    const { POST } = await import("@/app/api/admin/apbd/review/route");
    const response = await POST(
      new Request("http://localhost/api/admin/apbd/review", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          entryId: "22222222-2222-4222-8222-222222222222",
          decision: "reject",
          reason: "no",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(reviewApbdEntry).not.toHaveBeenCalled();
  });
});