// Agoraya — modules/rbac policies repository
// Persistence port for policies plus two adapters:
// - `InMemoryPolicyRepository` — code-defined policy set (MVP) and tests.
// - `createDrizzlePolicyRepository` — PostgreSQL persistence through lib/db.
//
// The port keeps the policy service independent from the database client, so
// the module can be unit-tested without a live PostgreSQL instance.

import { randomUUID } from "node:crypto";

import { eq, and, asc, desc, or, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { z } from "zod";

import { rbacPolicies, rbacPolicyVersions } from "../db";
import type * as dbSchema from "@/lib/db/schema";
import { ValidationError } from "@/lib/errors";

import { uuidOrNull } from "../audit";
import { policyConditionSchema } from "../schema";
import type {
  PolicyDefinition,
  PolicyVersionSnapshot,
  StoredPolicy,
} from "../types";

/** Read side used by the policy decision point. */
export interface PolicyProvider {
  /** Active policies that apply to a tenant (global policies included). */
  listActivePolicies(tenantId: string): Promise<StoredPolicy[]>;
}

/** Persistence port for policy definitions and their version history. */
export interface PolicyRepository extends PolicyProvider {
  findByKey(key: string): Promise<StoredPolicy | null>;
  /**
   * Store a policy together with its version snapshot. The two writes belong
   * to the same unit of work: a policy without a version snapshot could not
   * be reviewed.
   */
  save(
    policy: StoredPolicy,
    snapshot: PolicyVersionSnapshot,
  ): Promise<StoredPolicy>;
  listVersions(key: string): Promise<PolicyVersionSnapshot[]>;
}

const conditionsSchema = z.array(policyConditionSchema);

type PolicyConditionList = z.infer<typeof conditionsSchema>;

function parseConditions(
  value: unknown,
  policyKey: string,
): PolicyConditionList {
  const parsed = conditionsSchema.safeParse(value);
  if (!parsed.success) {
    throw new ValidationError(
      `Stored policy "${policyKey}" has invalid conditions`,
      {
        context: { policyKey },
      },
    );
  }
  return parsed.data;
}

function toStoredPolicy(row: typeof rbacPolicies.$inferSelect): StoredPolicy {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    ...(row.description === null ? {} : { description: row.description }),
    effect: row.effect === "deny" ? "deny" : "allow",
    priority: row.priority,
    status:
      row.status === "active" || row.status === "archived"
        ? row.status
        : "draft",
    roles: [...row.roles],
    permissions: [...row.permissions],
    resources: [...row.resources],
    actions: [...row.actions],
    conditions: parseConditions(row.conditions, row.key),
    tenantId: row.tenantId,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPolicyValues(
  policy: StoredPolicy,
): typeof rbacPolicies.$inferInsert {
  return {
    id: policy.id,
    key: policy.key,
    name: policy.name,
    description: policy.description ?? null,
    effect: policy.effect,
    priority: policy.priority,
    status: policy.status,
    version: policy.version,
    tenantId: policy.tenantId,
    roles: [...policy.roles],
    permissions: [...policy.permissions],
    resources: [...policy.resources],
    actions: [...policy.actions],
    conditions: policy.conditions.map((condition) => ({ ...condition })),
    createdAt: policy.createdAt,
    updatedAt: policy.updatedAt,
  };
}

/**
 * In-memory policy repository. Holds the code-defined policy set and any
 * policy saved through the policy service.
 */
export class InMemoryPolicyRepository implements PolicyRepository {
  readonly #policies = new Map<string, StoredPolicy>();
  readonly #versions = new Map<string, PolicyVersionSnapshot[]>();

  constructor(initial: readonly PolicyDefinition[] = []) {
    this.seed(initial);
  }

  /** Insert or replace a policy definition, keeping the existing version. */
  seed(definitions: readonly PolicyDefinition[]): void {
    const now = new Date();
    for (const definition of definitions) {
      const existing = this.#policies.get(definition.key);
      this.#policies.set(definition.key, {
        ...definition,
        id: existing?.id ?? `policy:${definition.key}`,
        version: existing?.version ?? 1,
        createdAt: existing?.createdAt ?? now,
        updatedAt: existing?.updatedAt ?? now,
      });
    }
  }

  async listActivePolicies(tenantId: string): Promise<StoredPolicy[]> {
    return [...this.#policies.values()]
      .filter((policy) => policy.status === "active")
      .filter(
        (policy) => policy.tenantId === null || policy.tenantId === tenantId,
      )
      .sort((left, right) => left.key.localeCompare(right.key));
  }

  async findByKey(key: string): Promise<StoredPolicy | null> {
    return this.#policies.get(key) ?? null;
  }

  async save(
    policy: StoredPolicy,
    snapshot: PolicyVersionSnapshot,
  ): Promise<StoredPolicy> {
    this.#policies.set(policy.key, policy);
    const versions = this.#versions.get(snapshot.key) ?? [];
    versions.push(snapshot);
    this.#versions.set(snapshot.key, versions);
    return policy;
  }

  async listVersions(key: string): Promise<PolicyVersionSnapshot[]> {
    return [...(this.#versions.get(key) ?? [])].sort(
      (left, right) => left.version - right.version,
    );
  }
}

/** PostgreSQL-backed policy repository. */
export function createDrizzlePolicyRepository(
  db: PostgresJsDatabase<typeof dbSchema>,
): PolicyRepository {
  return {
    async listActivePolicies(tenantId: string): Promise<StoredPolicy[]> {
      const rows = await db
        .select()
        .from(rbacPolicies)
        .where(
          and(
            eq(rbacPolicies.status, "active"),
            or(
              isNull(rbacPolicies.tenantId),
              eq(rbacPolicies.tenantId, tenantId),
            ),
          ),
        )
        .orderBy(asc(rbacPolicies.priority), asc(rbacPolicies.key));

      return rows.map(toStoredPolicy);
    },

    async findByKey(key: string): Promise<StoredPolicy | null> {
      const rows = await db
        .select()
        .from(rbacPolicies)
        .where(eq(rbacPolicies.key, key))
        .limit(1);
      const row = rows[0];
      return row ? toStoredPolicy(row) : null;
    },

    async save(
      policy: StoredPolicy,
      snapshot: PolicyVersionSnapshot,
    ): Promise<StoredPolicy> {
      return db.transaction(async (tx) => {
        const rows = await tx
          .insert(rbacPolicies)
          .values(toPolicyValues(policy))
          .onConflictDoUpdate({
            target: rbacPolicies.key,
            set: {
              name: policy.name,
              description: policy.description ?? null,
              effect: policy.effect,
              priority: policy.priority,
              status: policy.status,
              version: policy.version,
              tenantId: policy.tenantId,
              roles: [...policy.roles],
              permissions: [...policy.permissions],
              resources: [...policy.resources],
              actions: [...policy.actions],
              conditions: policy.conditions.map((condition) => ({
                ...condition,
              })),
              updatedAt: policy.updatedAt,
            },
          })
          .returning();

        const row = rows[0];
        if (!row) {
          throw new ValidationError("Policy save returned no row");
        }

        await tx.insert(rbacPolicyVersions).values({
          id: randomUUID(),
          policyId: row.id,
          policyKey: snapshot.key,
          version: snapshot.version,
          definition: snapshot.definition,
          changedBy: uuidOrNull(snapshot.changedBy),
          reason: snapshot.reason,
          createdAt: snapshot.changedAt,
          updatedAt: snapshot.changedAt,
        });

        return toStoredPolicy(row);
      });
    },

    async listVersions(key: string): Promise<PolicyVersionSnapshot[]> {
      const rows = await db
        .select()
        .from(rbacPolicyVersions)
        .where(eq(rbacPolicyVersions.policyKey, key))
        .orderBy(desc(rbacPolicyVersions.version));

      return rows.map((row) => {
        const definition = row.definition;
        const parsed = z
          .object({
            key: z.string(),
            name: z.string(),
            description: z.string().optional(),
            effect: z.enum(["allow", "deny"]),
            priority: z.number(),
            status: z.enum(["draft", "active", "archived"]),
            roles: z.array(z.string()),
            permissions: z.array(z.string()),
            resources: z.array(z.string()),
            actions: z.array(z.string()),
            conditions: conditionsSchema,
            tenantId: z.string().nullable(),
          })
          .safeParse(definition);

        if (!parsed.success) {
          throw new ValidationError(
            `Policy version snapshot for "${key}" is malformed`,
          );
        }

        return {
          policyId: row.policyId,
          key: row.policyKey,
          version: row.version,
          definition: parsed.data,
          changedBy: row.changedBy,
          reason: row.reason,
          changedAt: row.createdAt,
        };
      });
    },
  };
}
