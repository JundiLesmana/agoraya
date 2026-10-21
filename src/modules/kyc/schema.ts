// Agoraya — modules/kyc schema
// Canonical Zod contracts for the KYC module. All mutation inputs are parsed
// server-side before reaching business logic.

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

const uuidSchema = z.string().min(1).max(64);
const nikSchema = z
  .string()
  .min(16)
  .max(16)
  .regex(/^\d{16}$/, "NIK must be exactly 16 digits");
const nameSchema = z.string().min(1).max(255);
const reasonSchema = z.string().max(500).optional();

// ---------------------------------------------------------------------------
// Roster commands
// ---------------------------------------------------------------------------

/**
 * Command to add a citizen to the KYC roster.
 *
 * `nik` is the SIMULATED NIK. The service hashes it before storage; the raw
 * value is never persisted or logged.
 */
export const addToRosterCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  userId: uuidSchema,
  /** SIMULATED NIK — never a real government identity number. */
  nik: nikSchema,
  name: nameSchema,
  submittedBy: uuidSchema,
});

/** Command to query roster entries, with pagination. */
export const listRosterCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  status: z
    .enum(["pending", "partially_approved", "verified", "rejected", "expired"])
    .optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

/** Command to look up a single roster entry. */
export const getRosterEntryCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  rosterId: uuidSchema,
});

// ---------------------------------------------------------------------------
// Dual-approval commands
// ---------------------------------------------------------------------------

/**
 * Command for an approver to submit their decision.
 *
 * The service enforces that the same person cannot fill both approval slots.
 */
export const submitApprovalCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  rosterId: uuidSchema,
  approverId: uuidSchema,
  decision: z.enum(["approved", "rejected"]),
  reason: reasonSchema,
});

// ---------------------------------------------------------------------------
// Lifecycle commands
// ---------------------------------------------------------------------------

/** Command to mark a verified KYC entry as expired. */
export const expireKycCommandSchema = z.strictObject({
  tenantId: uuidSchema,
  rosterId: uuidSchema,
  /** Actor triggering the expiry (system job or admin). */
  triggeredBy: z.string().min(1).max(64),
});

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type AddToRosterCommand = z.output<typeof addToRosterCommandSchema>;
export type ListRosterCommand = z.output<typeof listRosterCommandSchema>;
export type GetRosterEntryCommand = z.output<typeof getRosterEntryCommandSchema>;
export type SubmitApprovalCommand = z.output<typeof submitApprovalCommandSchema>;
export type ExpireKycCommand = z.output<typeof expireKycCommandSchema>;
