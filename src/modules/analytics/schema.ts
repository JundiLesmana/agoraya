import { z } from "zod";

const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

export const ticketAggregateQuerySchema = z.object({
  actorId: uuid,
  tenantId: uuid,
});

export type TicketAggregateQuery = z.infer<typeof ticketAggregateQuerySchema>;
