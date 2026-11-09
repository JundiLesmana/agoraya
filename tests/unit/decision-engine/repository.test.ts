import { describe, expect, it } from "vitest";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import type { Session } from "@/lib/auth/session";
import {
  createDecisionRun,
  decodeCursor,
  encodeCursor,
  fetchAccessibleProjects,
  getDecisionRun,
  listDecisionRuns,
} from "@/modules/decision-engine/repository";

type Tx = PostgresJsDatabase<typeof schema>;

const TENANT_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_A = "11111111-1111-4111-8111-111111111111";
const PROJECT_X = "44444444-4444-4444-8444-444444444444";
const RUN_ID = "66666666-6666-4666-8666-666666666666";

const session: Session = {
  userId: USER_A,
  tenantId: TENANT_A,
  role: "asn",
  roles: ["asn"],
};

function projectRow(overrides: Partial<{ id: string; status: string; contractValue: number; initialPhysicalProgress: number; initialFinancialProgress: number }> = {}) {
  return {
    id: overrides.id ?? PROJECT_X,
    status: overrides.status ?? "ongoing",
    contractValue: overrides.contractValue ?? 100000000,
    initialPhysicalProgress: overrides.initialPhysicalProgress ?? 10,
    initialFinancialProgress: overrides.initialFinancialProgress ?? 20,
  };
}

function reportRow(projectId: string, overrides: Partial<{ physicalProgress: number; financialProgress: number; periodYear: number; periodMonth: number; submittedAt: Date }> = {}) {
  return {
    projectId,
    physicalProgress: overrides.physicalProgress ?? 60,
    financialProgress: overrides.financialProgress ?? 40,
    periodYear: overrides.periodYear ?? 2026,
    periodMonth: overrides.periodMonth ?? 10,
    submittedAt: overrides.submittedAt ?? new Date("2026-10-15T00:00:00.000Z"),
  };
}

function createFakeTx() {
  const rowQueue: unknown[][] = [];
  const calls: Array<{ method: string; args: unknown[] }> = [];
  let mode: "query" | "none" = "none";
  const record = (method: string, ...args: unknown[]) => {
    calls.push({ method, args });
    return chain;
  };
  const chain = {
    select: (...args: unknown[]) => {
      mode = "query";
      return record("select", ...args);
    },
    from: (...args: unknown[]) => record("from", ...args),
    where: (...args: unknown[]) => record("where", ...args),
    orderBy: (...args: unknown[]) => record("orderBy", ...args),
    limit: (...args: unknown[]) => record("limit", ...args),
    groupBy: (...args: unknown[]) => record("groupBy", ...args),
    insert: (...args: unknown[]) => {
      mode = "none";
      return record("insert", ...args);
    },
    values: (...args: unknown[]) => record("values", ...args),
    returning: (...args: unknown[]) => {
      mode = "query";
      return record("returning", ...args);
    },
    execute: (...args: unknown[]) => {
      record("execute", ...args);
      return undefined;
    },
    transaction: (fn: (tx: unknown) => Promise<unknown>) => {
      calls.push({ method: "transaction", args: [] });
      return fn(chain);
    },
    then: (resolve: (value: unknown[]) => void) => {
      const rows = mode === "query" ? (rowQueue.shift() ?? []) : undefined;
      mode = "none";
      resolve(rows ?? []);
    },
  };
  return {
    chain: chain as unknown as Tx,
    calls,
    enqueue: (rows: unknown[]) => rowQueue.push(rows),
  };
}

describe("decision-engine/repository", () => {
  describe("fetchAccessibleProjects", () => {
    it("maps latest submitted report and marks progress data available", async () => {
      const fake = createFakeTx();
      fake.enqueue([projectRow()]);
      fake.enqueue([reportRow(PROJECT_X)]);
      const result = await fetchAccessibleProjects(
        session,
        { fiscalYear: 2026 },
        fake.chain,
      );

      expect(result).toEqual([
        {
          projectId: PROJECT_X,
          status: "ongoing",
          physicalProgress: {
            value: 60,
            source: {
              kind: "submitted_report",
              periodYear: 2026,
              periodMonth: 10,
              submittedAt: "2026-10-15T00:00:00.000Z",
            },
          },
          financialProgress: {
            value: 40,
            source: {
              kind: "submitted_report",
              periodYear: 2026,
              periodMonth: 10,
              submittedAt: "2026-10-15T00:00:00.000Z",
            },
          },
          contractValue: 100000000,
          progressDataAvailable: true,
        },
      ]);
    });

    it("falls back to initial fields when no report exists", async () => {
      const fake = createFakeTx();
      fake.enqueue([projectRow()]);
      fake.enqueue([]);
      const result = await fetchAccessibleProjects(
        session,
        { fiscalYear: 2026 },
        fake.chain,
      );

      expect(result[0]?.physicalProgress).toEqual({
        value: 10,
        source: { kind: "initial_field", field: "initial_physical_progress" },
      });
      expect(result[0]?.financialProgress).toEqual({
        value: 20,
        source: { kind: "initial_field", field: "initial_financial_progress" },
      });
      expect(result[0]?.progressDataAvailable).toBe(false);
    });

    it("excludes projects outside tenant, user, and fiscal year scope", async () => {
      const fake = createFakeTx();
      fake.enqueue([projectRow()]);
      fake.enqueue([]);
      const result = await fetchAccessibleProjects(
        session,
        { fiscalYear: 2026, projectIds: [PROJECT_X] },
        fake.chain,
      );
      expect(result).toHaveLength(1);
      const whereCalls = fake.calls.filter((c) => c.method === "where");
      expect(whereCalls).toHaveLength(2);
    });

    it("sets transaction-local tenant and user context before queries", async () => {
      const fake = createFakeTx();
      fake.enqueue([]);
      fake.enqueue([]);
      await fetchAccessibleProjects(session, { fiscalYear: 2026 }, fake.chain);
      const executeCalls = fake.calls.filter((c) => c.method === "execute");
      expect(executeCalls).toHaveLength(2);
      const methods = fake.calls.map((c) => c.method);
      expect(methods.slice(0, 3)).toEqual(["transaction", "execute", "execute"]);
    });
  });

  describe("createDecisionRun", () => {
    it("inserts run and items within tenant/user context and returns id", async () => {
      const fake = createFakeTx();
      fake.enqueue([{ id: RUN_ID, createdAt: new Date("2026-11-08T00:00:00.000Z") }]);
      fake.enqueue([]);
      const result = await createDecisionRun(
        session,
        {
          fiscalYear: 2026,
          criteriaVersion: "1.0.0",
          algorithmVersion: "weighted-sum-v1",
          criteriaSnapshot: { weights: { physical_progress: 0.4 } },
          items: [
            {
              projectId: PROJECT_X,
              rank: 1,
              score: 85.5,
              inputSnapshot: { projectId: PROJECT_X },
              scoreBreakdown: [],
            },
          ],
        },
        fake.chain,
      );
      expect(result).toEqual({ id: RUN_ID, createdAt: new Date("2026-11-08T00:00:00.000Z") });
      const insertCalls = fake.calls.filter((c) => c.method === "insert");
      expect(insertCalls).toHaveLength(2);
      const valuesCalls = fake.calls.filter((c) => c.method === "values");
      const runValues = valuesCalls.find((c) => !Array.isArray(c.args[0]));
      expect(runValues?.args[0]).toMatchObject({
        tenantId: TENANT_A,
        requestedBy: USER_A,
        fiscalYear: 2026,
      });
    });
  });

  describe("listDecisionRuns", () => {
    it("paginates runs and returns opaque cursor", async () => {
      const runs = Array.from({ length: 3 }, (_, i) => ({
        id: `run-${i}`,
        fiscalYear: 2026,
        criteriaVersion: "1.0.0",
        algorithmVersion: "weighted-sum-v1",
        createdAt: new Date(`2026-11-0${i}T00:00:00.000Z`),
      }));
      const fake = createFakeTx();
      fake.enqueue([...runs, { id: "extra" }]);
      fake.enqueue([{ runId: runs[0].id, count: "2" }]);
      const result = await listDecisionRuns(
        session,
        { fiscalYear: 2026, limit: 3 },
        fake.chain,
      );
      expect(result.runs).toHaveLength(3);
      const cursor = result.nextCursor;
      expect(cursor).toBeTruthy();
      const decoded = decodeCursor(cursor ?? "");
      expect(decoded.id).toBe(runs[2].id);
    });

    it("returns null cursor when no more pages", async () => {
      const fake = createFakeTx();
      fake.enqueue([{ id: "run-1", fiscalYear: 2026, criteriaVersion: "1.0.0", algorithmVersion: "weighted-sum-v1", createdAt: new Date() }]);
      fake.enqueue([]);
      const result = await listDecisionRuns(session, { limit: 20 }, fake.chain);
      expect(result.nextCursor).toBeNull();
    });

    it("respects cursor for keyset pagination", async () => {
      const cursor = encodeCursor({ createdAt: "2026-11-01T00:00:00.000Z", id: "run-1" });
      const fake = createFakeTx();
      fake.enqueue([]);
      fake.enqueue([]);
      await listDecisionRuns(session, { limit: 20, cursor }, fake.chain);
      const whereCalls = fake.calls.filter((c) => c.method === "where");
      expect(whereCalls).toHaveLength(1);
    });

    it("round-trips encoded cursor", () => {
      const payload = { createdAt: "2026-11-08T00:00:00.000Z", id: RUN_ID };
      expect(decodeCursor(encodeCursor(payload))).toEqual(payload);
    });

    it("rejects invalid cursor", () => {
      expect(() => decodeCursor("not-a-cursor")).toThrow("Cursor tidak valid.");
      expect(() => decodeCursor(encodeCursor({ createdAt: "bad", id: RUN_ID }))).toThrow("Cursor tidak valid.");
    });
  });

  describe("getDecisionRun", () => {
    it("returns run detail only when accessible", async () => {
      const run = {
        id: RUN_ID,
        fiscalYear: 2026,
        criteriaVersion: "1.0.0",
        algorithmVersion: "weighted-sum-v1",
        createdAt: new Date("2026-11-08T00:00:00.000Z"),
      };
      const items = [{ id: "item-1", runId: RUN_ID, projectId: PROJECT_X, rank: 1, score: 85.5, inputSnapshot: {}, scoreBreakdown: [], createdAt: new Date() }];
      const fake = createFakeTx();
      fake.enqueue([run]);
      fake.enqueue(items);
      const result = await getDecisionRun(session, RUN_ID, fake.chain);
      expect(result?.run.runId).toBe(RUN_ID);
      expect(result?.items).toHaveLength(1);
      expect(result?.items[0]?.score).toBe(85.5);
    });

    it("returns null when run is not accessible", async () => {
      const fake = createFakeTx();
      fake.enqueue([]);
      fake.enqueue([]);
      const result = await getDecisionRun(session, RUN_ID, fake.chain);
      expect(result).toBeNull();
    });
  });

  it("maps database rows to ProjectPrioritizationProjectInput", async () => {
    const fake = createFakeTx();
    fake.enqueue([projectRow({ id: PROJECT_X, contractValue: 250000000 })]);
    fake.enqueue([]);
    const result = await fetchAccessibleProjects(session, { fiscalYear: 2026 }, fake.chain);
    expect(result).toEqual([
      expect.objectContaining({
        projectId: PROJECT_X,
        contractValue: 250000000,
        status: "ongoing",
        progressDataAvailable: false,
      }),
    ]);
  });
});
