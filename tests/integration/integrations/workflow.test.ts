import { describe, expect, it, vi } from "vitest";

import { CircuitBreaker, IntegrationClient, InMemoryIntegrationAuditRepository, InMemoryIntegrationSyncRepository, IntegrationSyncService, mapIntegrationData } from "@/modules/integrations";
import type { OutboxRepository } from "@/modules/jobs/repository";

describe("integration workflow", () => {
  it("supports client to mapper to sync flow with audit logging", async () => {
    const httpClient = { request: vi.fn().mockResolvedValue({ status: 200, headers: new Headers(), body: { id: "abc", title: "hello" } }) };
    const client = new IntegrationClient(httpClient, new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000 }), 0);
    const external = await client.execute<{ id: string; title: string }>({ url: "https://example.test", method: "GET", fallback: vi.fn().mockResolvedValue({ id: "fallback", title: "fallback" }) });
    const mapped = mapIntegrationData(external, (input) => ({ externalId: input.id, title: input.title.toUpperCase() }));

    const outbox: OutboxRepository = { transaction: vi.fn(async (fn) => fn(outbox)), enqueue: vi.fn(async (event) => ({ ...event, status: "pending", attempts: 0, publishedAt: null, createdAt: new Date(), updatedAt: new Date(), nextAttemptAt: new Date(), lastError: null })), claimBatch: vi.fn(), markPublished: vi.fn(), markFailed: vi.fn() } as unknown as OutboxRepository;
    const syncRepository = new InMemoryIntegrationSyncRepository();
    const auditRepository = new InMemoryIntegrationAuditRepository();
    const sync = new IntegrationSyncService({ syncRepository, auditRepository, outbox });

    const record = await sync.trigger("service-a", mapped.externalId, mapped, { integration: "service-a", source: "api" });

    expect(record.payload).toEqual(mapped);
    expect(httpClient.request).toHaveBeenCalledTimes(1);
  });
});
