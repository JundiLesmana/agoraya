import {
  and,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import {
  applicationRoles,
  auditEvents,
  cmsContents,
  cmsRiskReviews,
  kycApprovals,
  roles,
  tickets,
  userApplicationRoles,
  userRoles,
} from "@/lib/db/schema";
import { asnProfiles, jobPositions, users } from "@/modules/identity/db";
import { hasNonCitizenAccountRole } from "./account-scope";
import {
  ASN_PERFORMANCE_TASK_TYPES,
  type AsnPerformanceFilters,
  type AsnPerformanceTaskType,
} from "./performance-schema";

function createEmptyTaskBreakdown(): Record<AsnPerformanceTaskType, number> {
  return {
    layanan_kesehatan: 0,
    layanan_pendidikan: 0,
    layanan_sosial: 0,
    laporan_warga: 0,
    perizinan: 0,
    submit_cms: 0,
    review_cms: 0,
    review_kyc: 0,
    review_workflow: 0,
    access_management: 0,
    decision_engine: 0,
  };
}

interface PerformanceEventRow {
  readonly userId: string;
  readonly tenantId: string;
  readonly taskType: AsnPerformanceTaskType;
  readonly completedAt: Date;
  readonly targetId?: string | null;
}

interface AsnIdentityRow {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly nip: string | null;
  readonly opd: string | null;
  readonly unit: string | null;
  readonly position: string | null;
  readonly roles: readonly string[];
}

interface ParticipantMetrics {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly roles: readonly string[];
  readonly nip: string | null;
  readonly opd: string | null;
  readonly unit: string | null;
  readonly position: string | null;
  readonly assignedTasks: number;
  readonly completedTasks: number;
  readonly completionRate: number | null;
  readonly taskBreakdown: Record<AsnPerformanceTaskType, number>;
}

export async function getAsnPerformanceSummary(
  tenantId: string,
  filters: AsnPerformanceFilters,
) {
  const metrics = await buildPerformanceMetrics(tenantId, filters);
  const active = metrics.filter((item) => item.assignedTasks > 0);
  const totalAssigned = active.reduce((sum, item) => sum + item.assignedTasks, 0);
  const totalCompleted = active.reduce((sum, item) => sum + item.completedTasks, 0);

  return {
    range: serializeRange(filters),
    totals: {
      asnCount: metrics.length,
      assignedTasks: totalAssigned,
      completedTasks: totalCompleted,
      completionRate: null,
      withActivityCount: active.length,
      noActivityCount: metrics.length - active.length,
    },
    byTaskType: summarizeByTaskType(active),
  };
}

export async function getAsnPerformanceTrends(
  tenantId: string,
  filters: AsnPerformanceFilters,
) {
  const events = await listPerformanceEvents(tenantId, filters);
  const buckets = new Map<string, Record<AsnPerformanceTaskType, number>>();

  for (const event of events) {
    const key = bucketKey(event.completedAt, filters.granularity);
    const current = buckets.get(key) ?? createEmptyTaskBreakdown();
    current[event.taskType] += 1;
    buckets.set(key, current);
  }

  return {
    range: serializeRange(filters),
    granularity: filters.granularity,
    items: [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([periodStart, counts]) => ({
      periodStart,
      totalCompleted: Object.values(counts).reduce((sum, value) => sum + value, 0),
      taskBreakdown: counts,
    })),
  };
}

export async function getLowestActivityAsn(
  tenantId: string,
  filters: AsnPerformanceFilters,
) {
  const metrics = await buildPerformanceMetrics(tenantId, filters);
  return {
    range: serializeRange(filters),
    items: metrics
      .sort((left, right) => {
        const rateDelta = (left.completionRate ?? 1) - (right.completionRate ?? 1);
        if (rateDelta !== 0) return rateDelta;
        if (left.completedTasks !== right.completedTasks) {
          return left.completedTasks - right.completedTasks;
        }
        return left.name.localeCompare(right.name);
      })
      .slice(0, filters.limit),
  };
}

export async function getAsnPerformanceDetails(
  tenantId: string,
  filters: AsnPerformanceFilters,
) {
  const metrics = await buildPerformanceMetrics(tenantId, filters);
  const items = metrics.slice(filters.offset, filters.offset + filters.limit).map((item) => ({
    ...item,
    statusLabel:
      item.assignedTasks === 0 ? "Belum ada aktivitas" : "Aktivitas tercatat",
  }));

  return {
    range: serializeRange(filters),
    total: metrics.length,
    limit: filters.limit,
    offset: filters.offset,
    items,
  };
}

export async function getAsnPerformanceActionNeeded(
  tenantId: string,
  filters: AsnPerformanceFilters,
) {
  const thresholdRate = Number(process.env.PERFORMANCE_ACTION_THRESHOLD_RATE ?? "0.75");
  const minimumTasks = Number(process.env.PERFORMANCE_ACTION_MIN_TASKS ?? "5");
  const metrics = await buildPerformanceMetrics(tenantId, filters);

  return {
    range: serializeRange(filters),
    thresholdRate,
    minimumTasks,
    items: metrics.filter(
      (item) =>
        item.assignedTasks >= minimumTasks &&
        item.completionRate !== null &&
        item.completionRate < thresholdRate,
    ),
  };
}

export async function exportAsnPerformance(
  tenantId: string,
  filters: AsnPerformanceFilters,
  format: "json" | "csv",
) {
  const details = await getAsnPerformanceDetails(tenantId, filters);
  if (format === "csv") {
    const header = [
      "userId",
      "name",
      "email",
      "nip",
      "opd",
      "unit",
      "position",
      "roles",
      "activityCount",
      "statusLabel",
      ...ASN_PERFORMANCE_TASK_TYPES,
    ];
    const rows = details.items.map((item) =>
      [
        item.userId,
        item.name,
        item.email,
        item.nip ?? "",
        item.opd ?? "",
        item.unit ?? "",
        item.position ?? "",
        item.roles.join(", "),
        item.assignedTasks,
        item.statusLabel,
        ...ASN_PERFORMANCE_TASK_TYPES.map((taskType) => item.taskBreakdown[taskType]),
      ]
        .map((value) => JSON.stringify(String(value)))
        .join(","),
    );
    return {
      body: [header.join(","), ...rows].join("\n"),
      contentType: "text/csv; charset=utf-8",
    };
  }

  return {
    body: JSON.stringify(details, null, 2),
    contentType: "application/json; charset=utf-8",
  };
}

async function buildPerformanceMetrics(
  tenantId: string,
  filters: AsnPerformanceFilters,
): Promise<ParticipantMetrics[]> {
  const [identities, events] = await Promise.all([
    listAsnParticipants(tenantId, filters),
    listPerformanceEvents(tenantId, filters),
  ]);

  const countsByUser = new Map<string, Record<AsnPerformanceTaskType, number>>();
  for (const event of events) {
    const current = countsByUser.get(event.userId) ?? createEmptyTaskBreakdown();
    current[event.taskType] += 1;
    countsByUser.set(event.userId, current);
  }

  return identities
    .map((identity) => {
      const taskBreakdown = countsByUser.get(identity.userId) ?? createEmptyTaskBreakdown();
      const assignedTasks = Object.values(taskBreakdown).reduce(
        (sum, value) => sum + value,
        0,
      );
      return {
        ...identity,
        assignedTasks,
        completedTasks: assignedTasks,
        completionRate: null,
        taskBreakdown,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function listAsnParticipants(
  tenantId: string,
  filters: AsnPerformanceFilters,
): Promise<AsnIdentityRow[]> {
  const database = db();
  const conditions = [
    eq(users.tenantId, tenantId),
    hasNonCitizenAccountRole(database, tenantId),
  ];
  if (filters.opd) conditions.push(ilike(asnProfiles.opdName, contains(filters.opd)));
  if (filters.unit) conditions.push(ilike(asnProfiles.unitName, contains(filters.unit)));
  if (filters.position) conditions.push(ilike(jobPositions.name, contains(filters.position)));
  if (filters.q) {
    const search = contains(filters.q);
    const searchCondition = or(ilike(users.name, search), ilike(asnProfiles.nip, search));
    if (searchCondition) conditions.push(searchCondition);
  }

  const people = await database
    .select({
      userId: users.id,
      name: users.name,
      email: users.email,
      nip: asnProfiles.nip,
      opd: asnProfiles.opdName,
      unit: asnProfiles.unitName,
      position: jobPositions.name,
    })
    .from(users)
    .leftJoin(
      asnProfiles,
      and(
        eq(asnProfiles.userId, users.id),
        eq(asnProfiles.tenantId, tenantId),
      ),
    )
    .leftJoin(jobPositions, eq(jobPositions.id, asnProfiles.positionId))
    .where(and(...conditions));
  if (people.length === 0) return [];

  const userIds = people.map((person) => person.userId);
  const [applicationRoleRows, legacyRoleRows] = await Promise.all([
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
        userId: userRoles.userId,
        key: roles.key,
        name: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(
        and(
          inArray(userRoles.userId, userIds),
          eq(roles.tenantId, tenantId),
          isNull(userRoles.revokedAt),
          or(isNull(userRoles.expiresAt), gt(userRoles.expiresAt, new Date())),
        ),
      ),
  ]);
  const roleNames = new Map<string, Map<string, string>>();
  for (const role of [...applicationRoleRows, ...legacyRoleRows]) {
    const userRoles = roleNames.get(role.userId) ?? new Map<string, string>();
    userRoles.set(role.key, role.name);
    roleNames.set(role.userId, userRoles);
  }
  return people.map((person) => ({
    ...person,
    roles: [...(roleNames.get(person.userId)?.values() ?? [])].sort((a, b) =>
      a.localeCompare(b),
    ),
  }));
}

async function listPerformanceEvents(
  tenantId: string,
  filters: AsnPerformanceFilters,
): Promise<PerformanceEventRow[]> {
  const database = db();
  const events: PerformanceEventRow[] = [];

  const auditRows = await database
    .select({
      actorId: auditEvents.actorId,
      action: auditEvents.action,
      targetTable: auditEvents.targetTable,
      targetId: auditEvents.targetId,
      metadata: auditEvents.metadata,
      completedAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .where(
      and(
        isNotNull(auditEvents.actorId),
        sql`${auditEvents.metadata} ->> 'tenantId' = ${tenantId}`,
        gte(auditEvents.createdAt, filters.startDate),
        lte(auditEvents.createdAt, filters.endDate),
      ),
    );
  const auditedReviewItemIds = new Set<string>();
  for (const row of auditRows) {
    const metadata = isRecord(row.metadata) ? row.metadata : {};
    const taskType = auditTaskType(row.action, metadata);
    if (!taskType || !filters.taskTypes.includes(taskType) || !row.actorId) {
      continue;
    }
    if (
      taskType === "review_workflow" &&
      row.targetId &&
      ["tickets", "service_applications"].includes(row.targetTable)
    ) {
      auditedReviewItemIds.add(row.targetId);
    }
    events.push({
      userId: row.actorId,
      tenantId,
      taskType,
      completedAt: row.completedAt,
      targetId: row.targetId,
    });
  }

  if (filters.taskTypes.includes("submit_cms")) {
    const submitRows = await database
      .select({
        userId: cmsContents.createdBy,
        tenantId: cmsContents.tenantId,
        completedAt: cmsContents.createdAt,
        taskType: sql<AsnPerformanceTaskType>`'submit_cms'`,
      })
      .from(cmsContents)
      .where(
        and(
          eq(cmsContents.tenantId, tenantId),
          isNull(cmsContents.deletedAt),
          gte(cmsContents.createdAt, filters.startDate),
          lte(cmsContents.createdAt, filters.endDate),
        ),
      );
    events.push(...submitRows);
  }

  if (filters.taskTypes.includes("review_cms")) {
    const reviewRows = await database
      .select({
        userId: cmsRiskReviews.reviewerId,
        tenantId: cmsRiskReviews.tenantId,
        completedAt: cmsRiskReviews.createdAt,
        taskType: sql<AsnPerformanceTaskType>`'review_cms'`,
      })
      .from(cmsRiskReviews)
      .where(
        and(
          eq(cmsRiskReviews.tenantId, tenantId),
          gte(cmsRiskReviews.createdAt, filters.startDate),
          lte(cmsRiskReviews.createdAt, filters.endDate),
        ),
      );
    events.push(...reviewRows);
  }

  if (filters.taskTypes.includes("review_kyc")) {
    try {
      const kycRows = await database
        .select({
          userId: kycApprovals.approverId,
          tenantId: kycApprovals.tenantId,
          completedAt: kycApprovals.createdAt,
          taskType: sql<AsnPerformanceTaskType>`'review_kyc'`,
        })
        .from(kycApprovals)
        .where(
          and(
            eq(kycApprovals.tenantId, tenantId),
            inArray(kycApprovals.decision, ["approved", "rejected"]),
            gte(kycApprovals.createdAt, filters.startDate),
            lte(kycApprovals.createdAt, filters.endDate),
          ),
        );
      events.push(...kycRows.filter((row) => row.userId !== null) as PerformanceEventRow[]);
    } catch {
      // kyc_approvals table may not be migrated in all environments
    }
  }

  const ticketCategoryMap: Record<string, AsnPerformanceTaskType> = {
    health: "layanan_kesehatan",
    kesehatan: "layanan_kesehatan",
    layanan_kesehatan: "layanan_kesehatan",
    education: "layanan_pendidikan",
    pendidikan: "layanan_pendidikan",
    layanan_pendidikan: "layanan_pendidikan",
    social: "layanan_sosial",
    sosial: "layanan_sosial",
    layanan_sosial: "layanan_sosial",
    permit: "perizinan",
    perizinan: "perizinan",
    izin: "perizinan",
    civic_reporting: "laporan_warga",
    laporan_warga: "laporan_warga",
    infrastruktur: "laporan_warga",
    lingkungan: "laporan_warga",
    ilumniasi: "laporan_warga",
    laporan: "laporan_warga",
  };

  const hasTicketTasks = filters.taskTypes.some((t) =>
    [
      "layanan_kesehatan",
      "layanan_pendidikan",
      "layanan_sosial",
      "laporan_warga",
      "perizinan",
    ].includes(t),
  );

  if (hasTicketTasks) {
    try {
      const ticketRows = await database
        .select({
          id: tickets.id,
          assigneeId: tickets.assigneeId,
          tenantId: tickets.tenantId,
          category: tickets.category,
          status: tickets.status,
          resolvedAt: tickets.resolvedAt,
          closedAt: tickets.closedAt,
        })
        .from(tickets)
        .where(
          and(
            eq(tickets.tenantId, tenantId),
            inArray(tickets.status, ["resolved", "closed"]),
            sql`${tickets.assigneeId} is not null`,
          ),
        );

      for (const row of ticketRows) {
        if (!row.assigneeId || auditedReviewItemIds.has(row.id)) continue;
        const taskType =
          ticketCategoryMap[row.category.toLowerCase()] ?? "laporan_warga";
        if (!filters.taskTypes.includes(taskType)) continue;

        const completedDate = row.resolvedAt ?? row.closedAt;
        if (!completedDate) continue;

        const date = new Date(completedDate);
        if (date >= filters.startDate && date <= filters.endDate) {
          events.push({
            userId: row.assigneeId,
            tenantId: row.tenantId,
            completedAt: date,
            taskType,
          });
        }
      }
    } catch {
      // tickets table fallback
    }
  }

  return events;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function auditTaskType(
  action: string,
  metadata: Readonly<Record<string, unknown>>,
): AsnPerformanceTaskType | null {
  if (metadata.result === "rejected" || metadata.result === "failure") {
    return null;
  }
  switch (action) {
    case "asn.dataset.submitted":
      return "submit_cms";
    case "asn.project_progress.saved":
      return metadata.status === "submitted" ? "submit_cms" : null;
    case "asn.statistics.saved":
    case "asn.apbd.saved":
      return metadata.status === "published" ? "submit_cms" : null;
    case "review.assignment.updated":
    case "review.note.saved":
    case "review.status.updated":
    case "asn.dataset.bps_published":
      return "review_workflow";
    case "asn.access.updated":
      return "access_management";
    case "decision_engine.run.create":
      return "decision_engine";
    default:
      return null;
  }
}

function summarizeByTaskType(items: readonly ParticipantMetrics[]) {
  const result = {} as Record<
    AsnPerformanceTaskType,
    { assignedTasks: number; completedTasks: number; completionRate: number | null }
  >;
  for (const taskType of ASN_PERFORMANCE_TASK_TYPES) {
    result[taskType] = summarizeTaskType(items, taskType);
  }
  return result;
}

function summarizeTaskType(
  items: readonly ParticipantMetrics[],
  taskType: AsnPerformanceTaskType,
) {
  const assignedTasks = items.reduce(
    (sum, item) => sum + item.taskBreakdown[taskType],
    0,
  );
  return {
    assignedTasks,
    completedTasks: assignedTasks,
    completionRate: null,
  };
}

function contains(value: string): string {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function serializeRange(filters: AsnPerformanceFilters) {
  return {
    startDate: filters.startDate.toISOString(),
    endDate: filters.endDate.toISOString(),
    taskTypes: filters.taskTypes,
  };
}


function bucketKey(date: Date, granularity: "day" | "week"): string {
  const value = new Date(date);
  if (granularity === "week") {
    const day = value.getUTCDay();
    const delta = day === 0 ? -6 : 1 - day;
    value.setUTCDate(value.getUTCDate() + delta);
  }
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
}
