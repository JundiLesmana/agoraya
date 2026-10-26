export type {
  KycApproval,
  KycApprovalDecision,
  KycApprovalSummary,
  KycRosterEntry,
  KycRosterPage,
  KycStatus,
} from "./types";

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

// Repository
export {
  InMemoryKycRepository,
  createDrizzleKycRepository,
} from "./roster/repository";
export type { KycRepository } from "./roster/repository";

// Domain
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

// Services
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

// Module factory
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
