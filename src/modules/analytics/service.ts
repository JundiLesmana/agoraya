import { ForbiddenError, ValidationError } from "@/lib/errors";
import { InMemoryAggregateCache } from "./cache";
import type { AnalyticsRepository, TicketAggregate } from "./repository";
import { ticketAggregateQuerySchema } from "./schema";
import { suppressSmallCells } from "./suppression";

export interface AnalyticsAuthorizer {
  authorize(input: {
    actorId: string;
    tenantId: string;
    action: "read";
  }): Promise<boolean>;
}

export interface AnalyticsServiceOptions {
  readonly repository: AnalyticsRepository;
  readonly authorizer: AnalyticsAuthorizer;
}

const defaultAggregateCache = new InMemoryAggregateCache<
  readonly TicketAggregate[]
>();

export function invalidateAggregateCache(): void {
  defaultAggregateCache.invalidateAll();
}

export class AnalyticsService {
  readonly #repository: AnalyticsRepository;
  readonly #authorizer: AnalyticsAuthorizer;

  constructor(options: AnalyticsServiceOptions) {
    this.#repository = options.repository;
    this.#authorizer = options.authorizer;
  }

  async getTicketAggregates(
    command: unknown,
  ): Promise<readonly TicketAggregate[]> {
    const parsed = ticketAggregateQuerySchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid analytics query");
    }
    const { actorId, tenantId } = parsed.data;
    if (
      !(await this.#authorizer.authorize({ actorId, tenantId, action: "read" }))
    ) {
      throw new ForbiddenError("Analytics access is not permitted");
    }

    const cached = defaultAggregateCache.get(tenantId);
    if (cached) return cached;

    const aggregateRows = await this.#repository.listTicketAggregates(tenantId);
    const safeRows = Object.freeze(
      suppressSmallCells(aggregateRows, (row) => row.count).map((row) =>
        Object.freeze({ ...row }),
      ),
    );
    defaultAggregateCache.set(tenantId, safeRows);
    return safeRows;
  }
}
