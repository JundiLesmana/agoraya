// Agoraya — modules/rbac policies service
// Policy management: load, create, update, version, and archive policies.
//
// Policies are the source of truth for authorization decisions. Every change is
// versioned (the previous definition is kept as an immutable snapshot) and
// recorded in the audit trail. Change listeners are notified so the policy
// decision point can drop cached decisions that were made under the old
// policy version.

import { randomUUID } from "node:crypto";

import { logger } from "@/lib/logger";
import { AppError, ErrorCode, ValidationError } from "@/lib/errors";

import type { AuditSink } from "../audit";
import { uuidOrNull } from "../audit";
import { savePolicyCommandSchema } from "../schema";
import type { SavePolicyCommand } from "../schema";
import type {
  PolicyDefinition,
  PolicyVersionSnapshot,
  StoredPolicy,
} from "../types";
import type { PolicyProvider, PolicyRepository } from "./repository";

const DEFAULT_POLICY_CACHE_TTL_MS = 30_000;

export interface PolicyServiceOptions {
  readonly repository: PolicyRepository;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
  /** How long a loaded policy set is reused before it is re-read. */
  readonly cacheTtlMs?: number;
}

interface CachedPolicySet {
  readonly policies: StoredPolicy[];
  readonly expiresAt: number;
}

function isStringArray(
  value: string | readonly string[],
): value is readonly string[] {
  return Array.isArray(value);
}

/**
 * Loads and mutates policies.
 *
 * The service implements `PolicyProvider`, which is the read interface used by
 * the policy decision point.
 */
export class PolicyService implements PolicyProvider {
  readonly #repository: PolicyRepository;
  readonly #audit: AuditSink | undefined;
  readonly #clock: () => Date;
  readonly #cacheTtlMs: number;
  readonly #cache = new Map<string, CachedPolicySet>();
  readonly #listeners = new Set<() => void>();

  constructor(options: PolicyServiceOptions) {
    this.#repository = options.repository;
    this.#audit = options.audit;
    this.#clock = options.clock ?? (() => new Date());
    this.#cacheTtlMs = options.cacheTtlMs ?? DEFAULT_POLICY_CACHE_TTL_MS;
  }

  /** Register a listener notified after every policy change. Returns an unsubscribe function. */
  onChange(listener: () => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** Active policies for a tenant. Global policies are included. */
  async listActivePolicies(tenantId: string): Promise<StoredPolicy[]> {
    const now = this.#clock().getTime();
    const cached = this.#cache.get(tenantId);
    if (cached && cached.expiresAt > now) {
      return cached.policies;
    }

    const policies = await this.#repository.listActivePolicies(tenantId);
    this.#cache.set(tenantId, { policies, expiresAt: now + this.#cacheTtlMs });
    return policies;
  }

  /** A single policy by key, regardless of status. */
  async getPolicyByKey(key: string): Promise<StoredPolicy | null> {
    return this.#repository.findByKey(key);
  }

  /** Version history of a policy, oldest first. */
  async listVersions(key: string): Promise<PolicyVersionSnapshot[]> {
    const snapshots = await this.#repository.listVersions(key);
    return [...snapshots].sort((left, right) => left.version - right.version);
  }

  /**
   * Create or update a policy.
   *
   * The definition is validated before it is stored. Updating an existing
   * policy increments its version and keeps the previous definition as an
   * immutable snapshot.
   */
  async savePolicy(command: SavePolicyCommand): Promise<StoredPolicy> {
    const parsed = savePolicyCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid policy definition", {
        details: {
          issues: parsed.error.issues.map((issue) => issue.path.join(".")),
        },
      });
    }

    const { definition, changedBy, reason } = parsed.data;
    const existing = await this.#repository.findByKey(definition.key);
    const now = this.#clock();

    const policy: StoredPolicy = {
      ...definition,
      id: existing?.id ?? randomUUID(),
      version: existing ? existing.version + 1 : 1,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    const saved = await this.#repository.save(policy, {
      policyId: policy.id,
      key: policy.key,
      version: policy.version,
      definition: toPolicyDefinition(policy),
      changedBy,
      reason: reason ?? null,
      changedAt: now,
    });

    this.#cache.clear();
    this.#notifyListeners();

    await this.#recordAudit({
      action: existing ? "rbac.policy.updated" : "rbac.policy.created",
      targetTable: "rbac_policies",
      targetId: saved.id,
      metadata: {
        policyKey: saved.key,
        version: saved.version,
        effect: saved.effect,
        status: saved.status,
        reason: reason ?? null,
      },
      actorId: changedBy,
    });

    logger.info("rbac.policy.saved", {
      policyKey: saved.key,
      version: saved.version,
      effect: saved.effect,
    });

    return saved;
  }

  /** Archive a policy so it stops being evaluated. */
  async archivePolicy(
    key: string,
    changedBy: string,
    reason?: string,
  ): Promise<StoredPolicy | null> {
    const existing = await this.#repository.findByKey(key);
    if (!existing) return null;

    return this.savePolicy({
      definition: { ...toPolicyDefinition(existing), status: "archived" },
      changedBy,
      reason: reason ?? "archived",
    });
  }

  #notifyListeners(): void {
    for (const listener of this.#listeners) {
      listener();
    }
  }

  async #recordAudit(event: {
    action: string;
    targetTable: string;
    targetId: string | null;
    metadata: Readonly<Record<string, unknown>>;
    actorId: string | null;
  }): Promise<void> {
    if (!this.#audit) return;
    try {
      await this.#audit.record({
        actorId: event.actorId,
        action: event.action,
        targetTable: event.targetTable,
        targetId: uuidOrNull(event.targetId),
        metadata: event.metadata,
        occurredAt: this.#clock(),
      });
    } catch (error) {
      logger.error("rbac.audit.failed", {
        action: event.action,
        error: error instanceof Error ? error.message : "unknown error",
      });
      throw new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to record policy audit event",
        { isOperational: false, cause: error },
      );
    }
  }
}

/** Strip persistence metadata from a stored policy. */
export function toPolicyDefinition(policy: StoredPolicy): PolicyDefinition {
  return {
    key: policy.key,
    name: policy.name,
    ...(policy.description === undefined
      ? {}
      : { description: policy.description }),
    effect: policy.effect,
    priority: policy.priority,
    status: policy.status,
    roles: [...policy.roles],
    permissions: [...policy.permissions],
    resources: [...policy.resources],
    actions: [...policy.actions],
    conditions: policy.conditions.map((condition) => ({
      attribute: condition.attribute,
      operator: condition.operator,
      value: isStringArray(condition.value)
        ? [...condition.value]
        : condition.value,
    })),
    tenantId: policy.tenantId,
  };
}
