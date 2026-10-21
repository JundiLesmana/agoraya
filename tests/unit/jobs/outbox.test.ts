import { describe, expect, it } from "vitest";
import { InMemoryOutboxRepository, OutboxProcessor } from "@/modules/jobs";

describe("OutboxProcessor", () => {
  it("publishes pending events", async () => {
    const repo = new InMemoryOutboxRepository();
    await repo.enqueue({ id: "event-1", topic: "report.created", payload: { id: "r1" }, nextAttemptAt: new Date("2026-01-01T00:00:00Z") });
    const published: string[] = [];
    const processor = new OutboxProcessor(repo, { async publish(topic) { published.push(topic); } });
    await processor.flush(new Date("2026-01-01T00:00:00.001Z"));
    expect(await processor.flush(new Date("2026-01-01T00:00:00Z"))).toBe(1);
    expect(published).toEqual(["report.created"]);
  });
});
