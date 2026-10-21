export type JobStatus = "pending" | "processing" | "completed" | "failed" | "dead_letter";

export interface JobEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly type: string;
  readonly payload: TPayload;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly timeoutMs: number;
  readonly availableAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly status: JobStatus;
  readonly lastError: string | null;
}

export interface JobMetrics {
  pending: number;
  processing: number;
  failed: number;
  deadLetter: number;
  completed: number;
}

export interface OutboxEnvelope<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly topic: string;
  readonly payload: TPayload;
  readonly status: "pending" | "published" | "failed";
  readonly attempts: number;
  readonly nextAttemptAt: Date;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastError: string | null;
}
