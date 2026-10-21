import type { WhatIfScenario } from "./types";

export function simulateScenario(scenario: WhatIfScenario): Readonly<Record<string, number>> {
  const outcome: Record<string, number> = { ...scenario.baseline };
  for (const [key, delta] of Object.entries(scenario.deltas)) {
    outcome[key] = (outcome[key] ?? 0) + delta;
  }
  return outcome;
}

