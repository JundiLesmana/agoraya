import { createHash } from "node:crypto";

import { logger } from "@/lib/logger";

import type { AuditSink } from "../audit";
import { uuidOrNull } from "../audit";
import { accessRequestSchema } from "../schema";
import type { AccessDecision, AccessRequest, EffectiveSubject } from "../types";
import { evaluatePolicies } from "../policies/engine";
import type { PolicyProvider } from "../policies/repository";
import type { EffectiveAccessProvider } from "../grants/service";
import type { DecisionCache } from "./cache";
import { InMemoryDecisionCache } from "./cache";

const DEFAULT_CACHE_TTL_MS = 30_000;

export interface PolicyDecisionPointOptions {
  readonly policyProvider: PolicyProvider;
  readonly effectiveAccess: EffectiveAccessProvider;
  readonly cache?: DecisionCache;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
  readonly cacheTtlMs?: number;
}

interface SubjectCacheEntry {
  readonly epoch: number;
  readonly tenantId: string;
  readonly subject: EffectiveSubject;
  readonly expiresAt: number;
}

interface AuditContext {
  readonly userId: string | null;
  readonly tenantId: string | null;
  readonly action: string | null;
  readonly resourceType: string | null;
  readonly resourceId: string | null;
  readonly requestId: string | null;
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function stableAttributes(
  attributes: Readonly<Record<string, string>> | undefined,
): string {
  if (!attributes) return "";
  return Object.entries(attributes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

/** Best-effort extraction of audit data from a request that may be invalid. */
function toAuditContext(request: AccessRequest | undefined): AuditContext {
  const subject = request?.subject;
  const resource = request?.resource;
  return {
    userId: subject?.userId ?? null,
    tenantId: subject?.tenantId ?? null,
    action: request?.action ?? null,
    resourceType: resource?.type ?? null,
    resourceId: resource?.id ?? null,
    requestId: request?.requestId ?? null,
  };
}

/**
 * Policy Decision Point.
 */
export class PolicyDecisionPoint {
  readonly #policyProvider: PolicyProvider;
  readonly #effectiveAccess: EffectiveAccessProvider;
  readonly #cache: DecisionCache;
  readonly #audit: AuditSink | undefined;
  readonly #clock: () => Date;
  readonly #cacheTtlMs: number;

  readonly #subjectCache = new Map<string, SubjectCacheEntry>();
  readonly #grantEpochs = new Map<string, number>();
  #policyEpoch = 0;

  constructor(options: PolicyDecisionPointOptions) {
    this.#policyProvider = options.policyProvider;
    this.#effectiveAccess = options.effectiveAccess;
    this.#cache = options.cache ?? new InMemoryDecisionCache();
    this.#audit = options.audit;
    this.#clock = options.clock ?? (() => new Date());
    this.#cacheTtlMs = options.cacheTtlMs ?? DEFAULT_CACHE_TTL_MS;
  }

  /** Evaluate a single access request. */
  async evaluate(request: AccessRequest): Promise<AccessDecision> {
    const started = performance.now();

    const parsed = accessRequestSchema.safeParse(request);
    if (!parsed.success) {
      logger.warn("rbac.request.invalid", {
        issues: parsed.error.issues.map((issue) => issue.path.join(".")),
        requestId: request?.requestId,
      });
      return this.#deny("invalid_request", started, toAuditContext(request));
    }

    const input = parsed.data;
    const userId = input.subject.userId;

    let subject: EffectiveSubject;
    try {
      subject = await this.#resolveSubject(userId, input.subject.tenantId);
    } catch (error) {
      logger.error("rbac.subject.unavailable", {
        userId,
        error: error instanceof Error ? error.message : "unknown error",
      });
      return this.#deny("context_unavailable", started, toAuditContext(input));
    }

    const key = this.#buildKey(subject, input.resource, input.action);
    const cached = this.#cache.get(userId, key);
    if (cached) {
      const decision: AccessDecision = {
        ...cached,
        cached: true,
        durationMs: performance.now() - started,
      };
      return this.#finalize(decision, toAuditContext(input), true);
    }

    let decision: AccessDecision;
    try {
      const policies = await this.#policyProvider.listActivePolicies(
        input.subject.tenantId,
      );
      const result = evaluatePolicies({
        policies,
        subject,
        resource: input.resource,
        action: input.action,
      });
      decision = {
        ...result,
        evaluatedAt: this.#clock().toISOString(),
        cached: false,
        durationMs: performance.now() - started,
      };
    } catch (error) {
      logger.error("rbac.policy.unavailable", {
        userId,
        tenantId: input.subject.tenantId,
        error: error instanceof Error ? error.message : "unknown error",
      });
      return this.#deny("context_unavailable", started, toAuditContext(input));
    }

    this.#cache.set(userId, key, decision, this.#cacheTtlMs);
    return this.#finalize(decision, toAuditContext(input), false);
  }

  async evaluateBatch(
    requests: readonly AccessRequest[],
  ): Promise<AccessDecision[]> {
    const decisions: AccessDecision[] = [];
    for (const request of requests) {
      decisions.push(await this.evaluate(request));
    }
    return decisions;
  }

  invalidateUser(userId: string): void {
    this.#grantEpochs.set(userId, this.#grantEpoch(userId) + 1);
    this.#subjectCache.delete(userId);
    this.#cache.invalidateUser(userId);
  }

  invalidateUsers(userIds: readonly string[]): void {
    for (const userId of userIds) {
      this.invalidateUser(userId);
    }
  }

  invalidatePolicies(): void {
    this.#policyEpoch += 1;
    this.#subjectCache.clear();
    this.#cache.invalidateAll();
  }

  #grantEpoch(userId: string): number {
    return this.#grantEpochs.get(userId) ?? 0;
  }

  async #resolveSubject(
    userId: string,
    tenantId: string,
  ): Promise<EffectiveSubject> {
    const epoch = this.#grantEpoch(userId);
    const cached = this.#subjectCache.get(userId);
    const now = this.#clock().getTime();

    if (
      cached &&
      cached.epoch === epoch &&
      cached.tenantId === tenantId &&
      cached.expiresAt > now
    ) {
      return cached.subject;
    }

    const access = await this.#effectiveAccess.getEffectiveAccess(userId, {
      tenantId,
    });

    const subject: EffectiveSubject = {
      userId,
      tenantId,
      roles: [...access.roles],
      permissions: [...access.permissions],
    };

    this.#subjectCache.set(userId, {
      epoch,
      tenantId,
      subject,
      expiresAt: now + this.#cacheTtlMs,
    });

    return subject;
  }

  #buildKey(
    subject: EffectiveSubject,
    resource: AccessRequest["resource"],
    action: string,
  ): string {
    const subjectFingerprint = digest(
      `${subject.roles.join(",")}|${subject.permissions.join(",")}`,
    );
    const resourceFingerprint = digest(
      [
        resource.type,
        resource.id ?? "",
        resource.tenantId ?? "",
        resource.ownerId ?? "",
        resource.status ?? "",
        stableAttributes(resource.attributes),
      ].join("|"),
    );

    return [
      `p${this.#policyEpoch}`,
      `g${this.#grantEpoch(subject.userId)}`,
      `s${subjectFingerprint.slice(0, 16)}`,
      `r${resourceFingerprint.slice(0, 16)}`,
      `a${digest(action).slice(0, 16)}`,
    ].join(":");
  }

  async #deny(
    reason: "invalid_request" | "context_unavailable",
    started: number,
    context: AuditContext,
  ): Promise<AccessDecision> {
    const decision: AccessDecision = {
      allowed: false,
      reason,
      matchedPolicy: null,
      evaluatedAt: this.#clock().toISOString(),
      cached: false,
      durationMs: performance.now() - started,
    };
    return this.#finalize(decision, context, false);
  }

  /**
   * Record the decision. A failure to write the audit record turns an allowed
   * decision into a denied one: the audit trail is part of the security
   * guarantee, so the module fails closed.
   */
  async #finalize(
    decision: AccessDecision,
    context: AuditContext,
    cached: boolean,
  ): Promise<AccessDecision> {
    try {
      await this.#recordAudit(decision, context, cached);
    } catch (error) {
      logger.error("rbac.audit.failed", {
        userId: context.userId,
        action: context.action,
        error: error instanceof Error ? error.message : "unknown error",
      });

      if (decision.allowed) {
        const denied: AccessDecision = {
          allowed: false,
          reason: "audit_unavailable",
          matchedPolicy: decision.matchedPolicy,
          evaluatedAt: decision.evaluatedAt,
          cached,
          durationMs: decision.durationMs,
        };
        this.#recordSecurityEvent(denied, context);
        return denied;
      }
    }

    if (!decision.allowed) {
      this.#recordSecurityEvent(decision, context);
    }

    return decision;
  }

  async #recordAudit(
    decision: AccessDecision,
    context: AuditContext,
    cached: boolean,
  ): Promise<void> {
    if (!this.#audit) return;

    await this.#audit.record({
      actorId: uuidOrNull(context.userId),
      action: decision.allowed ? "rbac.access.granted" : "rbac.access.denied",
      targetTable: context.resourceType ?? "unknown",
      targetId: uuidOrNull(context.resourceId),
      metadata: {
        userId: context.userId,
        tenantId: context.tenantId,
        action: context.action,
        reason: decision.reason,
        policyKey: decision.matchedPolicy?.key ?? null,
        policyVersion: decision.matchedPolicy?.version ?? null,
        cached,
        requestId: context.requestId,
      },
      occurredAt: this.#clock(),
    });
  }

  #recordSecurityEvent(decision: AccessDecision, context: AuditContext): void {
    logger.warn("rbac.access.denied", {
      userId: context.userId,
      tenantId: context.tenantId,
      action: context.action,
      resourceType: context.resourceType,
      resourceId: context.resourceId,
      reason: decision.reason,
      policyKey: decision.matchedPolicy?.key ?? null,
      requestId: context.requestId,
    });
  }
}
