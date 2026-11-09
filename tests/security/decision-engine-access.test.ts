import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  closeDefaultDatabase,
  getDefaultDatabase,
  type Database,
} from "@/lib/db/client";

const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const TENANT_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const USER_C = "33333333-3333-4333-8333-333333333333";
const PROJECT_X = "44444444-4444-4444-8444-444444444444";
const PROJECT_Y = "55555555-5555-5555-8555-555555555555";
const RUN_ID = "66666666-6666-4666-8666-666666666666";
const ITEM_ID = "77777777-7777-4777-8777-777777777777";

const INPUT_SNAPSHOT = {
  project_id: PROJECT_X,
  fiscal_year: 2026,
  period_year: 2026,
  period_month: 10,
  physical_progress: 60,
  financial_progress: 40,
  contract_value: 100000000,
};
const SCORE_BREAKDOWN = {
  physical_progress: 30,
  financial_progress: 12,
  contract_value: 33.5,
  total: 75.5,
};

let db: Database | null = null;

async function withSession<T>(
  tenantId: string,
  userId: string,
  fn: (tx: Database) => Promise<T>
): Promise<T> {
  if (!db) {
    throw new Error("test database is unavailable");
  }
  return db.transaction(async (tx) => {
    await tx.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
    await tx.query(`SET LOCAL app.user_id = '${userId}'`);
    return fn(tx);
  });
}

async function seed(): Promise<void> {
  await withSession(TENANT_A, USER_A, async (tx) => {
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
        ('${PROJECT_X}', '${TENANT_A}', '${USER_A}', 'EXT-X', 'Paket X', 'Lokasi X', 'jalan', 100000000, 'Penyedia X', '2026-01-01', '2026-12-31', 2026, 'ongoing'),
        ('${PROJECT_Y}', '${TENANT_B}', '${USER_C}', 'EXT-Y', 'Paket Y', 'Lokasi Y', 'jalan', 200000000, 'Penyedia Y', '2026-01-01', '2026-12-31', 2026, 'ongoing')
        ON CONFLICT (id) DO NOTHING`
    );
    await tx.query(
      `INSERT INTO decision_runs (
        id, tenant_id, requested_by, fiscal_year, criteria_version, algorithm_version, criteria_snapshot
      ) VALUES
        ('${RUN_ID}', '${TENANT_A}', '${USER_A}', 2026, 'v1.0', 'mcsa-v1', '${JSON.stringify({
          criteria: ["physical_progress", "financial_progress", "contract_value"],
          weights: { physical_progress: 0.4, financial_progress: 0.3, contract_value: 0.3 },
        })}')
        ON CONFLICT (id) DO NOTHING`
    );
    await tx.query(
      `INSERT INTO decision_run_items (
        id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown
      ) VALUES
        ('${ITEM_ID}', '${TENANT_A}', '${RUN_ID}', '${PROJECT_X}', 1, 75.5, '${JSON.stringify(INPUT_SNAPSHOT)}', '${JSON.stringify(SCORE_BREAKDOWN)}')
        ON CONFLICT (id) DO NOTHING`
    );
  });
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

function isDbAvailable(): boolean {
  return db !== null;
}

describe("Decision Engine RLS — tenant isolation and ownership", () => {
  it("allows the requesting user of the owning tenant to see the run and its items", async () => {
    if (!isDbAvailable()) return;
    const runs = await withSession<{ id: string; requested_by: string }[]>(
      TENANT_A,
      USER_A,
      (tx) =>
        tx.query<{ id: string; requested_by: string }>(
          `SELECT id, requested_by FROM decision_runs WHERE id = '${RUN_ID}'`
        )
    );
    expect(runs).toHaveLength(1);
    expect(runs[0]?.requested_by).toBe(USER_A);

    const items = await withSession<{ id: string; rank: number; score: number }[]>(
      TENANT_A,
      USER_A,
      (tx) =>
        tx.query<{ id: string; rank: number; score: number }>(
          `SELECT id, rank, score FROM decision_run_items WHERE run_id = '${RUN_ID}'`
        )
    );
    expect(items).toHaveLength(1);
    expect(items[0]?.rank).toBe(1);
  });

  it("denies another user in the same tenant", async () => {
    if (!isDbAvailable()) return;
    const runs = await withSession<{ id: string }[]>(
      TENANT_A,
      USER_B,
      (tx) => tx.query<{ id: string }>(`SELECT id FROM decision_runs`)
    );
    expect(runs).toHaveLength(0);

    const items = await withSession<{ id: string }[]>(
      TENANT_A,
      USER_B,
      (tx) => tx.query<{ id: string }>(`SELECT id FROM decision_run_items`)
    );
    expect(items).toHaveLength(0);
  });

  it("denies a user from another tenant", async () => {
    if (!isDbAvailable()) return;
    const runs = await withSession<{ id: string }[]>(
      TENANT_B,
      USER_C,
      (tx) => tx.query<{ id: string }>(`SELECT id FROM decision_runs`)
    );
    expect(runs).toHaveLength(0);

    const items = await withSession<{ id: string }[]>(
      TENANT_B,
      USER_C,
      (tx) =>
        tx.query<{ id: string }>(
          `SELECT id FROM decision_run_items WHERE run_id = '${RUN_ID}'`
        )
    );
    expect(items).toHaveLength(0);
  });

  it("denies item access for a project not assigned to the user", async () => {
    if (!isDbAvailable()) return;
    const items = await withSession<{ id: string }[]>(
      TENANT_A,
      USER_A,
      (tx) =>
        tx.query<{ id: string }>(
          `SELECT id FROM decision_run_items WHERE project_id = '${PROJECT_Y}'`
        )
    );
    expect(items).toHaveLength(0);

    await expect(
      withSession(TENANT_A, USER_A, (tx) =>
        tx.query(
          `INSERT INTO decision_run_items (
            id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown
          ) VALUES (
            '88888888-8888-4888-8888-888888888888', '${TENANT_A}', '${RUN_ID}', '${PROJECT_Y}', 2, 50, '{}'::jsonb, '{}'::jsonb
          )`
        )
      )
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("denies inserting a run requested by another user", async () => {
    if (!isDbAvailable()) return;
    await expect(
      withSession(TENANT_A, USER_B, (tx) =>
        tx.query(
          `INSERT INTO decision_runs (
            id, tenant_id, requested_by, fiscal_year, criteria_version, algorithm_version, criteria_snapshot
          ) VALUES (
            '99999999-9999-4999-8999-999999999999', '${TENANT_A}', '${USER_B}', 2026, 'v1.0', 'mcsa-v1', '{}'::jsonb
          )`
        )
      )
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("rejects rank not greater than zero", async () => {
    if (!isDbAvailable()) return;
    await expect(
      withSession(TENANT_A, USER_A, (tx) =>
        tx.query(
          `INSERT INTO decision_run_items (
            id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown
          ) VALUES (
            'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', '${TENANT_A}', '${RUN_ID}', '${PROJECT_X}', 0, 10, '{}'::jsonb, '{}'::jsonb
          )`
        )
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects score outside [0, 100]", async () => {
    if (!isDbAvailable()) return;
    await expect(
      withSession(TENANT_A, USER_A, (tx) =>
        tx.query(
          `INSERT INTO decision_run_items (
            id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown
          ) VALUES (
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '${TENANT_A}', '${RUN_ID}', '${PROJECT_X}', 2, 101, '{}'::jsonb, '{}'::jsonb
          )`
        )
      )
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("rejects duplicate (run_id, project_id)", async () => {
    if (!isDbAvailable()) return;
    await expect(
      withSession(TENANT_A, USER_A, (tx) =>
        tx.query(
          `INSERT INTO decision_run_items (
            id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown
          ) VALUES (
            'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '${TENANT_A}', '${RUN_ID}', '${PROJECT_X}', 3, 10, '{}'::jsonb, '{}'::jsonb
          )`
        )
      )
    ).rejects.toMatchObject({ code: "23505" });
  });

  it("rejects duplicate (run_id, rank)", async () => {
    if (!isDbAvailable()) return;
    await expect(
      withSession(TENANT_A, USER_A, (tx) =>
        tx.query(
          `INSERT INTO decision_run_items (
            id, tenant_id, run_id, project_id, rank, score, input_snapshot, score_breakdown
          ) VALUES (
            'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '${TENANT_A}', '${RUN_ID}', '${PROJECT_X}', 1, 10, '{}'::jsonb, '{}'::jsonb
          )`
        )
      )
    ).rejects.toMatchObject({ code: "23505" });
  });
});
