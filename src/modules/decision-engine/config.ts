import type { ProjectPrioritizationConfig } from "./types";
import {
  projectPrioritizationConfigSchema,
  type ProjectPrioritizationConfigOutput,
} from "./schema";

export const PROJECT_PRIORITIZATION_CONFIG_VERSION = "1.0.0";

export const projectPrioritizationConfig: ProjectPrioritizationConfig = {
  version: PROJECT_PRIORITIZATION_CONFIG_VERSION,
  weights: {
    physical_progress: 0.40,
    financial_progress: 0.30,
    contract_value: 0.30,
  },
};

export const validatedProjectPrioritizationConfig: ProjectPrioritizationConfigOutput =
  projectPrioritizationConfigSchema.parse(projectPrioritizationConfig);
