import { describe, expect, it } from "vitest";
import { prioritizeProjects } from "@/modules/decision-engine/project-prioritization";
import {
  projectPrioritizationConfig,
  PROJECT_PRIORITIZATION_CONFIG_VERSION,
} from "@/modules/decision-engine/config";
import type {
  CriterionSourceIdentity,
  ProjectPrioritizationConfig,
  ProjectPrioritizationProjectInput,
} from "@/modules/decision-engine/types";

function projectValue(
  value: number,
  sourceOverrides: Partial<{
    kind: CriterionSourceIdentity["kind"];
    periodYear: number;
    periodMonth: number;
    submittedAt: string;
    field: string;
  }> = {},
): { value: number; source: CriterionSourceIdentity } {
  return {
    value,
    source: {
      kind: sourceOverrides.kind ?? "submitted_report",
      periodYear: sourceOverrides.periodYear,
      periodMonth: sourceOverrides.periodMonth,
      submittedAt: sourceOverrides.submittedAt,
      field: sourceOverrides.field,
    },
  };
}

function projectInput(overrides: Partial<ProjectPrioritizationProjectInput> = {}): ProjectPrioritizationProjectInput {
  return {
    projectId: "00000000-0000-0000-0000-000000000001",
    status: "ongoing",
    physicalProgress: projectValue(80),
    financialProgress: projectValue(60),
    contractValue: 1000000000,
    progressDataAvailable: true,
    ...overrides,
  };
}

describe("decision-engine/project-prioritization", () => {
  it("exports versioned MVP config with spec weights", () => {
    expect(PROJECT_PRIORITIZATION_CONFIG_VERSION).toBe("1.0.0");
    expect(projectPrioritizationConfig.weights).toEqual({
      physical_progress: 0.40,
      financial_progress: 0.30,
      contract_value: 0.30,
    });
  });

  it("computes weighted sum score and breakdown per criterion", () => {
    const results = prioritizeProjects(
      [
        projectInput({
          projectId: "00000000-0000-4000-8000-000000000001",
          physicalProgress: projectValue(100),
          financialProgress: projectValue(100),
          contractValue: 2000000000,
        }),
        projectInput({
          projectId: "00000000-0000-4000-8000-000000000002",
          physicalProgress: projectValue(0),
          financialProgress: projectValue(0),
          contractValue: 100000000,
        }),
      ],
      projectPrioritizationConfig,
    );

    expect(results).toHaveLength(2);
    const best = results.find((r) => r.projectId === "00000000-0000-4000-8000-000000000001");
    expect(best?.score).toBeCloseTo(100, 2);
    expect(best?.rank).toBe(1);

    const physical = best?.breakdown.find((b) => b.criterion === "physical_progress");
    expect(physical?.normalizedValue).toBe(100);
    expect(physical?.weight).toBe(0.40);
    expect(physical?.contribution).toBe(40);
    expect(physical?.sourceValue).toBe(100);
    expect(physical?.source.kind).toBe("submitted_report");
  });

  it("clamps physical and financial progress to [0, 100]", () => {
    const results = prioritizeProjects(
      [
        projectInput({
          projectId: "00000000-0000-4000-8000-000000000001",
          physicalProgress: projectValue(150),
          financialProgress: projectValue(-20),
          contractValue: 500000000,
        }),
      ],
      projectPrioritizationConfig,
    );

    const r = results[0];
    expect(r.score).toBeCloseTo(0.40 * 100 + 0.30 * 0 + 0.30 * 50, 2);
    const physical = r.breakdown.find((b) => b.criterion === "physical_progress");
    const financial = r.breakdown.find((b) => b.criterion === "financial_progress");
    expect(physical?.normalizedValue).toBe(100);
    expect(financial?.normalizedValue).toBe(0);
  });

  it("uses min-max normalization for contract value within the group", () => {
    const results = prioritizeProjects(
      [
        projectInput({ projectId: "00000000-0000-4000-8000-000000000010", contractValue: 100000000 }),
        projectInput({ projectId: "00000000-0000-4000-8000-000000000011", contractValue: 900000000 }),
      ],
      projectPrioritizationConfig,
    );

    const low = results.find((r) => r.projectId === "00000000-0000-4000-8000-000000000010");
    const high = results.find((r) => r.projectId === "00000000-0000-4000-8000-000000000011");
    expect(low?.breakdown.find((b) => b.criterion === "contract_value")?.normalizedValue).toBe(0);
    expect(high?.breakdown.find((b) => b.criterion === "contract_value")?.normalizedValue).toBe(100);
  });

  it("assigns 0.5 normalized contract value when all values are equal", () => {
    const results = prioritizeProjects(
      [
        projectInput({ projectId: "00000000-0000-4000-8000-000000000001", contractValue: 500000000 }),
        projectInput({ projectId: "00000000-0000-4000-8000-000000000002", contractValue: 500000000 }),
      ],
      projectPrioritizationConfig,
    );

    for (const result of results) {
      const contract = result.breakdown.find((b) => b.criterion === "contract_value");
      expect(contract?.normalizedValue).toBe(50);
    }
  });

  it("ranks by score desc, then contract value desc, then id asc", () => {
    const results = prioritizeProjects(
      [
        projectInput({
          projectId: "00000000-0000-4000-8000-000000000003",
          physicalProgress: projectValue(50),
          financialProgress: projectValue(50),
          contractValue: 900000000,
        }),
        projectInput({
          projectId: "00000000-0000-4000-8000-000000000001",
          physicalProgress: projectValue(50),
          financialProgress: projectValue(50),
          contractValue: 900000000,
        }),
        projectInput({
          projectId: "00000000-0000-4000-8000-000000000002",
          physicalProgress: projectValue(50),
          financialProgress: projectValue(50),
          contractValue: 100000000,
        }),
      ],
      projectPrioritizationConfig,
    );

    expect(results.map((r) => r.projectId)).toEqual(["00000000-0000-4000-8000-000000000001", "00000000-0000-4000-8000-000000000003", "00000000-0000-4000-8000-000000000002"]);
    expect(results.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("produces deterministic ordering across repeated runs", () => {
    const input = [
      projectInput({ projectId: "00000000-0000-4000-8000-000000000009", contractValue: 300000000 }),
      projectInput({ projectId: "00000000-0000-4000-8000-000000000001", contractValue: 700000000 }),
      projectInput({ projectId: "00000000-0000-4000-8000-00000000000d", contractValue: 500000000 }),
    ];
    const first = prioritizeProjects(input, projectPrioritizationConfig);
    const second = prioritizeProjects(input, projectPrioritizationConfig);
    expect(first).toEqual(second);
  });

  it("keeps score within [0, 100] with 2 decimal precision", () => {
    const results = prioritizeProjects(
      [
        projectInput({ projectId: "00000000-0000-4000-8000-000000000001", physicalProgress: projectValue(100), financialProgress: projectValue(100), contractValue: 1000000000 }),
      ],
      projectPrioritizationConfig,
    );

    expect(results[0].score).toBeGreaterThanOrEqual(0);
    expect(results[0].score).toBeLessThanOrEqual(100);
    expect(String(results[0].score).split(".")[1]?.length ?? 0).toBeLessThanOrEqual(2);
  });

  it("excludes non-ongoing projects from active ranking", () => {
    const results = prioritizeProjects(
      [
        projectInput({ projectId: "00000000-0000-4000-8000-00000000000e", status: "ongoing", contractValue: 500000000 }),
        projectInput({ projectId: "00000000-0000-4000-8000-00000000000f", status: "archived", contractValue: 900000000 }),
        projectInput({ projectId: "00000000-0000-4000-8000-000000000010", status: "completed", contractValue: 900000000 }),
      ],
      projectPrioritizationConfig,
    );

    expect(results.map((r) => r.projectId)).toEqual(["00000000-0000-4000-8000-00000000000e"]);
  });

  it("falls back to initial progress values when no report exists", () => {
    const results = prioritizeProjects(
      [
        projectInput({
          projectId: "00000000-0000-4000-8000-000000000001",
          progressDataAvailable: false,
          physicalProgress: projectValue(40, { kind: "initial_field" }),
          financialProgress: projectValue(30, { kind: "initial_field" }),
          contractValue: 500000000,
        }),
      ],
      projectPrioritizationConfig,
    );

    const r = results[0];
    expect(r.breakdown[0].source.kind).toBe("initial_field");
    expect(r.breakdown[0].normalizedValue).toBe(40);
    expect(r.breakdown[1].normalizedValue).toBe(30);
  });

  it("rejects non-finite input values", () => {
    expect(() =>
      prioritizeProjects(
        [
          projectInput({
            projectId: "00000000-0000-4000-8000-000000000001",
            physicalProgress: projectValue(NaN),
          }),
        ],
        projectPrioritizationConfig,
      ),
    ).toThrow();

    expect(() =>
      prioritizeProjects(
        [
          projectInput({
            projectId: "00000000-0000-4000-8000-000000000001",
            financialProgress: projectValue(Infinity),
          }),
        ],
        projectPrioritizationConfig,
      ),
    ).toThrow();
  });

  it("rejects invalid weights: total not equal to 1", () => {
    expect(() =>
      prioritizeProjects(
        [projectInput()],
        {
          version: "1.0.0",
          weights: { physical_progress: 0.5, financial_progress: 0.3, contract_value: 0.3 },
        } as unknown as ProjectPrioritizationConfig,
      ),
    ).toThrow();
  });

  it("rejects negative weight", () => {
    expect(() =>
      prioritizeProjects(
        [projectInput()],
        {
          version: "1.0.0",
          weights: { physical_progress: -0.1, financial_progress: 0.6, contract_value: 0.5 },
        } as unknown as ProjectPrioritizationConfig,
      ),
    ).toThrow();
  });

  it("rejects missing required criterion weight", () => {
    expect(() =>
      prioritizeProjects(
        [projectInput()],
        {
          version: "1.0.0",
          weights: { physical_progress: 0.5, financial_progress: 0.5 },
        } as unknown as ProjectPrioritizationConfig,
      ),
    ).toThrow();
  });

  it("rejects extra unknown criterion weight", () => {
    expect(() =>
      prioritizeProjects(
        [projectInput()],
        {
          version: "1.0.0",
          weights: { physical_progress: 0.4, financial_progress: 0.3, contract_value: 0.3, bogus: 0.1 },
        } as unknown as ProjectPrioritizationConfig,
      ),
    ).toThrow();
  });

  it("rejects missing required project data", () => {
    expect(() =>
      prioritizeProjects(
        [
          {
            projectId: "00000000-0000-4000-8000-000000000001",
            status: "ongoing",
            physicalProgress: projectValue(50),
            financialProgress: projectValue(50),
            contractValue: NaN,
            progressDataAvailable: true,
          } as unknown as ProjectPrioritizationProjectInput,
        ],
        projectPrioritizationConfig,
      ),
    ).toThrow();
  });
});
