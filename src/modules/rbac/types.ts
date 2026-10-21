// Agoraya — modules/rbac types
// Shared domain types for the RBAC module: policy definitions, access
// requests, and authorization decisions.
//
// This file is intentionally free of I/O, framework, and persistence imports so
// the domain contracts can be reused by the policy engine, the grants service,
// and the policy decision point (PDP) without pulling in a database client.

/** Effect a policy has when it matches a request. */
export type PolicyEffect = "allow" | "deny";

/** Lifecycle state of a policy definition. Only `active` policies are evaluated. */
export type PolicyStatus = "draft" | "active" | "archived";

/**
 * Comparison operators available to attribute conditions.
 *
 * `eq` / `neq` compare against a single value; `in` / `not_in` compare against
 * a set of values. A condition whose attribute cannot be resolved never
 * matches (fail closed).
 */
export type ConditionOperator = "eq" | "neq" | "in" | "not_in";

/**
 * A single attribute condition (the ABAC half of the hybrid).
 *
 * `value` holds a literal, or an attribute reference when it starts with `$`
 * (for example `$subject.tenantId`). References are resolved against the
 * request at evaluation time; an unresolvable reference never matches.
 */
export interface PolicyCondition {
  readonly attribute: string;
  readonly operator: ConditionOperator;
  readonly value: string | readonly string[];
}

/**
 * A policy as authored. Policies are keyed by a stable string key so that
 * code-defined policies and database-stored policies share one contract.
 */
export interface PolicyDefinition {
  /** Stable unique key, for example `tickets.read`. */
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly effect: PolicyEffect;
  /** Lower priority is evaluated first. */
  readonly priority: number;
  readonly status: PolicyStatus;
  /** Role keys the subject must hold (empty = no role constraint). */
  readonly roles: readonly string[];
  /** Permission keys the subject must hold (empty = no permission constraint). */
  readonly permissions: readonly string[];
  /** Resource type patterns, for example `tickets` or `audit:*`. */
  readonly resources: readonly string[];
  /** Action patterns, for example `read`, `create`, or `*`. */
  readonly actions: readonly string[];
  /** Attribute conditions that must all hold for the policy to apply. */
  readonly conditions: readonly PolicyCondition[];
  /** Owning tenant, or `null` for policies that apply to every tenant. */
  readonly tenantId: string | null;
}

/** A policy definition as persisted, with identity and version metadata. */
export interface StoredPolicy extends PolicyDefinition {
  readonly id: string;
  /** Incremented on every update; starts at 1. */
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** An immutable snapshot of a policy version, kept for review/audit. */
export interface PolicyVersionSnapshot {
  readonly policyId: string;
  readonly key: string;
  readonly version: number;
  readonly definition: PolicyDefinition;
  readonly changedBy: string | null;
  readonly reason: string | null;
  readonly changedAt: Date;
}

/** The subject of an access request, before roles are resolved. */
export interface SubjectIdentifier {
  readonly userId: string;
  readonly tenantId: string;
  readonly attributes?: Readonly<Record<string, string>>;
}

/** The subject of an access request after grants have been resolved. */
export interface EffectiveSubject extends SubjectIdentifier {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

/** The resource an access request targets. */
export interface ResourceContext {
  /** Resource type, for example `tickets`. */
  readonly type: string;
  readonly id?: string;
  /** Owning tenant. Required by tenant-scoped policies. */
  readonly tenantId?: string;
  /** Owner of the record, used by ownership conditions. */
  readonly ownerId?: string;
  readonly status?: string;
  readonly attributes?: Readonly<Record<string, string>>;
}

/** An authorization request evaluated by the PDP. */
export interface AccessRequest {
  readonly subject: SubjectIdentifier;
  readonly resource: ResourceContext;
  readonly action: string;
  readonly requestId?: string;
}

/** Machine-readable explanation for a decision. */
export type DecisionReason =
  | "allow_by_policy"
  | "deny_by_policy"
  | "no_matching_policy"
  | "tenant_mismatch"
  | "invalid_request"
  | "context_unavailable"
  | "audit_unavailable";

/** The policy that produced a decision. */
export interface MatchedPolicy {
  readonly id: string;
  readonly key: string;
  readonly version: number;
  readonly effect: PolicyEffect;
  readonly priority: number;
}

/** The outcome of evaluating a request against the policy set. */
export interface PolicyEvaluationResult {
  readonly allowed: boolean;
  readonly reason: DecisionReason;
  readonly matchedPolicy: MatchedPolicy | null;
}

/** The outcome returned by the PDP, including cache and timing metadata. */
export interface AccessDecision extends PolicyEvaluationResult {
  /** ISO timestamp of the policy evaluation that produced this decision. */
  readonly evaluatedAt: string;
  /** True when the decision was served from the decision cache. */
  readonly cached: boolean;
  /** Time spent producing the decision, in milliseconds. */
  readonly durationMs: number;
}

/** Roles and permissions currently held by a user. */
export interface EffectiveAccess {
  readonly userId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

/** A role assignment grant (user -> role). */
export interface RoleGrant {
  readonly userId: string;
  readonly roleId: string;
  readonly roleKey: string;
  readonly tenantId: string;
  readonly grantedAt: Date;
  readonly grantedBy: string | null;
  readonly expiresAt: Date | null;
  readonly revokedAt: Date | null;
}

/** A permission grant (role -> permission). */
export interface PermissionGrant {
  readonly roleId: string;
  readonly roleKey: string;
  readonly permissionId: string;
  readonly permissionKey: string;
  readonly grantedAt: Date;
  readonly grantedBy: string | null;
  readonly revokedAt: Date | null;
}

/** A role reference resolved from the roles table. */
export interface RoleRef {
  readonly id: string;
  readonly key: string;
  readonly tenantId: string;
}

/** A permission reference resolved from the permissions table. */
export interface PermissionRef {
  readonly id: string;
  readonly key: string;
}
