import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/lib/errors";
import type {
  AnalyticsRepository,
  TicketAggregate,
} from "@/modules/analytics/repository";
import {
  AnalyticsService,
  invalidateAggregateCache,
} from "@/modules/analytics/service";

const tenantId = "11111111-1111-4111-8111-111111111111";
const actorId = "22222222-2222-4222-8222-222222222222";

function row(category: string, count: number): TicketAggregate {
  return {
    category,
    status: "submitted",
    count,
    resolvedCount: 0,
    resolutionSecondsSum: 0,
    averageResolutionSeconds: null,
  };
}

describe("analytics service", () => {
  beforeEach(() => {
    invalidateAggregateCache();
  });

  it("authorizes tenant reads and suppresses groups below five", async () => {
    const listTicketAggregates = vi
      .fn<AnalyticsRepository["listTicketAggregates"]>()
      .mockResolvedValue([row("common", 5), row("rare", 4)]);
    const service = new AnalyticsService({
      repository: { listTicketAggregates },
      authorizer: { authorize: vi.fn().mockResolvedValue(true) },
    });

    const query = { actorId, tenantId };
    await expect(service.getTicketAggregates(query)).resolves.toEqual([
      row("common", 5),
    ]);
    await expect(service.getTicketAggregates(query)).resolves.toEqual([
      row("common", 5),
    ]);
    expect(listTicketAggregates).toHaveBeenCalledWith(tenantId);
    expect(listTicketAggregates).toHaveBeenCalledTimes(1);
  });

  it("checks authorization before serving a cached response", async () => {
    const listTicketAggregates = vi
      .fn<AnalyticsRepository["listTicketAggregates"]>()
      .mockResolvedValue([row("common", 5)]);
    const authorize = vi
      .fn()
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);
    const service = new AnalyticsService({
      repository: { listTicketAggregates },
      authorizer: { authorize },
    });
    const query = { actorId, tenantId };

    await service.getTicketAggregates(query);
    await expect(service.getTicketAggregates(query)).rejects.toThrow(
      ForbiddenError,
    );
    expect(authorize).toHaveBeenCalledTimes(2);
    expect(listTicketAggregates).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid tenant or actor identifiers before database access", async () => {
    const listTicketAggregates = vi.fn();
    const service = new AnalyticsService({
      repository: { listTicketAggregates },
      authorizer: { authorize: vi.fn() },
    });

    await expect(
      service.getTicketAggregates({ actorId: "invalid", tenantId }),
    ).rejects.toThrow("Invalid analytics query");
    expect(listTicketAggregates).not.toHaveBeenCalled();
  });
});
