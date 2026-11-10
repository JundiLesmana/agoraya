import { beforeEach, describe, expect, it, vi } from "vitest";

const { getCurrentSessionMock, dbMock, loggerErrorMock } = vi.hoisted(() => ({
  getCurrentSessionMock: vi.fn(),
  dbMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSession: getCurrentSessionMock,
}));

vi.mock("@/lib/db", () => ({
  db: dbMock,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: loggerErrorMock,
  },
}));

import { GET } from "@/app/api/citizen/service-applications/[id]/route";

function mockDetailQuery(row?: Record<string, unknown>, shouldReject = false) {
  const findFirst = shouldReject
    ? vi.fn().mockRejectedValue(new Error("db failed"))
    : vi.fn().mockResolvedValue(row ?? undefined);
  dbMock.mockReturnValue({
    query: {
      serviceApplications: { findFirst },
    },
  });
  return { findFirst };
}

describe("citizen service detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when there is no active session", async () => {
    getCurrentSessionMock.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost/api/citizen/service-applications/app-1"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(401);
    expect(dbMock).not.toHaveBeenCalled();
  });

  it("returns only the logged-in user's submission detail", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
      roles: ["citizen"],
    });
    const query = mockDetailQuery({
      id: "app-1",
      trackingNumber: "PGD-261010-00001",
      category: "social",
      serviceType: "kebersihan",
      serviceId: "svc-1",
      routeKey: "sosial-kesehatan",
      serviceName: "Lampu jalan padam di Jl. Melati",
      agency: "Dinas Pekerjaan Umum",
      status: "in_progress",
      applicantName: "Warga Contoh",
      contactEmail: "warga@example.com",
      payload: {},
      submittedAt: new Date("2026-10-10T08:00:00.000Z"),
      updatedAt: new Date("2026-10-11T08:00:00.000Z"),
    });

    const response = await GET(new Request("http://localhost/api/citizen/service-applications/app-1"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(200);
    expect(query.findFirst).toHaveBeenCalledOnce();
    await expect(response.json()).resolves.toMatchObject({
      application: {
        id: "app-1",
        trackingNumber: "PGD-261010-00001",
        applicantName: "Warga Contoh",
        contactEmail: "warga@example.com",
      },
    });
  });

  it("returns 404 when the submission is not found for the session scope", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
      roles: ["citizen"],
    });
    mockDetailQuery();

    const response = await GET(new Request("http://localhost/api/citizen/service-applications/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 500 and logs when the query fails", async () => {
    getCurrentSessionMock.mockResolvedValue({
      userId: "user-1",
      tenantId: "tenant-1",
      roles: ["citizen"],
    });
    mockDetailQuery(undefined, true);

    const response = await GET(new Request("http://localhost/api/citizen/service-applications/app-1"), {
      params: Promise.resolve({ id: "app-1" }),
    });

    expect(response.status).toBe(500);
    expect(loggerErrorMock).toHaveBeenCalledWith(
      "citizen_service_applications.detail_failed",
      expect.objectContaining({ userId: "user-1", applicationId: "app-1" }),
    );
  });
});
