// Agoraya — modules/kyc
// Public entry point for the KYC (Know Your Citizen) module.
//
// The module has three sub-domains:
//   - `roster`: citizen registry management (add, list, get).
//   - `dual-approval`: two-person verification workflow.
//   - `lifecycle`: KYC status transitions (pending → verified → expired, etc.).
//
// Identity data is SIMULATED — no real Dukcapil/SIASN access.
//
// Typical wiring:
//
//   const kycModule = createKycModule({
//     repository: createDrizzleKycRepository(db),
//     audit: createAuditEventSink(db),
//   });
//   const entry = await kycModule.roster.addToRoster({ ... });
//   const outcome = await kycModule.dualApproval.submitApproval({ ... });
//   await kycModule.lifecycle.expireKyc({ ... });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type {
  KycApproval,
  KycApprovalDecision,
  KycApprovalSummary,
  KycRosterEntry,
  KycRosterPage,
  KycStatus,
} from "./types";

// ---------------------------------------------------------------------------
// Schemas and command types
// ---------------------------------------------------------------------------

export {
  addToRosterCommandSchema,
  expireKycCommandSchema,
  getRosterEntryCommandSchema,
  listRosterCommandSchema,
  submitApprovalCommandSchema,
} from "./schema";
export type {
  AddToRosterCommand,
  ExpireKycCommand,
  GetRosterEntryCommand,
  ListRosterCommand,
  SubmitApprovalCommand,
} from "./schema";

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export {
  InMemoryKycRepository,
  createDrizzleKycRepository,
} from "./roster/repository";
export type { KycRepository } from "./roster/repository";

// ---------------------------------------------------------------------------
// Domain
// ---------------------------------------------------------------------------

export {
  InvalidKycTransitionError,
  assertTransitionAllowed,
  deriveStatusFromApprovals,
  isAllowedTransition,
  isExpired,
} from "./lifecycle/domain";

export {
  ApprovalNotAllowedError,
  ApprovalSlotConflictError,
  SelfApprovalError,
  canReceiveApproval,
  nextApprovalSlot,
  summariseApprovals,
  validateAndGetSlot,
} from "./dual-approval/domain";

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export { RosterService } from "./roster/service";
export type { RosterServiceOptions } from "./roster/service";

export {
  DualApprovalService,
  DEFAULT_VERIFIED_TTL_MS,
} from "./dual-approval/service";
export type {
  ApprovalOutcome,
  DualApprovalServiceOptions,
} from "./dual-approval/service";

export { LifecycleService } from "./lifecycle/service";
export type { LifecycleServiceOptions } from "./lifecycle/service";

// ---------------------------------------------------------------------------
// Module factory
// ---------------------------------------------------------------------------

import type { AuditSink } from "@/modules/rbac/audit";
import type { KycRepository } from "./roster/repository";
import { RosterService } from "./roster/service";
import { DualApprovalService } from "./dual-approval/service";
import { LifecycleService } from "./lifecycle/service";

export interface KycModuleOptions {
  readonly repository: KycRepository;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
}

export interface KycModule {
  readonly roster: RosterService;
  readonly dualApproval: DualApprovalService;
  readonly lifecycle: LifecycleService;
}

/**
 * Wire the KYC module.
 *
 * All three services share the same repository, audit sink, and clock so
 * that approval decisions and status updates are consistent.
 */
export function createKycModule(options: KycModuleOptions): KycModule {
  const shared = {
    repository: options.repository,
    audit: options.audit,
    clock: options.clock,
  };

  return {
    roster: new RosterService(shared),
    dualApproval: new DualApprovalService(shared),
    lifecycle: new LifecycleService(shared),
  };
}
