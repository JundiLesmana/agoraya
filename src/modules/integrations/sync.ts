import { randomUUID } from "node:crypto";

import { logger } from "@/lib/logger";
import type { OutboxRepository } from "../jobs/repository";
import type { IntegrationAuditEntry, IntegrationMappingContext, IntegrationSyncRecord } from "./types";

export interface IntegrationSyncRepository {
  transaction<T>(fn: (repository: IntegrationSyncRepository) => Promise<T>): Promise<T>;
  enqueue(record: Omit<IntegrationSyncRecord, "status" | "attempts" | "lastError" | "createdAt" | "updatedAt" | "completedAt">): Promise<IntegrationSyncRecord>;
  update(record: IntegrationSyncRecord): Promise<IntegrationSyncRecord>;
  listPending(now: Date, limit: number): Promise<readonly IntegrationSyncRecord[]>;
}

export interface IntegrationAuditRepository {
  append(entry: Omit<IntegrationAuditEntry, "id" | "createdAt">): Promise<IntegrationAuditEntry>;
}

export class InMemoryIntegrationSyncRepository implements IntegrationSyncRepository {
  readonly #records = new Map<string, IntegrationSyncRecord>();
  async transaction<T>(fn: (repository: IntegrationSyncRepository) => Promise<T>): Promise<T> { return fn(this); }
  async enqueue(record: Omit<IntegrationSyncRecord, "status" | "attempts" | "lastError" | "createdAt" | "updatedAt" | "completedAt">) { const now = new Date(); const entry: IntegrationSyncRecord = { ...record, status: "pending", attempts: 0, lastError: null, createdAt: now, updatedAt: now, completedAt: null }; this.#records.set(entry.id, entry); return structuredClone(entry); }
  async update(record: IntegrationSyncRecord) { this.#records.set(record.id, structuredClone(record)); return structuredClone(record); }
  async listPending(now: Date, limit: number) { return structuredClone([...this.#records.values()].filter((record) => record.status === "pending" && record.availableAt <= now).slice(0, limit)); }
}

export class InMemoryIntegrationAuditRepository implements IntegrationAuditRepository {
  readonly #entries: IntegrationAuditEntry[] = [];
  async append(entry: Omit<IntegrationAuditEntry, "id" | "createdAt">) { const createdAt = new Date(); const record = { ...entry, id: randomUUID(), createdAt }; this.#entries.push(record); return structuredClone(record); }
}

export class IntegrationSyncService {
  constructor(private readonly options: { readonly syncRepository: IntegrationSyncRepository; readonly auditRepository: IntegrationAuditRepository; readonly outbox: OutboxRepository; readonly defaultMaxAttempts?: number }) {}

  async trigger(integration: string, sourceId: string, payload: Record<string, unknown>, context: IntegrationMappingContext): Promise<IntegrationSyncRecord> {
    const record = await this.options.syncRepository.enqueue({ id: randomUUID(), integration, sourceId, availableAt: new Date(), payload, maxAttempts: this.options.defaultMaxAttempts ?? 3 });
    await this.options.auditRepository.append({ integration, action: "sync.execute", status: "ok", requestId: sourceId, metadata: { ...context, syncId: record.id } });
    logger.info("integration.sync.triggered", { integration, sourceId });
    await this.options.outbox.enqueue({ id: randomUUID(), topic: "integrations.sync", payload: { integration, sourceId, syncId: record.id }, nextAttemptAt: new Date() });
    return record;
  }
}
