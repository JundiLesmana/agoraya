import { describe, expect, it } from "vitest";
import { optimizeDecision } from "@/modules/decision-engine/optimizer";
import type { AlternativeScore } from "@/modules/decision-engine/types";

describe("decision-engine/optimizer", () => {
  it("returns the best candidate by weighted score", () => {
    const result = optimizeDecision({
      candidates: [
        { key: "a", label: "A", scores: { score: 10 } },
        { key: "b", label: "B", scores: { score: 7 } },
      ],
      weights: { score: 1 },
    });
    expect(result?.key).toBe("a");
  });

  it("returns null for no candidates", () => {
    const result = optimizeDecision({
      candidates: [],
      weights: { score: 1 },
    });
    expect(result).toBeNull();
  });
});
