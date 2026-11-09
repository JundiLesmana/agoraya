import { appendAuditEvent } from "@/modules/audit";
import { db } from "@/lib/db";
import { ForbiddenError, formatError, isAppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import type { CriterionBreakdown } from "./types";
import type { DecisionDatabase } from "@/modules/decision-engine/repository";
import type { Session } from "@/lib/auth/session";
import * as repository from "@/modules/decision-engine/repository";
import {
  PROJECT_PRIORITIZATION_CONFIG_VERSION,
  projectPrioritizationConfig,
} from "./config";
import { prioritizeProjects } from "./project-prioritization";

export const ALGORITHM_VERSION = "weighted-sum-v1";

export interface CreatePrioritizationRunInput {
  readonly fiscalYear: number;
  readonly projectIds?: readonly string[];
}

export interface PrioritizationRunResult {
  readonly runId: string;
  readonly criteriaVersion: string;
  readonly algorithmVersion: string;
  readonly fiscalYear: number;
  readonly createdAt: Date;
  readonly results: readonly {
    readonly projectId: string;
    readonly rank: number;
    readonly score: number;
    readonly breakdown: readonly CriterionBreakdown[];
  }[];
}

export interface ListPrioritizationRunsOptions {
  readonly fiscalYear?: number;
  readonly limit: number;
  readonly cursor?: string;
}

export interface PrioritizationRunDetail {
  readonly run: {
    readonly runId: string;
    readonly fiscalYear: number;
    readonly criteriaVersion: string;
    readonly algorithmVersion: string;
    readonly createdAt: Date;
    readonly projectCount: number;
  };
  readonly items: readonly {
    readonly projectId: string;
    readonly rank: number;
    readonly score: number;
    readonly inputSnapshot: unknown;
    readonly scoreBreakdown: unknown;
  }[];
}

export async function createPrioritizationRun(
  session: Session,
  input: CreatePrioritizationRunInput,
  database: DecisionDatabase = db(),
): Promise<PrioritizationRunResult> {
  const projects = await repository.fetchAccessibleProjects(session, {
    fiscalYear: input.fiscalYear,
    projectIds: input.projectIds,
  }, database);

  if (input.projectIds) {
    const accessibleIds = new Set(projects.map((project) => project.projectId));
    const missing = input.projectIds.filter((id) => !accessibleIds.has(id));
    if (missing.length > 0) {
      logger.warn("decision_engine.run.unauthorized_projects", {
        actorId: session.userId,
        fiscalYear: input.fiscalYear,
        requestedCount: input.projectIds.length,
        missingCount: missing.length,
      });
      throw new ForbiddenError("Satu atau lebih proyek tidak dapat diakses.");
    }
  }

  const results = prioritizeProjects(projects, projectPrioritizationConfig);

  const projectById = new Map(projects.map((project) => [project.projectId, project]));
  const items = results.map((result) => {
    const project = projectById.get(result.projectId);
    if (!project) {
      throw new Error(`Proyek tidak ditemukan dalam daftar yang dapat diakses: ${result.projectId}`);
    }
    return {
      projectId: result.projectId,
      rank: result.rank,
      score: result.score,
      inputSnapshot: {
        projectId: project.projectId,
        fiscalYear: input.fiscalYear,
        status: project.status,
        physicalProgress: project.physicalProgress,
        financialProgress: project.financialProgress,
        contractValue: project.contractValue,
        progressDataAvailable: project.progressDataAvailable,
      },
      scoreBreakdown: result.breakdown.map((breakdown) => ({
        criterion: breakdown.criterion,
        sourceValue: breakdown.sourceValue,
        normalizedValue: breakdown.normalizedValue,
        weight: breakdown.weight,
        contribution: breakdown.contribution,
        source: breakdown.source,
      })),
    };
  });

  const criteriaSnapshot = {
    version: PROJECT_PRIORITIZATION_CONFIG_VERSION,
    weights: projectPrioritizationConfig.weights,
    criteria: [
      "physical_progress",
      "financial_progress",
      "contract_value",
    ] as const,
  };

  const { id: runId, createdAt } = await repository.createDecisionRun(
    session,
    {
      fiscalYear: input.fiscalYear,
      criteriaVersion: PROJECT_PRIORITIZATION_CONFIG_VERSION,
      algorithmVersion: ALGORITHM_VERSION,
      criteriaSnapshot,
      items,
    },
    database,
  );

  await appendAuditEvent(database, {
    action: "decision_engine.run.create",
    actorId: session.userId,
    targetTable: "decision_runs",
    targetId: runId,
    metadata: {
      fiscalYear: input.fiscalYear,
      algorithm: ALGORITHM_VERSION,
      projectCount: items.length,
      requestedProjectCount: input.projectIds?.length ?? null,
    },
    occurredAt: new Date(),
  });

  logger.info("decision_engine.run.created", {
    runId,
    fiscalYear: input.fiscalYear,
    projectCount: items.length,
  });

  return {
    runId,
    criteriaVersion: PROJECT_PRIORITIZATION_CONFIG_VERSION,
    algorithmVersion: ALGORITHM_VERSION,
    fiscalYear: input.fiscalYear,
    createdAt,
    results: results.map((result) => ({
      projectId: result.projectId,
      rank: result.rank,
      score: result.score,
      breakdown: result.breakdown,
    })),
  };
}

export async function listPrioritizationRuns(
  session: Session,
  options: ListPrioritizationRunsOptions,
  database: DecisionDatabase = db(),
): Promise<{
  readonly runs: readonly repository.DecisionRunSummary[];
  readonly nextCursor: string | null;
}> {
  return repository.listDecisionRuns(session, options, database);
}

export async function getPrioritizationRun(
  session: Session,
  runId: string,
  database: DecisionDatabase = db(),
): Promise<PrioritizationRunDetail | null> {
  const detail = await repository.getDecisionRun(session, runId, database);
  if (!detail) return null;

  return {
    run: {
      runId: detail.run.runId,
      fiscalYear: detail.run.fiscalYear,
      criteriaVersion: detail.run.criteriaVersion,
      algorithmVersion: detail.run.algorithmVersion,
      createdAt: detail.run.createdAt,
      projectCount: detail.run.projectCount,
    },
    items: detail.items.map((item) => ({
      projectId: item.projectId,
      rank: item.rank,
      score: item.score,
      inputSnapshot: item.inputSnapshot,
      scoreBreakdown: item.scoreBreakdown,
    })),
  };
}

export function mapServiceError(error: unknown): {
  readonly statusCode: number;
  readonly body: { readonly code: string; readonly message: string };
} {
  const formatted = formatError(error);
  if (!isAppError(error) || formatted.statusCode >= 500) {
    logger.error("decision_engine.service.error", {
      errorType: error instanceof Error ? error.constructor.name : "UnknownError",
    });
  }
  return {
    statusCode: formatted.statusCode,
    body: { code: formatted.code, message: formatted.message },
  };
}
