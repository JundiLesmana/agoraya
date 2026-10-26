export type PolicyEffect = "allow" | "deny";

export type PolicyStatus = "draft" | "active" | "archived";

export type ConditionOperator = "eq" | "neq" | "in" | "not_in";

export interface PolicyCondition {
  readonly attribute: string;
  readonly operator: ConditionOperator;
  readonly value: string | readonly string[];
}

export interface PolicyDefinition {
  readonly key: string;
  readonly name: string;
  readonly description?: string;
  readonly effect: PolicyEffect;
  readonly priority: number;
  readonly status: PolicyStatus;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
  readonly resources: readonly string[];
  readonly actions: readonly string[];
  readonly conditions: readonly PolicyCondition[];
  readonly tenantId: string | null;
}

export interface StoredPolicy extends PolicyDefinition {
  readonly id: string;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PolicyVersionSnapshot {
  readonly policyId: string;
  readonly key: string;
  readonly version: number;
  readonly definition: PolicyDefinition;
  readonly changedBy: string | null;
  readonly reason: string | null;
  readonly changedAt: Date;
}

export interface SubjectIdentifier {
  readonly userId: string;
  readonly tenantId: string;
  readonly attributes?: Readonly<Record<string, string>>;
}

export interface EffectiveSubject extends SubjectIdentifier {
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

export interface ResourceContext {
  readonly type: string;
  readonly id?: string;
  readonly tenantId?: string;
  readonly ownerId?: string;
  readonly status?: string;
  readonly attributes?: Readonly<Record<string, string>>;
}

export interface AccessRequest {
  readonly subject: SubjectIdentifier;
  readonly resource: ResourceContext;
  readonly action: string;
  readonly requestId?: string;
}

export type DecisionReason =
  | "allow_by_policy"
  | "deny_by_policy"
  | "no_matching_policy"
  | "tenant_mismatch"
  | "invalid_request"
  | "context_unavailable"
  | "audit_unavailable";

export interface MatchedPolicy {
  readonly id: string;
  readonly key: string;
  readonly version: number;
  readonly effect: PolicyEffect;
  readonly priority: number;
}

export interface PolicyEvaluationResult {
  readonly allowed: boolean;
  readonly reason: DecisionReason;
  readonly matchedPolicy: MatchedPolicy | null;
}

export interface AccessDecision extends PolicyEvaluationResult {
  readonly evaluatedAt: string;
  readonly cached: boolean;
  readonly durationMs: number;
}

export interface EffectiveAccess {
  readonly userId: string;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

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

export interface PermissionGrant {
  readonly roleId: string;
  readonly roleKey: string;
  readonly permissionId: string;
  readonly permissionKey: string;
  readonly grantedAt: Date;
  readonly grantedBy: string | null;
  readonly revokedAt: Date | null;
}

export interface RoleRef {
  readonly id: string;
  readonly key: string;
  readonly tenantId: string;
}

export interface PermissionRef {
  readonly id: string;
  readonly key: string;
}
