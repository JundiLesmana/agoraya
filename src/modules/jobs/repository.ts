import { randomUUID } from "node:crypto";

import type { JobEnvelope, JobMetrics, JobStatus, OutboxEnvelope } from "./types";

const clone = <T>(value: T): T => structuredClone(value);

export interface JobRepository {
  transaction<T>(fn: (repository: JobRepository) => Promise<T>): Promise<T>;
  enqueue(job: Omit<JobEnvelope, "status" | "lastError" | "createdAt" | "updatedAt">): Promise<JobEnvelope>;
  leaseNext(now: Date): Promise<JobEnvelope | null>;
  update(job: JobEnvelope): Promise<JobEnvelope>;
  countMetrics(): Promise<JobMetrics>;
  listDeadLetter(limit: number): Promise<JobEnvelope[]>;
}

export interface OutboxRepository {
  transaction<T>(fn: (repository: OutboxRepository) => Promise<T>): Promise<T>;
  enqueue(event: Omit<OutboxEnvelope, "status" | "attempts" | "publishedAt" | "createdAt" | "updatedAt" | "lastError">): Promise<OutboxEnvelope>;
  claimBatch(now: Date, limit: number): Promise<OutboxEnvelope[]>;
  markPublished(id: string, now: Date): Promise<OutboxEnvelope | null>;
  markFailed(id: string, error: string, now: Date): Promise<OutboxEnvelope | null>;
}

export class InMemoryJobRepository implements JobRepository {
  readonly #jobs = new Map<string, JobEnvelope>();
  async transaction<T>(fn: (repository: JobRepository) => Promise<T>): Promise<T> { return fn(this); }
  async enqueue(job: Omit<JobEnvelope, "status" | "lastError" | "createdAt" | "updatedAt">) {
    const now = new Date();
    const envelope: JobEnvelope = { ...job, status: "pending", lastError: null, createdAt: now, updatedAt: now };
    this.#jobs.set(envelope.id, envelope);
    return clone(envelope);
  }
  async leaseNext(now: Date) {
    const next = [...this.#jobs.values()].find((job) => (job.status === "pending" || job.status === "failed") && job.availableAt <= now);
    if (!next) return null;
    const updated = { ...next, status: "processing" as JobStatus, updatedAt: now };
    this.#jobs.set(updated.id, updated);
    return clone(updated);
  }
  async update(job: JobEnvelope) { this.#jobs.set(job.id, clone(job)); return clone(job); }
  async countMetrics() {
    const counts: JobMetrics = { pending: 0, processing: 0, failed: 0, deadLetter: 0, completed: 0 };
    for (const job of this.#jobs.values()) {
      if (job.status === "dead_letter") counts.deadLetter += 1;
      else counts[job.status] += 1;
    }
    return counts;
  }
  async listDeadLetter(limit: number) { return clone([...this.#jobs.values()].filter((job) => job.status === "dead_letter").slice(0, limit)); }
}

export class InMemoryOutboxRepository implements OutboxRepository {
  readonly #events = new Map<string, OutboxEnvelope>();
  async transaction<T>(fn: (repository: OutboxRepository) => Promise<T>): Promise<T> { return fn(this); }
  async enqueue(event: Omit<OutboxEnvelope, "status" | "attempts" | "publishedAt" | "createdAt" | "updatedAt" | "lastError">) {
    const now = new Date();
    const envelope: OutboxEnvelope = { ...event, status: "pending", attempts: 0, publishedAt: null, createdAt: now, updatedAt: now, lastError: null };
    this.#events.set(envelope.id, envelope);
    return clone(envelope);
  }
  async claimBatch(now: Date, limit: number) { return clone([...this.#events.values()].filter((event) => (event.status === "pending" || event.status === "failed") && event.nextAttemptAt <= now).slice(0, limit)); }
  async markPublished(id: string, now: Date) { const item = this.#events.get(id); if (!item) return null; const updated = { ...item, status: "published" as const, publishedAt: now, updatedAt: now }; this.#events.set(id, updated); return clone(updated); }
  async markFailed(id: string, error: string, now: Date) { const item = this.#events.get(id); if (!item) return null; const updated = { ...item, status: "failed" as const, attempts: item.attempts + 1, updatedAt: now, lastError: error }; this.#events.set(id, updated); return clone(updated); }
}
