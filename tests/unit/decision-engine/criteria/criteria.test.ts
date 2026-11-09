import { describe, expect, it } from "vitest";
import { evaluateCriteria } from "@/modules/decision-engine/criteria";
import type { DecisionCriterion } from "@/modules/decision-engine/types";

function criterion(
  overrides: Partial<DecisionCriterion> = {},
): DecisionCriterion {
  return {
    key: "budget",
    name: "Budget",
    weight: 1,
    threshold: 10,
    comparator: "gte",
    ...overrides,
  };
}

describe("decision-engine/criteria", () => {
  it("approves when value meets gte threshold", () => {
    const result = evaluateCriteria({
      criteria: [criterion()],
      values: { budget: 12 },
    });
    expect(result.outcome).toBe("approved");
    expect(result.score).toBe(1);
  });

  it("rejects when value below gte threshold", () => {
    const result = evaluateCriteria({
      criteria: [criterion()],
      values: { budget: 5 },
    });
    expect(result.outcome).toBe("rejected");
    expect(result.score).toBe(0);
  });

  it("uses lte comparator", () => {
    const pass = evaluateCriteria({
      criteria: [criterion({ comparator: "lte", threshold: 10 })],
      values: { budget: 5 },
    });
    expect(pass.outcome).toBe("approved");

    const fail = evaluateCriteria({
      criteria: [criterion({ comparator: "lte", threshold: 10 })],
      values: { budget: 12 },
    });
    expect(fail.outcome).toBe("rejected");
  });

  it("uses eq comparator", () => {
    const pass = evaluateCriteria({
      criteria: [criterion({ comparator: "eq", threshold: 10 })],
      values: { budget: 10 },
    });
    expect(pass.outcome).toBe("approved");

    const fail = evaluateCriteria({
      criteria: [criterion({ comparator: "eq", threshold: 10 })],
      values: { budget: 11 },
    });
    expect(fail.outcome).toBe("rejected");
  });

  it("mode any approves when at least one matches", () => {
    const result = evaluateCriteria({
      criteria: [criterion(), criterion({ key: "other", threshold: 100 })],
      values: { budget: 12 },
      mode: "any",
    });
    expect(result.outcome).toBe("approved");
  });

  it("mode all requires every criterion to match", () => {
    const result = evaluateCriteria({
      criteria: [criterion(), criterion({ key: "other", threshold: 100 })],
      values: { budget: 12 },
      mode: "all",
    });
    expect(result.outcome).toBe("rejected");
  });

  it("returns empty criteria as approved in all mode", () => {
    const result = evaluateCriteria({ criteria: [], values: {} });
    expect(result.outcome).toBe("approved");
    expect(result.score).toBe(0);
  });

  it("ignores non-numeric values", () => {
    const result = evaluateCriteria({
      criteria: [criterion()],
      values: { budget: "ten" as unknown as number },
    });
    expect(result.outcome).toBe("rejected");
  });

  it("records rationale for pass and fail", () => {
    const result = evaluateCriteria({
      criteria: [criterion(), criterion({ key: "other", threshold: 100 })],
      values: { budget: 12 },
    });
    expect(result.rationale).toContain("budget: pass");
    expect(result.rationale).toContain("other: fail");
  });
});
