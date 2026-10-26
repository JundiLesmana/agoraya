import { z } from "zod";

import type { PolicyDefinition } from "./types";

const policyKeySchema = z
  .string()
  .min(1)
  .max(100)
  .regex(
    /^[a-z0-9][a-z0-9._-]*$/,
    "Policy key must be lowercase and start with a letter or digit",
  );

const roleKeySchema = z.string().min(1).max(100);
const permissionKeySchema = z.string().min(1).max(100);
const resourcePatternSchema = z.string().min(1).max(100);
const actionPatternSchema = z.string().min(1).max(100);

/**
 * Attribute condition comparing one attribute against a single value.
 * The value is a literal, or an attribute reference such as `$subject.tenantId`.
 */
export const scalarConditionSchema = z.strictObject({
  attribute: z.string().min(1).max(200),
  operator: z.enum(["eq", "neq"]),
  value: z.string().min(1).max(500),
});

/** Attribute condition comparing one attribute against a set of values. */
export const setConditionSchema = z.strictObject({
  attribute: z.string().min(1).max(200),
  operator: z.enum(["in", "not_in"]),
  value: z.array(z.string().min(1).max(500)).min(1).max(50),
});

export const policyConditionSchema = z.union([
  scalarConditionSchema,
  setConditionSchema,
]);

/**
 * A policy definition. A policy must constrain the subject (role or
 * permission) — a policy without any subject constraint would match every
 * request and is rejected as unsafe.
 */
export const policyDefinitionSchema = z
  .strictObject({
    key: policyKeySchema,
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    effect: z.enum(["allow", "deny"]),
    priority: z.number().int().min(0).max(1000).default(100),
    status: z.enum(["draft", "active", "archived"]).default("active"),
    roles: z.array(roleKeySchema).max(50).default([]),
    permissions: z.array(permissionKeySchema).max(100).default([]),
    resources: z.array(resourcePatternSchema).min(1).max(50),
    actions: z.array(actionPatternSchema).min(1).max(50),
    conditions: z.array(policyConditionSchema).max(20).default([]),
    tenantId: z.string().min(1).max(64).nullable().default(null),
  })
  .refine(
    (definition) =>
      definition.roles.length > 0 || definition.permissions.length > 0,
    {
      message:
        "Policy must constrain the subject with at least one role or permission",
      path: ["roles"],
    },
  );

/** Command for creating or updating a policy. */
export const savePolicyCommandSchema = z.strictObject({
  definition: policyDefinitionSchema,
  /** Actor performing the change, for the version history. */
  changedBy: z.string().min(1).max(64),
  reason: z.string().max(500).optional(),
});

/** An authorization request as submitted by a caller. */
export const accessRequestSchema = z.strictObject({
  subject: z.strictObject({
    userId: z.string().min(1).max(64),
    tenantId: z.string().min(1).max(64),
    attributes: z.record(z.string(), z.string().max(500)).optional(),
  }),
  resource: z.strictObject({
    type: z.string().min(1).max(100),
    id: z.string().min(1).max(64).optional(),
    tenantId: z.string().min(1).max(64).optional(),
    ownerId: z.string().min(1).max(64).optional(),
    status: z.string().min(1).max(50).optional(),
    attributes: z.record(z.string(), z.string().max(500)).optional(),
  }),
  action: z.string().min(1).max(100),
  requestId: z.string().min(1).max(128).optional(),
});

/** Command for assigning a role to a user. */
export const assignRoleCommandSchema = z.strictObject({
  tenantId: z.string().min(1).max(64),
  userId: z.string().min(1).max(64),
  roleKey: roleKeySchema,
  grantedBy: z.string().min(1).max(64),
  expiresAt: z.union([z.iso.datetime(), z.date()]).optional(),
});

/** Command for revoking a role from a user. */
export const revokeRoleCommandSchema = z.strictObject({
  tenantId: z.string().min(1).max(64),
  userId: z.string().min(1).max(64),
  roleKey: roleKeySchema,
  revokedBy: z.string().min(1).max(64),
});

/** Command for granting a permission to a role. */
export const assignPermissionCommandSchema = z.strictObject({
  tenantId: z.string().min(1).max(64),
  roleKey: roleKeySchema,
  permissionKey: permissionKeySchema,
  grantedBy: z.string().min(1).max(64),
});

/** Command for revoking a permission from a role. */
export const revokePermissionCommandSchema = z.strictObject({
  tenantId: z.string().min(1).max(64),
  roleKey: roleKeySchema,
  permissionKey: permissionKeySchema,
  revokedBy: z.string().min(1).max(64),
});

export type PolicyConditionInput = z.output<typeof policyConditionSchema>;
/** A policy definition as accepted from a caller (defaults still optional). */
export type PolicyDefinitionInput = z.input<typeof policyDefinitionSchema>;
/** A policy definition after validation (defaults applied). */
export type PolicyDefinitionOutput = z.output<typeof policyDefinitionSchema>;
export type SavePolicyCommand = {
  readonly definition: PolicyDefinition;
  readonly changedBy: string;
  readonly reason?: string;
};
export type AccessRequestInput = z.output<typeof accessRequestSchema>;
export type AssignRoleCommand = {
  readonly tenantId: string;
  readonly userId: string;
  readonly roleKey: string;
  readonly grantedBy: string;
  readonly expiresAt?: Date | string;
};
export type RevokeRoleCommand = {
  readonly tenantId: string;
  readonly userId: string;
  readonly roleKey: string;
  readonly revokedBy: string;
};
export type AssignPermissionCommand = {
  readonly tenantId: string;
  readonly roleKey: string;
  readonly permissionKey: string;
  readonly grantedBy: string;
};
export type RevokePermissionCommand = {
  readonly tenantId: string;
  readonly roleKey: string;
  readonly permissionKey: string;
  readonly revokedBy: string;
};
