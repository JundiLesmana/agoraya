import { ExternalServiceError } from "@/lib/errors";

export interface IntegrationHttpClient {
  request<TResponse>(input: { url: string; method: string; headers?: Readonly<Record<string, string>>; body?: string; signal?: AbortSignal }): Promise<{ status: number; headers: Headers; body: TResponse }>;
}

export interface CircuitBreakerOptions { readonly failureThreshold: number; readonly cooldownMs: number; }

export class CircuitBreaker {
  #failures = 0;
  #openedAt: number | null = null;

  constructor(private readonly options: CircuitBreakerOptions) {}

  get isOpen(): boolean {
    return this.#openedAt !== null && Date.now() - this.#openedAt < this.options.cooldownMs;
  }

  async execute<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.isOpen) return fallback();
    try {
      const result = await operation();
      this.#failures = 0;
      this.#openedAt = null;
      return result;
    } catch (error) {
      this.#failures += 1;
      if (this.#failures >= this.options.failureThreshold) this.#openedAt = Date.now();
      if (this.isOpen) return fallback();
      throw error instanceof Error ? error : new ExternalServiceError("Integration request failed", { cause: error });
    }
  }
}

export class IntegrationClient {
  constructor(private readonly httpClient: IntegrationHttpClient, private readonly breaker: CircuitBreaker, private readonly retryDelayMs = 100) {}

  async execute<TResponse>(input: { url: string; method: string; headers?: Readonly<Record<string, string>>; body?: unknown; retries?: number; fallback: () => Promise<TResponse> }): Promise<TResponse> {
    const retries = input.retries ?? 2;
    const attempt = async (remaining: number): Promise<TResponse> => {
      try {
        const response = await this.httpClient.request<TResponse>({ url: input.url, method: input.method, headers: input.headers, body: input.body === undefined ? undefined : JSON.stringify(input.body) });
        if (response.status >= 400) throw new ExternalServiceError("Integration request failed", { details: { status: response.status } });
        return response.body;
      } catch (error) {
        if (remaining <= 0) throw error;
        await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
        return attempt(remaining - 1);
      }
    };
    return this.breaker.execute(() => attempt(retries), input.fallback);
  }
}

