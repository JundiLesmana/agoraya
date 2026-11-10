import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockDb = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({ db: mockDb }));
vi.mock("@/lib/cloudinary/upload", () => ({
  uploadToCloudinary: vi.fn(),
}));

describe("service application processing", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("computes a warning SLA snapshot when time remaining is within four hours", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00.000Z"));

    const { computeSlaSnapshot } = await import("@/lib/service-applications/processing");

    expect(
      computeSlaSnapshot({
        processingStartedAt: "2026-01-01T08:00:00.000Z",
        slaPausedAt: null,
        slaPausedTotalMinutes: 0,
        slaTargetMinutes: 240,
      }),
    ).toMatchObject({
      elapsedMinutes: 120,
      remainingMinutes: 120,
      paused: false,
      state: "warning",
      startedAt: "2026-01-01T08:00:00.000Z",
      pausedAt: null,
      pausedTotalMinutes: 0,
      targetMinutes: 240,
    });
  });

  it("freezes elapsed SLA while paused", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));

    const { computeSlaSnapshot } = await import("@/lib/service-applications/processing");

    expect(
      computeSlaSnapshot({
        processingStartedAt: "2026-01-01T08:00:00.000Z",
        slaPausedAt: "2026-01-01T10:30:00.000Z",
        slaPausedTotalMinutes: 15,
        slaTargetMinutes: 300,
      }),
    ).toMatchObject({
      elapsedMinutes: 135,
      remainingMinutes: 165,
      paused: true,
      state: "warning",
      pausedAt: "2026-01-01T10:30:00.000Z",
      pausedTotalMinutes: 15,
    });
  });

  it("allows only same-tenant assignee or supervisor to manage a submission", async () => {
    const { canManageSubmission } = await import("@/lib/service-applications/processing");

    expect(
      canManageSubmission(
        {
          userId: "staff-1",
          tenantId: "tenant-1",
          role: "staff",
          roles: ["staff"],
          email: "staff@example.test",
        },
        { tenantId: "tenant-1", assigneeId: "staff-1" },
      ),
    ).toBe(true);

    expect(
      canManageSubmission(
        {
          userId: "staff-1",
          tenantId: "tenant-1",
          role: "staff",
          roles: ["staff"],
          email: "staff@example.test",
        },
        { tenantId: "tenant-1", assigneeId: null },
      ),
    ).toBe(false);

    expect(
      canManageSubmission(
        {
          userId: "admin-1",
          tenantId: "tenant-1",
          role: "asn",
          roles: ["admin", "asn"],
          email: "admin@example.test",
        },
        { tenantId: "tenant-1", assigneeId: null },
      ),
    ).toBe(true);

    expect(
      canManageSubmission(
        {
          userId: "admin-1",
          tenantId: "tenant-2",
          role: "asn",
          roles: ["admin", "asn"],
          email: "admin@example.test",
        },
        { tenantId: "tenant-1", assigneeId: "staff-1" },
      ),
    ).toBe(false);
  });
});
