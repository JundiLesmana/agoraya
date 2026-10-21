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

