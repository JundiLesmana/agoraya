// Agoraya — modules/rbac policies engine
// Pure, deterministic policy evaluation (the RBAC + ABAC hybrid).
//
// Rules:
// - Deny by default: a request that matches no policy is denied.
// - Deny overrides: a matching `deny` policy beats any matching `allow`.
// - Tenant isolation: a resource whose tenant differs from the subject tenant
//   is denied before any policy is considered.
// - Fail closed: a condition whose attribute (or attribute reference) cannot be
//   resolved never matches.
//
// The engine has no I/O, no clock, and no shared mutable state.

import type {
  EffectiveSubject,
  MatchedPolicy,
  PolicyCondition,
  PolicyEvaluationResult,
  ResourceContext,
  StoredPolicy,
} from "../types";

/** Prefix that marks a condition value as an attribute reference. */
export const ATTRIBUTE_REFERENCE_PREFIX = "$";

/** Input for a single policy evaluation. */
export interface PolicyEvaluationInput {
  readonly policies: readonly StoredPolicy[];
  readonly subject: EffectiveSubject;
  readonly resource: ResourceContext;
  readonly action: string;
}

/**
 * Match a value against a pattern.
 *
 * `*` matches everything, `prefix:*` matches any value starting with
 * `prefix:`, everything else must match exactly.
 */
export function matchesPattern(pattern: string, value: string): boolean {
  if (pattern === "*") return true;
  if (pattern.endsWith(":*")) return value.startsWith(pattern.slice(0, -1));
  return pattern === value;
}

function lookupAttribute(
  attributes: Readonly<Record<string, string>> | undefined,
  path: readonly string[],
): string | undefined {
  if (!attributes || path.length === 0) return undefined;
  const value = attributes[path.join(".")];
  return typeof value === "string" ? value : undefined;
}

/**
 * Resolve a dotted attribute path against the request.
 *
 * Supported paths: `subject.id`, `subject.userId`, `subject.tenantId`,
 * `subject.roles`, `subject.permissions`, `subject.attributes.<name>`,
 * `resource.id`, `resource.type`, `resource.tenantId`, `resource.ownerId`,
 * `resource.status`, `resource.attributes.<name>`, `action`.
 */
export function resolveAttribute(
  subject: EffectiveSubject,
  resource: ResourceContext,
  action: string,
  path: string,
): string | undefined {
  const segments = path.split(".");
  const scope = segments[0];
  const rest = segments.slice(1);

  if (scope === "action") {
    return rest.length === 0 ? action : undefined;
  }

  if (rest.length === 0) return undefined;

  if (scope === "subject") {
    if (rest[0] === "attributes")
      return lookupAttribute(subject.attributes, rest.slice(1));
    switch (rest[0]) {
      case "id":
      case "userId":
        return subject.userId;
      case "tenantId":
        return subject.tenantId;
      case "roles":
        return subject.roles.join(",");
      case "permissions":
        return subject.permissions.join(",");
      default:
        return undefined;
    }
  }

  if (scope === "resource") {
    if (rest[0] === "attributes")
      return lookupAttribute(resource.attributes, rest.slice(1));
    switch (rest[0]) {
      case "id":
        return resource.id;
      case "type":
        return resource.type;
      case "tenantId":
        return resource.tenantId;
      case "ownerId":
        return resource.ownerId;
      case "status":
        return resource.status;
      default:
        return undefined;
    }
  }

  return undefined;
}

/** Resolve a condition value: literal, or attribute reference when prefixed with `$`. */
function resolveValue(
  value: string,
  subject: EffectiveSubject,
  resource: ResourceContext,
  action: string,
): string | undefined {
  if (!value.startsWith(ATTRIBUTE_REFERENCE_PREFIX)) return value;
  const path = value.slice(ATTRIBUTE_REFERENCE_PREFIX.length);
  return resolveAttribute(subject, resource, action, path);
}

function evaluateScalarCondition(
  condition: PolicyCondition,
  subject: EffectiveSubject,
  resource: ResourceContext,
  action: string,
): boolean {
  if (typeof condition.value !== "string") return false;
  const actual = resolveAttribute(
    subject,
    resource,
    action,
    condition.attribute,
  );
  if (actual === undefined) return false;
  const expected = resolveValue(condition.value, subject, resource, action);
  if (expected === undefined) return false;
  return condition.operator === "eq"
    ? actual === expected
    : actual !== expected;
}

function evaluateSetCondition(
  condition: PolicyCondition,
  subject: EffectiveSubject,
  resource: ResourceContext,
  action: string,
): boolean {
  if (!Array.isArray(condition.value)) return false;
  const actual = resolveAttribute(
    subject,
    resource,
    action,
    condition.attribute,
  );
  if (actual === undefined) return false;

  const expected: string[] = [];
  for (const candidate of condition.value) {
    const resolved = resolveValue(candidate, subject, resource, action);
    // Fail closed: an unresolvable member makes the whole condition fail.
    if (resolved === undefined) return false;
    expected.push(resolved);
  }

  const contained = expected.includes(actual);
  return condition.operator === "in" ? contained : !contained;
}

/** Evaluate one attribute condition. */
export function evaluateCondition(
  condition: PolicyCondition,
  subject: EffectiveSubject,
  resource: ResourceContext,
  action: string,
): boolean {
  if (condition.operator === "eq" || condition.operator === "neq") {
    return evaluateScalarCondition(condition, subject, resource, action);
  }
  return evaluateSetCondition(condition, subject, resource, action);
}

/** A policy applies to the subject when every configured subject constraint holds. */
export function policyMatchesSubject(
  policy: StoredPolicy,
  subject: EffectiveSubject,
  resource: ResourceContext,
  action: string,
): boolean {
  if (
    policy.roles.length > 0 &&
    !policy.roles.some((role) => subject.roles.includes(role))
  ) {
    return false;
  }
  if (
    policy.permissions.length > 0 &&
    !policy.permissions.some((permission) =>
      subject.permissions.includes(permission),
    )
  ) {
    return false;
  }
  return policy.conditions.every((condition) =>
    evaluateCondition(condition, subject, resource, action),
  );
}

function comparePolicies(left: StoredPolicy, right: StoredPolicy): number {
  if (left.priority !== right.priority) return left.priority - right.priority;
  return left.key.localeCompare(right.key);
}

function toMatchedPolicy(policy: StoredPolicy): MatchedPolicy {
  return {
    id: policy.id,
    key: policy.key,
    version: policy.version,
    effect: policy.effect,
    priority: policy.priority,
  };
}

/**
 * Evaluate an access request against a policy set.
 *
 * The returned result is the policy outcome only; cache and timing metadata is
 * added by the PDP.
 */
export function evaluatePolicies(
  input: PolicyEvaluationInput,
): PolicyEvaluationResult {
  const { subject, resource, action, policies } = input;

  // Tenant isolation: a resource owned by another tenant is never accessible.
  if (
    resource.tenantId !== undefined &&
    resource.tenantId !== subject.tenantId
  ) {
    return { allowed: false, reason: "tenant_mismatch", matchedPolicy: null };
  }

  const candidates = policies
    .filter((policy) => policy.status === "active")
    .filter(
      (policy) =>
        policy.tenantId === null || policy.tenantId === subject.tenantId,
    )
    .filter((policy) =>
      policy.resources.some((pattern) =>
        matchesPattern(pattern, resource.type),
      ),
    )
    .filter((policy) =>
      policy.actions.some((pattern) => matchesPattern(pattern, action)),
    )
    .sort(comparePolicies);

  let matchedAllow: StoredPolicy | null = null;

  for (const policy of candidates) {
    if (!policyMatchesSubject(policy, subject, resource, action)) continue;
    if (policy.effect === "deny") {
      // Deny overrides every allow.
      return {
        allowed: false,
        reason: "deny_by_policy",
        matchedPolicy: toMatchedPolicy(policy),
      };
    }
    if (matchedAllow === null) matchedAllow = policy;
  }

  if (matchedAllow !== null) {
    return {
      allowed: true,
      reason: "allow_by_policy",
      matchedPolicy: toMatchedPolicy(matchedAllow),
    };
  }

  return { allowed: false, reason: "no_matching_policy", matchedPolicy: null };
}
