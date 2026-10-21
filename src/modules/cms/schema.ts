import { z } from "zod";

// IDs are UUIDs in persistence; accepting the repository's existing opaque ID
// convention here keeps commands compatible with the other feature modules.
const id = z.string().min(1).max(64);
const body = z.record(z.string(), z.unknown());
const reason = z.string().trim().min(1).max(500);

export const createContentCommandSchema = z.strictObject({
  tenantId: id,
  actorId: id,
  slug: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().trim().min(1).max(255),
  body,
});
export const updateContentCommandSchema = z
  .strictObject({
    tenantId: id,
    contentId: id,
    actorId: id,
    title: z.string().trim().min(1).max(255).optional(),
    body: body.optional(),
    reason,
  })
  .refine((value) => value.title !== undefined || value.body !== undefined, {
    message: "An update requires title or body",
  });
export const contentActionCommandSchema = z.strictObject({
  tenantId: id,
  contentId: id,
  actorId: id,
  reason: reason.optional(),
});
export const reviewContentCommandSchema = z.strictObject({
  tenantId: id,
  contentId: id,
  reviewerId: id,
  score: z.number().int().min(0).max(10),
  decision: z.enum(["approved", "rejected"]),
  rationale: reason,
});
export const rollbackContentCommandSchema = z.strictObject({
  tenantId: id,
  contentId: id,
  actorId: id,
  version: z.number().int().min(1),
  reason,
});
export const listContentCommandSchema = z.strictObject({
  tenantId: id,
  actorId: id,
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
  status: z.enum(["draft", "in_review", "published", "archived"]).optional(),
});

export type CreateContentCommand = z.output<typeof createContentCommandSchema>;
export type UpdateContentCommand = z.output<typeof updateContentCommandSchema>;
export type ContentActionCommand = z.output<typeof contentActionCommandSchema>;
export type ReviewContentCommand = z.output<typeof reviewContentCommandSchema>;
export type RollbackContentCommand = z.output<
  typeof rollbackContentCommandSchema
>;
export type ListContentCommand = z.output<typeof listContentCommandSchema>;
