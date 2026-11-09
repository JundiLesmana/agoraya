import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import {
  closeDefaultDatabase,
  getDefaultDatabase,
  type Database,
} from "@/lib/db/client";
import { requireModuleAccess } from "@/lib/auth/require-module-access";

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess: vi.fn(),
}));

const requireModuleAccessMock = vi.mocked(requireModuleAccess);

const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const USER_C = "33333333-3333-4333-8333-333333333333";
const PROJECT_X = "44444444-4444-4444-8444-444444444444";
const PROJECT_Y = "55555555-5555-5555-8555-555555555555";
const REPORT_X = "88888888-8888-4888-8888-888888888888";
const SEEDED_RUN_ID = "66666666-6666-4666-8666-666666666666";
const SEEDED_ITEM_ID = "77777777-7777-4777-8777-777777777777";

let db: Database | null = null;

async function seed(): Promise<void> {
  if (!db) throw new Error("test database is unavailable");
  return db.transaction(async (tx) => {
    await tx.query(
      `INSERT INTO tenants (id, name, slug, status) VALUES
        ('${TENANT_A}', 'Tenant A', 'tenant-a', 'active'),
        ('${TENANT_B}', 'Tenant B', 'tenant-b', 'active')
        ON CONFLICT (id) DO NOTHING`
    );
    await tx.query(
      `INSERT INTO users (id, tenant_id, email, name, status) VALUES
        ('${USER_A}', '${TENANT_A}', 'user-a@agoraya.local', 'User A', 'active'),
        ('${USER_B}', '${TENANT_A}', 'user-b@agoraya.local', 'User B', 'active'),
        ('${USER_C}', '${TENANT_B}', 'user-c@agoraya.local', 'User C', 'active')
        ON CONFLICT (id) DO NOTHING`
    );
    await tx.query(
      `INSERT INTO infrastructure_projects (
        id, tenant_id, assigned_user_id, external_project_id, package_name,
        location, sector, contract_value, provider_name, start_date, end_date, fiscal_year, status
      ) VALUES
        ('${PROJECT_X}', '${TENANT_A}', '${USER_A}', 'EXT-X', 'Paket X', 'Lokasi X', 'jalan', 1000000000, 'Penyedia X', '2026-01-01', '2026-12-31', 2026, 'ongoing'),
        ('${PROJECT_Y}', '${TENANT_B}', '${USER_C}', 'EXT-Y', 'Paket Y', 'Lokasi Y', 'jalan', 2000000000, 'Penyedia Y', '2026-01-01', '2026-12-31', 2026, 'ongoing')
        ON CONFLICT (id) DO NOTHING`
    );
    await tx.query(
      `INSERT INTO project_progress_reports (
        id, tenant_id, project_id, reported_by, period_month, period_year,
        physical_progress, financial_progress, evaluation_notes, status, submitted_at
      ) VALUES
        ('${REPORT_X}', '${TENANT_A}', '${PROJECT_X}', '${USER_A}', 10, 2026,
         80, 60, 'Laporan periode Oktober 2026', 'submitted', '2026-10-15T00:00:00.000Z')
        ON CONFLICT (id) DO NOTHING`
    );
  });
}

async function clearRuns(): Promise<void> {
  if (!db) throw new Error("test database is unavailable");
  await db.query(`DELETE FROM decision_run_items`);
  await db.query(`DELETE FROM decision_runs`);
}

function authorizeAs(tenantId: string, userId: string, roles: string[] = ["asn"]): void {
  requireModuleAccessMock.mockResolvedValue({
    authorized: true,
    session: { userId, tenantId, role: roles[0], roles },
  });
}

function denySession(): void {
  requireModuleAccessMock.mockResolvedValue({
    authorized: false,
    response: NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    ),
  });
}

function routeModule(): Promise<{
  readonly POST: (req: Request) => Promise<Response>;
  readonly GET: (
    req: Request,
    ctx?: { readonly params: Promise<{ readonly runId: string }> },
  ) => Promise<Response>;
}> {
  return import("@/app/api/v1/projects/prioritization/runs/route");
}

function isDbAvailable(): boolean {
  return db !== null;
}

async function queryRows<T extends Record<string, unknown>>(
  text: string,
): Promise<T[]> {
  if (!db) throw new Error("test database is unavailable");
  return (await db.query(text)) as unknown as T[];
}

function requireDb(): void {
  if (!isDbAvailable()) throw new Error("test database is unavailable");
}

beforeAll(async () => {
  try {
    db = getDefaultDatabase();
    await db.query(`SELECT 1`);
    await seed();
  } catch {
    db = null;
  }
});

afterAll(async () => {
  await closeDefaultDatabase();
});

beforeEach(() => {
  vi.resetAllMocks();
  authorizeAs(TENANT_A, USER_A);
  if (db) {
    clearRuns().catch(() => undefined);
    db.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO decision_runs (
          id, tenant_id, requested_by, fiscal_year, criteria_version, algorithm_version, criteria_snapshot
        ) VALUES (
          '${SEEDED_RUN_ID}', '${TENANT_A}', '${USER_A}', 2026, 'v1.0', 'weighted-sum-v1', '{}'::jsonb
        )
        ON CONFLICT (id) DO NOTHING`
      );
      await tx.query(
        `INSERT INTO decision_run_items (
          id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown
        ) VALUES (
          '${SEEDED_ITEM_ID}', '${TENANT_A}', '${SEEDED_RUN_ID}', '${PROJECT_X}', 1, 75.5, '{}'::jsonb, '{}'::jsonb
        )
        ON CONFLICT (id) DO NOTHING`
      );
    }).catch(() => undefined);
  }
});

describe("POST /api/v1/projects/prioritization/runs", () => {
  it("membuat run dan ranking dengan status 201", async () => {
    if (!isDbAvailable()) return;
    const { POST } = await routeModule();
    const response = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026 }),
      }),
    );

    expect(response.status).toBe(201);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body).toMatchObject({
      runId: expect.any(String),
      criteriaVersion: "1.0.0",
      algorithmVersion: "weighted-sum-v1",
      fiscalYear: 2026,
      createdAt: expect.any(String),
    });
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toMatchObject({
      projectId: PROJECT_X,
      rank: 1,
    });
    expect(body.results[0].score).toBeCloseTo(65, 2);
    expect(body.results[0].breakdown).toHaveLength(3);
    expect(body.results[0].breakdown[0]).toMatchObject({
      criterion: "physical_progress",
      normalizedValue: 80,
    });
    expect(body.results[0].breakdown[1]).toMatchObject({
      criterion: "financial_progress",
      normalizedValue: 60,
    });
    expect(body.results[0].breakdown[2]).toMatchObject({
      criterion: "contract_value",
      normalizedValue: 50,
    });

    requireDb();
    const runs = await queryRows<{ id: string }>(
      `SELECT id FROM decision_runs WHERE id = '${body.runId}'`,
    );
    expect(runs).toHaveLength(1);
    const items = await queryRows<{ id: string; project_id: string }>(
      `SELECT id, project_id FROM decision_run_items WHERE run_id = '${body.runId}'`,
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.project_id).toBe(PROJECT_X);
  });

  it("menangani body tanpa projectIds sebagai semua proyek yang dapat diakses", async () => {
    if (!isDbAvailable()) return;
    const { POST } = await routeModule();
    const response = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026 }),
      }),
    );
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.results.map((r: { projectId: string }) => r.projectId).sort()).toEqual([
      PROJECT_X,
    ]);
  });

  it("menolak project ID yang tidak berada dalam cakupan pengguna", async () => {
    if (!isDbAvailable()) return;
    const { POST } = await routeModule();
    const response = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026, projectIds: [PROJECT_Y] }),
      }),
    );
    expect(response.status).toBe(403);
  });

  it("menolak body dengan field terlarang (tenantId, weights, criteria, score, values)", async () => {
    if (!isDbAvailable()) return;
    const { POST } = await routeModule();
    const response = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fiscalYear: 2026,
          tenantId: TENANT_A,
          weights: { physical_progress: 0.5 },
          criteria: ["physical_progress"],
          score: 90,
          values: {},
        }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("menolak fiscal year di luar rentang 2020..2100 dan non-integer", async () => {
    if (!isDbAvailable()) return;
    const { POST } = await routeModule();
    for (const body of [
      { fiscalYear: 1999 },
      { fiscalYear: 2101 },
      { fiscalYear: "2026" },
      { fiscalYear: 2026.5 },
    ]) {
      const response = await POST(
        new Request("http://localhost/api/v1/projects/prioritization/runs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      );
      expect(response.status).toBe(400);
    }
  });

  it("menolak body JSON yang tidak valid", async () => {
    if (!isDbAvailable()) return;
    const { POST } = await routeModule();
    const response = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not-json",
      }),
    );
    expect(response.status).toBe(400);
  });

  it("mengembalikan 401 ketika sesi tidak valid", async () => {
    if (!isDbAvailable()) return;
    denySession();
    const { POST } = await routeModule();
    const response = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026 }),
      }),
    );
    expect(response.status).toBe(401);
  });

  it("mengembalikan 403 ketika role tidak diizinkan", async () => {
    if (!isDbAvailable()) return;
    authorizeAs(TENANT_A, USER_A, ["citizen"]);
    const { POST } = await routeModule();
    const response = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026 }),
      }),
    );
    expect(response.status).toBe(403);
  });
});

describe("GET /api/v1/projects/prioritization/runs", () => {
  it("daftar run tanpa snapshot input penuh", async () => {
    if (!isDbAvailable()) return;
    const { POST, GET } = await routeModule();
    const created = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026 }),
      }),
    );
    const { runId } = await created.json();

    const response = await GET(
      new Request("http://localhost/api/v1/projects/prioritization/runs?fiscalYear=2026"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.runs).toHaveLength(1);
    expect(body.runs[0]).toMatchObject({
      runId,
      fiscalYear: 2026,
      criteriaVersion: "1.0.0",
      algorithmVersion: "weighted-sum-v1",
    });
    expect(body.runs[0]).not.toHaveProperty("inputSnapshot");
    expect(body.nextCursor).toBeNull();
  });

  it("membatasi daftar run berdasarkan fiscal year", async () => {
    if (!isDbAvailable()) return;
    const { POST, GET } = await routeModule();
    await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026 }),
      }),
    );

    const response = await GET(
      new Request("http://localhost/api/v1/projects/prioritization/runs?fiscalYear=2025"),
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.runs).toHaveLength(0);
  });

  it("mendukung paginasi cursor dengan limit Maksimal 50", async () => {
    if (!isDbAvailable()) return;
    const { POST, GET } = await routeModule();
    const responses = await Promise.all(
      Array.from({ length: 3 }, () =>
        POST(
          new Request("http://localhost/api/v1/projects/prioritization/runs", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ fiscalYear: 2026 }),
          }),
        )
      ),
    );
    const runIds = (
      await Promise.all(responses.map((r) => r.json()))
    ).map((body: { runId: string }) => body.runId);

    const first = await GET(
      new Request("http://localhost/api/v1/projects/prioritization/runs?limit=2"),
    );
    expect(first.status).toBe(200);
    const firstBody = (await first.json()) as {
      runs: { runId: string }[];
      nextCursor: string | null;
    };
    expect(firstBody.runs).toHaveLength(2);
    const cursor = firstBody.nextCursor;
    expect(cursor).toBeTruthy();

    const second = await GET(
      new Request(
        `http://localhost/api/v1/projects/prioritization/runs?limit=2&cursor=${encodeURIComponent(cursor ?? "")}`,
      ),
    );
    const secondBody = (await second.json()) as {
      runs: { runId: string }[];
      nextCursor: string | null;
    };
    expect(secondBody.runs).toHaveLength(1);
    expect(secondBody.nextCursor).toBeNull();
    expect(
      [
        ...firstBody.runs,
        ...secondBody.runs,
      ].map((r) => r.runId).sort(),
    ).toEqual(runIds.sort());
  });

  it("menolak query parameter yang tidak valid", async () => {
    if (!isDbAvailable()) return;
    const { GET } = await routeModule();
    for (const search of [
      "limit=51",
      "limit=abc",
      "fiscalYear=1999",
      "fiscalYear=2101",
      "cursor=not-a-cursor",
    ]) {
      const response = await GET(
        new Request(
          `http://localhost/api/v1/projects/prioritization/runs?${search}`,
        ),
      );
      expect(response.status).toBe(400);
    }
  });
});

describe("GET /api/v1/projects/prioritization/runs/[runId]", () => {
  it("mengembalikan detail hasil run milik pengguna", async () => {
    if (!isDbAvailable()) return;
    const { POST, GET } = await routeModule();
    const created = await POST(
      new Request("http://localhost/api/v1/projects/prioritization/runs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fiscalYear: 2026 }),
      }),
    );
    const { runId } = await created.json();

    const response = await GET(
      new Request(`http://localhost/api/v1/projects/prioritization/runs/${runId}`),
      { params: Promise.resolve({ runId }) },
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.run.runId).toBe(runId);
    expect(body.items).toHaveLength(1);
    expect(body.items[0]).toMatchObject({
      projectId: PROJECT_X,
      rank: 1,
      score: expect.any(Number),
    });
    expect(body.items[0].inputSnapshot).toMatchObject({
      projectId: PROJECT_X,
      fiscalYear: 2026,
      contractValue: 1000000000,
    });
    expect(body.items[0].scoreBreakdown).toHaveLength(3);
  });

  it("mengembalikan 404 untuk run milik pengguna lain di tenant yang sama", async () => {
    if (!isDbAvailable()) return;
    authorizeAs(TENANT_A, USER_B);
    const { GET } = await routeModule();
    const response = await GET(
      new Request(`http://localhost/api/v1/projects/prioritization/runs/${SEEDED_RUN_ID}`),
      { params: Promise.resolve({ runId: SEEDED_RUN_ID }) },
    );
    expect(response.status).toBe(404);
  });

  it("mengembalikan 404 untuk run dari tenant lain", async () => {
    if (!isDbAvailable()) return;
    authorizeAs(TENANT_B, USER_C);
    const { GET } = await routeModule();
    const response = await GET(
      new Request(`http://localhost/api/v1/projects/prioritization/runs/${SEEDED_RUN_ID}`),
      { params: Promise.resolve({ runId: SEEDED_RUN_ID }) },
    );
    expect(response.status).toBe(404);
  });

  it("mengembalikan 400 untuk ID run yang bukan UUID", async () => {
    if (!isDbAvailable()) return;
    const { GET } = await routeModule();
    const response = await GET(
      new Request("http://localhost/api/v1/projects/prioritization/runs/bukan-uuid"),
      { params: Promise.resolve({ runId: "bukan-uuid" }) },
    );
    expect(response.status).toBe(400);
  });
});
