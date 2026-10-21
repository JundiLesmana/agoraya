// Agoraya — modules/rbac policies definitions
// The built-in policy set. Policies are authored in code for the MVP (no
// dynamic policy API) and can be persisted through the policy service so they
// are stored, versioned, and evaluated like any other policy.
//
// Role and permission keys refer to the tenant-defined rows in `roles.key` and
// `permissions.key`. The keys below match the demo scenario seed
// (`superadmin`, `maker`, `checker`, `citizen`).
//
// Every policy carries a tenant condition: a policy never applies to a resource
// owned by a different tenant. The citizen read policy additionally requires
// resource ownership, which is the attribute-based half of the hybrid.

import type { PolicyDefinition } from "../types";

/** Condition: the resource must belong to the subject's tenant. */
const SAME_TENANT = {
  attribute: "resource.tenantId",
  operator: "eq",
  value: "$subject.tenantId",
} as const;

/** Condition: the resource must be owned by the subject. */
const OWNED_BY_SUBJECT = {
  attribute: "resource.ownerId",
  operator: "eq",
  value: "$subject.id",
} as const;

export const BUILT_IN_POLICIES: readonly PolicyDefinition[] = [
  {
    key: "tickets.create",
    name: "Membuat laporan",
    description: "Warga dan petugas dapat membuat laporan baru.",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["citizen", "maker", "superadmin"],
    permissions: [],
    resources: ["tickets"],
    actions: ["create"],
    conditions: [SAME_TENANT],
    tenantId: null,
  },
  {
    key: "tickets.read.staff",
    name: "Membaca seluruh laporan",
    description: "Petugas dan admin dapat membaca seluruh laporan tenant.",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["maker", "checker", "superadmin"],
    permissions: [],
    resources: ["tickets"],
    actions: ["read"],
    conditions: [SAME_TENANT],
    tenantId: null,
  },
  {
    key: "tickets.read.own",
    name: "Membaca laporan sendiri",
    description: "Warga hanya dapat membaca laporan yang ia buat.",
    effect: "allow",
    priority: 50,
    status: "active",
    roles: ["citizen"],
    permissions: [],
    resources: ["tickets"],
    actions: ["read"],
    conditions: [SAME_TENANT, OWNED_BY_SUBJECT],
    tenantId: null,
  },
  {
    key: "tickets.update",
    name: "Mengubah status laporan",
    description: "Checker dan admin dapat mengubah status laporan.",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["checker", "superadmin"],
    permissions: [],
    resources: ["tickets"],
    actions: ["update"],
    conditions: [SAME_TENANT],
    tenantId: null,
  },
  {
    key: "tickets.verify",
    name: "Verifikasi laporan",
    description: "Checker dan admin dapat memverifikasi hasil perbaikan.",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["checker", "superadmin"],
    permissions: [],
    resources: ["tickets"],
    actions: ["verify"],
    conditions: [SAME_TENANT],
    tenantId: null,
  },
  {
    key: "cms.read",
    name: "Membaca data CMS",
    description: "Petugas dapat membaca konten CMS tenant.",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["maker", "checker", "superadmin"],
    permissions: [],
    resources: ["cms"],
    actions: ["read"],
    conditions: [SAME_TENANT],
    tenantId: null,
  },
  {
    key: "audit.read",
    name: "Membaca log audit",
    description:
      "Hanya admin dengan izin audit:read yang dapat membaca log audit.",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["superadmin"],
    permissions: ["audit:read"],
    resources: ["audit"],
    actions: ["read"],
    conditions: [SAME_TENANT],
    tenantId: null,
  },
  {
    key: "rbac.manage",
    name: "Mengelola kebijakan akses",
    description:
      "Admin dapat membaca dan mengelola kebijakan serta grant akses.",
    effect: "allow",
    priority: 100,
    status: "active",
    roles: ["superadmin"],
    permissions: [],
    resources: ["rbac"],
    actions: ["read", "write", "manage"],
    conditions: [SAME_TENANT],
    tenantId: null,
  },
];

/** A copy of the built-in policy set, safe to mutate by callers. */
export function builtinPolicyDefinitions(): PolicyDefinition[] {
  return BUILT_IN_POLICIES.map((policy) => ({
    ...policy,
    roles: [...policy.roles],
    permissions: [...policy.permissions],
    resources: [...policy.resources],
    actions: [...policy.actions],
    conditions: policy.conditions.map((condition) => ({ ...condition })),
  }));
}
