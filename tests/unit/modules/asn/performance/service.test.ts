import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  exportAsnPerformance,
  getAsnPerformanceActionNeeded,
  getAsnPerformanceDetails,
  getAsnPerformanceSummary,
  getAsnPerformanceTrends,
  getLowestActivityAsn,
} from "@/modules/asn/performance-service";
import { resolveAsnPerformanceFilters } from "@/modules/asn/performance-schema";

const dbState = vi.hoisted(() => ({
  participantRows: [
    {
      userId: "user-1",
      name: "Budi",
      email: "budi@example.com",
      nip: "111",
      opd: "Kominfo",
      unit: "Data",
      position: "Analis",
    },
    {
      userId: "user-2",
      name: "Cici",
      email: "cici@example.com",
      nip: "222",
      opd: "Kominfo",
      unit: "Data",
      position: "Analis",
    },
  ],
  submitRows: [
    {
      userId: "user-1",
      tenantId: "tenant-1",
      completedAt: new Date("2026-02-01T10:00:00.000Z"),
      taskType: "submit_cms",
    },
  ],
  reviewCmsRows: [
    {
      userId: "user-1",
      tenantId: "tenant-1",
      completedAt: new Date("2026-02-02T10:00:00.000Z"),
      taskType: "review_cms",
    },
  ],
  reviewKycRows: [
    {
      userId: "user-1",
      tenantId: "tenant-1",
      completedAt: new Date("2026-02-03T10:00:00.000Z"),
      taskType: "review_kyc",
    },
  ],
  auditRows: [] as {
    actorId: string;
    action: string;
    targetTable: string;
    targetId: string;
    metadata: Record<string, unknown>;
    completedAt: Date;
  }[],
}));

vi.mock("@/lib/db", () => ({
  db: () => ({
    select(selection: Record<string, unknown>) {
      const values = Object.values(selection);
      const fieldNames = values
        .map((value) =>
          value && typeof value === "object" && "name" in value
            ? String((value as { name: string }).name)
            : null,
        )
        .filter((value): value is string => value !== null);

      let rows: unknown[] = [];
      if (fieldNames.includes("email") && fieldNames.includes("nip")) {
        rows = dbState.participantRows;
      } else if (fieldNames.includes("created_by")) {
        rows = dbState.submitRows;
      } else if (fieldNames.includes("reviewer_id")) {
        rows = dbState.reviewCmsRows;
      } else if (fieldNames.includes("approver_id")) {
        rows = dbState.reviewKycRows;
      } else if (fieldNames.includes("metadata")) {
        rows = dbState.auditRows;
      }

      return {
        from() {
          return {
            innerJoin() {
              return this;
            },
            leftJoin() {
              return this;
            },
            where() {
              return Promise.resolve(rows);
            },
            then(onFulfilled: (value: unknown[]) => unknown, onRejected?: (reason: unknown) => unknown) {
              return Promise.resolve(rows).then(onFulfilled, onRejected);
            },
          };
        },
      };
    },
  }),
}));

describe("asn performance service", () => {
  beforeEach(() => {
    dbState.participantRows = [
      {
        userId: "user-1",
        name: "Budi",
        email: "budi@example.com",
        nip: "111",
        opd: "Kominfo",
        unit: "Data",
        position: "Analis",
      },
      {
        userId: "user-2",
        name: "Cici",
        email: "cici@example.com",
        nip: "222",
        opd: "Kominfo",
        unit: "Data",
        position: "Analis",
      },
    ];
    dbState.submitRows = [
      {
        userId: "user-1",
        tenantId: "tenant-1",
        completedAt: new Date("2026-02-01T10:00:00.000Z"),
        taskType: "submit_cms",
      },
    ];
    dbState.reviewCmsRows = [
      {
        userId: "user-1",
        tenantId: "tenant-1",
        completedAt: new Date("2026-02-02T10:00:00.000Z"),
        taskType: "review_cms",
      },
    ];
    dbState.reviewKycRows = [
      {
        userId: "user-1",
        tenantId: "tenant-1",
        completedAt: new Date("2026-02-03T10:00:00.000Z"),
        taskType: "review_kyc",
      },
    ];
    dbState.auditRows = [];
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.PERFORMANCE_ACTION_THRESHOLD_RATE;
    delete process.env.PERFORMANCE_ACTION_MIN_TASKS;
  });

  it("includes staff without activity in summary and lowest-activity ranking", async () => {
    const filters = resolveAsnPerformanceFilters({ task_types: undefined });

    const summary = await getAsnPerformanceSummary("tenant-1", filters);
    const lowest = await getLowestActivityAsn("tenant-1", filters);

    expect(summary.totals).toEqual({
      asnCount: 2,
      assignedTasks: 3,
      completedTasks: 3,
      completionRate: null,
      withActivityCount: 1,
      noActivityCount: 1,
    });
    expect(lowest.items).toHaveLength(2);
    expect(lowest.items[0]?.userId).toBe("user-2");
  });

  it("shows no-assignment label and null completion rate in details", async () => {
    const filters = resolveAsnPerformanceFilters({ task_types: undefined, limit: 10, offset: 0 });

    const details = await getAsnPerformanceDetails("tenant-1", filters);
    const idle = details.items.find((item) => item.userId === "user-2");

    expect(idle).toMatchObject({
      assignedTasks: 0,
      completedTasks: 0,
      completionRate: null,
      statusLabel: "Belum ada aktivitas",
    });
  });

  it("returns trend buckets by requested granularity", async () => {
    const filters = resolveAsnPerformanceFilters({ task_types: undefined, granularity: "day" });

    const trends = await getAsnPerformanceTrends("tenant-1", filters);

    expect(trends.items).toHaveLength(3);
    expect(trends.items.map(({ periodStart, totalCompleted }) => ({
      periodStart,
      totalCompleted,
    }))).toEqual([
      { periodStart: "2026-02-01", totalCompleted: 1 },
      { periodStart: "2026-02-02", totalCompleted: 1 },
      { periodStart: "2026-02-03", totalCompleted: 1 },
    ]);
    expect(trends.items[0]?.taskBreakdown.submit_cms).toBe(1);
    expect(trends.items[1]?.taskBreakdown.review_cms).toBe(1);
    expect(trends.items[2]?.taskBreakdown.review_kyc).toBe(1);
  });

  it("counts published APBD entries as their own ASN performance activity", async () => {
    dbState.auditRows = [
      {
        actorId: "user-1",
        action: "asn.apbd.saved",
        targetTable: "apbd_entries",
        targetId: "entry-1",
        metadata: { tenantId: "tenant-1", status: "published", result: "success" },
        completedAt: new Date("2026-02-04T10:00:00.000Z"),
      },
      {
        actorId: "user-2",
        action: "asn.apbd.saved",
        targetTable: "apbd_entries",
        targetId: "entry-2",
        metadata: { tenantId: "tenant-1", status: "draft", result: "success" },
        completedAt: new Date("2026-02-04T11:00:00.000Z"),
      },
      {
        actorId: "user-1",
        action: "asn.apbd.review.approved",
        targetTable: "apbd_entries",
        targetId: "entry-3",
        metadata: {
          tenantId: "tenant-1",
          status: "published",
          result: "success",
          operatorId: "user-2",
        },
        completedAt: new Date("2026-02-04T12:00:00.000Z"),
      },
    ];
    const filters = resolveAsnPerformanceFilters({
      task_types: ["apbd_input"],
    });

    const details = await getAsnPerformanceDetails("tenant-1", filters);

    expect(details.items.find((item) => item.userId === "user-1")?.taskBreakdown.apbd_input).toBe(1);
    expect(details.items.find((item) => item.userId === "user-2")?.taskBreakdown.apbd_input).toBe(1);
  });

  it("returns empty action-needed items when everyone meets threshold", async () => {
    process.env.PERFORMANCE_ACTION_THRESHOLD_RATE = "0.9";
    process.env.PERFORMANCE_ACTION_MIN_TASKS = "2";
    const filters = resolveAsnPerformanceFilters({ task_types: undefined });

    const actionNeeded = await getAsnPerformanceActionNeeded("tenant-1", filters);

    expect(actionNeeded.items).toEqual([]);
    expect(actionNeeded.thresholdRate).toBe(0.9);
    expect(actionNeeded.minimumTasks).toBe(2);
  });

  it("exports csv with details rows", async () => {
    const filters = resolveAsnPerformanceFilters({ task_types: undefined, limit: 10, offset: 0 });

    const result = await exportAsnPerformance("tenant-1", filters, "csv");

    expect(result.contentType).toBe("text/csv; charset=utf-8");
    expect(result.body).toContain("userId,name,email");
    expect(result.body).toContain('"user-2","Cici","cici@example.com"');
  });
});
