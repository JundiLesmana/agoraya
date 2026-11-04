import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sessionState = vi.hoisted(() => ({
  value: {
    userId: "actor-1",
    tenantId: "tenant-1",
    role: "superadmin",
    roles: ["superadmin"],
    email: "admin@example.com",
  },
}));

const serviceState = vi.hoisted(() => ({
  summary: { totals: { asnCount: 1, assignedTasks: 3, completedTasks: 3, completionRate: 1 } },
  details: { total: 1, limit: 20, offset: 0, items: [] },
  trends: { granularity: "day", items: [] },
  lowest: { items: [] },
  actionNeeded: { thresholdRate: 0.75, minimumTasks: 5, items: [] },
  exportResult: { body: "csv-body", contentType: "text/csv; charset=utf-8" },
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: vi.fn(async () => sessionState.value),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

vi.mock("@/modules/asn/performance-service", () => ({
  getAsnPerformanceSummary: vi.fn(async () => serviceState.summary),
  getAsnPerformanceDetails: vi.fn(async () => serviceState.details),
  getAsnPerformanceTrends: vi.fn(async () => serviceState.trends),
  getLowestActivityAsn: vi.fn(async () => serviceState.lowest),
  getAsnPerformanceActionNeeded: vi.fn(async () => serviceState.actionNeeded),
  exportAsnPerformance: vi.fn(async () => serviceState.exportResult),
}));

import { GET as getActionNeeded } from "@/app/api/v1/asn-performance/action-needed/route";
import { GET as getDetails } from "@/app/api/v1/asn-performance/details/route";
import { GET as getExport } from "@/app/api/v1/asn-performance/export/route";
import { GET as getLowest } from "@/app/api/v1/asn-performance/lowest-activity/route";
import { GET as getSummary } from "@/app/api/v1/asn-performance/summary/route";
import { GET as getTrends } from "@/app/api/v1/asn-performance/trends/route";
import {
  exportAsnPerformance,
  getAsnPerformanceActionNeeded,
  getAsnPerformanceDetails,
  getAsnPerformanceSummary,
  getAsnPerformanceTrends,
  getLowestActivityAsn,
} from "@/modules/asn/performance-service";

describe("asn performance routes", () => {
  beforeEach(() => {
    sessionState.value = {
      userId: "actor-1",
      tenantId: "tenant-1",
      role: "superadmin",
      roles: ["superadmin"],
      email: "admin@example.com",
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns summary data for superadmin", async () => {
    const response = await getSummary(new Request("http://localhost/api/v1/asn-performance/summary"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.summary });
    expect(vi.mocked(getAsnPerformanceSummary)).toHaveBeenCalled();
  });

  it("returns details data for superadmin", async () => {
    const response = await getDetails(new Request("http://localhost/api/v1/asn-performance/details?limit=10&offset=0"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.details });
    expect(vi.mocked(getAsnPerformanceDetails)).toHaveBeenCalled();
  });

  it("returns trend data for superadmin", async () => {
    const response = await getTrends(new Request("http://localhost/api/v1/asn-performance/trends?granularity=day"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.trends });
    expect(vi.mocked(getAsnPerformanceTrends)).toHaveBeenCalled();
  });

  it("returns lowest-activity data for superadmin", async () => {
    const response = await getLowest(new Request("http://localhost/api/v1/asn-performance/lowest-activity"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.lowest });
    expect(vi.mocked(getLowestActivityAsn)).toHaveBeenCalled();
  });

  it("returns action-needed data for superadmin", async () => {
    const response = await getActionNeeded(new Request("http://localhost/api/v1/asn-performance/action-needed"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: serviceState.actionNeeded });
    expect(vi.mocked(getAsnPerformanceActionNeeded)).toHaveBeenCalled();
  });

  it("streams export response with attachment headers", async () => {
    const response = await getExport(new Request("http://localhost/api/v1/asn-performance/export?format=csv"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="asn-performance.csv"');
    expect(await response.text()).toBe("csv-body");
    expect(vi.mocked(exportAsnPerformance)).toHaveBeenCalledWith(
      "tenant-1",
      expect.any(Object),
      "csv",
    );
  });

  it("rejects invalid filters before calling the service", async () => {
    const response = await getSummary(new Request("http://localhost/api/v1/asn-performance/summary?task_types=invalid"));

    expect(response.status).toBe(400);
    expect(vi.mocked(getAsnPerformanceSummary)).not.toHaveBeenCalled();
  });

  it("rejects non-superadmin access", async () => {
    sessionState.value = {
      userId: "actor-1",
      tenantId: "tenant-1",
      role: "operator",
      roles: ["operator"],
      email: "operator@example.com",
    };

    const response = await getSummary(new Request("http://localhost/api/v1/asn-performance/summary"));

    expect(response.status).toBe(403);
    expect(vi.mocked(getAsnPerformanceSummary)).not.toHaveBeenCalled();
  });
});
