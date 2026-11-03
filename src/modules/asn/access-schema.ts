import { z } from "zod";
import { MODULE_ACCESS_KEYS } from "@/modules/rbac/module-access";

const uuidSchema = z.string().uuid();
const applicationRoleSchema = z.string().min(1).max(100);

export const asnAccessFiltersSchema = z.object({
  q: z.string().trim().max(255).optional(),
  name: z.string().trim().max(255).optional(),
  nip: z.string().trim().max(32).optional(),
  opd: z.string().trim().max(255).optional(),
  position: z.string().trim().max(255).optional(),
  accountStatus: z.enum(["active", "inactive", "suspended"]).optional(),
  applicationRole: applicationRoleSchema.optional(),
  module: z.enum(MODULE_ACCESS_KEYS).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

export const updateAsnAccessSchema = z
  .strictObject({
    applicationRoles: z.array(applicationRoleSchema).max(20).optional(),
    modules: z.array(z.enum(MODULE_ACCESS_KEYS)).max(5).optional(),
    executiveStatus: z.enum(["observer", "not_granted"]).optional(),
  })
  .refine(
    (value) =>
      value.applicationRoles !== undefined ||
      value.modules !== undefined ||
      value.executiveStatus !== undefined,
    { message: "At least one access field must be provided" },
  );

export const asnIdSchema = uuidSchema;

export type AsnAccessFilters = z.output<typeof asnAccessFiltersSchema>;
export type UpdateAsnAccessCommand = z.output<typeof updateAsnAccessSchema>;
