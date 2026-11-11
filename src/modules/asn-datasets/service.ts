import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { getDefaultDatabase } from "@/lib/db/client";
import type { Database, Row } from "@/lib/db/types";
import type { Session } from "@/lib/auth/session";
import { appendAuditEvent } from "@/modules/audit/service";
import { uuidOrNull } from "@/modules/rbac/audit";
import {
  asnDatasetSubmissions,
  bpsStatistics,
  datasets,
} from "@/lib/db/schema";
import { datasetSubmissionPayloadSchema } from "./contract";
import type {
  DatasetAssignment,
  DatasetSource,
  DatasetSubmissionPayload,
} from "./contract";
import { parseDatasetCsv } from "./domain";
import { bpsRegionCodesForAssignment } from "./region-code";

type AssignmentRow = Row & {
  assignmentType: "statistics" | "apbd" | "project";
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: string;
  referenceYear: number;
  projectId: string | null;
  projectLabel: string | null;
};

type SubmissionRow = Row & {
  id: string;
  datasetId: string;
  title: string;
  summary: string;
  category: "Anggaran" | "Proyek" | "Statistik";
  sourceOrganization: string;
  sourceLabel: "BPS_API" | "ASN_SUBMITTED";
  sourceKind: "manual" | "bps";
  status: "draft" | "submitted" | "published";
  assignmentType: "statistics" | "apbd" | "project";
  agencyId: string | null;
  regionId: string | null;
  regionName: string | null;
  sectorId: string;
  referenceYear: number;
  projectId: string | null;
  projectLabel: string | null;
  recordCount: number;
  createdByName: string;
  updatedAt: Date | string;
  submittedAt: Date | string | null;
  createdBy?: string;
  sourceUrl?: string | null;
  licenseName?: string;
  licenseUrl?: string | null;
  tags?: string[];
  dataDictionary?: unknown;
  csvPreview?: string;
  description?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  frequency?: "monthly" | "quarterly" | "annual" | "irregular";
  csvData?: string;
};

export class AsnDatasetError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AsnDatasetError";
  }
}

function canManageTenantDatasets(session: Session): boolean {
  return session.roles.some((role) => role === "admin" || role === "superadmin");
}

function isoDate(value: Date | string | null): string | null {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Dataset submission contains an invalid timestamp.");
  }
  return date.toISOString();
}

async function withUserContext<T>(
  session: Session,
  operation: (transaction: Database) => Promise<T>,
  database: Database = getDefaultDatabase(),
): Promise<T> {
  return database.transaction(async (transaction) => {
    await transaction.query("SELECT set_config('app.tenant_id', $1, true)", [
      session.tenantId,
    ]);
    await transaction.query("SELECT set_config('app.user_id', $1, true)", [
      session.userId,
    ]);
    return operation(transaction);
  });
}

function mapAssignment(row: AssignmentRow): DatasetAssignment {
  return {
    assignmentType: row.assignmentType,
    agencyId: row.agencyId,
    regionId: row.regionId,
    regionName: row.regionName,
    sectorId: row.sectorId,
    referenceYear: row.referenceYear,
    projectId: row.projectId,
    projectLabel: row.projectLabel,
  };
}

async function listAssignments(
  transaction: Database,
  session: Session,
): Promise<DatasetAssignment[]> {
  const canManageTenant = canManageTenantDatasets(session);
  const rows = await transaction.query<AssignmentRow>(
    `SELECT 'statistics'::varchar AS "assignmentType",
       agency_id AS "agencyId", region_id AS "regionId",
       region_name AS "regionName", sector_id AS "sectorId",
       EXTRACT(YEAR FROM NOW())::int AS "referenceYear",
       NULL::text AS "projectId", NULL::text AS "projectLabel"
     FROM statistic_operator_assignments
     WHERE tenant_id = $1 AND ($3::boolean OR user_id = $2)
     UNION
     SELECT 'apbd'::varchar AS "assignmentType",
       agency_id AS "agencyId", region_id AS "regionId",
       region_name AS "regionName", sector_id AS "sectorId",
       EXTRACT(YEAR FROM NOW())::int AS "referenceYear",
       NULL::text AS "projectId", NULL::text AS "projectLabel"
     FROM apbd_operator_assignments
     WHERE tenant_id = $1 AND ($3::boolean OR user_id = $2)
     UNION
     SELECT 'project'::varchar AS "assignmentType",
       ''::text AS "agencyId", location AS "regionId",
       location AS "regionName", sector AS "sectorId",
       fiscal_year AS "referenceYear", id::text AS "projectId",
       external_project_id || ' — ' || package_name AS "projectLabel"
     FROM infrastructure_projects
     WHERE tenant_id = $1 AND ($3::boolean OR assigned_user_id = $2)
     ORDER BY "assignmentType", "referenceYear" DESC, "regionName", "sectorId"`,
    [session.tenantId, session.userId, canManageTenant],
  );
  return rows.map(mapAssignment);
}

function mapSummary(row: SubmissionRow) {
  return {
    id: row.id,
    datasetId: row.datasetId,
    title: row.title,
    summary: row.summary,
    category: row.category,
    sourceOrganization: row.sourceOrganization,
    sourceLabel: row.sourceLabel,
    sourceKind: row.sourceKind,
    status: row.status,
    assignmentType: row.assignmentType,
    agencyId: row.agencyId,
    regionId: row.regionId,
    regionName: row.regionName,
    sectorId: row.sectorId,
    referenceYear: row.referenceYear,
    projectId: row.projectId,
    projectLabel: row.projectLabel,
    recordCount: Number(row.recordCount),
    createdByName: row.createdByName,
    updatedAt: isoDate(row.updatedAt),
    submittedAt: isoDate(row.submittedAt),
  };
}

async function listSubmissionRows(
  transaction: Database,
  session: Session,
  pendingReview = false,
): Promise<SubmissionRow[]> {
  const submissionFilter = pendingReview
    ? `AND submission.status = 'submitted'
       AND submission.source_kind IN ('manual', 'bps')
       AND dataset.slug <> 'statistik-bps'
       AND submission.created_by <> $2`
    : `AND (submission.status <> 'draft' OR submission.created_by = $2)`;
  const reviewFields = pendingReview
    ? `submission.source_url AS "sourceUrl",
       submission.license_name AS "licenseName",
       submission.data_dictionary AS "dataDictionary",
       LEFT(submission.csv_data, 4000) AS "csvPreview"`
    : `NULL::text AS "sourceUrl", NULL::text AS "licenseName",
       NULL::jsonb AS "dataDictionary", NULL::text AS "csvPreview"`;
  return transaction.query<SubmissionRow>(
    `SELECT submission.id::text AS id, submission.dataset_id::text AS "datasetId",
       submission.title, submission.summary, submission.category,
       submission.source_organization AS "sourceOrganization",
       submission.source_label AS "sourceLabel", submission.source_kind AS "sourceKind",
       CASE
         WHEN submission.status = 'submitted' AND dataset.is_published
           THEN 'published'
         ELSE submission.status
       END AS status,
       submission.assignment_type AS "assignmentType",
       submission.agency_id AS "agencyId", submission.region_id AS "regionId",
       submission.region_name AS "regionName", submission.sector_id AS "sectorId",
       submission.reference_year AS "referenceYear",
       submission.project_id::text AS "projectId",
       CASE WHEN project.id IS NULL THEN NULL
         ELSE project.external_project_id || ' — ' || project.package_name
       END AS "projectLabel",
       submission.record_count AS "recordCount",
       submission.created_by::text AS "createdBy",
       creator.name AS "createdByName",
       ${reviewFields},
       submission.updated_at AS "updatedAt", submission.submitted_at AS "submittedAt"
     FROM asn_dataset_submissions submission
     INNER JOIN datasets dataset ON dataset.id = submission.dataset_id
     INNER JOIN users creator
       ON creator.id = submission.created_by AND creator.tenant_id = submission.tenant_id
     LEFT JOIN infrastructure_projects project
       ON project.id = submission.project_id AND project.tenant_id = submission.tenant_id
     WHERE submission.tenant_id = $1
       ${submissionFilter}
       AND ($3::boolean OR (
         (
           submission.assignment_type = 'statistics'
           AND EXISTS (
             SELECT 1 FROM statistic_operator_assignments assignment
             WHERE assignment.tenant_id = submission.tenant_id
               AND assignment.user_id = $2
               AND assignment.agency_id = submission.agency_id
               AND assignment.region_id = submission.region_id
               AND assignment.sector_id = submission.sector_id
           )
         )
         OR (
           submission.assignment_type = 'apbd'
           AND EXISTS (
             SELECT 1 FROM apbd_operator_assignments assignment
             WHERE assignment.tenant_id = submission.tenant_id
               AND assignment.user_id = $2
               AND assignment.agency_id = submission.agency_id
               AND assignment.region_id = submission.region_id
               AND assignment.sector_id = submission.sector_id
           )
         )
         OR (
           submission.assignment_type = 'project'
           AND EXISTS (
             SELECT 1 FROM infrastructure_projects assigned_project
             WHERE assigned_project.id = submission.project_id
               AND assigned_project.tenant_id = submission.tenant_id
               AND assigned_project.assigned_user_id = $2
           )
         )
       ))
     ORDER BY submission.updated_at DESC, submission.id
     LIMIT 200`,
    [session.tenantId, session.userId, canManageTenantDatasets(session)],
  );
}

export async function getPendingAsnDatasetSubmissions(
  session: Session,
  database?: Database,
) {
  return withUserContext(
    session,
    async (transaction) => {
      const rows = await listSubmissionRows(transaction, session, true);
      return rows.map((row) => ({
        ...mapSummary(row),
        sourceUrl: row.sourceUrl ?? null,
        licenseName: row.licenseName ?? "",
        dataDictionary: row.dataDictionary ?? [],
        csvPreview: row.csvPreview ?? "",
      }));
    },
    database,
  );
}

export async function publishAsnDatasetSubmission(
  session: Session,
  submissionId: string,
  database: Database = getDefaultDatabase(),
) {
  return withUserContext(
    session,
    async (transaction) => {
      const submission = await transaction.queryOne<
        Row & {
          id: string;
          datasetId: string;
          title: string;
          createdBy: string;
          sourceKind: "manual" | "bps";
          assignmentType: DatasetAssignment["assignmentType"];
          agencyId: string | null;
          regionId: string | null;
          sectorId: string;
          projectId: string | null;
          csvData: string;
          slug: string;
        }
      >(
        `SELECT submission.id::text AS id,
           submission.dataset_id::text AS "datasetId", submission.title,
           submission.created_by::text AS "createdBy",
           submission.source_kind AS "sourceKind",
           submission.assignment_type AS "assignmentType",
           submission.agency_id AS "agencyId",
           submission.region_id AS "regionId",
           submission.sector_id AS "sectorId",
           submission.project_id::text AS "projectId",
           submission.csv_data AS "csvData", dataset.slug
         FROM asn_dataset_submissions submission
         INNER JOIN datasets dataset ON dataset.id = submission.dataset_id
         WHERE submission.id = $1 AND submission.tenant_id = $2
           AND submission.status = 'submitted'
           AND submission.source_kind IN ('manual', 'bps')
           AND dataset.slug <> 'statistik-bps'
           AND dataset.is_published = FALSE
         FOR UPDATE OF submission, dataset`,
        [submissionId, session.tenantId],
      );
      if (!submission) {
        throw new AsnDatasetError(
          "Pengajuan dataset tidak ditemukan atau sudah ditinjau.",
          404,
        );
      }
      if (submission.createdBy === session.userId) {
        throw new AsnDatasetError(
          "Pembuat dataset tidak dapat meninjau pengajuannya sendiri.",
          403,
        );
      }

      const assignments = await listAssignments(transaction, session);
      const assigned = assignments.some((assignment) =>
        submission.assignmentType === "project"
          ? assignment.assignmentType === "project" &&
            assignment.projectId === submission.projectId
          : assignment.assignmentType === submission.assignmentType &&
            assignment.agencyId === submission.agencyId &&
            assignment.regionId === submission.regionId &&
            assignment.sectorId === submission.sectorId,
      );
      if (!assigned) {
        throw new AsnDatasetError(
          "Dataset berada di luar penugasan yang dapat Anda tinjau.",
          403,
        );
      }

      const now = new Date();
      const published = await transaction.queryOne<Row & { id: string }>(
        `UPDATE datasets
         SET is_published = TRUE, csv_data = $2, last_updated_at = $3
         WHERE id = $1 AND is_published = FALSE
         RETURNING id::text AS id`,
        [submission.datasetId, submission.csvData, now],
      );
      if (!published) {
        throw new AsnDatasetError(
          "Dataset sudah dipublikasikan oleh peninjau lain.",
          409,
        );
      }

      await transaction.query(
        `INSERT INTO dataset_resources (dataset_id, title, format, url)
         VALUES ($1, 'Unduh data CSV', 'CSV', $2)
         ON CONFLICT (dataset_id, format, url) DO NOTHING`,
        [submission.datasetId, `/api/asn/datasets/${submission.slug}/download`],
      );
      await transaction.query(
        `INSERT INTO audit_events (
           id, actor_id, action, target_table, target_id, metadata
         ) VALUES (
           gen_random_uuid(), $1, 'asn.dataset.published',
           'asn_dataset_submissions', $2, $3::jsonb
         )`,
        [
          session.userId,
          submission.id,
          JSON.stringify({
            tenantId: session.tenantId,
            actorRole: session.roles.join(","),
            datasetId: submission.datasetId,
            sourceKind: submission.sourceKind,
            assignmentType: submission.assignmentType,
            agencyId: submission.agencyId,
            regionId: submission.regionId,
            sectorId: submission.sectorId,
            projectId: submission.projectId,
            result: "success",
          }),
        ],
      );

      return {
        submissionId: submission.id,
        datasetId: submission.datasetId,
        title: submission.title,
        slug: submission.slug,
      };
    },
    database,
  );
}

export async function getAsnDatasetWorkspace(
  session: Session,
  submissionId?: string,
  database?: Database,
) {
  return withUserContext(
    session,
    async (transaction) => {
      const [assignments, rows] = await Promise.all([
        listAssignments(transaction, session),
        listSubmissionRows(transaction, session),
      ]);
      let detail: SubmissionRow | null = null;
      if (submissionId) {
        detail =
          (await transaction.queryOne<SubmissionRow>(
            `SELECT submission.id::text AS id,
               submission.dataset_id::text AS "datasetId", submission.title,
               submission.summary, submission.category,
               submission.source_organization AS "sourceOrganization",
               submission.source_label AS "sourceLabel",
               submission.source_kind AS "sourceKind", submission.status,
               submission.assignment_type AS "assignmentType",
               submission.agency_id AS "agencyId", submission.region_id AS "regionId",
               submission.region_name AS "regionName", submission.sector_id AS "sectorId",
               submission.reference_year AS "referenceYear",
               submission.project_id::text AS "projectId",
               CASE WHEN project.id IS NULL THEN NULL
                 ELSE project.external_project_id || ' — ' || project.package_name
               END AS "projectLabel",
               submission.record_count AS "recordCount", creator.name AS "createdByName",
               submission.updated_at AS "updatedAt", submission.submitted_at AS "submittedAt",
               submission.description, submission.source_url AS "sourceUrl",
               submission.license_name AS "licenseName",
               submission.license_url AS "licenseUrl", submission.tags,
               submission.data_dictionary AS "dataDictionary",
               submission.period_start AS "periodStart",
               submission.period_end AS "periodEnd", submission.frequency,
               submission.csv_data AS "csvData"
             FROM asn_dataset_submissions submission
             INNER JOIN users creator
               ON creator.id = submission.created_by AND creator.tenant_id = submission.tenant_id
             LEFT JOIN infrastructure_projects project
               ON project.id = submission.project_id AND project.tenant_id = submission.tenant_id
             WHERE submission.id = $1 AND submission.tenant_id = $2
               AND submission.status = 'draft' AND submission.created_by = $3
             LIMIT 1`,
            [submissionId, session.tenantId, session.userId],
          )) ?? null;
        if (!detail) {
          throw new AsnDatasetError(
            "Draf dataset tidak ditemukan atau tidak termasuk tanggung jawab Anda.",
            404,
          );
        }
      }

      return {
        assignments,
        submissions: rows.map(mapSummary),
        detail: detail
          ? {
              ...mapSummary(detail),
              description: detail.description ?? "",
              sourceUrl: detail.sourceUrl ?? null,
              licenseName: detail.licenseName ?? "",
              licenseUrl: detail.licenseUrl ?? null,
              tags: detail.tags ?? [],
              dataDictionary: detail.dataDictionary ?? [],
              periodStart: detail.periodStart ?? null,
              periodEnd: detail.periodEnd ?? null,
              frequency: detail.frequency ?? "annual",
              csvData: detail.csvData ?? "",
            }
          : null,
      };
    },
    database,
  );
}

type CanonicalAssignment = {
  assignmentType: "statistics" | "apbd" | "project";
  agencyId: string | null;
  regionId: string | null;
  regionName: string | null;
  sectorId: string;
  referenceYear: number;
  projectId: string | null;
};

async function requireAssignment(
  transaction: Database,
  session: Session,
  payload: DatasetSubmissionPayload,
): Promise<CanonicalAssignment> {
  if (
    payload.assignmentType === "statistics" ||
    payload.assignmentType === "apbd"
  ) {
    const table =
      payload.assignmentType === "statistics"
        ? "statistic_operator_assignments"
        : "apbd_operator_assignments";
    const assignment = await transaction.queryOne<
      Row & {
        agencyId: string;
        regionId: string;
        regionName: string;
        sectorId: string;
      }
    >(
      `SELECT agency_id AS "agencyId", region_id AS "regionId",
         region_name AS "regionName", sector_id AS "sectorId"
       FROM ${table}
       WHERE tenant_id = $1 AND ($6::boolean OR user_id = $2)
         AND agency_id = $3 AND region_id = $4 AND sector_id = $5
       LIMIT 1`,
      [
        session.tenantId,
        session.userId,
        payload.agencyId,
        payload.regionId,
        payload.sectorId,
        canManageTenantDatasets(session),
      ],
    );
    if (!assignment) {
      throw new AsnDatasetError(
        "Instansi, wilayah, atau urusan tidak termasuk dalam penugasan akun Anda.",
        403,
      );
    }
    return {
      assignmentType: payload.assignmentType,
      agencyId: assignment.agencyId,
      regionId: assignment.regionId,
      regionName: assignment.regionName,
      sectorId: assignment.sectorId,
      referenceYear: payload.referenceYear,
      projectId: null,
    };
  }

  const project = await transaction.queryOne<
    Row & {
      id: string;
      location: string;
      sector: string;
      fiscalYear: number;
    }
  >(
    `SELECT id::text AS id, location, sector, fiscal_year AS "fiscalYear"
     FROM infrastructure_projects
     WHERE id = $1 AND tenant_id = $2
       AND ($4::boolean OR assigned_user_id = $3)
     LIMIT 1`,
    [
      payload.projectId,
      session.tenantId,
      session.userId,
      canManageTenantDatasets(session),
    ],
  );
  if (!project || project.fiscalYear !== payload.referenceYear) {
    throw new AsnDatasetError(
      "Proyek tidak ditemukan atau tahun dataset tidak sesuai dengan penugasan proyek.",
      403,
    );
  }
  return {
    assignmentType: "project",
    agencyId: null,
    regionId: null,
    regionName: project.location,
    sectorId: project.sector,
    referenceYear: project.fiscalYear,
    projectId: project.id,
  };
}

function slugify(title: string): string {
  return title
    .toLocaleLowerCase("id-ID")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 140);
}

function validateDictionary(
  submitted:
    | DatasetSubmissionPayload["dataDictionary"]
    | undefined,
  generated: ReturnType<typeof parseDatasetCsv>["dictionary"],
) {
  if (!submitted) return generated;
  const allowed = new Set(generated.map((column) => column.name));
  if (
    submitted.length !== generated.length ||
    submitted.some((column) => !allowed.has(column.name))
  ) {
    throw new AsnDatasetError(
      "Kamus data harus menjelaskan setiap kolom CSV tepat satu kali.",
      400,
    );
  }
  return submitted;
}

async function recordDatasetAudit(
  session: Session,
  action: string,
  submissionId: string,
  metadata: Readonly<Record<string, unknown>>,
): Promise<void> {
  await appendAuditEvent(db(), {
    actorId: uuidOrNull(session.userId),
    action,
    targetTable: "asn_dataset_submissions",
    targetId: uuidOrNull(submissionId),
    metadata: {
      tenantId: session.tenantId,
      actorRole: session.roles.join(","),
      ...metadata,
      result: "success",
    },
    occurredAt: new Date(),
  });
}

export async function saveAsnDatasetSubmission(
  session: Session,
  rawPayload: unknown,
  csvText: string,
  database: Database = getDefaultDatabase(),
) {
  const parsed = datasetSubmissionPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new AsnDatasetError(
      parsed.error.issues[0]?.message ?? "Data dataset tidak valid.",
      400,
    );
  }
  const payload = parsed.data;
  const csv = parseDatasetCsv(csvText);
  const dataDictionary = validateDictionary(payload.dataDictionary, csv.dictionary);

  const saved = await withUserContext(
    session,
    async (transaction) => {
      const assignment = await requireAssignment(transaction, session, payload);
      const now = new Date();
      let submissionId = payload.submissionId;
      let datasetId: string;

      if (submissionId) {
        const existing = await transaction.queryOne<
          Row & { id: string; datasetId: string }
        >(
          `SELECT id::text AS id, dataset_id::text AS "datasetId"
           FROM asn_dataset_submissions
           WHERE id = $1 AND tenant_id = $2 AND created_by = $3
             AND status = 'draft' AND source_kind = 'manual'
           FOR UPDATE`,
          [submissionId, session.tenantId, session.userId],
        );
        if (!existing) {
          throw new AsnDatasetError(
            "Draf dataset tidak dapat diubah atau bukan milik akun Anda.",
            404,
          );
        }
        datasetId = existing.datasetId;
        await transaction.query(
          `UPDATE datasets SET slug = $2, title = $3, summary = $4,
             description = $5, category = $6, source_organization = $7,
             source_url = $8, source_label = 'ASN_SUBMITTED',
             license_name = $9, license_url = $10, tags = $11,
             data_dictionary = $12::jsonb, last_updated_at = $13,
             is_published = FALSE, csv_data = NULL
           WHERE id = $1 AND is_published = FALSE`,
          [
            datasetId,
            `${slugify(payload.title) || "dataset"}-${datasetId.slice(0, 8)}`,
            payload.title,
            payload.summary,
            payload.description,
            payload.category,
            payload.sourceOrganization,
            payload.sourceUrl || null,
            payload.licenseName,
            payload.licenseUrl || null,
            payload.tags,
            JSON.stringify(dataDictionary),
            now,
          ],
        );
        await transaction.query(
          `UPDATE asn_dataset_submissions SET
             updated_by = $3, assignment_type = $4, agency_id = $5,
             region_id = $6, region_name = $7, sector_id = $8,
             reference_year = $9, project_id = $10, title = $11,
             summary = $12, description = $13, category = $14,
             source_organization = $15, source_url = $16,
             source_label = 'ASN_SUBMITTED', license_name = $17,
             license_url = $18, tags = $19, data_dictionary = $20::jsonb,
             period_start = $21, period_end = $22, frequency = $23,
             csv_data = $24, record_count = $25, status = $26,
             submitted_at = $27, updated_at = $28
           WHERE id = $1 AND tenant_id = $2`,
          [
            submissionId,
            session.tenantId,
            session.userId,
            assignment.assignmentType,
            assignment.agencyId,
            assignment.regionId,
            assignment.regionName,
            assignment.sectorId,
            assignment.referenceYear,
            assignment.projectId,
            payload.title,
            payload.summary,
            payload.description,
            payload.category,
            payload.sourceOrganization,
            payload.sourceUrl || null,
            payload.licenseName,
            payload.licenseUrl || null,
            payload.tags,
            JSON.stringify(dataDictionary),
            payload.periodStart ?? null,
            payload.periodEnd ?? null,
            payload.frequency,
            csvText,
            csv.rows.length,
            payload.mode === "submit" ? "submitted" : "draft",
            payload.mode === "submit" ? now : null,
            now,
          ],
        );
      } else {
        const createdDataset = await transaction.queryOne<Row & { id: string }>(
          `INSERT INTO datasets (
             slug, title, summary, description, category, source_organization,
             source_url, source_label, license_name, license_url, tags,
             data_dictionary, last_updated_at, is_published, csv_data
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'ASN_SUBMITTED',
             $8, $9, $10, $11::jsonb, $12, FALSE, NULL)
           RETURNING id::text AS id`,
          [
            `${slugify(payload.title) || "dataset"}-${crypto.randomUUID().slice(0, 8)}`,
            payload.title,
            payload.summary,
            payload.description,
            payload.category,
            payload.sourceOrganization,
            payload.sourceUrl || null,
            payload.licenseName,
            payload.licenseUrl || null,
            payload.tags,
            JSON.stringify(dataDictionary),
            now,
          ],
        );
        if (!createdDataset) {
          throw new Error("Dataset katalog tidak dapat disiapkan.");
        }
        datasetId = createdDataset.id;
        const createdSubmission = await transaction.queryOne<Row & { id: string }>(
          `INSERT INTO asn_dataset_submissions (
             tenant_id, dataset_id, created_by, updated_by, assignment_type,
             agency_id, region_id, region_name, sector_id, reference_year,
             project_id, title, summary, description, category,
             source_organization, source_url, source_label, source_kind,
             license_name, license_url, tags, data_dictionary, period_start,
             period_end, frequency, csv_data, record_count, status, submitted_at
           ) VALUES (
             $1, $2, $3, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
             $13, $14, $15, $16, 'ASN_SUBMITTED', 'manual', $17, $18,
             $19, $20::jsonb, $21, $22, $23, $24, $25, $26, $27
           ) RETURNING id::text AS id`,
          [
            session.tenantId,
            datasetId,
            session.userId,
            assignment.assignmentType,
            assignment.agencyId,
            assignment.regionId,
            assignment.regionName,
            assignment.sectorId,
            assignment.referenceYear,
            assignment.projectId,
            payload.title,
            payload.summary,
            payload.description,
            payload.category,
            payload.sourceOrganization,
            payload.sourceUrl || null,
            payload.licenseName,
            payload.licenseUrl || null,
            payload.tags,
            JSON.stringify(dataDictionary),
            payload.periodStart ?? null,
            payload.periodEnd ?? null,
            payload.frequency,
            csvText,
            csv.rows.length,
            payload.mode === "submit" ? "submitted" : "draft",
            payload.mode === "submit" ? now : null,
          ],
        );
        if (!createdSubmission) {
          throw new Error("Pengajuan dataset tidak dapat disimpan.");
        }
        submissionId = createdSubmission.id;
      }

      return {
        submissionId,
        datasetId,
        title: payload.title,
        category: payload.category,
        status: payload.mode === "submit" ? "submitted" : "draft",
        recordCount: csv.rows.length,
        assignment,
      };
    },
    database,
  );

  if (!saved.submissionId) {
    throw new Error("Identitas pengajuan dataset tidak tersedia.");
  }
  await recordDatasetAudit(
    session,
    saved.status === "submitted"
      ? "asn.dataset.submitted"
      : payload.submissionId
        ? "asn.dataset.draft_updated"
        : "asn.dataset.draft_saved",
    saved.submissionId,
    {
      datasetId: saved.datasetId,
      category: saved.category,
      assignmentType: saved.assignment.assignmentType,
      agencyId: saved.assignment.agencyId,
      regionId: saved.assignment.regionId,
      sectorId: saved.assignment.sectorId,
      referenceYear: saved.assignment.referenceYear,
      recordCount: saved.recordCount,
      status: saved.status,
      sourceKind: "manual",
    },
  );
  return saved;
}

export async function importAssignedBpsDataset(
  session: Session,
  scope: {
    readonly agencyId: string;
    readonly regionId: string;
    readonly sectorId: string;
  },
  database: Database = getDefaultDatabase(),
) {
  const saved = await withUserContext(
    session,
    async (transaction) => {
      const assignment = await transaction.queryOne<
        Row & {
          agencyId: string;
          regionId: string;
          regionName: string;
          sectorId: string;
        }
      >(
        `SELECT agency_id AS "agencyId", region_id AS "regionId",
           region_name AS "regionName", sector_id AS "sectorId"
         FROM statistic_operator_assignments
         WHERE tenant_id = $1 AND ($6::boolean OR user_id = $2)
           AND agency_id = $3 AND region_id = $4 AND sector_id = $5
         LIMIT 1`,
        [
          session.tenantId,
          session.userId,
          scope.agencyId,
          scope.regionId,
          scope.sectorId,
          canManageTenantDatasets(session),
        ],
      );
      if (!assignment) {
        throw new AsnDatasetError(
          "Impor BPS hanya dapat dilakukan untuk penugasan statistik akun Anda.",
          403,
        );
      }
      return assignment;
    },
    database,
  );

  const regionCodes = bpsRegionCodesForAssignment(
    saved.regionId,
    saved.regionName,
  );
  if (!regionCodes.length) {
    throw new AsnDatasetError(
      "Wilayah penugasan belum memiliki pemetaan kode BPS. Hubungi administrator untuk melengkapi pemetaan wilayah.",
      422,
    );
  }

  const bpsRows = await db()
    .select({
      indicatorCode: bpsStatistics.indicatorCode,
      regionCode: bpsStatistics.regionCode,
      year: bpsStatistics.year,
      value: bpsStatistics.value,
      unit: bpsStatistics.unit,
    })
    .from(bpsStatistics)
    .where(
      and(
        eq(bpsStatistics.sourceLabel, "BPS_API"),
        inArray(bpsStatistics.regionCode, [...regionCodes]),
      ),
    )
    .orderBy(desc(bpsStatistics.year), bpsStatistics.indicatorCode);

  if (!bpsRows.length) {
    throw new AsnDatasetError(
      "BPS tidak memiliki agregat untuk kode wilayah pada penugasan ini. Tidak ada data yang diajukan.",
      422,
    );
  }
  const latestYear = bpsRows[0].year;
  const regionRows = bpsRows.filter((row) => row.year === latestYear);
  const serializedCsv = [
    ["indicator_code", "region_code", "year", "value", "unit"],
    ...regionRows.map((row) => [
      row.indicatorCode,
      row.regionCode,
      String(row.year),
      String(row.value),
      row.unit,
    ]),
  ]
    .map((row) =>
      row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\r\n");
  const now = new Date();
  const title = `Statistik BPS — ${saved.regionName.slice(0, 220)} — ${latestYear}`;
  const summary = `Agregat indikator BPS untuk ${saved.regionName} tahun ${latestYear}.`;
  const description =
    "Snapshot statistik BPS yang diimpor sesuai penugasan wilayah operator.";
  const dataDictionary = JSON.stringify([
    {
      name: "indicator_code",
      type: "text",
      description: "Kode indikator BPS.",
    },
    {
      name: "region_code",
      type: "text",
      description: "Kode wilayah BPS.",
    },
    {
      name: "year",
      type: "integer",
      description: "Tahun referensi data.",
    },
    {
      name: "value",
      type: "decimal",
      description: "Nilai agregat indikator.",
    },
    {
      name: "unit",
      type: "text",
      description: "Satuan nilai.",
    },
  ]);

  const result = await withUserContext(
    session,
    async (transaction) => {
      const existing = await transaction.queryOne<
        Row & { submissionId: string; datasetId: string }
      >(
        `SELECT submission.id::text AS "submissionId",
           submission.dataset_id::text AS "datasetId"
         FROM asn_dataset_submissions submission
         INNER JOIN datasets dataset ON dataset.id = submission.dataset_id
         WHERE submission.tenant_id = $1 AND submission.created_by = $2
           AND submission.assignment_type = 'statistics'
           AND submission.agency_id = $3 AND submission.region_id = $4
           AND submission.sector_id = $5 AND submission.reference_year = $6
           AND submission.source_kind = 'bps' AND submission.status = 'submitted'
           AND dataset.is_published = FALSE AND dataset.slug <> 'statistik-bps'
         ORDER BY submission.updated_at DESC
         LIMIT 1
         FOR UPDATE OF submission, dataset`,
        [
          session.tenantId,
          session.userId,
          saved.agencyId,
          saved.regionId,
          saved.sectorId,
          latestYear,
        ],
      );
      let datasetId: string;
      let submissionId: string;

      if (existing) {
        datasetId = existing.datasetId;
        submissionId = existing.submissionId;
        await transaction.query(
          `UPDATE datasets
           SET title = $2, summary = $3, description = $4,
             last_updated_at = $5, is_published = FALSE, csv_data = NULL
           WHERE id = $1 AND is_published = FALSE`,
          [datasetId, title, summary, description, now],
        );
        await transaction.query(
          `UPDATE asn_dataset_submissions
           SET updated_by = $3, reference_year = $4, title = $5, summary = $6,
             description = $7, data_dictionary = $8::jsonb, csv_data = $9,
             record_count = $10, submitted_at = $11, updated_at = $11
           WHERE id = $1 AND tenant_id = $2 AND status = 'submitted'`,
          [
            submissionId,
            session.tenantId,
            session.userId,
            latestYear,
            title,
            summary,
            description,
            dataDictionary,
            serializedCsv,
            regionRows.length,
            now,
          ],
        );
      } else {
        const dataset = await transaction.queryOne<Row & { id: string }>(
          `INSERT INTO datasets (
             slug, title, summary, description, category, source_organization,
             source_url, source_label, license_name, tags, data_dictionary,
             last_updated_at, is_published, csv_data
           ) VALUES (
             $1, $2, $3, $4, 'Statistik', 'Badan Pusat Statistik',
             'https://webapi.bps.go.id/developer/', 'BPS_API',
             'Sesuai ketentuan BPS', ARRAY['statistik','BPS','indikator'],
             $5::jsonb, $6, FALSE, NULL
           ) RETURNING id::text AS id`,
          [
            `statistik-bps-${crypto.randomUUID().slice(0, 8)}`,
            title,
            summary,
            description,
            dataDictionary,
            now,
          ],
        );
        if (!dataset) {
          throw new Error("Metadata dataset BPS tidak dapat disiapkan.");
        }
        datasetId = dataset.id;
        const submitted = await transaction.queryOne<Row & { id: string }>(
          `INSERT INTO asn_dataset_submissions (
             tenant_id, dataset_id, created_by, updated_by, assignment_type,
             agency_id, region_id, region_name, sector_id, reference_year,
             project_id, title, summary, description, category,
             source_organization, source_url, source_label, source_kind,
             license_name, license_url, tags, data_dictionary, period_start,
             period_end, frequency, csv_data, record_count, status, submitted_at
           ) VALUES (
             $1, $2, $3, $3, 'statistics', $4, $5, $6, $7, $8, NULL,
             $9, $10, $11, 'Statistik', 'Badan Pusat Statistik',
             'https://webapi.bps.go.id/developer/', 'BPS_API', 'bps',
             'Sesuai ketentuan BPS', NULL, ARRAY['statistik','BPS','indikator'],
             $12::jsonb, NULL, NULL, 'annual', $13, $14, 'submitted', $15
           ) RETURNING id::text AS id`,
          [
            session.tenantId,
            datasetId,
            session.userId,
            saved.agencyId,
            saved.regionId,
            saved.regionName,
            saved.sectorId,
            latestYear,
            title,
            summary,
            description,
            dataDictionary,
            serializedCsv,
            regionRows.length,
            now,
          ],
        );
        if (!submitted) {
          throw new Error("Snapshot BPS tidak dapat diajukan.");
        }
        submissionId = submitted.id;
      }
      return {
        submissionId,
        datasetId,
        title,
        category: "Statistik" as const,
        status: "submitted" as const,
        recordCount: regionRows.length,
        assignment: {
          assignmentType: "statistics" as const,
          agencyId: saved.agencyId,
          regionId: saved.regionId,
          regionName: saved.regionName,
          sectorId: saved.sectorId,
          referenceYear: latestYear,
          projectId: null,
        },
      };
    },
    database,
  );

  await recordDatasetAudit(
    session,
    "asn.dataset.bps_imported",
    result.submissionId,
    {
      datasetId: result.datasetId,
      assignmentType: "statistics",
      agencyId: saved.agencyId,
      regionId: saved.regionId,
      sectorId: saved.sectorId,
      referenceYear: latestYear,
      recordCount: regionRows.length,
      status: "submitted",
      sourceKind: "bps",
      sourceLabel: "BPS_API",
    },
  );
  return result;
}

export async function getApbdDatasetSources(
  session: Session,
  scope: {
    readonly agencyId: string;
    readonly regionId: string;
    readonly sectorId: string;
    readonly referenceYear: number;
  },
  database: Database = getDefaultDatabase(),
): Promise<DatasetSource[]> {
  return withUserContext(
    session,
    async (transaction) => {
      const assigned = await transaction.queryOne<Row & { agencyId: string }>(
        `SELECT agency_id AS "agencyId"
         FROM apbd_operator_assignments
         WHERE tenant_id = $1 AND ($6::boolean OR user_id = $2)
           AND agency_id = $3 AND region_id = $4 AND sector_id = $5
         LIMIT 1`,
        [
          session.tenantId,
          session.userId,
          scope.agencyId,
          scope.regionId,
          scope.sectorId,
          canManageTenantDatasets(session),
        ],
      );
      if (!assigned) {
        throw new AsnDatasetError(
          "Konteks APBD tidak termasuk dalam penugasan yang dapat Anda akses.",
          403,
        );
      }
      const rows = await transaction.query<
        Row & {
          id: string;
          title: string;
          category: "Anggaran" | "Proyek" | "Statistik";
          sourceLabel: "BPS_API" | "ASN_SUBMITTED";
          sourceOrganization: string;
          regionName: string | null;
          sectorId: string;
          referenceYear: number;
          submittedAt: Date | string;
        }
      >(
        `SELECT id::text AS id, title, category,
           source_label AS "sourceLabel",
           source_organization AS "sourceOrganization",
           region_name AS "regionName", sector_id AS "sectorId",
           reference_year AS "referenceYear", submitted_at AS "submittedAt"
         FROM asn_dataset_submissions
         WHERE tenant_id = $1 AND status = 'submitted'
           AND assignment_type IN ('statistics', 'apbd')
           AND agency_id = $2 AND region_id = $3 AND sector_id = $4
           AND reference_year = $5
           AND category IN ('Statistik', 'Anggaran')
         ORDER BY submitted_at DESC, title
         LIMIT 100`,
        [
          session.tenantId,
          scope.agencyId,
          scope.regionId,
          scope.sectorId,
          scope.referenceYear,
        ],
      );
      return rows.map((row) => ({
        ...row,
        submittedAt: isoDate(row.submittedAt) ?? "",
      }));
    },
    database,
  );
}

export async function getProjectDatasetSources(
  session: Session,
  projectId: string,
  database: Database = getDefaultDatabase(),
): Promise<DatasetSource[]> {
  return withUserContext(
    session,
    async (transaction) => {
      const project = await transaction.queryOne<
        Row & { id: string; sector: string; fiscalYear: number; location: string }
      >(
        `SELECT id::text AS id, sector, fiscal_year AS "fiscalYear", location
         FROM infrastructure_projects
         WHERE id = $1 AND tenant_id = $2
           AND ($4::boolean OR assigned_user_id = $3)`,
        [
          projectId,
          session.tenantId,
          session.userId,
          canManageTenantDatasets(session),
        ],
      );
      if (!project) {
        throw new AsnDatasetError("Proyek tidak termasuk dalam penugasan Anda.", 403);
      }
      const rows = await transaction.query<
        Row & {
          id: string;
          title: string;
          category: "Anggaran" | "Proyek" | "Statistik";
          sourceLabel: "BPS_API" | "ASN_SUBMITTED";
          sourceOrganization: string;
          regionName: string | null;
          sectorId: string;
          referenceYear: number;
          submittedAt: Date | string;
        }
      >(
        `SELECT id::text AS id, title, category,
           source_label AS "sourceLabel",
           source_organization AS "sourceOrganization",
           region_name AS "regionName", sector_id AS "sectorId",
           reference_year AS "referenceYear", submitted_at AS "submittedAt"
         FROM asn_dataset_submissions
         WHERE tenant_id = $1 AND status = 'submitted'
           AND sector_id = $2 AND reference_year = $3
           AND category IN ('Proyek', 'Statistik')
           AND (
             (assignment_type = 'project' AND project_id = $4)
             OR (assignment_type = 'statistics'
               AND lower(btrim(region_name)) = lower(btrim($5)))
           )
         ORDER BY submitted_at DESC, title
         LIMIT 100`,
        [
          session.tenantId,
          project.sector,
          project.fiscalYear,
          project.id,
          project.location,
        ],
      );
      return rows.map((row) => ({
        ...row,
        submittedAt: isoDate(row.submittedAt) ?? "",
      }));
    },
    database,
  );
}
