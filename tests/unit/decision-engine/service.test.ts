import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { Session } from "@/lib/auth/session";
import type * as dbSchema from "@/lib/db/schema";
import { decisionRuns, decisionRunItems } from "@/lib/db/schema";
import { auditEvents } from "@/lib/db/schema/analytics";
import {
  ALGORITHM_VERSION,
  createPrioritizationRun,
  getPrioritizationRun,
  listPrioritizationRuns,
  mapServiceError,
} from "@/modules/decision-engine/service";
import { PROJECT_PRIORITIZATION_CONFIG_VERSION } from "@/modules/decision-engine/config";
import { ForbiddenError } from "@/lib/errors";

type Tx = PostgresJsDatabase<typeof dbSchema>;

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

const createdAt = new Date("2026-11-08T00:00:00.000Z");
let originalAuditHashSecret: string | undefined;

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

beforeEach(() => {
  vi.resetAllMocks();
  originalAuditHashSecret = process.env.AUDIT_HASH_SECRET;
  process.env.AUDIT_HASH_SECRET = "test-hash-secret-for-unit-tests-0000000001";
});

afterEach(() => {
  if (originalAuditHashSecret === undefined) {
    delete process.env.AUDIT_HASH_SECRET;
  } else {
    process.env.AUDIT_HASH_SECRET = originalAuditHashSecret;
  }
});

describe("decision-engine/service", () => {
  it("membuat run dan item dalam satu transaksi dengan skor deterministik", async () => {
    const fake = createFakeTx();
    fake.enqueue([
      {
        id: PROJECT_X,
        status: "ongoing",
        contractValue: 1000000000,
        initialPhysicalProgress: 10,
        initialFinancialProgress: 20,
        packageName: "proyek-x",
      },
    ]);
    fake.enqueue([
      {
        projectId: PROJECT_X,
        physicalProgress: 80,
        financialProgress: 60,
        periodYear: 2026,
        periodMonth: 10,
        submittedAt: new Date("2026-10-15T00:00:00.000Z"),
      },
    ]);
    fake.enqueue([{ id: RUN_ID, createdAt }]);

    const result = await createPrioritizationRun(
      session,
      { fiscalYear: 2026 },
      fake.chain,
    );

    expect(result.runId).toBe(RUN_ID);
    expect(result.criteriaVersion).toBe(PROJECT_PRIORITIZATION_CONFIG_VERSION);
    expect(result.algorithmVersion).toBe(ALGORITHM_VERSION);
    expect(result.fiscalYear).toBe(2026);
    expect(result.createdAt).toEqual(createdAt);
    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.projectId).toBe(PROJECT_X);
    expect(result.results[0]?.rank).toBe(1);
    expect(result.results[0]?.score).toBeCloseTo(65, 2);

    expect(result.results[0]?.breakdown).toHaveLength(3);
    expect(result.results[0]?.breakdown[0]?.criterion).toBe("physical_progress");
    expect(result.results[0]?.breakdown[0]?.normalizedValue).toBe(80);
    expect(result.results[0]?.breakdown[0]?.contribution).toBeCloseTo(32, 2);
    expect(result.results[0]?.breakdown[1]?.criterion).toBe("financial_progress");
    expect(result.results[0]?.breakdown[1]?.normalizedValue).toBe(60);
    expect(result.results[0]?.breakdown[1]?.contribution).toBeCloseTo(18, 2);
    expect(result.results[0]?.breakdown[2]?.criterion).toBe("contract_value");
    expect(result.results[0]?.breakdown[2]?.normalizedValue).toBe(50);
    expect(result.results[0]?.breakdown[2]?.contribution).toBeCloseTo(15, 2);

    const insertCalls = fake.calls.filter((c) => c.method === "insert");
    expect(insertCalls).toHaveLength(3);
    const runInsert = insertCalls.find((c) => c.args[0] === decisionRuns);
    expect(runInsert).toBeDefined();
    const itemsInsert = insertCalls.find((c) => c.args[0] === decisionRunItems);
    expect(itemsInsert).toBeDefined();
    const auditInsert = insertCalls.find((c) => c.args[0] === auditEvents);
    expect(auditInsert).toBeDefined();
    const runValuesCall = fake.calls.find(
      (c) =>
        c.method === "values" &&
        !Array.isArray(c.args[0]) &&
        (c.args[0] as Record<string, unknown>)?.tenantId === TENANT_A,
    );
    expect(runValuesCall?.args[0]).toMatchObject({
      tenantId: TENANT_A,
      requestedBy: USER_A,
      fiscalYear: 2026,
      criteriaVersion: PROJECT_PRIORITIZATION_CONFIG_VERSION,
      algorithmVersion: ALGORITHM_VERSION,
    });
    const itemsValuesCall = fake.calls.find(
      (c) => c.method === "values" && Array.isArray(c.args[0]),
    );
    const itemsPayload = itemsValuesCall?.args[0];
    const itemsArray = Array.isArray(itemsPayload) ? itemsPayload : [];
    expect(itemsArray).toHaveLength(1);
    expect(itemsArray[0]).toMatchObject({
      tenantId: TENANT_A,
      runId: RUN_ID,
      projectId: PROJECT_X,
      rank: 1,
      score: expect.any(Number),
    });
    expect((itemsArray[0] as Record<string, unknown>)?.inputSnapshot).toMatchObject({
      projectId: PROJECT_X,
      fiscalYear: 2026,
      contractValue: 1000000000,
      progressDataAvailable: true,
    });

    const executeCalls = fake.calls.filter((c) => c.method === "execute");
    expect(executeCalls).toHaveLength(5);
  });

  it("menolak proyek yang tidak dapat diakses tanpa menghasilkan ranking parsial", async () => {
    const fake = createFakeTx();
    fake.enqueue([
      {
        id: "77777777-7777-7777-8777-777777777777",
        status: "ongoing",
        contractValue: 500000000,
        initialPhysicalProgress: 10,
        initialFinancialProgress: 20,
        packageName: "proyek-lain",
      },
    ]);
    fake.enqueue([]);
    await expect(
      createPrioritizationRun(session, { fiscalYear: 2026, projectIds: [PROJECT_X] }, fake.chain),
    ).rejects.toMatchObject({ code: "FORBIDDEN", statusCode: 403 });
    const insertCalls = fake.calls.filter((c) => c.method === "insert");
    expect(insertCalls).toHaveLength(0);
  });

  it("membuat run dengan nol item ketika tidak ada proyek yang memenuhi syarat", async () => {
    const fake = createFakeTx();
    fake.enqueue([]);
    fake.enqueue([{ id: RUN_ID, createdAt }]);

    const result = await createPrioritizationRun(session, { fiscalYear: 2026 }, fake.chain);
    expect(result.results).toEqual([]);
    expect(result.runId).toBe(RUN_ID);
  });

  it("mengembalikan daftar run dari repository", async () => {
    const fake = createFakeTx();
    fake.enqueue([
      { id: RUN_ID, fiscalYear: 2026, criteriaVersion: "1.0.0", algorithmVersion: "weighted-sum-v1", createdAt },
    ]);
    fake.enqueue([]);
    const result = await listPrioritizationRuns(session, { fiscalYear: 2026, limit: 20 }, fake.chain);
    expect(result.runs).toHaveLength(1);
    expect(result.runs[0]?.runId).toBe(RUN_ID);
    expect(result.nextCursor).toBeNull();
  });

  it("mengembalikan null ketika run tidak ditemukan di cakupan pengguna", async () => {
    const fake = createFakeTx();
    fake.enqueue([]);
    fake.enqueue([]);
    const result = await getPrioritizationRun(session, RUN_ID, fake.chain);
    expect(result).toBeNull();
  });

  it("memetakan error service ke status code", () => {
    expect(mapServiceError(new ForbiddenError("dilarang"))).toEqual({
      statusCode: 403,
      body: { code: "FORBIDDEN", message: "dilarang" },
    });
    expect(mapServiceError(new Error("gagal"))).toEqual({
      statusCode: 500,
      body: { code: "INTERNAL_SERVER_ERROR", message: "Internal server error" },
    });
  });
});
