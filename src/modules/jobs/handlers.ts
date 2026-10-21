export interface JobHandler<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly type: string;
  handle(payload: TPayload): Promise<void>;
}

export class JobHandlerRegistry {
  readonly #handlers = new Map<string, JobHandler>();
  register(handler: JobHandler): void { this.#handlers.set(handler.type, handler); }
  get(type: string): JobHandler | undefined { return this.#handlers.get(type); }
}

