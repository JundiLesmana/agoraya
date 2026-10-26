export type {
  AccessDecision,
  AccessRequest,
  ConditionOperator,
  DecisionReason,
  EffectiveAccess,
  EffectiveSubject,
  MatchedPolicy,
  PermissionGrant,
  PermissionRef,
  PolicyCondition,
  PolicyDefinition,
  PolicyEffect,
  PolicyEvaluationResult,
  PolicyStatus,
  PolicyVersionSnapshot,
  ResourceContext,
  RoleGrant,
  RoleRef,
  StoredPolicy,
  SubjectIdentifier,
} from "./types";

export {
  accessRequestSchema,
  assignPermissionCommandSchema,
  assignRoleCommandSchema,
  policyConditionSchema,
  policyDefinitionSchema,
  revokePermissionCommandSchema,
  revokeRoleCommandSchema,
  savePolicyCommandSchema,
} from "./schema";
export type {
  AccessRequestInput,
  AssignPermissionCommand,
  AssignRoleCommand,
  PolicyDefinitionInput,
  PolicyDefinitionOutput,
  RevokePermissionCommand,
  RevokeRoleCommand,
  SavePolicyCommand,
} from "./schema";

export { InMemoryAuditSink, createAuditEventSink, uuidOrNull } from "./audit";
export type { AuditEvent, AuditSink } from "./audit";

export {
  BUILT_IN_POLICIES,
  builtinPolicyDefinitions,
} from "./policies/definitions";
export {
  InMemoryPolicyRepository,
  PolicyService,
  createDrizzlePolicyRepository,
  evaluateCondition,
  evaluatePolicies,
  matchesPattern,
  policyMatchesSubject,
  resolveAttribute,
  toPolicyDefinition,
} from "./policies";
export type {
  PolicyProvider,
  PolicyRepository,
  PolicyServiceOptions,
} from "./policies";

export {
  GrantService,
  InMemoryGrantRepository,
  createDrizzleGrantRepository,
} from "./grants";
export type {
  EffectiveAccessProvider,
  GrantChangeEvent,
  GrantRepository,
  GrantServiceOptions,
} from "./grants";

export {
  InMemoryDecisionCache,
  PolicyDecisionPoint,
  buildAccessRequest,
  subjectFromSession,
} from "./pdp";
export type {
  DecisionCache,
  PolicyDecisionPointOptions,
  SessionValidationResult,
  SessionValidator,
} from "./pdp";

import type { AuditSink } from "./audit";
import { GrantService } from "./grants/service";
import type { GrantRepository } from "./grants/repository";
import { PolicyService } from "./policies/service";
import type { PolicyRepository } from "./policies/repository";
import { PolicyDecisionPoint } from "./pdp/service";
import type { DecisionCache } from "./pdp/cache";

export interface RbacModuleOptions {
  readonly policyRepository: PolicyRepository;
  readonly grantRepository: GrantRepository;
  readonly cache?: DecisionCache;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
  readonly cacheTtlMs?: number;
}

/** The wired RBAC module. */
export interface RbacModule {
  readonly policyService: PolicyService;
  readonly grantService: GrantService;
  readonly pdp: PolicyDecisionPoint;
}

export function createRbacModule(options: RbacModuleOptions): RbacModule {
  const policyService = new PolicyService({
    repository: options.policyRepository,
    audit: options.audit,
    clock: options.clock,
    cacheTtlMs: options.cacheTtlMs,
  });

  const grantService = new GrantService({
    repository: options.grantRepository,
    audit: options.audit,
    clock: options.clock,
  });

  const pdp = new PolicyDecisionPoint({
    policyProvider: policyService,
    effectiveAccess: grantService,
    cache: options.cache,
    audit: options.audit,
    clock: options.clock,
    cacheTtlMs: options.cacheTtlMs,
  });

  policyService.onChange(() => pdp.invalidatePolicies());
  grantService.onChange((event) => {
    if (event.kind === "user") {
      pdp.invalidateUser(event.userId);
      return;
    }
    pdp.invalidateUsers(event.userIds);
  });

  return { policyService, grantService, pdp };
}
