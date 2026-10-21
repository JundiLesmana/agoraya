export type IntegrationSyncStatus = "pending" | "running" | "completed" | "failed" | "dead_letter";

export interface IntegrationRequest<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly service: string;
  readonly method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  readonly path: string;
  readonly payload?: TPayload;
  readonly idempotencyKey?: string;
  readonly correlationId?: string;
}

export interface IntegrationResponse<TBody = unknown> {
  readonly status: number;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: TBody;
}

export interface IntegrationMappingContext {
  readonly integration: string;
  readonly source: string;
}

export interface IntegrationSyncRecord<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  readonly id: string;
  readonly integration: string;
  readonly sourceId: string;
  readonly status: IntegrationSyncStatus;
  readonly attempts: number;
  readonly maxAttempts: number;
  readonly availableAt: Date;
  readonly payload: TPayload;
  readonly lastError: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly completedAt: Date | null;
}

export interface IntegrationAuditEntry {
  readonly id: string;
  readonly integration: string;
  readonly action: "client.request" | "mapper.transform" | "sync.execute" | "sync.retry" | "sync.fallback" | "sync.completed";
  readonly status: "ok" | "error";
  readonly requestId: string;
  readonly createdAt: Date;
  readonly metadata: Readonly<Record<string, unknown>>;
}

