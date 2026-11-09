import { describe, expect, it } from "vitest";
import { rankAlternatives } from "@/modules/decision-engine/mcsa";
import type { AlternativeScore } from "@/modules/decision-engine/types";

describe("decision-engine/mcsa", () => {
  it("ranks by weighted sum descending", () => {
    const alternatives: readonly AlternativeScore[] = [
      { key: "a", label: "A", scores: { cost: 1, impact: 5 } },
      { key: "b", label: "B", scores: { cost: 3, impact: 6 } },
    ];
    const ranked = rankAlternatives(alternatives, { cost: 0.5, impact: 1 });
    expect(ranked[0]?.key).toBe("b");
    expect(ranked[1]?.key).toBe("a");
  });

  it("treats missing criterion score as zero", () => {
    const ranked = rankAlternatives(
      [{ key: "a", label: "A", scores: { cost: 1 } }],
      { cost: 0.5, impact: 1 },
    );
    expect(ranked[0]?.score).toBeCloseTo(0.5);
  });

  it("breaks ties by key ascending", () => {
    const alternatives: readonly AlternativeScore[] = [
      { key: "b", label: "B", scores: { cost: 2 } },
      { key: "a", label: "A", scores: { cost: 2 } },
    ];
    const ranked = rankAlternatives(alternatives, { cost: 1 });
    expect(ranked[0]?.key).toBe("a");
    expect(ranked[1]?.key).toBe("b");
  });

  it("returns empty array for no alternatives", () => {
    const ranked = rankAlternatives([], { cost: 1 });
    expect(ranked).toEqual([]);
  });
});
