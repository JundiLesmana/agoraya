import { z } from "zod";

import type { PrioritizationCriterionKey } from "./types";
import { prioritizationCriterionKeys } from "./types";
export const criterionSourceIdentitySchema = z.strictObject({
  kind: z.enum(["submitted_report", "initial_field", "project_field"]),
  periodYear: z.number().int().min(2020).max(2100).optional(),
  periodMonth: z.number().int().min(1).max(12).optional(),
  submittedAt: z.string().datetime().optional(),
  field: z.string().min(1).optional(),
});

export const projectCriterionValueSchema = z.strictObject({
  value: z.number().finite(),
  source: criterionSourceIdentitySchema,
});

export const projectPrioritizationProjectInputSchema = z.strictObject({
  projectId: z.string().uuid(),
  status: z.string().min(1),
  physicalProgress: projectCriterionValueSchema,
  financialProgress: projectCriterionValueSchema,
  contractValue: z.number().finite().nonnegative(),
  progressDataAvailable: z.boolean(),
});


export const projectPrioritizationConfigSchema = z
  .strictObject({
    version: z.string().min(1),
    weights: z.record(z.string(), z.number().finite().nonnegative()),
  })
  .refine((config) => {
    const keys = Object.keys(config.weights);
    return (
      keys.length === prioritizationCriterionKeys.length &&
      keys.every((key) =>
        prioritizationCriterionKeys.includes(key as PrioritizationCriterionKey),
      )
    );
  }, {
    message: "Weights must contain exactly the MVP criterion keys",
    path: ["weights"],
  })
  .refine((config) => {
    const keys = Object.keys(config.weights);
    return keys.length === new Set(keys).size;
  }, {
    message: "Duplicate weight keys are not allowed",
    path: ["weights"],
  })
  .refine((config) => {
    const total = Object.values(config.weights).reduce(
      (sum, weight) => sum + weight,
      0,
    );
    return Math.abs(total - 1) < 1e-9;
  }, {
    message: "Total bobot harus sama dengan 1",
    path: ["weights"],
  });

export type ProjectPrioritizationProjectInput = z.input<
  typeof projectPrioritizationProjectInputSchema
>;
export type ProjectPrioritizationConfigInput = z.input<
  typeof projectPrioritizationConfigSchema
>;
export type ProjectPrioritizationConfigOutput = z.output<
  typeof projectPrioritizationConfigSchema
>;
