export type AiProviderName = 'openai' | 'anthropic' | 'local';

export interface AiRequest<TContext extends Record<string, unknown> = Record<string, unknown>> {
  readonly intent: string;
  readonly promptId: string;
  readonly context: TContext;
  readonly provider?: AiProviderName;
}

export interface AiResponse {
  readonly provider: AiProviderName;
  readonly content: string;
  readonly raw?: unknown;
}

export interface AiProvider {
  readonly name: AiProviderName;
  complete(input: { prompt: string; context: Record<string, unknown> }): Promise<AiResponse>;
}

export interface AiRoutingResult {
  readonly provider: AiProvider;
  readonly prompt: string;
}

export interface GuardrailViolation {
  readonly code: string;
  readonly message: string;
}

