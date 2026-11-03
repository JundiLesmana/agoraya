import { afterEach, describe, expect, it, vi } from 'vitest';
import { fillPromptTemplate } from '@/modules/ai/prompts';
import { aiStructuredResponseSchema } from '@/modules/ai/schemas';
import { checkGuardrails } from '@/modules/ai/guardrails';
import { routeAiRequest } from '@/modules/ai/router';
import { getAiProvider } from '@/modules/ai/providers';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('modules/ai', () => {
  it('fills prompt templates with context values', () => {
    expect(fillPromptTemplate('Hello {{name}} from {{city}}', { name: 'Ayu', city: 'Bandung' })).toBe('Hello Ayu from Bandung');
  });

  it('validates structured responses', () => {
    expect(aiStructuredResponseSchema.safeParse({ summary: 'ok', confidence: 0.9, labels: ['a'] }).success).toBe(true);
    expect(aiStructuredResponseSchema.safeParse({ summary: '', confidence: 2, labels: [] }).success).toBe(false);
  });

  it('detects pii and harmful content', () => {
    const result = checkGuardrails('Contact me at test@example.com and do violence');
    expect(result.allowed).toBe(false);
    expect(result.violations.map((v) => v.code)).toContain('pii_detected');
    expect(result.violations.map((v) => v.code)).toContain('harmful_content');
    expect(result.modifiedContent).toContain('[REDACTED]');
  });

  it('routes requests to the selected provider', async () => {
    const provider = getAiProvider('local');
    const completeSpy = vi.spyOn(provider, 'complete');
    await expect(routeAiRequest({ intent: 'classify', promptId: 'classification', context: { input: 'hello', context: 'demo' }, provider: 'local' })).rejects.toThrow('Unexpected token');
    expect(completeSpy).toHaveBeenCalled();
  });

  it('throttles repeated requests per provider', async () => {
    const provider = getAiProvider('openai');
    vi.spyOn(provider, 'complete').mockResolvedValue({ provider: 'openai', content: '{"summary":"ok","confidence":0.8,"labels":[]}' });
    for (let index = 0; index < 10; index += 1) {
      await routeAiRequest({ intent: 'classify', promptId: 'classification', context: { input: `hello-${index}`, context: 'demo' }, provider: 'openai' });
    }
    await expect(routeAiRequest({ intent: 'classify', promptId: 'classification', context: { input: 'hello-over', context: 'demo' }, provider: 'openai' })).rejects.toThrow('AI rate limit exceeded');
  });
});

