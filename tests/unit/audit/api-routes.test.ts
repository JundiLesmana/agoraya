import { beforeEach, describe, expect, it, vi } from "vitest";

const requireAsnAccessAdmin = vi.fn();
const listAuditLogs = vi.fn();
const getAuditLogByEventId = vi.fn();
const summarizeAuditLogs = vi.fn();
const exportAuditLogs = vi.fn();
const db = vi.fn(() => "db-instance");

vi.mock("@/modules/asn/access-api", () => ({
  requireAsnAccessAdmin,
}));

vi.mock("@/modules/audit", () => ({
  listAuditLogs,
  getAuditLogByEventId,
  summarizeAuditLogs,
  exportAuditLogs,
}));

vi.mock("@/lib/db", () => ({
  db,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
  },
}));

describe("audit log api routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.mockReturnValue("db-instance");
    requireAsnAccessAdmin.mockResolvedValue({
      authorized: true,
      session: { userId: "user-1", tenantId: "tenant-1", roles: ["superadmin"] },
    });
  });

  it("lists audit logs with translated filters", async () => {
    listAuditLogs.mockResolvedValue({ data: [], meta: { total: 0, limit: 50, offset: 0, dateRange: { startDate: "2026-10-01T00:00:00.000Z", endDate: "2026-10-08T00:00:00.000Z" } } });
    const { GET } = await import("@/app/api/v1/audit/logs/route");

    const response = await GET(
      new Request("http://localhost/api/v1/audit/logs?start_date=2026-10-01&end_date=2026-10-08&actor_id=00000000-0000-0000-0000-000000000001&module=rbac&action=rbac.grant.permission_assigned&result=success&object_type=role_permissions&search_query=grant&limit=25&offset=10"),
    );

    expect(response.status).toBe(200);
    expect(listAuditLogs).toHaveBeenCalledWith("db-instance", {
      startDate: "2026-10-01",
      endDate: "2026-10-08",
      actorId: "00000000-0000-0000-0000-000000000001",
      module: "rbac",
      action: "rbac.grant.permission_assigned",
      result: "success",
      objectType: "role_permissions",
      searchQuery: "grant",
      limit: 25,
      offset: 10,
      tenantId: "tenant-1",
    });
  });

  it("gets a single audit log by event id", async () => {
    getAuditLogByEventId.mockResolvedValue({ data: { eventId: "AUD-20261008-001" } });
    const { GET } = await import("@/app/api/v1/audit/logs/[event_id]/route");

    const response = await GET(new Request("http://localhost/api/v1/audit/logs/AUD-20261008-001"), {
      params: Promise.resolve({ event_id: "AUD-20261008-001" }),
    });

    expect(response.status).toBe(200);
    expect(getAuditLogByEventId).toHaveBeenCalledWith(
      "db-instance",
      "AUD-20261008-001",
      "tenant-1",
    );
  });

  it("returns summary data using shared query parsing", async () => {
    summarizeAuditLogs.mockResolvedValue({ data: { total: 1, byModule: [], byAction: [], byResult: [], byObjectType: [] } });
    const { GET } = await import("@/app/api/v1/audit/logs/summary/route");

    const response = await GET(
      new Request("http://localhost/api/v1/audit/logs/summary?module=kyc&search_query=approval"),
    );

    expect(response.status).toBe(200);
    expect(summarizeAuditLogs).toHaveBeenCalledWith("db-instance", {
      startDate: undefined,
      endDate: undefined,
      actorId: undefined,
      module: "kyc",
      action: undefined,
      result: undefined,
      objectType: undefined,
      searchQuery: "approval",
      tenantId: "tenant-1",
    });
  });

  it("exports audit logs as downloadable csv", async () => {
    exportAuditLogs.mockResolvedValue({
      body: "id,action\n1,rbac.grant.permission_assigned",
      contentType: "text/csv; charset=utf-8",
    });
    const { GET } = await import("@/app/api/v1/audit/logs/export/route");

    const response = await GET(
      new Request("http://localhost/api/v1/audit/logs/export?format=csv&module=rbac"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="audit-logs.csv"');
    expect(exportAuditLogs).toHaveBeenCalledWith("db-instance", {
      startDate: undefined,
      endDate: undefined,
      actorId: undefined,
      module: "rbac",
      action: undefined,
      result: undefined,
      objectType: undefined,
      searchQuery: undefined,
      tenantId: "tenant-1",
    }, "csv");
  });

  it("returns auth response without calling service when unauthorized", async () => {
    requireAsnAccessAdmin.mockResolvedValue({
      authorized: false,
      response: new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      }),
    });
    const { GET } = await import("@/app/api/v1/audit/logs/route");

    const response = await GET(new Request("http://localhost/api/v1/audit/logs"));

    expect(response.status).toBe(401);
    expect(listAuditLogs).not.toHaveBeenCalled();
  });
});
