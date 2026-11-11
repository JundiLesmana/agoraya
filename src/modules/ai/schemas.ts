import { z } from 'zod';

export const aiStructuredResponseSchema = z.object({
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  labels: z.array(z.string()).default([]),
});

export type AiStructuredResponse = z.infer<typeof aiStructuredResponseSchema>;

export const aiExplanationOutputSchema = z.strictObject({
  summary: z.string().trim().min(1).max(600),
  keyFactors: z.array(z.string().trim().min(1).max(160)).min(1).max(4),
  limitations: z.array(z.string().trim().min(1).max(160)).min(1).max(4),
});

export type AiExplanationOutput = z.infer<typeof aiExplanationOutputSchema>;
