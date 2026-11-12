import { getDefaultDatabase } from "@/lib/db/client";
import type { Session } from "@/lib/auth/session";
import type { Database, Row } from "@/lib/db/types";
import {
  deletePrivateCloudinaryFile,
  privateCloudinaryDownloadUrl,
  uploadToCloudinary,
} from "@/lib/cloudinary/upload";
import { logger } from "@/lib/logger";
import {
  APBD_PERIODS,
  apbdRecordMetadataSchema,
  apbdSavePayloadSchema,
} from "./contract";
import type {
  ApbdAssignment,
  ApbdItem,
  ApbdRecordMetadata,
} from "./contract";
import { validateApbdItems } from "./domain";

type AssignmentRow = Row & {
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: string;
};
type EntryRow = Row & {
  id: string;
  status: "draft" | "in_review" | "published";
  revisionOfId: string | null;
  sourceDatasetSubmissionId: string | null;
  revisionReason: string;
  updatedBy: string;
  updatedAt: Date | string;
  recordMetadata?: ApbdRecordMetadata;
};
type ItemRow = Row & {
  id: string;
  code: string;
  programName: string;
  subactivityName: string;
  affairCode: string;
  programCode: string;
  activityCode: string;
  activityName: string;
  fundingSource: string;
  supportingDocument: string;
};
type PeriodRow = Row & {
  itemId: string;
  periodType: "monthly" | "quarterly";
  periodValue: string;
  pagu: string | null;
  realisasi: string | null;
  targetValue: string | null;
  targetDate: string | null;
  documentReference: string;
};
type AuditRow = Row & {
  itemCode: string;
  periodValue: string;
  field: "pagu" | "realisasi";
  previousValue: string | null;
  newValue: string;
  actorName: string;
  changedAt: Date | string;
};

export class ApbdBudgetError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly rowErrors: readonly { readonly row: number; readonly messages: readonly string[] }[] = [],
  ) {
    super(message);
    this.name = "ApbdBudgetError";
  }
}

function isoDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Riwayat APBD berisi tanggal yang tidak valid.");
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

async function listAssignments(
  transaction: Database,
  session: Session,
): Promise<ApbdAssignment[]> {
  const rows = await transaction.query<AssignmentRow>(
    `SELECT agency_id AS "agencyId", region_id AS "regionId",
       region_name AS "regionName", sector_id AS "sectorId"
     FROM apbd_operator_assignments
     WHERE tenant_id = $1 AND user_id = $2
     ORDER BY region_name, sector_id, agency_id`,
    [session.tenantId, session.userId],
  );
  return rows;
}

async function requireAssignment(
  transaction: Database,
  session: Session,
  scope: Pick<ApbdAssignment, "agencyId" | "regionId" | "sectorId">,
): Promise<ApbdAssignment> {
  const assignments = await listAssignments(transaction, session);
  const assignment = assignments.find(
    (candidate) =>
      candidate.agencyId === scope.agencyId &&
      candidate.regionId === scope.regionId &&
      candidate.sectorId === scope.sectorId,
  );
  if (!assignment) {
    throw new ApbdBudgetError(
      "Instansi, wilayah, atau urusan tidak termasuk dalam hak akses akun Anda.",
      403,
    );
  }
  return assignment;
}

async function findEntry(
  transaction: Database,
  session: Session,
  assignment: ApbdAssignment,
  referenceYear: number,
  forUpdate = false,
): Promise<EntryRow | null> {
  return transaction.queryOne<EntryRow>(
    `SELECT entry.id::text AS id, entry.status,
       entry.revision_of_id::text AS "revisionOfId",
       entry.source_dataset_submission_id::text AS "sourceDatasetSubmissionId",
       entry.revision_reason AS "revisionReason",
       entry.record_metadata AS "recordMetadata",
       users.name AS "updatedBy", entry.updated_at AS "updatedAt"
     FROM apbd_entries entry
     INNER JOIN users
       ON users.id = entry.updated_by AND users.tenant_id = entry.tenant_id
     WHERE entry.tenant_id = $1 AND entry.agency_id = $2
       AND entry.region_id = $3 AND entry.sector_id = $4
       AND entry.reference_year = $5
     ORDER BY CASE entry.status WHEN 'draft' THEN 0 WHEN 'in_review' THEN 1 ELSE 2 END,
       entry.published_at DESC NULLS LAST, entry.updated_at DESC
     LIMIT 1 ${forUpdate ? "FOR UPDATE OF entry" : ""}`,
    [
      session.tenantId,
      assignment.agencyId,
      assignment.regionId,
      assignment.sectorId,
      referenceYear,
    ],
  );
}

async function getEntryView(
  transaction: Database,
  session: Session,
  entry: EntryRow,
): Promise<EntryRow & {
  items: {
    code: string;
    programName: string;
    subactivityName: string;
    affairCode: string;
    programCode: string;
    activityCode: string;
    activityName: string;
    fundingSource: string;
    supportingDocument: string;
    periods: {
      periodType: "quarterly";
      periodValue: string;
      pagu: string | null;
      realisasi: string | null;
      targetValue: string | null;
      targetDate: string | null;
      documentReference: string;
    }[];
  }[];
  recordMetadata: ApbdRecordMetadata;
  documents: { id: string; originalName: string; mediaType: string; fileSize: number }[];
  audit: {
    itemCode: string;
    periodValue: string;
    field: "pagu" | "realisasi";
    previousValue: string | null;
    newValue: string;
    actorName: string;
    changedAt: string;
  }[];
}> {
  const items = await transaction.query<ItemRow>(
    `SELECT id::text AS id, code, program_name AS "programName",
       subactivity_name AS "subactivityName", affair_code AS "affairCode",
       program_code AS "programCode", activity_code AS "activityCode",
       activity_name AS "activityName", funding_source AS "fundingSource",
       supporting_document AS "supportingDocument"
     FROM apbd_budget_items
     WHERE tenant_id = $1 AND entry_id = $2
     ORDER BY code`,
    [session.tenantId, entry.id],
  );
  const [values, audit, documents] = await Promise.all([
    transaction.query<PeriodRow>(
      `SELECT item_id::text AS "itemId", period_type AS "periodType",
         period_value AS "periodValue", pagu::text AS pagu,
         realisasi::text AS realisasi, target_value::text AS "targetValue",
         target_date::text AS "targetDate",
         document_reference AS "documentReference"
       FROM apbd_budget_period_values
       WHERE tenant_id = $1 AND entry_id = $2
       ORDER BY period_type, period_value`,
      [session.tenantId, entry.id],
    ),
    transaction.query<AuditRow>(
      `SELECT item.code AS "itemCode", audit.period_value AS "periodValue",
         audit.field, audit.previous_value::text AS "previousValue",
         audit.new_value::text AS "newValue", users.name AS "actorName",
         audit.created_at AS "changedAt"
       FROM apbd_value_audit audit
       INNER JOIN apbd_budget_items item
         ON item.id = audit.item_id AND item.tenant_id = audit.tenant_id
       INNER JOIN users
         ON users.id = audit.actor_id AND users.tenant_id = audit.tenant_id
       WHERE audit.tenant_id = $1 AND audit.entry_id = $2
       ORDER BY audit.created_at DESC
       LIMIT 20`,
      [session.tenantId, entry.id],
    ),
    transaction.query<
      Row & {
        id: string;
        originalName: string;
        mediaType: string;
        fileSize: number;
      }
    >(
      `SELECT id::text AS id, original_name AS "originalName",
         media_type AS "mediaType", file_size AS "fileSize"
       FROM apbd_entry_documents
       WHERE tenant_id = $1 AND entry_id = $2
       ORDER BY created_at`,
      [session.tenantId, entry.id],
    ),
  ]);
  return {
    ...entry,
    updatedAt: isoDate(entry.updatedAt),
    recordMetadata: apbdRecordMetadataSchema.parse(entry.recordMetadata ?? {}),
    items: items.map((item) => ({
      code: item.code,
      id: item.id,
      programName: item.programName,
      subactivityName: item.subactivityName,
      affairCode: item.affairCode,
      programCode: item.programCode,
      activityCode: item.activityCode,
      activityName: item.activityName,
      fundingSource: item.fundingSource,
      supportingDocument: item.supportingDocument,
      periods: APBD_PERIODS.map((period) => {
        const value = values.find(
          (candidate) =>
            candidate.itemId === item.id &&
            candidate.periodType === "quarterly" &&
            candidate.periodValue === period.value,
        );
        return {
          periodType: "quarterly" as const,
          periodValue: period.value,
          pagu: value?.pagu ?? null,
          realisasi: value?.realisasi ?? null,
          targetValue: value?.targetValue ?? null,
          targetDate: value?.targetDate?.slice(0, 10) ?? null,
          documentReference: value?.documentReference ?? "",
        };
      }),
    })),
    documents: documents.map((document) => ({
      ...document,
      fileSize: Number(document.fileSize),
    })),
    audit: audit.map((row) => ({
      ...row,
      changedAt: isoDate(row.changedAt),
    })),
  };
}

export async function getApbdWorkspace(
  session: Session,
  context?: {
    readonly referenceYear: number;
    readonly agencyId: string;
    readonly regionId: string;
    readonly sectorId: string;
  },
  database?: Database,
) {
  return withUserContext(
    session,
    async (transaction) => {
      const assignments = await listAssignments(transaction, session);
      if (!context) return { assignments, entry: null };
      const assignment = await requireAssignment(
        transaction,
        session,
        context,
      );
      const entry = await findEntry(
        transaction,
        session,
        assignment,
        context.referenceYear,
      );
      return {
        assignments,
        entry: entry ? await getEntryView(transaction, session, entry) : null,
      };
    },
    database,
  );
}

function hasPublishableValues(items: readonly ApbdItem[]): boolean {
  if (!items.length) return false;
  return items.every((item) =>
    item.periods.every(
      (period) =>
        period.pagu !== null &&
        period.realisasi !== null &&
        BigInt(period.realisasi) <= BigInt(period.pagu),
    ),
  );
}

async function hasPublishableStoredValues(
  transaction: Database,
  session: Session,
  entryId: string,
): Promise<boolean> {
  const itemCount = await transaction.queryOne<Row & { count: number | string }>(
    `SELECT COUNT(*)::int AS count
     FROM apbd_budget_items
     WHERE tenant_id = $1 AND entry_id = $2`,
    [session.tenantId, entryId],
  );
  const values = await transaction.query<
    Row & {
      periodValue: string | null;
      pagu: string | null;
      realisasi: string | null;
    }
  >(
    `SELECT period.period_value AS "periodValue",
       period.pagu::text AS pagu, period.realisasi::text AS realisasi
     FROM apbd_budget_items item
     LEFT JOIN apbd_budget_period_values period
       ON period.item_id = item.id AND period.tenant_id = item.tenant_id
       AND period.period_type = 'quarterly'
     WHERE item.tenant_id = $1 AND item.entry_id = $2
     ORDER BY item.id, period.period_value`,
    [session.tenantId, entryId],
  );
  const count = Number(itemCount?.count ?? 0);
  return (
    count > 0 &&
    values.length === count * APBD_PERIODS.length &&
    values.every(
      (period) =>
        period.periodValue !== null &&
        period.pagu !== null &&
        period.realisasi !== null &&
        BigInt(period.realisasi) <= BigInt(period.pagu),
    )
  );
}

async function createRevision(
  transaction: Database,
  session: Session,
  assignment: ApbdAssignment,
  payload: {
    referenceYear: number;
    revisionOfId: string;
    revisionReason: string;
  },
): Promise<string> {
  const source = await transaction.queryOne<EntryRow>(
    `SELECT id::text AS id, status, revision_of_id::text AS "revisionOfId",
       source_dataset_submission_id::text AS "sourceDatasetSubmissionId",
       revision_reason AS "revisionReason", updated_by::text AS "updatedBy",
       updated_at AS "updatedAt", record_metadata AS "recordMetadata"
     FROM apbd_entries
     WHERE id = $1 AND tenant_id = $2 AND agency_id = $3 AND region_id = $4
       AND sector_id = $5 AND reference_year = $6
     FOR UPDATE`,
    [
      payload.revisionOfId,
      session.tenantId,
      assignment.agencyId,
      assignment.regionId,
      assignment.sectorId,
      payload.referenceYear,
    ],
  );
  if (!source || source.status !== "published") {
    throw new ApbdBudgetError("Data publikasi untuk revisi tidak ditemukan.", 404);
  }
  const existingDraft = await transaction.queryOne<Row & { id: string }>(
    `SELECT id::text AS id FROM apbd_entries
     WHERE tenant_id = $1 AND agency_id = $2 AND region_id = $3
       AND sector_id = $4 AND reference_year = $5
       AND status IN ('draft', 'in_review')
     FOR UPDATE`,
    [
      session.tenantId,
      assignment.agencyId,
      assignment.regionId,
      assignment.sectorId,
      payload.referenceYear,
    ],
  );
  if (existingDraft) {
    throw new ApbdBudgetError(
      "Masih ada draf aktif untuk konteks ini. Muat ulang sebelum membuat revisi.",
      409,
    );
  }
  const draft = await transaction.queryOne<Row & { id: string }>(
    `INSERT INTO apbd_entries (
       tenant_id, agency_id, region_id, region_name, sector_id,
      reference_year, status, revision_of_id, source_dataset_submission_id,
      revision_reason, record_metadata,
      created_by, updated_by
    ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8, $9, $10, $11, $11)
    RETURNING id::text AS id`,
    [
      session.tenantId,
      assignment.agencyId,
      assignment.regionId,
      assignment.regionName,
      assignment.sectorId,
      payload.referenceYear,
      source.id,
      source.sourceDatasetSubmissionId,
      payload.revisionReason,
      JSON.stringify(source.recordMetadata ?? {}),
      session.userId,
    ],
  );
  if (!draft) throw new Error("Draf revisi APBD gagal dibuat.");

  const sourceItems = await transaction.query<ItemRow>(
    `SELECT id::text AS id, code, program_name AS "programName",
       subactivity_name AS "subactivityName", affair_code AS "affairCode",
       program_code AS "programCode", activity_code AS "activityCode",
       activity_name AS "activityName", funding_source AS "fundingSource",
       supporting_document AS "supportingDocument"
     FROM apbd_budget_items
     WHERE tenant_id = $1 AND entry_id = $2
     ORDER BY code`,
    [session.tenantId, source.id],
  );
  for (const sourceItem of sourceItems) {
    const newItem = await transaction.queryOne<Row & { id: string }>(
      `INSERT INTO apbd_budget_items (
         tenant_id, entry_id, code, program_name, subactivity_name,
         affair_code, program_code, activity_code, activity_name,
         funding_source, supporting_document
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id::text AS id`,
      [
        session.tenantId,
        draft.id,
        sourceItem.code,
        sourceItem.programName,
        sourceItem.subactivityName,
        sourceItem.affairCode,
        sourceItem.programCode,
        sourceItem.activityCode,
        sourceItem.activityName,
        sourceItem.fundingSource,
        sourceItem.supportingDocument,
      ],
    );
    if (!newItem) throw new Error("Baris revisi APBD gagal disalin.");
    await transaction.query(
      `INSERT INTO apbd_budget_period_values (
         tenant_id, entry_id, item_id, period_type, period_value, pagu,
         realisasi, target_value, target_date, document_reference, updated_by
       )
       SELECT tenant_id, $1, $2, period_type, period_value, pagu, realisasi,
         target_value, target_date, document_reference, $6
       FROM apbd_budget_period_values
       WHERE tenant_id = $3 AND entry_id = $4 AND item_id = $5`,
      [
        draft.id,
        newItem.id,
        session.tenantId,
        source.id,
        sourceItem.id,
        session.userId,
      ],
    );
  }
  return draft.id;
}

export async function saveApbdWorkspace(
  session: Session,
  rawPayload: unknown,
  database: Database = getDefaultDatabase(),
) {
  const parsed = apbdSavePayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new ApbdBudgetError(
      parsed.error.issues[0]?.message ?? "Data APBD tidak valid.",
      400,
    );
  }
  const payload = parsed.data;
  const { items, errors } = validateApbdItems(payload.items);
  if (payload.status === "in_review" && errors.length) {
    throw new ApbdBudgetError(
      "Pengiriman tinjauan dibatalkan karena ada baris yang tidak valid.",
      400,
      errors,
    );
  }
  if (payload.status === "in_review" && !hasPublishableValues(items)) {
    throw new ApbdBudgetError(
      "Setiap sub-kegiatan wajib memiliki Pagu dan Realisasi Triwulan I–IV, dengan Realisasi tidak melebihi Pagu.",
      400,
    );
  }

  return withUserContext(
    session,
    async (transaction) => {
      const assignment = await requireAssignment(transaction, session, payload);
      if (payload.sourceDatasetSubmissionId) {
        const source = await transaction.queryOne<Row & { id: string }>(
          `SELECT id::text AS id
           FROM asn_dataset_submissions
           WHERE id = $1 AND tenant_id = $2 AND status = 'submitted'
             AND assignment_type IN ('statistics', 'apbd')
             AND category IN ('Statistik', 'Anggaran')
             AND agency_id = $3 AND region_id = $4 AND sector_id = $5
             AND reference_year = $6
           LIMIT 1`,
          [
            payload.sourceDatasetSubmissionId,
            session.tenantId,
            assignment.agencyId,
            assignment.regionId,
            assignment.sectorId,
            payload.referenceYear,
          ],
        );
        if (!source) {
          throw new ApbdBudgetError(
            "Dataset sumber harus terkirim dan sesuai dengan penugasan APBD ini.",
            403,
          );
        }
      }
      let entry = await findEntry(
        transaction,
        session,
        assignment,
        payload.referenceYear,
        true,
      );

      if (payload.revisionOfId) {
        if (
          !entry ||
          entry.status !== "published" ||
          entry.id !== payload.revisionOfId
        ) {
          throw new ApbdBudgetError(
            "Revisi harus dibuat dari publikasi terbaru dan tidak boleh mengganti draf aktif.",
            409,
          );
        }
        const draftId = await createRevision(
          transaction,
          session,
          assignment,
          {
            referenceYear: payload.referenceYear,
            revisionOfId: payload.revisionOfId,
            revisionReason: payload.revisionReason,
          },
        );
        entry = await transaction.queryOne<EntryRow>(
          `SELECT id::text AS id, status, revision_of_id::text AS "revisionOfId",
             source_dataset_submission_id::text AS "sourceDatasetSubmissionId",
             revision_reason AS "revisionReason", updated_by::text AS "updatedBy",
             updated_at AS "updatedAt", record_metadata AS "recordMetadata"
           FROM apbd_entries WHERE id = $1 AND tenant_id = $2`,
          [draftId, session.tenantId],
        );
      } else if (entry?.status === "published") {
        throw new ApbdBudgetError(
          "Data yang telah dipublikasikan terkunci. Buat revisi dengan catatan untuk mengubah data.",
          409,
        );
      } else if (entry?.status === "in_review") {
        throw new ApbdBudgetError(
          "Data APBD sedang menunggu tinjauan dan tidak dapat diubah.",
          409,
        );
      } else if (!entry) {
        const published = await transaction.queryOne<Row & { id: string }>(
          `SELECT id::text AS id FROM apbd_entries
           WHERE tenant_id = $1 AND agency_id = $2 AND region_id = $3
             AND sector_id = $4 AND reference_year = $5
             AND status = 'published'
           LIMIT 1`,
          [
            session.tenantId,
            assignment.agencyId,
            assignment.regionId,
            assignment.sectorId,
            payload.referenceYear,
          ],
        );
        if (published) {
          throw new ApbdBudgetError(
            "Data yang telah dipublikasikan hanya dapat diubah melalui revisi ber-catatan.",
            409,
          );
        }
        entry = await transaction.queryOne<EntryRow>(
          `INSERT INTO apbd_entries (
             tenant_id, agency_id, region_id, region_name, sector_id,
             reference_year, status, source_dataset_submission_id,
             record_metadata, created_by, updated_by
           ) VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8::jsonb, $9, $9)
           ON CONFLICT (
             tenant_id, agency_id, region_id, sector_id, reference_year
           ) WHERE status = 'draft'
           DO UPDATE SET updated_by = EXCLUDED.updated_by,
             updated_at = NOW()
           RETURNING id::text AS id, status,
             revision_of_id::text AS "revisionOfId",
             source_dataset_submission_id::text AS "sourceDatasetSubmissionId",
             revision_reason AS "revisionReason",
             updated_by::text AS "updatedBy", updated_at AS "updatedAt",
             record_metadata AS "recordMetadata"`,
          [
            session.tenantId,
            assignment.agencyId,
            assignment.regionId,
            assignment.regionName,
            assignment.sectorId,
            payload.referenceYear,
            payload.sourceDatasetSubmissionId,
            JSON.stringify(payload.recordMetadata),
            session.userId,
          ],
        );
      }

      if (!entry) throw new Error("Entri APBD gagal disiapkan.");
      const now = new Date();
      const persistedItems = await transaction.query<ItemRow>(
        `SELECT id::text AS id, code, program_name AS "programName",
           subactivity_name AS "subactivityName", affair_code AS "affairCode",
           program_code AS "programCode", activity_code AS "activityCode",
           activity_name AS "activityName", funding_source AS "fundingSource",
           supporting_document AS "supportingDocument"
         FROM apbd_budget_items
         WHERE tenant_id = $1 AND entry_id = $2
         FOR UPDATE`,
        [session.tenantId, entry.id],
      );
      const itemsToSave = items.map((item, index) => {
        const existingById = item.id
          ? persistedItems.find((persisted) => persisted.id === item.id)
          : undefined;
        if (item.id && !existingById) {
          throw new ApbdBudgetError(
            "Sub-kegiatan tidak termasuk dalam draf APBD yang sedang diubah.",
            403,
          );
        }
        const existingByCode = persistedItems.find(
          (persisted) =>
            persisted.code.toLocaleLowerCase("id-ID") ===
            item.code.toLocaleLowerCase("id-ID"),
        );
        if (
          existingById &&
          existingByCode &&
          existingByCode.id !== existingById.id
        ) {
          throw new ApbdBudgetError(
            "Kode sub-kegiatan sudah digunakan oleh baris lain.",
            400,
            [
              {
                row: index + 1,
                messages: ["Gunakan kode yang berbeda untuk setiap baris."],
              },
            ],
          );
        }
        return {
          ...item,
          id: existingById?.id ?? existingByCode?.id ?? item.id,
        };
      });

      for (const item of itemsToSave) {
        const savedItem = item.id
          ? await transaction.queryOne<Row & { id: string }>(
              `UPDATE apbd_budget_items SET code = $4,
                 program_name = $5, subactivity_name = $6, affair_code = $7,
                 program_code = $8, activity_code = $9, activity_name = $10,
                 funding_source = $11, supporting_document = $12, updated_at = $13
               WHERE id = $1 AND tenant_id = $2 AND entry_id = $3
               RETURNING id::text AS id`,
              [
                item.id,
                session.tenantId,
                entry.id,
                item.code,
                item.programName,
                item.subactivityName,
                item.affairCode,
                item.programCode,
                item.activityCode,
                item.activityName,
                item.fundingSource,
                item.supportingDocument,
                now,
              ],
            )
          : await transaction.queryOne<Row & { id: string }>(
              `INSERT INTO apbd_budget_items (
                 tenant_id, entry_id, code, program_name, subactivity_name,
                 affair_code, program_code, activity_code, activity_name,
                 funding_source, supporting_document
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
               ON CONFLICT (entry_id, code)
               DO UPDATE SET program_name = EXCLUDED.program_name,
                 subactivity_name = EXCLUDED.subactivity_name,
                 affair_code = EXCLUDED.affair_code,
                 program_code = EXCLUDED.program_code,
                 activity_code = EXCLUDED.activity_code,
                 activity_name = EXCLUDED.activity_name,
                 funding_source = EXCLUDED.funding_source,
                 supporting_document = EXCLUDED.supporting_document,
                 updated_at = $12
               RETURNING id::text AS id`,
              [
                session.tenantId,
                entry.id,
                item.code,
                item.programName,
                item.subactivityName,
                item.affairCode,
                item.programCode,
                item.activityCode,
                item.activityName,
                item.fundingSource,
                item.supportingDocument,
                now,
              ],
            );
        if (item.id && !savedItem) {
          throw new ApbdBudgetError(
            "Sub-kegiatan tidak termasuk dalam draf APBD yang sedang diubah.",
            403,
          );
        }
        if (!savedItem) throw new Error("Sub-kegiatan APBD gagal disimpan.");

        const existingValues = await transaction.query<PeriodRow>(
          `SELECT item_id::text AS "itemId", period_type AS "periodType",
             period_value AS "periodValue", pagu::text AS pagu,
             realisasi::text AS realisasi, target_value::text AS "targetValue",
             target_date::text AS "targetDate",
             document_reference AS "documentReference"
           FROM apbd_budget_period_values
           WHERE tenant_id = $1 AND entry_id = $2 AND item_id = $3
             AND period_type = 'quarterly'`,
          [session.tenantId, entry.id, savedItem.id],
        );
        for (const period of item.periods) {
          const previous = existingValues.find(
            (value) => value.periodValue === period.periodValue,
          );
          await transaction.query(
            `INSERT INTO apbd_budget_period_values (
               tenant_id, entry_id, item_id, period_type, period_value,
               pagu, realisasi, target_value, target_date, document_reference,
               updated_by, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (item_id, period_type, period_value)
             DO UPDATE SET pagu = EXCLUDED.pagu,
               realisasi = EXCLUDED.realisasi,
               target_value = EXCLUDED.target_value,
               target_date = EXCLUDED.target_date,
               document_reference = EXCLUDED.document_reference,
               updated_by = EXCLUDED.updated_by,
               updated_at = EXCLUDED.updated_at`,
            [
              session.tenantId,
              entry.id,
              savedItem.id,
              period.periodType,
              period.periodValue,
              period.pagu,
              period.realisasi,
              period.targetValue,
              period.targetDate,
              period.documentReference,
              session.userId,
              now,
            ],
          );
          for (const field of ["pagu", "realisasi"] as const) {
            const previousValue = previous?.[field] ?? null;
            const newValue = period[field];
            if (previousValue === newValue) continue;
            await transaction.query(
              `INSERT INTO apbd_value_audit (
                 tenant_id, entry_id, item_id, period_type, period_value,
                 field, previous_value, new_value, actor_id
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
              [
                session.tenantId,
                entry.id,
                savedItem.id,
                period.periodType,
                period.periodValue,
                field,
                previousValue,
                newValue,
                session.userId,
              ],
            );
          }
        }
      }

      if (payload.status === "in_review") {
        if (!(await hasPublishableStoredValues(transaction, session, entry.id))) {
          throw new ApbdBudgetError(
            "Semua sub-kegiatan pada draf wajib memiliki Pagu dan Realisasi Triwulan I–IV, dengan Realisasi tidak melebihi Pagu.",
            400,
          );
        }
        const evidence = await transaction.queryOne<Row & { count: number | string }>(
          `SELECT COUNT(*)::int AS count
           FROM apbd_entry_documents
           WHERE tenant_id = $1 AND entry_id = $2`,
          [session.tenantId, entry.id],
        );
        if (Number(evidence?.count ?? 0) === 0) {
          throw new ApbdBudgetError(
            "Unggah minimal satu dokumen verifikasi PDF sebelum mengirim tinjauan.",
            400,
          );
        }
        const updated = await transaction.queryOne<Row & { id: string }>(
          `UPDATE apbd_entries SET status = 'in_review',
             source_dataset_submission_id = $5, record_metadata = $6::jsonb,
             submitted_by = $4, submitted_at = $3,
             updated_by = $4, updated_at = $3
           WHERE id = $1 AND tenant_id = $2 AND status = 'draft'
           RETURNING id::text AS id`,
          [
            entry.id,
            session.tenantId,
            now,
            session.userId,
            payload.sourceDatasetSubmissionId,
            JSON.stringify(payload.recordMetadata),
          ],
        );
        if (!updated) {
          throw new ApbdBudgetError(
            "Data berubah atau telah dipublikasikan oleh pengguna lain. Muat ulang halaman.",
            409,
          );
        }
      } else {
        await transaction.query(
          `UPDATE apbd_entries SET source_dataset_submission_id = $3,
             record_metadata = $4::jsonb, updated_by = $5, updated_at = $6
           WHERE id = $1 AND tenant_id = $2 AND status = 'draft'`,
          [
            entry.id,
            session.tenantId,
            payload.sourceDatasetSubmissionId,
            JSON.stringify(payload.recordMetadata),
            session.userId,
            now,
          ],
        );
      }

      const updatedEntry = await transaction.queryOne<EntryRow>(
        `SELECT entry.id::text AS id, entry.status,
           entry.revision_of_id::text AS "revisionOfId",
           entry.source_dataset_submission_id::text AS "sourceDatasetSubmissionId",
           entry.revision_reason AS "revisionReason",
           entry.record_metadata AS "recordMetadata",
           users.name AS "updatedBy", entry.updated_at AS "updatedAt"
         FROM apbd_entries entry
         INNER JOIN users
           ON users.id = entry.updated_by AND users.tenant_id = entry.tenant_id
         WHERE entry.id = $1 AND entry.tenant_id = $2`,
        [entry.id, session.tenantId],
      );
      if (!updatedEntry) throw new Error("Entri APBD tersimpan tidak ditemukan.");
      const responseEntry = await getEntryView(
        transaction,
        session,
        updatedEntry,
      );
      return { ...responseEntry, rowErrors: errors };
    },
    database,
  );
}

export async function uploadApbdEvidence(
  session: Session,
  entryId: string,
  file: File,
  database: Database = getDefaultDatabase(),
) {
  const fileName = file.name.trim();
  if (
    file.type !== "application/pdf" ||
    !fileName.toLowerCase().endsWith(".pdf") ||
    fileName.length > 255 ||
    file.size < 1 ||
    file.size > 10 * 1024 * 1024
  ) {
    throw new ApbdBudgetError("Bukti APBD harus berupa PDF maksimal 10 MB.", 400);
  }
  const signature = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (new TextDecoder().decode(signature) !== "%PDF-") {
    throw new ApbdBudgetError("Isi berkas tidak sesuai dengan format PDF.", 400);
  }

  const canUpload = await withUserContext(
    session,
    async (transaction) =>
      transaction.queryOne<Row & { allowed: boolean }>(
        `SELECT EXISTS (
           SELECT 1 FROM apbd_entries entry
           INNER JOIN apbd_operator_assignments assignment
             ON assignment.tenant_id = entry.tenant_id
             AND assignment.agency_id = entry.agency_id
             AND assignment.region_id = entry.region_id
             AND assignment.sector_id = entry.sector_id
           WHERE entry.id = $1 AND entry.tenant_id = $2
             AND entry.status = 'draft' AND assignment.user_id = $3
         ) AS allowed`,
        [entryId, session.tenantId, session.userId],
      ),
    database,
  );
  if (!canUpload?.allowed) {
    throw new ApbdBudgetError(
      "Bukti hanya dapat diunggah ke draf APBD dalam penugasan Anda.",
      403,
    );
  }

  const uploaded = await uploadToCloudinary({
    buffer: Buffer.from(await file.arrayBuffer()),
    tenantId: session.tenantId,
    fileName,
    mimeType: file.type,
    category: "asn",
    module: "apbd",
    privateFile: true,
  });
  if (!uploaded.assetId) {
    await deletePrivateCloudinaryFile(uploaded.publicId);
    throw new Error("Cloudinary tidak mengembalikan identitas bukti APBD.");
  }

  try {
    return await withUserContext(
      session,
      async (transaction) => {
        const document = await transaction.queryOne<
          Row & { id: string; originalName: string; mediaType: string; fileSize: number }
        >(
          `INSERT INTO apbd_entry_documents (
             tenant_id, entry_id, cloudinary_public_id, cloudinary_asset_id,
             original_name, media_type, file_size, uploaded_by
           )
           SELECT $1, entry.id, $4, $5, $6, $7, $8, $3
           FROM apbd_entries entry
           INNER JOIN apbd_operator_assignments assignment
             ON assignment.tenant_id = entry.tenant_id
             AND assignment.agency_id = entry.agency_id
             AND assignment.region_id = entry.region_id
             AND assignment.sector_id = entry.sector_id
           WHERE entry.id = $2 AND entry.tenant_id = $1
             AND entry.status = 'draft' AND assignment.user_id = $3
           RETURNING id::text AS id, original_name AS "originalName",
             media_type AS "mediaType", file_size AS "fileSize"`,
          [
            session.tenantId,
            entryId,
            session.userId,
            uploaded.publicId,
            uploaded.assetId,
            uploaded.fileName,
            uploaded.mimeType,
            uploaded.size,
          ],
        );
        if (!document) {
          throw new ApbdBudgetError(
            "Draf APBD berubah; unggah bukti dibatalkan.",
            409,
          );
        }
        return { ...document, fileSize: Number(document.fileSize) };
      },
      database,
    );
  } catch (error) {
    try {
      await deletePrivateCloudinaryFile(uploaded.publicId);
    } catch (cleanupError) {
      logger.error("apbd.evidence_upload_cleanup_failed", {
        entryId,
        tenantId: session.tenantId,
        errorType:
          cleanupError instanceof Error ? cleanupError.name : "UnknownError",
      });
      throw cleanupError;
    }
    throw error;
  }
}

export async function getApbdReviewQueue(
  session: Session,
  database: Database = getDefaultDatabase(),
) {
  return withUserContext(
    session,
    async (transaction) => {
      const entries = await transaction.query<
        EntryRow & { referenceYear: number; agencyId: string; regionId: string; regionName: string; sectorId: string; submitter: string; submittedAt: Date | string }
      >(
        `SELECT entry.id::text AS id, entry.status,
           entry.revision_of_id::text AS "revisionOfId",
           entry.source_dataset_submission_id::text AS "sourceDatasetSubmissionId",
           entry.revision_reason AS "revisionReason",
           entry.record_metadata AS "recordMetadata",
           entry.reference_year AS "referenceYear", entry.agency_id AS "agencyId",
           entry.region_id AS "regionId", entry.region_name AS "regionName",
           entry.sector_id AS "sectorId", entry.updated_at AS "updatedAt",
           entry.updated_by::text AS "updatedBy", entry.submitted_at AS "submittedAt",
           submitter.name AS submitter
         FROM apbd_entries entry
         INNER JOIN users submitter
           ON submitter.id = entry.submitted_by AND submitter.tenant_id = entry.tenant_id
         WHERE entry.tenant_id = $1 AND entry.status = 'in_review'
         ORDER BY entry.submitted_at ASC`,
        [session.tenantId],
      );
      return Promise.all(
        entries.map(async (entry) => {
          const detail = await getEntryView(transaction, session, entry);
          return {
            id: entry.id,
            sourceDatasetSubmissionId: entry.sourceDatasetSubmissionId,
            referenceYear: entry.referenceYear,
            agencyId: entry.agencyId,
            regionId: entry.regionId,
            regionName: entry.regionName,
            sectorId: entry.sectorId,
            submitter: entry.submitter,
            submittedAt: isoDate(entry.submittedAt),
            revisionReason: entry.revisionReason,
            recordMetadata: detail.recordMetadata,
            items: detail.items,
            documents: detail.documents,
          };
        }),
      );
    },
    database,
  );
}

export async function reviewApbdEntry(
  session: Session,
  entryId: string,
  decision: "approve" | "reject",
  reason: string,
  database: Database = getDefaultDatabase(),
) {
  return withUserContext(
    session,
    async (transaction) => {
      const entry = await transaction.queryOne<
        Row & {
          id: string;
          referenceYear: number;
          agencyId: string;
          regionId: string;
          sectorId: string;
          createdBy: string;
        }
      >(
        `SELECT id::text AS id, reference_year AS "referenceYear",
           agency_id AS "agencyId", region_id AS "regionId",
           sector_id AS "sectorId", created_by::text AS "createdBy"
         FROM apbd_entries
         WHERE id = $1 AND tenant_id = $2 AND status = 'in_review'
         FOR UPDATE`,
        [entryId, session.tenantId],
      );
      if (!entry) {
        throw new ApbdBudgetError("Pengajuan APBD tidak ditemukan atau sudah ditinjau.", 404);
      }

      const documents =
        decision === "reject"
          ? await transaction.query<Row & { publicId: string }>(
              `SELECT cloudinary_public_id AS "publicId"
               FROM apbd_entry_documents
               WHERE tenant_id = $1 AND entry_id = $2`,
              [session.tenantId, entryId],
            )
          : [];
      for (const document of documents) {
        await deletePrivateCloudinaryFile(document.publicId);
      }

      const now = new Date();
      if (decision === "approve") {
        if (!(await hasPublishableStoredValues(transaction, session, entryId))) {
          throw new ApbdBudgetError(
            "Pengajuan tidak memenuhi validasi Pagu dan Realisasi triwulan.",
            400,
          );
        }
        const evidence = await transaction.queryOne<Row & { count: number | string }>(
          `SELECT COUNT(*)::int AS count
           FROM apbd_entry_documents
           WHERE tenant_id = $1 AND entry_id = $2`,
          [session.tenantId, entryId],
        );
        if (Number(evidence?.count ?? 0) === 0) {
          throw new ApbdBudgetError(
            "Pengajuan tidak memiliki dokumen verifikasi.",
            400,
          );
        }
        await transaction.query(
          `UPDATE apbd_entries SET status = 'published',
             reviewed_by = $3, reviewed_at = $4, published_at = $4,
             updated_by = $3, updated_at = $4
           WHERE id = $1 AND tenant_id = $2 AND status = 'in_review'`,
          [entryId, session.tenantId, session.userId, now],
        );
      } else {
        await transaction.query(
          "SELECT set_config('app.apbd_purge_rejected', 'true', true)",
        );
        await transaction.query(
          `INSERT INTO audit_events (
             actor_id, action, target_table, target_id, metadata, created_at, updated_at
           ) VALUES ($1, 'asn.apbd.review.rejected', 'apbd_entries', $2, $3::jsonb, $4, $4)`,
          [
            session.userId,
            entryId,
            JSON.stringify({
              tenantId: session.tenantId,
              result: "rejected",
              referenceYear: entry.referenceYear,
              agencyId: entry.agencyId,
              regionId: entry.regionId,
              sectorId: entry.sectorId,
              operatorId: entry.createdBy,
              reason,
              purged: true,
            }),
            now,
          ],
        );
        await transaction.query(
          "DELETE FROM apbd_budget_period_values WHERE tenant_id = $1 AND entry_id = $2",
          [session.tenantId, entryId],
        );
        await transaction.query(
          "DELETE FROM apbd_value_audit WHERE tenant_id = $1 AND entry_id = $2",
          [session.tenantId, entryId],
        );
        await transaction.query(
          "DELETE FROM apbd_entry_documents WHERE tenant_id = $1 AND entry_id = $2",
          [session.tenantId, entryId],
        );
        await transaction.query(
          "DELETE FROM apbd_budget_items WHERE tenant_id = $1 AND entry_id = $2",
          [session.tenantId, entryId],
        );
        await transaction.query(
          "DELETE FROM apbd_entries WHERE id = $1 AND tenant_id = $2 AND status = 'in_review'",
          [entryId, session.tenantId],
        );
        return { id: entryId, status: "rejected" as const };
      }

      await transaction.query(
        `INSERT INTO audit_events (
           actor_id, action, target_table, target_id, metadata, created_at, updated_at
         ) VALUES ($1, 'asn.apbd.review.approved', 'apbd_entries', $2, $3::jsonb, $4, $4)`,
        [
          session.userId,
          entryId,
          JSON.stringify({
            tenantId: session.tenantId,
            result: "success",
            status: "published",
            referenceYear: entry.referenceYear,
            agencyId: entry.agencyId,
            regionId: entry.regionId,
            sectorId: entry.sectorId,
            operatorId: entry.createdBy,
          }),
          now,
        ],
      );
      return { id: entryId, status: "published" as const };
    },
    database,
  );
}

export async function getApbdDocumentDownloadUrl(
  session: Session,
  documentId: string,
  database: Database = getDefaultDatabase(),
): Promise<string> {
  const document = await withUserContext(
    session,
    async (transaction) =>
      transaction.queryOne<Row & { publicId: string }>(
        `SELECT document.cloudinary_public_id AS "publicId"
         FROM apbd_entry_documents document
         INNER JOIN apbd_entries entry
           ON entry.id = document.entry_id AND entry.tenant_id = document.tenant_id
         WHERE document.id = $1 AND document.tenant_id = $2
           AND (entry.status IN ('draft', 'in_review') OR EXISTS (
             SELECT 1 FROM user_roles user_role
             INNER JOIN roles role ON role.id = user_role.role_id
               AND role.tenant_id = entry.tenant_id
             WHERE user_role.user_id = $3 AND user_role.revoked_at IS NULL
               AND (user_role.expires_at IS NULL OR user_role.expires_at > NOW())
               AND role.key IN ('admin', 'superadmin')
           ))
         LIMIT 1`,
        [documentId, session.tenantId, session.userId],
      ),
    database,
  );
  if (!document) {
    throw new ApbdBudgetError("Dokumen verifikasi tidak ditemukan.", 404);
  }
  return privateCloudinaryDownloadUrl(document.publicId, "pdf");
}

export async function getPublishedApbdEntries(database: Database = getDefaultDatabase()) {
  const entries = await database.query<
    Row & {
      id: string;
      agencyId: string;
      regionId: string;
      regionName: string;
      sectorId: string;
      referenceYear: number;
      publishedAt: Date | string;
      recordMetadata: ApbdRecordMetadata;
    }
  >(
    `SELECT entry.id::text AS id, entry.agency_id AS "agencyId",
       entry.region_id AS "regionId",
       entry.region_name AS "regionName",
       entry.sector_id AS "sectorId", entry.reference_year AS "referenceYear",
       entry.published_at AS "publishedAt",
       entry.record_metadata AS "recordMetadata"
     FROM apbd_entries entry
     WHERE entry.status = 'published'
       AND COALESCE(entry.record_metadata ->> 'publicationAccess', 'public') = 'public'
       AND NOT EXISTS (
         SELECT 1 FROM apbd_entries newer
         WHERE newer.tenant_id = entry.tenant_id
           AND newer.agency_id = entry.agency_id
           AND newer.region_id = entry.region_id
           AND newer.sector_id = entry.sector_id
           AND newer.reference_year = entry.reference_year
           AND newer.status = 'published'
           AND (newer.published_at, newer.id) > (entry.published_at, entry.id)
       )
     ORDER BY entry.published_at DESC
    `,
  );
  if (!entries.length) return { entries: [] };

  const entryIds = entries.map((entry) => entry.id);
  const placeholders = entryIds.map((_, index) => `$${index + 1}`).join(", ");
  const items = await database.query<
    Row & {
      entryId: string;
      code: string;
      programName: string;
      subactivityName: string;
      pagu: string | null;
      realisasi: string | null;
      periodValue: string;
    }
  >(
    `SELECT item.entry_id::text AS "entryId", item.code,
       item.program_name AS "programName",
       item.subactivity_name AS "subactivityName", value.pagu::text AS pagu,
       value.realisasi::text AS realisasi, value.period_value AS "periodValue"
     FROM apbd_budget_items item
     INNER JOIN apbd_budget_period_values value
       ON value.item_id = item.id AND value.tenant_id = item.tenant_id
     WHERE item.entry_id IN (${placeholders})
       AND value.period_type = 'quarterly'
     ORDER BY item.code, value.period_value`,
    entryIds,
  );

  return {
    entries: entries.map((entry) => ({
      id: entry.id,
      agencyId: entry.agencyId,
      regionId: entry.regionId,
      regionName: entry.regionName,
      sectorId: entry.sectorId,
      referenceYear: entry.referenceYear,
      publishedAt: isoDate(entry.publishedAt),
      metadata: (() => {
        const metadata = apbdRecordMetadataSchema.parse(entry.recordMetadata ?? {});
        return {
          opdName: metadata.opdName,
          budgetType: metadata.budgetType,
          initialBudget: metadata.initialBudget,
          revisedBudget: metadata.revisedBudget,
          publicSummary: metadata.publicSummary,
          sourceUrl: metadata.sourceUrl,
          datasetVersion: metadata.datasetVersion,
        };
      })(),
      items: items
        .filter((item) => item.entryId === entry.id)
        .map((item) => ({
          code: item.code,
          programName: item.programName,
          subactivityName: item.subactivityName,
          periodValue: item.periodValue,
          pagu: item.pagu,
          realisasi: item.realisasi,
        })),
    })),
  };
}