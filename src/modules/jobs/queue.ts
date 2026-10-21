import { randomUUID } from "node:crypto";

import { JobHandlerRegistry } from "./handlers";
import type { JobEnvelope, JobMetrics } from "./types";
import type { JobRepository } from "./repository";

export interface QueueOptions { readonly defaultMaxAttempts: number; readonly defaultTimeoutMs: number; readonly retryDelayMs: number; }

export class JobQueue {
  constructor(private readonly repository: JobRepository, private readonly handlers: JobHandlerRegistry, private readonly options: QueueOptions) {}
  async enqueue<TPayload extends Record<string, unknown>>(type: string, payload: TPayload, now = new Date(), overrides: Partial<Pick<JobEnvelope, "maxAttempts" | "timeoutMs">> = {}) {
    return this.repository.enqueue({ id: randomUUID(), type, payload, attempts: 0, maxAttempts: overrides.maxAttempts ?? this.options.defaultMaxAttempts, timeoutMs: overrides.timeoutMs ?? this.options.defaultTimeoutMs, availableAt: now });
  }
  async processNext(now = new Date()): Promise<"idle" | "completed" | "failed"> {
    const job = await this.repository.leaseNext(now);
    if (!job) return "idle";
    const handler = this.handlers.get(job.type);
    if (!handler) return this.fail(job, now, new Error(`Missing handler for ${job.type}`));
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Job ${job.id} timed out after ${job.timeoutMs}ms`)), job.timeoutMs));
    try { await Promise.race([handler.handle(job.payload), timeout]); }
    catch (error) { return this.fail(job, now, error instanceof Error ? error : new Error(String(error))); }
    await this.repository.update({ ...job, attempts: job.attempts + 1, status: "completed", updatedAt: now, lastError: null });
    return "completed";
  }
  async metrics(): Promise<JobMetrics> { return this.repository.countMetrics(); }
  private async fail(job: JobEnvelope, now: Date, error: Error): Promise<"failed"> {
    const attempts = job.attempts + 1;
    const status = attempts >= job.maxAttempts ? "dead_letter" : "failed";
    await this.repository.update({ ...job, attempts, status, updatedAt: now, lastError: error.message, availableAt: attempts >= job.maxAttempts ? job.availableAt : new Date(now.getTime() + this.options.retryDelayMs) });
    return "failed";
  }
}
