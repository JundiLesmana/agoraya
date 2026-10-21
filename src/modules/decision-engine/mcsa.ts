import type { AlternativeScore, RankedAlternative } from "./types";

export function rankAlternatives(alternatives: readonly AlternativeScore[], weights: Readonly<Record<string, number>>): readonly RankedAlternative[] {
  return alternatives
    .map((alternative) => ({
      key: alternative.key,
      label: alternative.label,
      score: Object.entries(weights).reduce((total, [criterion, weight]) => total + (alternative.scores[criterion] ?? 0) * weight, 0),
    }))
    .sort((left, right) => right.score - left.score || left.key.localeCompare(right.key));
}

