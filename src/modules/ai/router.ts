import { logger } from '@/lib/logger';
import { checkGuardrails } from './guardrails';
import { evaluateAiOutput } from './eval';
import { fillPromptTemplate, getPromptTemplate } from './prompts';
import { aiStructuredResponseSchema } from './schemas';
import { getAiProvider } from './providers';
import type { AiRequest, AiResponse } from './types';

const rateLimits = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const LIMIT = 10;

function enforceRateLimit(key: string): void {
  const now = Date.now();
  const state = rateLimits.get(key);
  if (!state || state.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  if (state.count >= LIMIT) throw new Error('AI rate limit exceeded');
  state.count += 1;
}

export async function routeAiRequest(request: AiRequest): Promise<{ response: AiResponse; evaluation: ReturnType<typeof evaluateAiOutput> }> {
  enforceRateLimit(request.provider ?? 'openai');
  const promptTemplate = getPromptTemplate(request.promptId);
  if (!promptTemplate) throw new Error('Unknown prompt template');
  const prompt = fillPromptTemplate(promptTemplate.template, request.context);
  const guardrail = checkGuardrails(prompt);
  if (!guardrail.allowed && !guardrail.modifiedContent) throw new Error('AI request blocked by guardrails');
  const provider = getAiProvider(request.provider ?? 'openai');
  const response = await provider.complete({ prompt: guardrail.modifiedContent ?? prompt, context: request.context });
  const validated = aiStructuredResponseSchema.safeParse(JSON.parse(response.content));
  logger.info('ai.request.completed', { provider: response.provider, promptId: request.promptId, evaluated: true });
  return { response: validated.success ? { ...response, raw: validated.data } : response, evaluation: evaluateAiOutput({ prompt, response: response.content }) };
}

