import { and, eq, gte, ilike, inArray, isNull, lte, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { cmsContents, cmsRiskReviews, kycApprovals } from "@/lib/db/schema";
import { asnProfiles, jobPositions, users } from "@/modules/identity/db";
import type {
  AsnPerformanceFilters,
  AsnPerformanceTaskType,
} from "./performance-schema";

interface PerformanceEventRow {
  readonly userId: string;
  readonly tenantId: string;
  readonly taskType: AsnPerformanceTaskType;
  readonly completedAt: Date;
}

interface AsnIdentityRow {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
  readonly nip: string | null;
  readonly opd: string | null;
  readonly unit: string | null;
  readonly position: string | null;
}

interface ParticipantMetrics {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
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
      asnCount: active.length,
      assignedTasks: totalAssigned,
      completedTasks: totalCompleted,
      completionRate: totalAssigned > 0 ? ratio(totalCompleted, totalAssigned) : null,
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
    const current =
      buckets.get(key) ??
      ({ submit_cms: 0, review_cms: 0, review_kyc: 0 } satisfies Record<
        AsnPerformanceTaskType,
        number
      >);
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
      .filter((item) => item.assignedTasks > 0)
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
      item.assignedTasks === 0 ? "Tidak ada penugasan" : completionLabel(item.completionRate),
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
      "assignedTasks",
      "completedTasks",
      "completionRate",
      "statusLabel",
      "submitCms",
      "reviewCms",
      "reviewKyc",
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
        item.assignedTasks,
        item.completedTasks,
        item.completionRate ?? "",
        item.statusLabel,
        item.taskBreakdown.submit_cms,
        item.taskBreakdown.review_cms,
        item.taskBreakdown.review_kyc,
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
    const current =
      countsByUser.get(event.userId) ??
      ({ submit_cms: 0, review_cms: 0, review_kyc: 0 } satisfies Record<
        AsnPerformanceTaskType,
        number
      >);
    current[event.taskType] += 1;
    countsByUser.set(event.userId, current);
  }

  return identities
    .map((identity) => {
      const taskBreakdown =
        countsByUser.get(identity.userId) ??
        ({ submit_cms: 0, review_cms: 0, review_kyc: 0 } satisfies Record<
          AsnPerformanceTaskType,
          number
        >);
      const assignedTasks = Object.values(taskBreakdown).reduce(
        (sum, value) => sum + value,
        0,
      );
      return {
        ...identity,
        assignedTasks,
        completedTasks: assignedTasks,
        completionRate: assignedTasks > 0 ? 1 : null,
        taskBreakdown,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function listAsnParticipants(
  tenantId: string,
  filters: AsnPerformanceFilters,
): Promise<AsnIdentityRow[]> {
  const conditions = [eq(users.tenantId, tenantId), eq(asnProfiles.tenantId, tenantId)];
  if (filters.opd) conditions.push(ilike(asnProfiles.opdName, contains(filters.opd)));
  if (filters.unit) conditions.push(ilike(asnProfiles.unitName, contains(filters.unit)));
  if (filters.position) conditions.push(ilike(jobPositions.name, contains(filters.position)));
  if (filters.q) {
    const search = contains(filters.q);
    const searchCondition = or(ilike(users.name, search), ilike(asnProfiles.nip, search));
    if (searchCondition) conditions.push(searchCondition);
  }

  return db()
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
    .innerJoin(asnProfiles, eq(asnProfiles.userId, users.id))
    .leftJoin(jobPositions, eq(jobPositions.id, asnProfiles.positionId))
    .where(and(...conditions));
}

async function listPerformanceEvents(
  tenantId: string,
  filters: AsnPerformanceFilters,
): Promise<PerformanceEventRow[]> {
  const database = db();
  const events: PerformanceEventRow[] = [];

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
  }

  return events;
}

function summarizeByTaskType(items: readonly ParticipantMetrics[]) {
  return {
    submit_cms: summarizeTaskType(items, "submit_cms"),
    review_cms: summarizeTaskType(items, "review_cms"),
    review_kyc: summarizeTaskType(items, "review_kyc"),
  };
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
    completionRate: assignedTasks > 0 ? 1 : null,
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

function ratio(completed: number, assigned: number): number {
  return Number((completed / assigned).toFixed(4));
}

function completionLabel(rate: number | null): string {
  if (rate === null) return "Tidak ada penugasan";
  if (rate >= 0.9) return "Sangat baik";
  if (rate >= 0.75) return "Perlu perhatian";
  return "Butuh tindakan";
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
