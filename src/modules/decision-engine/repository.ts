import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import { db } from "@/lib/db";
import type * as dbSchema from "@/lib/db/schema";
import {
  decisionRuns,
  decisionRunItems,
  infrastructureProjects,
  projectProgressReports,
} from "@/lib/db/schema";
import type { Session } from "@/lib/auth/session";
import type {
  CriterionSourceIdentity,
  ProjectPrioritizationProjectInput,
} from "./types";

type DecisionDatabase = PostgresJsDatabase<typeof dbSchema>;

export type { DecisionDatabase };

interface CursorPayload {
  readonly createdAt: string;
  readonly id: string;
}

function encodeCursor(payload: CursorPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(value: string): CursorPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf-8"));
  } catch {
    throw new Error("Cursor tidak valid.");
  }
  const record = parsed as Record<string, unknown>;
  const createdAt = record.createdAt;
  const id = record.id;
  if (typeof createdAt !== "string" || typeof id !== "string") {
    throw new Error("Cursor tidak valid.");
  }
  const createdAtDate = new Date(createdAt);
  if (Number.isNaN(createdAtDate.getTime())) {
    throw new Error("Cursor tidak valid.");
  }
  return { createdAt, id };
}

async function withProjectContext<T>(
  session: Session,
  operation: (tx: DecisionDatabase) => Promise<T>,
  database: DecisionDatabase = db(),
): Promise<T> {
  return database.transaction(async (tx) => {
    await tx.execute(
      sql`select set_config('app.tenant_id', ${session.tenantId}, true)`,
    );
    await tx.execute(
      sql`select set_config('app.user_id', ${session.userId}, true)`,
    );
    return operation(tx);
  });
}

export interface FetchAccessibleProjectsOptions {
  readonly fiscalYear: number;
  readonly projectIds?: readonly string[];
}

export async function fetchAccessibleProjects(
  session: Session,
  options: FetchAccessibleProjectsOptions,
  database: DecisionDatabase = db(),
): Promise<ProjectPrioritizationProjectInput[]> {
  return withProjectContext(
    session,
    async (tx) => {
      const { fiscalYear, projectIds } = options;
      const conditions = [
        eq(infrastructureProjects.tenantId, session.tenantId),
        eq(infrastructureProjects.assignedUserId, session.userId),
        eq(infrastructureProjects.fiscalYear, fiscalYear),
      ];
      if (projectIds) {
        conditions.push(inArray(infrastructureProjects.id, projectIds));
      }

      const projects = await tx
        .select({
          id: infrastructureProjects.id,
          status: infrastructureProjects.status,
          contractValue: infrastructureProjects.contractValue,
          initialPhysicalProgress:
            infrastructureProjects.initialPhysicalProgress,
          initialFinancialProgress:
            infrastructureProjects.initialFinancialProgress,
        })
        .from(infrastructureProjects)
        .where(and(...conditions))
        .orderBy(
          infrastructureProjects.packageName,
          infrastructureProjects.id,
        );

      if (projects.length === 0) return [];

      const projectIdList = projects.map((project) => project.id);
      const reports = await tx
        .select({
          projectId: projectProgressReports.projectId,
          physicalProgress: projectProgressReports.physicalProgress,
          financialProgress: projectProgressReports.financialProgress,
          periodYear: projectProgressReports.periodYear,
          periodMonth: projectProgressReports.periodMonth,
          submittedAt: projectProgressReports.submittedAt,
        })
        .from(projectProgressReports)
        .where(
          and(
            eq(projectProgressReports.tenantId, session.tenantId),
            inArray(projectProgressReports.projectId, projectIdList),
            eq(projectProgressReports.periodYear, fiscalYear),
            eq(projectProgressReports.status, "submitted"),
          ),
        )
        .orderBy(
          desc(projectProgressReports.periodYear),
          desc(projectProgressReports.periodMonth),
          desc(projectProgressReports.submittedAt),
        );

      const latestByProject = new Map<string, (typeof reports)[number]>();
      for (const report of reports) {
        if (!latestByProject.has(report.projectId)) {
          latestByProject.set(report.projectId, report);
        }
      }

      return projects.map((project) => {
        const report = latestByProject.get(project.id);
        const hasReport = report !== undefined;
        const physicalSource: CriterionSourceIdentity = hasReport
          ? {
              kind: "submitted_report",
              periodYear: report.periodYear,
              periodMonth: report.periodMonth,
              ...(report.submittedAt
                ? { submittedAt: report.submittedAt.toISOString() }
                : {}),
            }
          : { kind: "initial_field", field: "initial_physical_progress" };
        const financialSource: CriterionSourceIdentity = hasReport
          ? {
              kind: "submitted_report",
              periodYear: report.periodYear,
              periodMonth: report.periodMonth,
              ...(report.submittedAt
                ? { submittedAt: report.submittedAt.toISOString() }
                : {}),
            }
          : { kind: "initial_field", field: "initial_financial_progress" };
        return {
          projectId: project.id,
          status: project.status,
          physicalProgress: {
            value: hasReport
              ? report.physicalProgress
              : project.initialPhysicalProgress,
            source: physicalSource,
          },
          financialProgress: {
            value: hasReport
              ? report.financialProgress
              : project.initialFinancialProgress,
            source: financialSource,
          },
          contractValue: project.contractValue,
          progressDataAvailable: hasReport,
        };
      });
    }, database);
}

export interface CreateDecisionRunItemInput {
  readonly projectId: string;
  readonly rank: number;
  readonly score: number;
  readonly inputSnapshot: unknown;
  readonly scoreBreakdown: unknown;
}

export interface CreateDecisionRunInput {
  readonly fiscalYear: number;
  readonly criteriaVersion: string;
  readonly algorithmVersion: string;
  readonly criteriaSnapshot: unknown;
  readonly items: readonly CreateDecisionRunItemInput[];
}

export async function createDecisionRun(
  session: Session,
  input: CreateDecisionRunInput,
  database: DecisionDatabase = db(),
): Promise<{ readonly id: string; readonly createdAt: Date }> {
  return withProjectContext(session, async (tx) => {
    const [run] = await tx
      .insert(decisionRuns)
      .values({
        tenantId: session.tenantId,
        requestedBy: session.userId,
        fiscalYear: input.fiscalYear,
        criteriaVersion: input.criteriaVersion,
        algorithmVersion: input.algorithmVersion,
        criteriaSnapshot: input.criteriaSnapshot,
      })
      .returning();
    if (!run) {
      throw new Error("Gagal membuat decision run.");
    }
    await tx.insert(decisionRunItems).values(
      input.items.map((item) => ({
        id: crypto.randomUUID(),
        tenantId: session.tenantId,
        runId: run.id,
        projectId: item.projectId,
        rank: item.rank,
        score: item.score,
        inputSnapshot: item.inputSnapshot,
        scoreBreakdown: item.scoreBreakdown,
      })),
    );
    return { id: run.id, createdAt: run.createdAt };
  }, database);
}

export interface DecisionRunSummary {
  readonly runId: string;
  readonly fiscalYear: number;
  readonly criteriaVersion: string;
  readonly algorithmVersion: string;
  readonly createdAt: Date;
  readonly projectCount: number;
}

export interface ListDecisionRunsOptions {
  readonly fiscalYear?: number;
  readonly limit: number;
  readonly cursor?: string;
}

export async function listDecisionRuns(
  session: Session,
  options: ListDecisionRunsOptions,
  database: DecisionDatabase = db(),
): Promise<{ readonly runs: readonly DecisionRunSummary[]; readonly nextCursor: string | null }> {
  return withProjectContext(session, async (tx) => {
    const { fiscalYear, limit, cursor } = options;
    const conditions = [
      eq(decisionRuns.tenantId, session.tenantId),
      eq(decisionRuns.requestedBy, session.userId),
    ];
    if (fiscalYear !== undefined) {
      conditions.push(eq(decisionRuns.fiscalYear, fiscalYear));
    }
    if (cursor) {
      const { createdAt, id } = decodeCursor(cursor);
      const createdAtDate = new Date(createdAt);
      conditions.push(
        sql`(${decisionRuns.createdAt} < ${createdAtDate}) OR (${decisionRuns.createdAt} = ${createdAtDate} AND ${decisionRuns.id} < ${id})`,
      );
    }

    const runs = await tx
      .select({
        id: decisionRuns.id,
        fiscalYear: decisionRuns.fiscalYear,
        criteriaVersion: decisionRuns.criteriaVersion,
        algorithmVersion: decisionRuns.algorithmVersion,
        createdAt: decisionRuns.createdAt,
      })
      .from(decisionRuns)
      .where(and(...conditions))
      .orderBy(desc(decisionRuns.createdAt), desc(decisionRuns.id))
      .limit(limit + 1);

    const hasMore = runs.length > limit;
    const page = hasMore ? runs.slice(0, -1) : runs;

    const countRows =
      page.length > 0
        ? await tx
            .select({ runId: decisionRunItems.runId, count: count() })
            .from(decisionRunItems)
            .where(
              and(
                eq(decisionRunItems.tenantId, session.tenantId),
                inArray(
                  decisionRunItems.runId,
                  page.map((run) => run.id),
                ),
              ),
            )
            .groupBy(decisionRunItems.runId)
        : [];
    const counts = new Map<string, number>();
    for (const row of countRows) {
      counts.set(row.runId, Number(row.count));
    }

    let nextCursor: string | null = null;
    if (hasMore && page.length > 0) {
      const last = page[page.length - 1];
      nextCursor = encodeCursor({ createdAt: last.createdAt.toISOString(), id: last.id });
    }

    return {
      runs: page.map((run) => ({
        runId: run.id,
        fiscalYear: run.fiscalYear,
        criteriaVersion: run.criteriaVersion,
        algorithmVersion: run.algorithmVersion,
        createdAt: run.createdAt,
        projectCount: counts.get(run.id) ?? 0,
      })),
      nextCursor,
    };
  }, database);
}

export interface DecisionRunItem {
  readonly id: string;
  readonly runId: string;
  readonly projectId: string;
  readonly rank: number;
  readonly score: number;
  readonly inputSnapshot: unknown;
  readonly scoreBreakdown: unknown;
  readonly createdAt: Date;
}

export interface DecisionRunDetail {
  readonly run: DecisionRunSummary;
  readonly items: readonly DecisionRunItem[];
}

export async function getDecisionRun(
  session: Session,
  runId: string,
  database: DecisionDatabase = db(),
): Promise<DecisionRunDetail | null> {
  return withProjectContext(session, async (tx) => {
    const [run] = await tx
      .select({
        id: decisionRuns.id,
        fiscalYear: decisionRuns.fiscalYear,
        criteriaVersion: decisionRuns.criteriaVersion,
        algorithmVersion: decisionRuns.algorithmVersion,
        createdAt: decisionRuns.createdAt,
      })
      .from(decisionRuns)
      .where(
        and(
          eq(decisionRuns.id, runId),
          eq(decisionRuns.tenantId, session.tenantId),
          eq(decisionRuns.requestedBy, session.userId),
        ),
      )
      .limit(1);
    if (!run) return null;

    const items = await tx
      .select()
      .from(decisionRunItems)
      .where(
        and(
          eq(decisionRunItems.runId, runId),
          eq(decisionRunItems.tenantId, session.tenantId),
        ),
      )
      .orderBy(decisionRunItems.rank);

    return {
      run: {
        runId: run.id,
        fiscalYear: run.fiscalYear,
        criteriaVersion: run.criteriaVersion,
        algorithmVersion: run.algorithmVersion,
        createdAt: run.createdAt,
        projectCount: items.length,
      },
      items: items.map((item) => ({
        id: item.id,
        runId: item.runId,
        projectId: item.projectId,
        rank: item.rank,
        score: item.score,
        inputSnapshot: item.inputSnapshot,
        scoreBreakdown: item.scoreBreakdown,
        createdAt: item.createdAt,
      })),
    };
  }, database);
}

export { encodeCursor, decodeCursor };
