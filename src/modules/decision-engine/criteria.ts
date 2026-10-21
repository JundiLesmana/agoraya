import type { DecisionCriterion, DecisionEvaluationInput, DecisionEvaluationResult } from "./types";

function compare(value: number, threshold: number, comparator: DecisionCriterion["comparator"]): boolean {
  if (comparator === "gte") return value >= threshold;
  if (comparator === "lte") return value <= threshold;
  return value === threshold;
}

export function evaluateCriteria(input: DecisionEvaluationInput): DecisionEvaluationResult {
  const mode = input.mode ?? "all";
  const rationale: string[] = [];
  let weightedTotal = 0;
  let totalWeight = 0;
  let matchedCount = 0;

  for (const criterion of input.criteria) {
    const value = input.values[criterion.key];
    const matched = typeof value === "number" && compare(value, criterion.threshold, criterion.comparator);
    totalWeight += criterion.weight;
    if (matched) {
      matchedCount += 1;
      weightedTotal += criterion.weight;
      rationale.push(`${criterion.key}: pass`);
    } else {
      rationale.push(`${criterion.key}: fail`);
    }
  }

  const score = totalWeight === 0 ? 0 : weightedTotal / totalWeight;
  const outcome = mode === "any" ? (matchedCount > 0 ? "approved" : "rejected") : (matchedCount === input.criteria.length ? "approved" : "rejected");
  return { outcome, score, rationale };
}

