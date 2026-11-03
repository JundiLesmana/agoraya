import { describe, expect, it } from "vitest";
import { checkGate, evaluateCriteria, optimizeDecision, rankAlternatives, simulateScenario, triggerDueDecisions } from "@/modules/decision-engine";

describe("decision engine", () => {
  it("evaluates criteria", () => {
    const result = evaluateCriteria({ criteria: [{ key: "budget", name: "Budget", weight: 1, threshold: 10, comparator: "gte" }], values: { budget: 12 } });
    expect(result.outcome).toBe("approved");
  });

  it("checks gate approvals", () => {
    expect(checkGate({ gate: { key: "g1", name: "Gate", requiredRoles: ["checker"], requiredPermissions: [], decision: "approve" }, subject: { roles: ["checker"], permissions: [] } })).toBe(true);
  });

  it("ranks alternatives", () => {
    const ranked = rankAlternatives([{ key: "a", label: "A", scores: { cost: 1, impact: 5 } }, { key: "b", label: "B", scores: { cost: 3, impact: 3 } }], { cost: 0.5, impact: 1 });
    expect(ranked[0]?.key).toBe("a");
  });

  it("finds optimal solution", () => {
    expect(optimizeDecision({ candidates: [{ key: "a", label: "A", scores: { score: 10 } }, { key: "b", label: "B", scores: { score: 7 } }], weights: { score: 1 } })?.key).toBe("a");
  });

  it("triggers due schedules", () => {
    const due = triggerDueDecisions([{ key: "now", runAt: new Date("2020-01-01T00:00:00.000Z"), payload: {} }, { key: "later", runAt: new Date("2030-01-01T00:00:00.000Z"), payload: {} }], new Date("2025-01-01T00:00:00.000Z"));
    expect(due.map((entry) => entry.key)).toEqual(["now"]);
  });

  it("simulates scenarios", () => {
    expect(simulateScenario({ key: "s", baseline: { score: 10 }, deltas: { score: -2 } }).score).toBe(8);
  });
});

