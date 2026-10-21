// Agoraya — modules/rbac grants repository
// Persistence port for role assignments (user -> role) and permission grants
// (role -> permission), plus an in-memory adapter for tests and local use.
//
// Grants are soft-revoked: a revoked grant keeps its row so the change stays
// auditable. An expired grant is ignored by the grants service.

import { and, eq, inArray, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as dbSchema from "@/lib/db/schema";
import {
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from "@/lib/db/schema";

import type {
  PermissionGrant,
  PermissionRef,
  RoleGrant,
  RoleRef,
} from "../types";

/** Input for creating or refreshing a role assignment. */
export interface UpsertRoleGrantInput {
  readonly userId: string;
  readonly roleId: string;
  readonly roleKey: string;
  readonly tenantId: string;
  readonly grantedBy: string | null;
  readonly expiresAt: Date | null;
  readonly grantedAt: Date;
}

/** Input for creating or refreshing a permission grant. */
export interface UpsertPermissionGrantInput {
  readonly roleId: string;
  readonly roleKey: string;
  readonly permissionId: string;
  readonly permissionKey: string;
  readonly grantedBy: string | null;
  readonly grantedAt: Date;
}

/** Persistence port for grants. */
export interface GrantRepository {
  /** All role assignments of a user, including revoked and expired ones. */
  listRoleGrants(userId: string): Promise<RoleGrant[]>;
  /** All permission grants of the given roles, including revoked ones. */
  listPermissionGrants(roleIds: readonly string[]): Promise<PermissionGrant[]>;
  /** Users that currently hold a role. */
  listUserIdsByRole(roleId: string): Promise<string[]>;
  findRoleByKey(tenantId: string, roleKey: string): Promise<RoleRef | null>;
  findPermissionByKey(permissionKey: string): Promise<PermissionRef | null>;
  upsertRoleGrant(input: UpsertRoleGrantInput): Promise<RoleGrant>;
  revokeRoleGrant(
    userId: string,
    roleId: string,
    revokedBy: string,
  ): Promise<boolean>;
  upsertPermissionGrant(
    input: UpsertPermissionGrantInput,
  ): Promise<PermissionGrant>;
  revokePermissionGrant(roleId: string, permissionId: string): Promise<boolean>;
}

function roleGrantKey(userId: string, roleId: string): string {
  return `${userId}:${roleId}`;
}

function permissionGrantKey(roleId: string, permissionId: string): string {
  return `${roleId}:${permissionId}`;
}

/** In-memory grant repository. */
export class InMemoryGrantRepository implements GrantRepository {
  readonly #roleGrants = new Map<string, RoleGrant>();
  readonly #permissionGrants = new Map<string, PermissionGrant>();
  readonly #roles = new Map<string, RoleRef>();
  readonly #permissions = new Map<string, PermissionRef>();

  /** Register a role so it can be granted. */
  registerRole(role: RoleRef): void {
    this.#roles.set(`${role.tenantId}:${role.key}`, role);
  }

  /** Register a permission so it can be granted. */
  registerPermission(permission: PermissionRef): void {
    this.#permissions.set(permission.key, permission);
  }

  async listRoleGrants(userId: string): Promise<RoleGrant[]> {
    return [...this.#roleGrants.values()].filter(
      (grant) => grant.userId === userId,
    );
  }

  async listPermissionGrants(
    roleIds: readonly string[],
  ): Promise<PermissionGrant[]> {
    const wanted = new Set(roleIds);
    return [...this.#permissionGrants.values()].filter((grant) =>
      wanted.has(grant.roleId),
    );
  }

  async listUserIdsByRole(roleId: string): Promise<string[]> {
    return [
      ...new Set(
        [...this.#roleGrants.values()]
          .filter(
            (grant) => grant.roleId === roleId && grant.revokedAt === null,
          )
          .map((grant) => grant.userId),
      ),
    ];
  }

  async findRoleByKey(
    tenantId: string,
    roleKey: string,
  ): Promise<RoleRef | null> {
    return this.#roles.get(`${tenantId}:${roleKey}`) ?? null;
  }

  async findPermissionByKey(
    permissionKey: string,
  ): Promise<PermissionRef | null> {
    return this.#permissions.get(permissionKey) ?? null;
  }

  async upsertRoleGrant(input: UpsertRoleGrantInput): Promise<RoleGrant> {
    const grant: RoleGrant = {
      userId: input.userId,
      roleId: input.roleId,
      roleKey: input.roleKey,
      tenantId: input.tenantId,
      grantedAt: input.grantedAt,
      grantedBy: input.grantedBy,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };
    this.#roleGrants.set(roleGrantKey(input.userId, input.roleId), grant);
    return grant;
  }

  async revokeRoleGrant(
    userId: string,
    roleId: string,
    revokedBy: string,
  ): Promise<boolean> {
    const key = roleGrantKey(userId, roleId);
    const grant = this.#roleGrants.get(key);
    if (!grant || grant.revokedAt !== null) return false;
    this.#roleGrants.set(key, {
      ...grant,
      revokedAt: new Date(),
      grantedBy: revokedBy,
    });
    return true;
  }

  async upsertPermissionGrant(
    input: UpsertPermissionGrantInput,
  ): Promise<PermissionGrant> {
    const grant: PermissionGrant = {
      roleId: input.roleId,
      roleKey: input.roleKey,
      permissionId: input.permissionId,
      permissionKey: input.permissionKey,
      grantedAt: input.grantedAt,
      grantedBy: input.grantedBy,
      revokedAt: null,
    };
    this.#permissionGrants.set(
      permissionGrantKey(input.roleId, input.permissionId),
      grant,
    );
    return grant;
  }

  async revokePermissionGrant(
    roleId: string,
    permissionId: string,
  ): Promise<boolean> {
    const key = permissionGrantKey(roleId, permissionId);
    const grant = this.#permissionGrants.get(key);
    if (!grant || grant.revokedAt !== null) return false;
    this.#permissionGrants.set(key, { ...grant, revokedAt: new Date() });
    return true;
  }
}

/** PostgreSQL-backed grant repository. */
export function createDrizzleGrantRepository(
  db: PostgresJsDatabase<typeof dbSchema>,
): GrantRepository {
  return {
    async listRoleGrants(userId: string): Promise<RoleGrant[]> {
      const rows = await db
        .select({
          userId: userRoles.userId,
          roleId: userRoles.roleId,
          roleKey: roles.key,
          tenantId: roles.tenantId,
          grantedAt: userRoles.grantedAt,
          grantedBy: userRoles.grantedBy,
          expiresAt: userRoles.expiresAt,
          revokedAt: userRoles.revokedAt,
        })
        .from(userRoles)
        .innerJoin(roles, eq(roles.id, userRoles.roleId))
        .where(eq(userRoles.userId, userId));

      return rows;
    },

    async listPermissionGrants(
      roleIds: readonly string[],
    ): Promise<PermissionGrant[]> {
      if (roleIds.length === 0) return [];

      const rows = await db
        .select({
          roleId: rolePermissions.roleId,
          roleKey: roles.key,
          permissionId: rolePermissions.permissionId,
          permissionKey: permissions.key,
          grantedAt: rolePermissions.grantedAt,
          grantedBy: rolePermissions.grantedBy,
          revokedAt: rolePermissions.revokedAt,
        })
        .from(rolePermissions)
        .innerJoin(roles, eq(roles.id, rolePermissions.roleId))
        .innerJoin(
          permissions,
          eq(permissions.id, rolePermissions.permissionId),
        )
        .where(inArray(rolePermissions.roleId, [...roleIds]));

      return rows;
    },

    async listUserIdsByRole(roleId: string): Promise<string[]> {
      const rows = await db
        .select({ userId: userRoles.userId })
        .from(userRoles)
        .where(and(eq(userRoles.roleId, roleId), isNull(userRoles.revokedAt)));

      return rows.map((row) => row.userId);
    },

    async findRoleByKey(
      tenantId: string,
      roleKey: string,
    ): Promise<RoleRef | null> {
      const rows = await db
        .select({ id: roles.id, key: roles.key, tenantId: roles.tenantId })
        .from(roles)
        .where(and(eq(roles.tenantId, tenantId), eq(roles.key, roleKey)))
        .limit(1);
      return rows[0] ?? null;
    },

    async findPermissionByKey(
      permissionKey: string,
    ): Promise<PermissionRef | null> {
      const rows = await db
        .select({ id: permissions.id, key: permissions.key })
        .from(permissions)
        .where(eq(permissions.key, permissionKey))
        .limit(1);
      return rows[0] ?? null;
    },

    async upsertRoleGrant(input: UpsertRoleGrantInput): Promise<RoleGrant> {
      const rows = await db
        .insert(userRoles)
        .values({
          userId: input.userId,
          roleId: input.roleId,
          grantedAt: input.grantedAt,
          grantedBy: input.grantedBy,
          expiresAt: input.expiresAt,
          revokedAt: null,
        })
        .onConflictDoUpdate({
          target: [userRoles.userId, userRoles.roleId],
          set: {
            grantedAt: input.grantedAt,
            grantedBy: input.grantedBy,
            expiresAt: input.expiresAt,
            revokedAt: null,
          },
        })
        .returning({
          userId: userRoles.userId,
          roleId: userRoles.roleId,
          grantedAt: userRoles.grantedAt,
          grantedBy: userRoles.grantedBy,
          expiresAt: userRoles.expiresAt,
          revokedAt: userRoles.revokedAt,
        });

      const row = rows[0];
      if (!row) {
        throw new Error("Role grant upsert returned no row");
      }

      return {
        ...row,
        roleKey: input.roleKey,
        tenantId: input.tenantId,
      };
    },

    async revokeRoleGrant(
      userId: string,
      roleId: string,
      revokedBy: string,
    ): Promise<boolean> {
      const rows = await db
        .update(userRoles)
        .set({ revokedAt: new Date(), grantedBy: revokedBy })
        .where(
          and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId),
            isNull(userRoles.revokedAt),
          ),
        )
        .returning({ id: userRoles.userId });

      return rows.length > 0;
    },

    async upsertPermissionGrant(
      input: UpsertPermissionGrantInput,
    ): Promise<PermissionGrant> {
      const rows = await db
        .insert(rolePermissions)
        .values({
          roleId: input.roleId,
          permissionId: input.permissionId,
          grantedAt: input.grantedAt,
          grantedBy: input.grantedBy,
          revokedAt: null,
        })
        .onConflictDoUpdate({
          target: [rolePermissions.roleId, rolePermissions.permissionId],
          set: {
            grantedAt: input.grantedAt,
            grantedBy: input.grantedBy,
            revokedAt: null,
          },
        })
        .returning({
          roleId: rolePermissions.roleId,
          permissionId: rolePermissions.permissionId,
          grantedAt: rolePermissions.grantedAt,
          grantedBy: rolePermissions.grantedBy,
          revokedAt: rolePermissions.revokedAt,
        });

      const row = rows[0];
      if (!row) {
        throw new Error("Permission grant upsert returned no row");
      }

      return {
        ...row,
        roleKey: input.roleKey,
        permissionKey: input.permissionKey,
      };
    },

    async revokePermissionGrant(
      roleId: string,
      permissionId: string,
    ): Promise<boolean> {
      const rows = await db
        .update(rolePermissions)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(rolePermissions.roleId, roleId),
            eq(rolePermissions.permissionId, permissionId),
            isNull(rolePermissions.revokedAt),
          ),
        )
        .returning({ roleId: rolePermissions.roleId });

      return rows.length > 0;
    },
  };
}
