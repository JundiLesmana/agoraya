export type DecisionOutcome = "approved" | "rejected" | "pending";

export interface DecisionCriterion {
  readonly key: string;
  readonly name: string;
  readonly weight: number;
  readonly threshold: number;
  readonly comparator: "gte" | "lte" | "eq";
}

export interface DecisionEvaluationInput {
  readonly criteria: readonly DecisionCriterion[];
  readonly values: Readonly<Record<string, number>>;
  readonly mode?: "all" | "any";
}

export interface DecisionEvaluationResult {
  readonly outcome: DecisionOutcome;
  readonly score: number;
  readonly rationale: readonly string[];
}

export interface DecisionGate {
  readonly key: string;
  readonly name: string;
  readonly requiredRoles: readonly string[];
  readonly requiredPermissions: readonly string[];
  readonly decision: "approve" | "reject";
}

export interface GateCheckInput {
  readonly gate: DecisionGate;
  readonly subject: { readonly roles: readonly string[]; readonly permissions: readonly string[] };
}

export interface AlternativeScore {
  readonly key: string;
  readonly label: string;
  readonly scores: Readonly<Record<string, number>>;
}

export interface RankedAlternative {
  readonly key: string;
  readonly label: string;
  readonly score: number;
}

export interface OptimizationProblem {
  readonly candidates: readonly AlternativeScore[];
  readonly weights: Readonly<Record<string, number>>;
}

export interface ScheduleEntry {
  readonly key: string;
  readonly runAt: Date;
  readonly payload: Record<string, unknown>;
}

export interface WhatIfScenario {
  readonly key: string;
  readonly baseline: Readonly<Record<string, number>>;
  readonly deltas: Readonly<Record<string, number>>;
}

export type PrioritizationCriterionKey = "physical_progress" | "financial_progress" | "contract_value";

export interface CriterionSourceIdentity {
  readonly kind: "submitted_report" | "initial_field" | "project_field";
  readonly periodYear?: number;
  readonly periodMonth?: number;
  readonly submittedAt?: string;
  readonly field?: string;
}

export interface ProjectCriterionValue {
  readonly value: number;
  readonly source: CriterionSourceIdentity;
}

export interface ProjectPrioritizationProjectInput {
  readonly projectId: string;
  readonly status: string;
  readonly physicalProgress: ProjectCriterionValue;
  readonly financialProgress: ProjectCriterionValue;
  readonly contractValue: number;
  readonly progressDataAvailable: boolean;
}

export interface ProjectPrioritizationConfig {
  readonly version: string;
  readonly weights: Readonly<Record<PrioritizationCriterionKey, number>>;
}

export interface CriterionBreakdown {
  readonly criterion: PrioritizationCriterionKey;
  readonly sourceValue: number;
  readonly normalizedValue: number;
  readonly weight: number;
  readonly contribution: number;
  readonly source: CriterionSourceIdentity;
}

export interface ProjectPrioritizationResult {
  readonly projectId: string;
  readonly score: number;
  readonly rank: number;
  readonly breakdown: readonly CriterionBreakdown[];
}

export const prioritizationCriterionKeys: readonly PrioritizationCriterionKey[] = [
  "physical_progress",
  "financial_progress",
  "contract_value",
];

