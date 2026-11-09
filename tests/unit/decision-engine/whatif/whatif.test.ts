import { describe, expect, it } from "vitest";
import { simulateScenario } from "@/modules/decision-engine/whatif";
import type { WhatIfScenario } from "@/modules/decision-engine/types";

describe("decision-engine/whatif", () => {
  it("applies deltas to baseline", () => {
    const result = simulateScenario({
      key: "s",
      baseline: { score: 10 },
      deltas: { score: -2 },
    });
    expect(result.score).toBe(8);
  });

  it("adds new keys from deltas", () => {
    const result = simulateScenario({
      key: "s",
      baseline: { score: 10 },
      deltas: { bonus: 5 },
    });
    expect(result.score).toBe(10);
    expect(result.bonus).toBe(5);
  });

  it("returns baseline unchanged when no deltas", () => {
    const result = simulateScenario({
      key: "s",
      baseline: { score: 10 },
      deltas: {},
    });
    expect(result.score).toBe(10);
  });
});
