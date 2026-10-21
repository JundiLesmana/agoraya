import { describe, expect, it, vi } from "vitest";

import { InMemoryIntegrationAuditRepository, InMemoryIntegrationSyncRepository, IntegrationSyncService } from "@/modules/integrations";
import type { OutboxRepository } from "@/modules/jobs/repository";

describe("integration sync", () => {
  it("enqueues sync work and records audit trail", async () => {
    const outbox: OutboxRepository = { transaction: vi.fn(async (fn) => fn(outbox)), enqueue: vi.fn(async (event) => ({ ...event, status: "pending", attempts: 0, publishedAt: null, createdAt: new Date(), updatedAt: new Date(), nextAttemptAt: new Date(), lastError: null })), claimBatch: vi.fn(), markPublished: vi.fn(), markFailed: vi.fn() } as unknown as OutboxRepository;
    const syncRepository = new InMemoryIntegrationSyncRepository();
    const auditRepository = new InMemoryIntegrationAuditRepository();
    const service = new IntegrationSyncService({ syncRepository, auditRepository, outbox, defaultMaxAttempts: 4 });

    const record = await service.trigger("service-a", "source-1", { name: "data" }, { integration: "service-a", source: "api" });

    expect(record.integration).toBe("service-a");
    expect(record.maxAttempts).toBe(4);
    expect(await syncRepository.listPending(new Date(), 10)).toHaveLength(1);
  });
});

