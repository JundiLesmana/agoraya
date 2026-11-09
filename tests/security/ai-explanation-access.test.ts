import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";
import {
  closeDefaultDatabase,
  getDefaultDatabase,
  type Database,
} from "@/lib/db/client";
import { requireModuleAccess } from "@/lib/auth/require-module-access";
import { getAiProvider } from "@/modules/ai/providers";
import { resetEnv } from "@/lib/env";

vi.mock("@/lib/auth/require-module-access", () => ({
  requireModuleAccess: vi.fn(),
}));
vi.mock("@/modules/ai/providers", () => ({
  getAiProvider: vi.fn(),
}));

const requireModuleAccessMock = vi.mocked(requireModuleAccess);

const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_C = "33333333-3333-4333-8333-333333333333";
const PROJECT_X = "44444444-4444-4444-8444-444444444444";
const RUN_ID = "66666666-6666-4666-8666-666666666666";

let db: Database | null = null;

async function seed(): Promise<void> {
  if (!db) throw new Error("test database is unavailable");
  return db.transaction(async (tx) => {
    await tx.query(
      `INSERT INTO tenants (id, name, slug, status) VALUES
        ('${TENANT_A}', 'Tenant A', 'tenant-a', 'active'),
        ('${TENANT_B}', 'Tenant B', 'tenant-b', 'active')
        ON CONFLICT (id) DO NOTHING`,
    );
    await tx.query(
      `INSERT INTO users (id, tenant_id, email, name, status) VALUES
        ('${USER_A}', '${TENANT_A}', 'user-a@agoraya.local', 'User A', 'active'),
        ('${USER_C}', '${TENANT_B}', 'user-c@agoraya.local', 'User C', 'active')
        ON CONFLICT (id) DO NOTHING`,
    );
    await tx.query(
      `INSERT INTO infrastructure_projects (
        id, tenant_id, assigned_user_id, external_project_id, package_name,
        location, sector, contract_value, provider_name, start_date, end_date, fiscal_year, status
      ) VALUES
        ('${PROJECT_X}', '${TENANT_A}', '${USER_A}', 'EXT-X', 'Paket X', 'Lokasi X', 'jalan', 1000000000, 'Penyedia X', '2026-01-01', '2026-12-31', 2026, 'ongoing')
        ON CONFLICT (id) DO NOTHING`,
    );
    await tx.query(
      `INSERT INTO decision_runs (id, tenant_id, requested_by, fiscal_year, criteria_version, algorithm_version, criteria_snapshot) VALUES
        ('${RUN_ID}', '${TENANT_A}', '${USER_A}', 2026, '1.0.0', 'weighted-sum-v1', '{"version":"1.0.0","weights":{"physical_progress":0.4,"financial_progress":0.3,"contract_value":0.3},"criteria":["physical_progress","financial_progress","contract_value"]}'::jsonb)
        ON CONFLICT (id) DO NOTHING`,
    );
    await tx.query(
      `INSERT INTO decision_run_items (id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown) VALUES
        ('${crypto.randomUUID()}', '${TENANT_A}', '${RUN_ID}', '${PROJECT_X}', 1, 65, '{"projectId":"${PROJECT_X}","fiscalYear":2026}'::jsonb, '[{"criterion":"physical_progress","sourceValue":80,"normalizedValue":80,"weight":0.4,"contribution":32,"source":{"kind":"submitted_report","periodYear":2026,"periodMonth":10}}]'::jsonb)
        ON CONFLICT DO NOTHING`,
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
    response: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
  });
}

function routeModule(): Promise<{
  readonly POST: (req: Request, context: { readonly params: Promise<{ readonly runId: string }> }) => Promise<Response>;
}> {
  return import("@/app/api/v1/projects/prioritization/runs/[runId]/explanation/route");
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
  resetEnv();
  process.env.DATABASE_URL = "postgres://agoraya:localdev@127.0.0.1:5432/agoraya_local";
  process.env.AUTH_SECRET = "test-secret-for-unit-tests-at-least-32-chars!";
  process.env.AI_PROVIDER = "gemini";
  process.env.AI_API_KEY = "test-api-key";
  authorizeAs(TENANT_A, USER_A);
  if (db) {
    clearRuns().catch(() => undefined);
    seed().catch(() => undefined);
  }
});

afterEach(() => {
  delete process.env.AI_PROVIDER;
  delete process.env.AI_API_KEY;
  resetEnv();
});

async function postExplanation(runId: string): Promise<Response> {
  const { POST } = await routeModule();
  return POST(
    new Request("http://localhost/api/v1/projects/prioritization/runs/x/explanation", { method: "POST" }),
    { params: Promise.resolve({ runId }) },
  );
}

describe("security-negative — penjelasan prioritas proyek", () => {
  it("mengembalikan 401 ketika sesi tidak valid", async () => {
    denySession();
    const response = await postExplanation(RUN_ID);
    expect(response.status).toBe(401);
  });

  it("menolak penjelasan untuk run milik tenant lain", async () => {
    if (!isDbAvailable()) return;
    authorizeAs(TENANT_B, USER_C);
    const response = await postExplanation(RUN_ID);
    expect(response.status).toBe(404);
  });

  it("mengembalikan penjelasan yang hanya berisi summary, keyFactors, limitations saat provider sukses", async () => {
    if (!isDbAvailable()) return;
    vi.mocked(getAiProvider).mockReturnValue({
      name: "gemini",
      complete: vi.fn().mockResolvedValue({
        provider: "gemini",
        content: JSON.stringify({ summary: "Penjelasan ringkas.", keyFactors: ["faktor a"], limitations: ["batasan a"] }),
      }),
    } as any);
    const response = await postExplanation(RUN_ID);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(Object.keys(body).sort()).toEqual(["keyFactors", "limitations", "summary"]);
    expect(body.summary).toBe("Penjelasan ringkas.");
    expect(body.score).toBeUndefined();
    expect(body.rank).toBeUndefined();
    expect(body.decision).toBeUndefined();
  });

  it("mengembalikan error eksplisit saat provider gagal tanpa mengubah hasil deterministik", async () => {
    if (!isDbAvailable()) return;
    vi.mocked(getAiProvider).mockReturnValue({
      name: "gemini",
      complete: vi.fn().mockRejectedValue(new Error("jaringan putus")),
    } as any);
    const response = await postExplanation(RUN_ID);
    expect(response.status).toBe(502);
  });

  it("menolak output provider yang mengandung field skor/rank/keputusan", async () => {
    if (!isDbAvailable()) return;
    vi.mocked(getAiProvider).mockReturnValue({
      name: "gemini",
      complete: vi.fn().mockResolvedValue({
        provider: "gemini",
        content: JSON.stringify({ summary: "ok", keyFactors: ["a"], limitations: ["b"], score: 90 }),
      }),
    } as any);
    const response = await postExplanation(RUN_ID);
    expect(response.status).toBe(400);
  });

  it("gagal secara eksplisit saat provider tidak dikonfigurasi", async () => {
    if (!isDbAvailable()) return;
    delete process.env.AI_PROVIDER;
    delete process.env.AI_API_KEY;
    resetEnv();
    const response = await postExplanation(RUN_ID);
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.code).toBe("EXTERNAL_SERVICE_ERROR");
  });
});
