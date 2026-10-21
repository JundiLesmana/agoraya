import { z } from 'zod';

export const aiStructuredResponseSchema = z.object({
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  labels: z.array(z.string()).default([]),
});

export type AiStructuredResponse = z.infer<typeof aiStructuredResponseSchema>;

