import { z } from "zod";

// Shared primitives
const uuidSchema = z.string().min(1).max(64);
const nikSchema = z
  .string()
  .min(16)
  .max(16)
  .regex(/^\d{16}$/, "NIK must be exactly 16 digits");
const nameSchema = z.string().min(1).max(255);
const reasonSchema = z.string().max(500).optional();

// Roster commands
export const addToRosterCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  userId: uuidSchema,
  nik: nikSchema,
  name: nameSchema,
  submittedBy: uuidSchema,
});

export const listRosterCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  status: z
    .enum(["pending", "partially_approved", "verified", "rejected", "expired"])
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export const getRosterEntryCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  rosterId: uuidSchema,
});

// Dual-approval commands
export const submitApprovalCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  rosterId: uuidSchema,
  approverId: uuidSchema,
  decision: z.enum(["approved", "rejected"]),
  reason: reasonSchema,
});

// Lifecycle commands
export const expireKycCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  rosterId: uuidSchema,
  triggeredBy: z.string().min(1).max(64),
});

// Inferred types
export type AddToRosterCommand = z.output<typeof addToRosterCommandSchema>;
export type ListRosterCommand = z.output<typeof listRosterCommandSchema>;
export type GetRosterEntryCommand = z.output<typeof getRosterEntryCommandSchema>;
export type SubmitApprovalCommand = z.output<typeof submitApprovalCommandSchema>;
export type ExpireKycCommand = z.output<typeof expireKycCommandSchema>;
