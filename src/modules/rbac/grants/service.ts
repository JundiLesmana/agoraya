// Agoraya — modules/rbac grants service
// User -> role assignments and role -> permission grants.
//
// Every change is recorded in the audit trail and published to change
// listeners so the policy decision point can invalidate cached decisions that
// were made under the previous grant set.

import { logger } from "@/lib/logger";
import {
  AppError,
  ErrorCode,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";

import type { AuditSink } from "../audit";
import { uuidOrNull } from "../audit";
import {
  assignPermissionCommandSchema,
  assignRoleCommandSchema,
  revokePermissionCommandSchema,
  revokeRoleCommandSchema,
} from "../schema";
import type {
  AssignPermissionCommand,
  AssignRoleCommand,
  RevokePermissionCommand,
  RevokeRoleCommand,
} from "../schema";
import type { EffectiveAccess, PermissionGrant, RoleGrant } from "../types";
import type { GrantRepository } from "./repository";

/** Read interface used by the policy decision point to resolve a subject. */
export interface EffectiveAccessProvider {
  getEffectiveAccess(
    userId: string,
    options?: { tenantId?: string },
  ): Promise<EffectiveAccess>;
}

/**
 * Emitted after a grant change.
 *
 * `user` invalidates the decisions of one user. `role` invalidates the
 * decisions of every user that holds the role, because the effective
 * permissions of all of them changed.
 */
export type GrantChangeEvent =
  | { readonly kind: "user"; readonly userId: string }
  | {
      readonly kind: "role";
      readonly roleId: string;
      readonly userIds: readonly string[];
    };

export interface GrantServiceOptions {
  readonly repository: GrantRepository;
  readonly audit?: AuditSink;
  readonly clock?: () => Date;
}

function toDate(value: Date | string | undefined): Date | null {
  if (value === undefined) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError("Invalid expiry date");
  }
  return date;
}

/**
 * Manages grants and resolves the effective access of a user.
 */
export class GrantService implements EffectiveAccessProvider {
  readonly #repository: GrantRepository;
  readonly #audit: AuditSink | undefined;
  readonly #clock: () => Date;
  readonly #listeners = new Set<(event: GrantChangeEvent) => void>();

  constructor(options: GrantServiceOptions) {
    this.#repository = options.repository;
    this.#audit = options.audit;
    this.#clock = options.clock ?? (() => new Date());
  }

  /** Register a listener notified after every grant change. Returns an unsubscribe function. */
  onChange(listener: (event: GrantChangeEvent) => void): () => void {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /**
   * Roles and permissions currently held by a user.
   *
   * Revoked and expired grants are ignored. When a tenant is given, grants that
   * belong to another tenant are ignored as well, so a cross-tenant grant can
   * never widen the effective access of a user.
   */
  async getEffectiveAccess(
    userId: string,
    options: { tenantId?: string } = {},
  ): Promise<EffectiveAccess> {
    const now = this.#clock();
    const grants = await this.#repository.listRoleGrants(userId);

    const active = grants.filter(
      (grant) =>
        grant.revokedAt === null &&
        (grant.expiresAt === null || grant.expiresAt > now),
    );

    const scoped =
      options.tenantId === undefined
        ? active
        : active.filter((grant) => {
            if (grant.tenantId === options.tenantId) return true;
            logger.warn("rbac.grant.cross_tenant_ignored", {
              userId,
              roleKey: grant.roleKey,
              grantTenantId: grant.tenantId,
              requestTenantId: options.tenantId,
            });
            return false;
          });

    const roles = [...new Set(scoped.map((grant) => grant.roleKey))];
    const roleIds = [...new Set(scoped.map((grant) => grant.roleId))];

    const permissionGrants =
      await this.#repository.listPermissionGrants(roleIds);
    const permissions = [
      ...new Set(
        permissionGrants
          .filter((grant) => grant.revokedAt === null)
          .map((grant) => grant.permissionKey),
      ),
    ];

    return { userId, roles, permissions };
  }

  /** Assign a role to a user. Re-assigning an existing role refreshes the grant. */
  async assignRole(command: AssignRoleCommand): Promise<RoleGrant> {
    const parsed = assignRoleCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid role assignment", {
        details: {
          issues: parsed.error.issues.map((issue) => issue.path.join(".")),
        },
      });
    }

    const { tenantId, userId, roleKey, grantedBy } = parsed.data;
    const role = await this.#repository.findRoleByKey(tenantId, roleKey);
    if (!role) {
      throw new NotFoundError(
        `Role "${roleKey}" does not exist in this tenant`,
      );
    }

    const grant = await this.#repository.upsertRoleGrant({
      userId,
      roleId: role.id,
      roleKey: role.key,
      tenantId: role.tenantId,
      grantedBy,
      expiresAt: toDate(parsed.data.expiresAt),
      grantedAt: this.#clock(),
    });

    await this.#recordAudit({
      action: "rbac.grant.role_assigned",
      targetTable: "user_roles",
      targetId: null,
      metadata: {
        userId,
        roleKey: role.key,
        expiresAt: grant.expiresAt ? grant.expiresAt.toISOString() : null,
      },
      actorId: grantedBy,
    });

    this.#notify({ kind: "user", userId });
    logger.info("rbac.grant.role_assigned", { userId, roleKey: role.key });

    return grant;
  }

  /** Revoke a role assignment. The grant is kept for auditing. */
  async revokeRole(command: RevokeRoleCommand): Promise<boolean> {
    const parsed = revokeRoleCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid role revocation", {
        details: {
          issues: parsed.error.issues.map((issue) => issue.path.join(".")),
        },
      });
    }

    const { tenantId, userId, roleKey, revokedBy } = parsed.data;
    const role = await this.#repository.findRoleByKey(tenantId, roleKey);
    if (!role) {
      throw new NotFoundError(
        `Role "${roleKey}" does not exist in this tenant`,
      );
    }

    const revoked = await this.#repository.revokeRoleGrant(
      userId,
      role.id,
      revokedBy,
    );
    if (!revoked) {
      return false;
    }

    await this.#recordAudit({
      action: "rbac.grant.role_revoked",
      targetTable: "user_roles",
      targetId: null,
      metadata: { userId, roleKey: role.key },
      actorId: revokedBy,
    });

    this.#notify({ kind: "user", userId });
    logger.info("rbac.grant.role_revoked", { userId, roleKey: role.key });

    return true;
  }

  /** Grant a permission to a role. */
  async assignPermission(
    command: AssignPermissionCommand,
  ): Promise<PermissionGrant> {
    const parsed = assignPermissionCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid permission grant", {
        details: {
          issues: parsed.error.issues.map((issue) => issue.path.join(".")),
        },
      });
    }

    const { tenantId, roleKey, permissionKey, grantedBy } = parsed.data;
    const role = await this.#repository.findRoleByKey(tenantId, roleKey);
    if (!role) {
      throw new NotFoundError(
        `Role "${roleKey}" does not exist in this tenant`,
      );
    }

    const permission =
      await this.#repository.findPermissionByKey(permissionKey);
    if (!permission) {
      throw new NotFoundError(`Permission "${permissionKey}" does not exist`);
    }

    const grant = await this.#repository.upsertPermissionGrant({
      roleId: role.id,
      roleKey: role.key,
      permissionId: permission.id,
      permissionKey: permission.key,
      grantedBy,
      grantedAt: this.#clock(),
    });

    const userIds = await this.#repository.listUserIdsByRole(role.id);

    await this.#recordAudit({
      action: "rbac.grant.permission_assigned",
      targetTable: "role_permissions",
      targetId: null,
      metadata: {
        roleKey: role.key,
        permissionKey: permission.key,
        affectedUsers: userIds.length,
      },
      actorId: grantedBy,
    });

    this.#notify({ kind: "role", roleId: role.id, userIds });
    logger.info("rbac.grant.permission_assigned", {
      roleKey: role.key,
      permissionKey,
    });

    return grant;
  }

  /** Revoke a permission from a role. */
  async revokePermission(command: RevokePermissionCommand): Promise<boolean> {
    const parsed = revokePermissionCommandSchema.safeParse(command);
    if (!parsed.success) {
      throw new ValidationError("Invalid permission revocation", {
        details: {
          issues: parsed.error.issues.map((issue) => issue.path.join(".")),
        },
      });
    }

    const { tenantId, roleKey, permissionKey, revokedBy } = parsed.data;
    const role = await this.#repository.findRoleByKey(tenantId, roleKey);
    if (!role) {
      throw new NotFoundError(
        `Role "${roleKey}" does not exist in this tenant`,
      );
    }

    const permission =
      await this.#repository.findPermissionByKey(permissionKey);
    if (!permission) {
      throw new NotFoundError(`Permission "${permissionKey}" does not exist`);
    }

    const revoked = await this.#repository.revokePermissionGrant(
      role.id,
      permission.id,
    );
    if (!revoked) {
      return false;
    }

    const userIds = await this.#repository.listUserIdsByRole(role.id);

    await this.#recordAudit({
      action: "rbac.grant.permission_revoked",
      targetTable: "role_permissions",
      targetId: null,
      metadata: {
        roleKey: role.key,
        permissionKey: permission.key,
        affectedUsers: userIds.length,
      },
      actorId: revokedBy,
    });

    this.#notify({ kind: "role", roleId: role.id, userIds });
    logger.info("rbac.grant.permission_revoked", {
      roleKey: role.key,
      permissionKey,
    });

    return true;
  }

  #notify(event: GrantChangeEvent): void {
    for (const listener of this.#listeners) {
      listener(event);
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
        "Failed to record grant audit event",
        {
          isOperational: false,
          cause: error,
        },
      );
    }
  }
}
