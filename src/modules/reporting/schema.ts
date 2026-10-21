import { z } from "zod";

// IDs are UUID-shaped opaque identifiers. Existing simulated fixtures predate
// RFC UUID version bits, so do not reject them solely for that representation.
const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
export const submitReportSchema = z.object({
  tenantId: uuid,
  reporterId: uuid,
  category: z.string().trim().min(1).max(100),
  title: z.string().trim().min(5).max(255),
  description: z.string().trim().min(10).max(10_000),
  location: z.record(z.string(), z.unknown()).nullable().optional(),
});
export const transitionReportSchema = z.object({
  tenantId: uuid,
  reportId: uuid,
  actorId: uuid,
  to: z.enum(["verified", "in_progress", "resolved", "closed"]),
  assigneeId: uuid.nullable().optional(),
});
export const attachQcEvidenceSchema = z.object({
  tenantId: uuid,
  reportId: uuid,
  actorId: uuid,
  storageKey: z.string().min(1).max(512),
  mediaType: z.string().min(1).max(100),
  note: z.string().trim().max(2_000).nullable().optional(),
});
export const castVoteSchema = z.object({
  tenantId: uuid,
  reportId: uuid,
  voterId: uuid,
  value: z.union([z.literal(-1), z.literal(1)]),
});
export type SubmitReportCommand = z.infer<typeof submitReportSchema>;
export type TransitionReportCommand = z.infer<typeof transitionReportSchema>;
export type AttachQcEvidenceCommand = z.infer<typeof attachQcEvidenceSchema>;
export type CastVoteCommand = z.infer<typeof castVoteSchema>;
