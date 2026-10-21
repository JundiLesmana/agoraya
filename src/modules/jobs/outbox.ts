import type { OutboxRepository } from "./repository";

export interface OutboxPublisher { publish(topic: string, payload: Record<string, unknown>): Promise<void>; }

export class OutboxProcessor {
  constructor(private readonly repository: OutboxRepository, private readonly publisher: OutboxPublisher) {}
  async flush(now = new Date(), limit = 20): Promise<number> {
    const events = await this.repository.claimBatch(now, limit);
    let delivered = 0;
    for (const event of events) {
      try { await this.publisher.publish(event.topic, event.payload); await this.repository.markPublished(event.id, now); delivered += 1; }
      catch (error) { await this.repository.markFailed(event.id, error instanceof Error ? error.message : String(error), now); }
    }
    return delivered;
  }
}
