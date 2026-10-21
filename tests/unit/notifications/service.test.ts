import { describe, expect, it, vi } from "vitest";
import { NotificationService } from "@/modules/notifications";
import type { OutboxRepository } from "@/modules/jobs/repository";

const outbox: OutboxRepository = {
  transaction: vi.fn(async (fn) => fn(outbox)),
  enqueue: vi.fn(async (event) => ({ ...event, status: "pending", attempts: 0, publishedAt: null, createdAt: new Date(), updatedAt: new Date(), lastError: null } as never)),
  claimBatch: vi.fn(),
  markPublished: vi.fn(),
  markFailed: vi.fn(),
};

describe("NotificationService", () => {
  it("queues and logs notifications", async () => {
    const brevo = { send: vi.fn() } as never;
    const service = new NotificationService({ brevo, outbox });

    await service.queueEmail("welcome", { email: "user@example.com" }, { message: "Welcome" });

    expect(outbox.enqueue).toHaveBeenCalled();
  });
});

