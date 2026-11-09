import { z } from 'zod';

export const aiStructuredResponseSchema = z.object({
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  labels: z.array(z.string()).default([]),
});

export type AiStructuredResponse = z.infer<typeof aiStructuredResponseSchema>;

export const aiExplanationOutputSchema = z.strictObject({
  summary: z.string().min(1).max(2000),
  keyFactors: z.array(z.string().min(1).max(300)).min(1).max(10),
  limitations: z.array(z.string().min(1).max(300)).min(1).max(10),
});

export type AiExplanationOutput = z.infer<typeof aiExplanationOutputSchema>;

