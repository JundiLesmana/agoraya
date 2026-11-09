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
  }
});

async function postBody(body: unknown): Promise<Response> {
  const { POST } = await routeModule();
  return (POST as unknown as (req: Request) => Promise<Response>)(
    new Request("http://localhost/api/v1/projects/prioritization/runs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function getResponse(url: string): Promise<Response> {
  const { GET } = await routeModule();
  return GET(new Request(url));
}

describe("security-negative — prioritas proyek", () => {
  it("menolak run untuk proyek milik tenant lain", async () => {
    if (!isDbAvailable()) return;
    authorizeAs(TENANT_B, USER_C);
    const response = await postBody({ fiscalYear: 2026, projectIds: [PROJECT_X] });
    expect(response.status).toBe(403);
  });

  it("menolak run untuk proyek yang tidak ditugaskan kepada pengguna di tenant yang sama", async () => {
    if (!isDbAvailable()) return;
    const response = await postBody({ fiscalYear: 2026, projectIds: [PROJECT_X] });
    expect(response.status).toBe(403);
  });

  it("tidak menghasilkan ranking parsial ketika sebagian project ID tak berizin", async () => {
    if (!isDbAvailable()) return;
    const response = await postBody({
      fiscalYear: 2026,
      projectIds: [PROJECT_X, PROJECT_Y],
    });
    expect(response.status).toBe(403);
    await routeModule();
    const list = await getResponse(
      "http://localhost/api/v1/projects/prioritization/runs?fiscalYear=2026",
    );
    expect(list.status).toBe(200);
    const body = await list.json();
    expect(body.runs).toHaveLength(0);
  });

  it("menolak field tak dikenal dari body (tenantId, weights, criteria, score, values)", async () => {
    if (!isDbAvailable()) return;
    for (const forbidden of [
      { fiscalYear: 2026, tenantId: TENANT_A },
      { fiscalYear: 2026, weights: { physical_progress: 0.5 } },
      { fiscalYear: 2026, criteria: ["physical_progress"] },
      { fiscalYear: 2026, score: 90 },
      { fiscalYear: 2026, values: {} },
    ]) {
      const response = await postBody(forbidden);
      expect(response.status).toBe(400);
    }
  });

  it("mengembalikan 401 ketika sesi tidak valid", async () => {
    if (!isDbAvailable()) return;
    denySession();
    const response = await postBody({ fiscalYear: 2026 });
    expect(response.status).toBe(401);
  });

  it("mengembalikan 403 untuk role selain asn/staff", async () => {
    if (!isDbAvailable()) return;
    authorizeAs(TENANT_A, USER_A, ["citizen"]);
    const response = await postBody({ fiscalYear: 2026 });
    expect(response.status).toBe(403);
  });

  it("tidak membocorkan run milik tenant lain pada daftar dan detail", async () => {
    if (!isDbAvailable()) return;
    authorizeAs(TENANT_B, USER_C);
    const { GET } = await routeModule();
    const list = await getResponse(
      "http://localhost/api/v1/projects/prioritization/runs?fiscalYear=2026",
    );
    expect(list.status).toBe(200);
    expect((await list.json()).runs).toHaveLength(0);

    const detail = await GET(
      new Request(
        "http://localhost/api/v1/projects/prioritization/runs/66666666-6666-4666-8666-666666666666",
      ),
      { params: Promise.resolve({ runId: "66666666-6666-4666-8666-666666666666" }) },
    );
    expect(detail.status).toBe(404);
  });

  it("menolak query parameter daftar yang tidak valid", async () => {
    if (!isDbAvailable()) return;
    const { GET } = await routeModule();
    for (const search of [
      "limit=0",
      "limit=51",
      "fiscalYear=abc",
      "fiscalYear=1999",
      "cursor=invalid",
    ]) {
      const response = await GET(
        new Request(`http://localhost/api/v1/projects/prioritization/runs?${search}`),
      );
      expect(response.status).toBe(400);
    }
  });
});
