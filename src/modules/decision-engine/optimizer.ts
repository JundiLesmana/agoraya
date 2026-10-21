import type { OptimizationProblem, RankedAlternative } from "./types";
import { rankAlternatives } from "./mcsa";

export function optimizeDecision(problem: OptimizationProblem): RankedAlternative | null {
  const ranked = rankAlternatives(problem.candidates, problem.weights);
  return ranked[0] ?? null;
}

