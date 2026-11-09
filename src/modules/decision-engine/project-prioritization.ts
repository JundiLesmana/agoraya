import type {
  CriterionBreakdown,
  ProjectPrioritizationConfig,
  ProjectPrioritizationProjectInput,
  ProjectPrioritizationResult,
} from "./types";
import {
  projectPrioritizationConfigSchema,
  projectPrioritizationProjectInputSchema,
} from "./schema";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function roundHalfUp(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function normalizeContractValue(
  value: number,
  min: number,
  max: number,
): number {
  const normalized = max > min ? (value - min) / (max - min) : 0.5;
  return clamp(normalized * 100, 0, 100);
}

export function prioritizeProjects(
  projects: readonly ProjectPrioritizationProjectInput[],
  config: ProjectPrioritizationConfig,
): readonly ProjectPrioritizationResult[] {
  const validatedConfig = projectPrioritizationConfigSchema.parse(config);
  const weights = validatedConfig.weights;

  const validInputs = projects.map((input) =>
    projectPrioritizationProjectInputSchema.parse(input),
  );

  const ongoing = validInputs.filter((input) => input.status === "ongoing");
  if (ongoing.length === 0) {
    return [];
  }

  const contractValues = ongoing.map((input) => input.contractValue);
  const contractMin = Math.min(...contractValues);
  const contractMax = Math.max(...contractValues);

  const scored: Array<{
    projectId: string;
    score: number;
    contractValue: number;
    breakdown: CriterionBreakdown[];
  }> = ongoing.map((input) => {
    const physicalNorm = clamp(input.physicalProgress.value, 0, 100);
    const financialNorm = clamp(input.financialProgress.value, 0, 100);
    const contractNorm = normalizeContractValue(
      input.contractValue,
      contractMin,
      contractMax,
    );

    const physicalWeight = weights.physical_progress;
    const financialWeight = weights.financial_progress;
    const contractWeight = weights.contract_value;

    const physicalContribution = physicalNorm * physicalWeight;
    const financialContribution = financialNorm * financialWeight;
    const contractContribution = contractNorm * contractWeight;

    const scoreRaw =
      physicalContribution + financialContribution + contractContribution;
    const score = roundHalfUp(scoreRaw, 2);

    const breakdown: CriterionBreakdown[] = [
      {
        criterion: "physical_progress",
        sourceValue: input.physicalProgress.value,
        normalizedValue: physicalNorm,
        weight: physicalWeight,
        contribution: physicalContribution,
        source: input.physicalProgress.source,
      },
      {
        criterion: "financial_progress",
        sourceValue: input.financialProgress.value,
        normalizedValue: financialNorm,
        weight: financialWeight,
        contribution: financialContribution,
        source: input.financialProgress.source,
      },
      {
        criterion: "contract_value",
        sourceValue: input.contractValue,
        normalizedValue: contractNorm,
        weight: contractWeight,
        contribution: contractContribution,
        source: { kind: "project_field", field: "contract_value" },
      },
    ];

    return {
      projectId: input.projectId,
      score,
      contractValue: input.contractValue,
      breakdown,
    };
  });

  scored.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if (right.contractValue !== left.contractValue) {
      return right.contractValue - left.contractValue;
    }
    return left.projectId.localeCompare(right.projectId);
  });

  return scored.map((entry, index) => ({
    projectId: entry.projectId,
    score: entry.score,
    rank: index + 1,
    breakdown: entry.breakdown,
  }));
}
