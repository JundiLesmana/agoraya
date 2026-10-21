import type { AiProvider, AiProviderName, AiResponse } from './types';

class BaseProvider implements AiProvider {
  constructor(readonly name: AiProviderName) {}

  async complete(input: { prompt: string; context: Record<string, unknown> }): Promise<AiResponse> {
    return { provider: this.name, content: `${this.name}:${input.prompt}`, raw: input.context };
  }
}

export const openAiProvider = new BaseProvider('openai');
export const anthropicProvider = new BaseProvider('anthropic');
export const localProvider = new BaseProvider('local');

export function getAiProvider(name: AiProviderName): AiProvider {
  switch (name) {
    case 'anthropic': return anthropicProvider;
    case 'local': return localProvider;
    default: return openAiProvider;
  }
}

