import { randomUUID } from "node:crypto";
import {
  and,
  asc,
  count,
  eq,
  exists,
  ilike,
  inArray,
  isNotNull,
  isNull,
  or,
} from "drizzle-orm";

import { db } from "@/lib/db";
import { ConflictError, NotFoundError, ValidationError } from "@/lib/errors";
import {
  applicationRoles,
  executiveAccess,
  moduleAccess,
  userApplicationRoles,
} from "@/modules/rbac/db";
import {
  accountCanReceiveAccess,
  parseModuleAccessKey,
} from "@/modules/rbac/module-access";
import type { ModuleAccessKey } from "@/modules/rbac/module-access";
import { appendAsnAccessAuditEvent } from "@/modules/audit";
import { kycRoster } from "@/modules/kyc/db";
import { asnProfiles, jobPositions, users } from "@/modules/identity/db";
import type { AsnAccessFilters, UpdateAsnAccessCommand } from "./access-schema";

interface AccessState {
  readonly accountStatus: string;
  readonly applicationRoles: readonly { key: string; name: string }[];
  readonly modules: readonly ModuleAccessKey[];
  readonly executiveStatus: "observer" | "not_granted";
}

function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart[0]}***@${domain}`;
}

function contains(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function maskNip(nip: string | null): string | null {
  if (!nip) return null;
  return `${"*".repeat(Math.max(0, nip.length - 4))}${nip.slice(-4)}`;
}

export async function listAsnAccess(
  tenantId: string,
  filters: AsnAccessFilters,
) {
  const database = db();
  const conditions = [
    eq(users.tenantId, tenantId),
    eq(asnProfiles.tenantId, tenantId),
    isNotNull(asnProfiles.userId),
  ];

  if (filters.q) {
    const search = contains(filters.q);
    const searchCondition = or(
      ilike(users.name, search),
      ilike(asnProfiles.nip, search),
    );
    if (!searchCondition) throw new Error("ASN search filter was not built");
    conditions.push(searchCondition);
  }
  if (filters.name) {
    conditions.push(ilike(users.name, contains(filters.name)));
  }
  if (filters.nip) {
    conditions.push(ilike(asnProfiles.nip, contains(filters.nip)));
  }
  if (filters.opd) {
    conditions.push(ilike(asnProfiles.opdName, contains(filters.opd)));
  }
  if (filters.position) {
    conditions.push(ilike(jobPositions.name, contains(filters.position)));
  }
  if (filters.accountStatus) {
    conditions.push(eq(users.status, filters.accountStatus));
  }
  if (filters.applicationRole) {
    conditions.push(
      exists(
        database
          .select({ id: userApplicationRoles.id })
          .from(userApplicationRoles)
          .innerJoin(
            applicationRoles,
            eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
          )
          .where(
            and(
              eq(userApplicationRoles.userId, users.id),
              eq(userApplicationRoles.tenantId, tenantId),
              eq(applicationRoles.key, filters.applicationRole),
              isNull(userApplicationRoles.revokedAt),
            ),
          ),
      ),
    );
  }
  if (filters.module) {
    conditions.push(
      exists(
        database
          .select({ id: moduleAccess.id })
          .from(moduleAccess)
          .where(
            and(
              eq(moduleAccess.userId, users.id),
              eq(moduleAccess.tenantId, tenantId),
              eq(moduleAccess.moduleKey, filters.module),
              isNull(moduleAccess.revokedAt),
            ),
          ),
      ),
    );
  }

  const where = and(...conditions);
  const [totalResult, people] = await Promise.all([
    database
      .select({ total: count() })
      .from(users)
      .leftJoin(asnProfiles, eq(asnProfiles.userId, users.id))
      .leftJoin(jobPositions, eq(jobPositions.id, asnProfiles.positionId))
      .where(where),
    database
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        accountStatus: users.status,
        nip: asnProfiles.nip,
        opd: asnProfiles.opdName,
        unit: asnProfiles.unitName,
        position: jobPositions.name,
      })
      .from(users)
      .leftJoin(asnProfiles, eq(asnProfiles.userId, users.id))
      .leftJoin(jobPositions, eq(jobPositions.id, asnProfiles.positionId))
      .where(where)
      .orderBy(asc(users.name), asc(users.id))
      .limit(filters.limit)
      .offset(filters.offset),
  ]);
  const userIds = people.map((person) => person.id);
  if (userIds.length === 0) {
    return {
      data: [],
      total: totalResult[0]?.total ?? 0,
      limit: filters.limit,
      offset: filters.offset,
    };
  }

  const [roleRows, moduleRows, executiveRows] = await Promise.all([
    database
      .select({
        userId: userApplicationRoles.userId,
        key: applicationRoles.key,
        name: applicationRoles.name,
      })
      .from(userApplicationRoles)
      .innerJoin(
        applicationRoles,
        eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
      )
      .where(
        and(
          inArray(userApplicationRoles.userId, userIds),
          eq(userApplicationRoles.tenantId, tenantId),
          isNull(userApplicationRoles.revokedAt),
        ),
      ),
    database
      .select({
        userId: moduleAccess.userId,
        moduleKey: moduleAccess.moduleKey,
      })
      .from(moduleAccess)
      .where(
        and(
          inArray(moduleAccess.userId, userIds),
          eq(moduleAccess.tenantId, tenantId),
          isNull(moduleAccess.revokedAt),
        ),
      ),
    database
      .select({
        userId: executiveAccess.userId,
        status: executiveAccess.status,
      })
      .from(executiveAccess)
      .where(
        and(
          inArray(executiveAccess.userId, userIds),
          eq(executiveAccess.tenantId, tenantId),
        ),
      ),
  ]);

  return {
    data: people.map((person) => ({
      id: person.id,
      name: person.name,
      emailMasked: maskEmail(person.email),
      nipMasked: maskNip(person.nip),
      opd: person.opd,
      unit: person.unit,
      position: person.position,
      accountStatus: person.accountStatus,
      applicationRoles: roleRows
        .filter((role) => role.userId === person.id)
        .map(({ key, name }) => ({ key, name }))
        .sort((left, right) => left.key.localeCompare(right.key)),
      modules: moduleRows
        .filter((grant) => grant.userId === person.id)
        .map((grant) => parseModuleAccessKey(grant.moduleKey)),
      executiveStatus: parseExecutiveStatus(
        executiveRows.find((grant) => grant.userId === person.id)?.status ??
          "not_granted",
      ),
    })),
    total: totalResult[0]?.total ?? 0,
    limit: filters.limit,
    offset: filters.offset,
  };
}

async function getAccessState(
  database: ReturnType<typeof db>,
  userId: string,
  tenantId: string,
): Promise<AccessState> {
  const [user] = await database
    .select({ status: users.status })
    .from(users)
    .innerJoin(asnProfiles, eq(asnProfiles.userId, users.id))
    .where(
      and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
        eq(asnProfiles.tenantId, tenantId),
      ),
    )
    .for("update")
    .limit(1);
  if (!user) throw new NotFoundError("ASN tidak ditemukan");

  const [roleRows, moduleRows, executiveRows] = await Promise.all([
    database
      .select({ key: applicationRoles.key, name: applicationRoles.name })
      .from(userApplicationRoles)
      .innerJoin(
        applicationRoles,
        eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
      )
      .where(
        and(
          eq(userApplicationRoles.userId, userId),
          eq(userApplicationRoles.tenantId, tenantId),
          isNull(userApplicationRoles.revokedAt),
        ),
      ),
    database
      .select({ moduleKey: moduleAccess.moduleKey })
      .from(moduleAccess)
      .where(
        and(
          eq(moduleAccess.userId, userId),
          eq(moduleAccess.tenantId, tenantId),
          isNull(moduleAccess.revokedAt),
        ),
      ),
    database
      .select({ status: executiveAccess.status })
      .from(executiveAccess)
      .where(
        and(
          eq(executiveAccess.userId, userId),
          eq(executiveAccess.tenantId, tenantId),
        ),
      )
      .limit(1),
  ]);

  return {
    accountStatus: user.status,
    applicationRoles: [...roleRows].sort((left, right) =>
      left.key.localeCompare(right.key),
    ),
    modules: moduleRows
      .map((row) => parseModuleAccessKey(row.moduleKey))
      .sort(),
    executiveStatus: parseExecutiveStatus(
      executiveRows[0]?.status ?? "not_granted",
    ),
  };
}

function parseExecutiveStatus(value: string): AccessState["executiveStatus"] {
  if (value === "observer" || value === "not_granted") return value;
  throw new Error("Stored executive access status is invalid");
}

export async function updateAsnAccess(
  userId: string,
  tenantId: string,
  actorId: string,
  command: UpdateAsnAccessCommand,
) {
  const database = db();
  const updatedAt = new Date();

  return database.transaction(async (tx) => {
    const before = await getAccessState(tx, userId, tenantId);
    const nextModules = [
      ...new Set(command.modules ?? [...before.modules]),
    ].sort();
    const nextExecutiveStatus =
      command.executiveStatus ?? before.executiveStatus;
    if (
      !accountCanReceiveAccess(
        before.accountStatus,
        nextModules,
        nextExecutiveStatus,
      )
    ) {
      throw new ConflictError(
        "Hak akses hanya dapat diberikan setelah akun ASN aktif.",
      );
    }

    let nextRoleKeys = before.applicationRoles.map((role) => role.key);
    let nextApplicationRoles = before.applicationRoles;
    if (command.applicationRoles !== undefined) {
      nextRoleKeys = [...new Set(command.applicationRoles)];
      const selectedRoles =
        nextRoleKeys.length === 0
          ? []
          : await tx
              .select({
                id: applicationRoles.id,
                key: applicationRoles.key,
                name: applicationRoles.name,
              })
              .from(applicationRoles)
              .where(inArray(applicationRoles.key, nextRoleKeys));
      if (selectedRoles.length !== nextRoleKeys.length) {
        throw new ValidationError("Peran aplikasi tidak dikenal.");
      }
      nextApplicationRoles = selectedRoles
        .map(({ key, name }) => ({ key, name }))
        .sort((left, right) => left.key.localeCompare(right.key));

      const activeAssignments = await tx
        .select({
          id: userApplicationRoles.id,
          key: applicationRoles.key,
        })
        .from(userApplicationRoles)
        .innerJoin(
          applicationRoles,
          eq(applicationRoles.id, userApplicationRoles.applicationRoleId),
        )
        .where(
          and(
            eq(userApplicationRoles.userId, userId),
            eq(userApplicationRoles.tenantId, tenantId),
            isNull(userApplicationRoles.revokedAt),
          ),
        );
      const retainedRoleKeys = new Set(nextRoleKeys);
      const assignmentIdsToRevoke = activeAssignments
        .filter((assignment) => !retainedRoleKeys.has(assignment.key))
        .map((assignment) => assignment.id);
      if (assignmentIdsToRevoke.length > 0) {
        await tx
          .update(userApplicationRoles)
          .set({ revokedAt: updatedAt })
          .where(inArray(userApplicationRoles.id, assignmentIdsToRevoke));
      }
      const currentRoleKeys = new Set(
        activeAssignments.map((assignment) => assignment.key),
      );
      const newRoles = selectedRoles.filter(
        (role) => !currentRoleKeys.has(role.key),
      );
      if (newRoles.length > 0) {
        await tx.insert(userApplicationRoles).values(
          newRoles.map((role) => ({
            id: randomUUID(),
            tenantId,
            userId,
            applicationRoleId: role.id,
            grantedBy: actorId,
            grantedAt: updatedAt,
          })),
        );
      }
    }

    if (command.modules !== undefined) {
      const desiredModules = [...new Set(command.modules)];
      const activeModules = await tx
        .select({ id: moduleAccess.id, moduleKey: moduleAccess.moduleKey })
        .from(moduleAccess)
        .where(
          and(
            eq(moduleAccess.userId, userId),
            eq(moduleAccess.tenantId, tenantId),
            isNull(moduleAccess.revokedAt),
          ),
        );
      const desiredSet = new Set<string>(desiredModules);
      const idsToRevoke = activeModules
        .filter((grant) => !desiredSet.has(grant.moduleKey))
        .map((grant) => grant.id);
      if (idsToRevoke.length > 0) {
        await tx
          .update(moduleAccess)
          .set({ revokedAt: updatedAt })
          .where(inArray(moduleAccess.id, idsToRevoke));
      }
      const currentSet = new Set(activeModules.map((grant) => grant.moduleKey));
      const newModules = desiredModules.filter(
        (moduleKey) => !currentSet.has(moduleKey),
      );
      if (newModules.length > 0) {
        await tx.insert(moduleAccess).values(
          newModules.map((moduleKey) => ({
            id: randomUUID(),
            tenantId,
            userId,
            moduleKey,
            grantedBy: actorId,
            grantedAt: updatedAt,
          })),
        );
      }
    }

    if (command.executiveStatus !== undefined) {
      await tx
        .insert(executiveAccess)
        .values({
          userId,
          tenantId,
          status: command.executiveStatus,
          updatedBy: actorId,
          createdAt: updatedAt,
          updatedAt,
        })
        .onConflictDoUpdate({
          target: executiveAccess.userId,
          set: {
            tenantId,
            status: command.executiveStatus,
            updatedBy: actorId,
            updatedAt,
          },
        });
    }

    const after: AccessState = {
      accountStatus: before.accountStatus,
      applicationRoles: nextApplicationRoles,
      modules: nextModules,
      executiveStatus: nextExecutiveStatus,
    };

    await appendAsnAccessAuditEvent(tx, {
      action: "asn.access.updated",
      actorId,
      targetTable: "users",
      targetId: userId,
      metadata: {
        before: {
          applicationRoles: before.applicationRoles.map((role) => role.key),
          modules: before.modules,
          executiveStatus: before.executiveStatus,
        },
        after: {
          applicationRoles: after.applicationRoles.map((role) => role.key),
          modules: after.modules,
          executiveStatus: after.executiveStatus,
        },
      },
      occurredAt: updatedAt,
    });

    return {
      userId,
      accountStatus: before.accountStatus,
      applicationRoles: after.applicationRoles,
      modules: after.modules,
      executiveStatus: after.executiveStatus,
      updatedAt: updatedAt.toISOString(),
    };
  });
}

export async function getAsnActivationRequirements(
  userId: string,
  tenantId: string,
) {
  const database = db();
  const rows = await database
    .select({
      userId: users.id,
      status: users.status,
      emailVerifiedAt: users.emailVerifiedAt,
      kycStatus: kycRoster.status,
    })
    .from(users)
    .innerJoin(asnProfiles, eq(asnProfiles.userId, users.id))
    .leftJoin(
      kycRoster,
      and(eq(kycRoster.userId, users.id), eq(kycRoster.tenantId, tenantId)),
    )
    .where(
      and(
        eq(users.id, userId),
        eq(users.tenantId, tenantId),
        eq(asnProfiles.tenantId, tenantId),
      ),
    )
    .limit(1);
  const user = rows[0];
  if (!user) throw new NotFoundError("ASN tidak ditemukan");

  return {
    userId: user.userId,
    accountStatus: user.status,
    requirements: [
      {
        key: "email_verification",
        status: user.emailVerifiedAt ? "fulfilled" : "pending",
        completedAt: user.emailVerifiedAt?.toISOString() ?? null,
      },
      {
        key: "admin_approval",
        status:
          user.status === "active"
            ? "fulfilled"
            : user.status === "suspended"
              ? "rejected"
              : "pending",
      },
      {
        key: "identity_verification",
        status:
          user.kycStatus === "verified"
            ? "fulfilled"
            : (user.kycStatus ?? "not_submitted"),
      },
    ],
  };
}
