import { describe, expect, it } from "vitest";
import { JobHandlerRegistry, JobQueue, InMemoryJobRepository } from "@/modules/jobs";

describe("JobQueue", () => {
  it("executes a handler and completes the job", async () => {
    const repo = new InMemoryJobRepository();
    const handlers = new JobHandlerRegistry();
    handlers.register({ type: "email.send", async handle(payload) { expect(payload.recipient).toBe("user@example.com"); } });
    const queue = new JobQueue(repo, handlers, { defaultMaxAttempts: 3, defaultTimeoutMs: 1000, retryDelayMs: 10 });
    await queue.enqueue("email.send", { recipient: "user@example.com" }, new Date("2026-01-01T00:00:00Z"));
    expect(await queue.processNext(new Date("2026-01-01T00:00:00Z"))).toBe("completed");
    expect((await queue.metrics()).completed).toBe(1);
  });
  it("retries and moves to dead letter after max attempts", async () => {
    const repo = new InMemoryJobRepository();
    const handlers = new JobHandlerRegistry();
    handlers.register({ type: "failing", async handle() { throw new Error("transient"); } });
    const queue = new JobQueue(repo, handlers, { defaultMaxAttempts: 2, defaultTimeoutMs: 1000, retryDelayMs: 10 });
    await queue.enqueue("failing", {}, new Date("2026-01-01T00:00:00Z"));
    await queue.processNext(new Date("2026-01-01T00:00:00Z"));
    await queue.processNext(new Date("2026-01-01T00:00:00.020Z"));
    expect((await repo.listDeadLetter(10)).length).toBe(1);
  });
});
