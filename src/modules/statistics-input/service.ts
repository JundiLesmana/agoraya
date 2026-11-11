import { v2 as cloudinary } from "cloudinary";
import { tenantCloudinaryFolder } from "@/lib/cloudinary/folders";
import { getDefaultDatabase } from "@/lib/db/client";
import type { Database, Row } from "@/lib/db/types";
import type { Session } from "@/lib/auth/session";
import { logger } from "@/lib/logger";
import {
  STATISTIC_INDICATORS,
  STATISTIC_SECTORS,
  statisticInputPayloadSchema,
  type StatisticAssignment,
  type StatisticEntryView,
  type StatisticInputPayload,
} from "./contract";
import { detectStatisticAnomalies, type StatisticPoint } from "./domain";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Map([
  ["application/pdf", "pdf"],
  ["application/vnd.ms-excel", "xls"],
  ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"],
]);

type AssignmentRow = Row & {
  agencyId: string;
  regionId: string;
  regionName: string;
  sectorId: string;
};
type EntryRow = Row & {
  id: string;
  status: "draft" | "published";
  sourceName: string;
  methodology: string;
};
type ValueRow = Row & {
  id: string;
  periodValue: string;
  actualValue: number | string;
  explanation: string;
};
type DocumentRow = Row & {
  id: string;
  originalName: string;
  fileSize: number;
};
type AuditRow = Row & {
  periodValue: string;
  previousValue: number | string | null;
  newValue: number | string;
  actorName: string;
  changedAt: Date | string;
};
type PublishedEntryRow = Row & {
  id: string;
  regionId: string;
  regionName: string;
  sectorId: string;
  indicatorId: string;
  referenceYear: number;
  sourceName: string;
  methodology: string;
  publishedAt: Date | string;
};
type PublishedValueRow = Row & {
  entryId: string;
  periodValue: string;
  actualValue: number | string;
};
type DownloadRow = Row & {
  cloudinaryPublicId: string;
  originalName: string;
};
type UploadedDocument = {
  readonly publicId: string;
  readonly assetId: string;
  readonly originalName: string;
  readonly mediaType: string;
  readonly fileSize: number;
};

export class StatisticsInputError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "StatisticsInputError";
  }
}

export async function getPublishedStatisticInputs(
  database: Database = getDefaultDatabase(),
) {
  const entries = await database.query<PublishedEntryRow>(
    `SELECT DISTINCT ON (
         tenant_id, region_id, sector_id, indicator_id, reference_year
       )
       id::text AS id, region_id AS "regionId",
       region_name AS "regionName",
       sector_id AS "sectorId", indicator_id AS "indicatorId",
       reference_year AS "referenceYear", source_name AS "sourceName",
       methodology, published_at AS "publishedAt"
     FROM statistic_entries
     WHERE status = 'published'
     ORDER BY tenant_id, region_id, sector_id, indicator_id, reference_year,
       published_at DESC NULLS LAST, id DESC`,
  );
  if (!entries.length) return { entries: [] };

  const entryPlaceholders = entries
    .map((_, index) => `$${index + 1}`)
    .join(", ");
  const values = await database.query<PublishedValueRow>(
    `SELECT entry_id::text AS "entryId", period_value AS "periodValue",
       actual_value AS "actualValue"
     FROM statistic_values
     WHERE entry_id IN (${entryPlaceholders})
     ORDER BY period_value`,
    entries.map((entry) => entry.id),
  );
  return {
    entries: entries.map((entry) => {
      const indicator = STATISTIC_INDICATORS.find(
        (item) => item.id === entry.indicatorId,
      );
      if (!indicator) {
        throw new Error("Data publikasi merujuk indikator yang tidak dikenal.");
      }
      return {
        id: entry.id,
        regionId: entry.regionId,
        regionName: entry.regionName,
        sectorId: entry.sectorId,
        indicatorId: entry.indicatorId,
        indicatorName: indicator.name,
        unit: indicator.unit,
        referenceYear: entry.referenceYear,
        sourceName: entry.sourceName,
        methodology: entry.methodology,
        publishedAt: asIsoString(entry.publishedAt),
        values: values
          .filter((value) => value.entryId === entry.id)
          .map((value) => ({
            periodValue: value.periodValue,
            value: Number(value.actualValue),
          })),
      };
    }),
  };
}

export async function getStatisticDocumentDownloadUrl(
  session: Session,
  documentId: string,
  database?: Database,
): Promise<string> {
  const document = await withUserContext(
    session,
    async (transaction) =>
      transaction.queryOne<DownloadRow>(
        `SELECT document.cloudinary_public_id AS "cloudinaryPublicId",
           document.original_name AS "originalName"
         FROM statistic_entry_documents document
         INNER JOIN statistic_entries entry
           ON entry.id = document.entry_id
           AND entry.tenant_id = document.tenant_id
         INNER JOIN statistic_operator_assignments assignment
           ON assignment.tenant_id = entry.tenant_id
           AND assignment.user_id = $2
           AND assignment.agency_id = entry.agency_id
           AND assignment.region_id = entry.region_id
           AND assignment.sector_id = entry.sector_id
         WHERE document.id = $1 AND document.tenant_id = $3
         LIMIT 1`,
        [documentId, session.userId, session.tenantId],
      ),
    database,
  );
  if (!document) {
    throw new StatisticsInputError("Dokumen tidak ditemukan.", 404);
  }
  const extension = document.originalName.split(".").pop()?.toLowerCase();
  if (extension !== "pdf" && extension !== "xls" && extension !== "xlsx") {
    throw new Error("Ekstensi dokumen statistik tersimpan tidak valid.");
  }
  const client = cloudinaryClient();
  return client.utils.private_download_url(
    document.cloudinaryPublicId,
    extension,
    {
      resource_type: "raw",
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
    },
  );
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

function mapAssignment(row: AssignmentRow): StatisticAssignment {
  const sector = STATISTIC_SECTORS.find((item) => item.id === row.sectorId);
  if (!sector) {
    throw new Error("Assignment memiliki sektor statistik yang tidak valid.");
  }
  return {
    agencyId: row.agencyId,
    regionId: row.regionId,
    regionName: row.regionName,
    sectorId: sector.id,
  };
}

async function listAssignments(
  transaction: Database,
  session: Session,
): Promise<StatisticAssignment[]> {
  const rows = await transaction.query<AssignmentRow>(
    `SELECT agency_id AS "agencyId", region_id AS "regionId",
       region_name AS "regionName", sector_id AS "sectorId"
     FROM statistic_operator_assignments
     WHERE tenant_id = $1 AND user_id = $2
     ORDER BY region_name, sector_id`,
    [session.tenantId, session.userId],
  );
  return rows.map(mapAssignment);
}

async function requireAssignment(
  transaction: Database,
  session: Session,
  regionId: string,
  sectorId: string,
): Promise<StatisticAssignment> {
  const assignments = await listAssignments(transaction, session);
  const assignment = hasStatisticAssignment(assignments, regionId, sectorId);
  if (!assignment) {
    throw new StatisticsInputError(
      "Wilayah atau sektor tidak termasuk dalam hak akses akun Anda.",
      403,
    );
  }
  return assignment;
}

export function hasStatisticAssignment(
  assignments: readonly StatisticAssignment[],
  regionId: string,
  sectorId: string,
): StatisticAssignment | null {
  return (
    assignments.find(
      (assignment) =>
        assignment.regionId === regionId && assignment.sectorId === sectorId,
    ) ?? null
  );
}

function mapEntryValues(rows: readonly ValueRow[]) {
  return rows.map((row) => ({
    periodValue: row.periodValue,
    value: Number(row.actualValue),
    explanation: row.explanation,
  }));
}

function asIsoString(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Riwayat statistik berisi tanggal yang tidak valid.");
  }
  return date.toISOString();
}

async function getEntryView(
  transaction: Database,
  session: Session,
  assignment: StatisticAssignment,
  context: {
    readonly referenceYear: number;
    readonly indicatorId: string;
  },
): Promise<StatisticEntryView> {
  const entry = await transaction.queryOne<EntryRow>(
    `SELECT id::text AS id, status, source_name AS "sourceName",
       methodology
     FROM statistic_entries
     WHERE tenant_id = $1 AND agency_id = $2 AND region_id = $3
       AND sector_id = $4 AND indicator_id = $5 AND reference_year = $6`,
    [
      session.tenantId,
      assignment.agencyId,
      assignment.regionId,
      assignment.sectorId,
      context.indicatorId,
      context.referenceYear,
    ],
  );
  if (!entry) {
    return {
      id: null,
      status: null,
      sourceName: "",
      methodology: "",
      values: [],
      documents: [],
      history: [],
    };
  }

  const [values, documents, history] = await Promise.all([
    transaction.query<ValueRow>(
      `SELECT period_value AS "periodValue", actual_value AS "actualValue",
         explanation
       FROM statistic_values
       WHERE tenant_id = $1 AND entry_id = $2
       ORDER BY period_value`,
      [session.tenantId, entry.id],
    ),
    transaction.query<DocumentRow>(
      `SELECT id::text AS id, original_name AS "originalName",
         file_size AS "fileSize"
       FROM statistic_entry_documents
       WHERE tenant_id = $1 AND entry_id = $2
       ORDER BY created_at`,
      [session.tenantId, entry.id],
    ),
    transaction.query<AuditRow>(
      `SELECT audit.period_value AS "periodValue",
         audit.previous_value AS "previousValue",
         audit.new_value AS "newValue", users.name AS "actorName",
         audit.created_at AS "changedAt"
       FROM statistic_value_audit audit
       INNER JOIN users ON users.id = audit.actor_id
         AND users.tenant_id = audit.tenant_id
       WHERE audit.tenant_id = $1 AND audit.entry_id = $2
       ORDER BY audit.created_at DESC
       LIMIT 10`,
      [session.tenantId, entry.id],
    ),
  ]);
  return {
    id: entry.id,
    status: entry.status,
    sourceName: entry.sourceName,
    methodology: entry.methodology,
    values: mapEntryValues(values),
    documents,
    history: history.map((row) => ({
      periodValue: row.periodValue,
      previousValue:
        row.previousValue === null ? null : Number(row.previousValue),
      newValue: Number(row.newValue),
      actorName: row.actorName,
      changedAt: asIsoString(row.changedAt),
    })),
  };
}

export async function getStatisticsWorkspace(
  session: Session,
  context?: {
    readonly referenceYear: number;
    readonly regionId: string;
    readonly sectorId: StatisticAssignment["sectorId"];
    readonly indicatorId: string;
  },
  database?: Database,
): Promise<{
  readonly assignments: readonly StatisticAssignment[];
  readonly indicators: typeof STATISTIC_INDICATORS;
  readonly entry: StatisticEntryView | null;
}> {
  return withUserContext(
    session,
    async (transaction) => {
      const assignments = await listAssignments(transaction, session);
      if (!context) {
        return { assignments, indicators: STATISTIC_INDICATORS, entry: null };
      }
      const assignment = await requireAssignment(
        transaction,
        session,
        context.regionId,
        context.sectorId,
      );
      const indicator = STATISTIC_INDICATORS.find(
        (item) =>
          item.id === context.indicatorId &&
          item.sectorId === assignment.sectorId,
      );
      if (!indicator) {
        throw new StatisticsInputError(
          "Indikator tidak termasuk dalam sektor yang diizinkan.",
          403,
        );
      }
      const entry = await getEntryView(transaction, session, assignment, {
        referenceYear: context.referenceYear,
        indicatorId: context.indicatorId,
      });
      return {
        assignments,
        indicators: STATISTIC_INDICATORS,
        entry,
      };
    },
    database,
  );
}

function cloudinaryClient() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error(
      "Cloudinary belum dikonfigurasi untuk unggahan dokumen statistik.",
    );
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  return cloudinary;
}

function hasValidFileSignature(mediaType: string, bytes: Uint8Array): boolean {
  if (mediaType === "application/pdf") {
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }
  if (mediaType === "application/vnd.ms-excel") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0 &&
      bytes[4] === 0xa1 &&
      bytes[5] === 0xb1 &&
      bytes[6] === 0x1a &&
      bytes[7] === 0xe1
    );
  }
  return (
    mediaType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" &&
    bytes.length >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    bytes[2] === 0x03 &&
    bytes[3] === 0x04
  );
}

async function validateFiles(files: readonly File[]): Promise<void> {
  if (files.length > MAX_FILES) {
    throw new StatisticsInputError(
      `Maksimal ${MAX_FILES} dokumen pendukung.`,
      400,
    );
  }
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (
      !ALLOWED_FILE_TYPES.has(file.type) ||
      ALLOWED_FILE_TYPES.get(file.type) !== extension ||
      file.name.length > 255
    ) {
      throw new StatisticsInputError(
        `Format dokumen ${file.name} harus PDF, XLS, atau XLSX.`,
        400,
      );
    }
    if (file.size < 1 || file.size > MAX_FILE_SIZE) {
      throw new StatisticsInputError(
        `Ukuran dokumen ${file.name} maksimal 10 MB.`,
        400,
      );
    }
    const signature = new Uint8Array(await file.slice(0, 8).arrayBuffer());
    if (!hasValidFileSignature(file.type, signature)) {
      throw new StatisticsInputError(
        `Isi dokumen ${file.name} tidak sesuai dengan formatnya.`,
        400,
      );
    }
  }
}

async function uploadDocuments(
  files: readonly File[],
  session: Session,
  payload: StatisticInputPayload,
  onUploaded: (document: UploadedDocument) => void,
): Promise<UploadedDocument[]> {
  if (files.length === 0) return [];
  await validateFiles(files);
  const client = cloudinaryClient();
  const documents: UploadedDocument[] = [];
  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const result = await client.uploader.upload(
      `data:${file.type};base64,${bytes.toString("base64")}`,
      {
        resource_type: "raw",
        type: "authenticated",
        folder: tenantCloudinaryFolder(
          session.tenantId,
          "statistics-input",
          payload.regionId,
          String(payload.referenceYear),
        ),
        public_id: crypto.randomUUID(),
        overwrite: false,
        unique_filename: false,
      },
    );
    if (!result.public_id || !result.asset_id) {
      throw new Error("Cloudinary tidak mengembalikan identitas dokumen.");
    }
    const document = {
      publicId: result.public_id,
      assetId: result.asset_id,
      originalName: file.name,
      mediaType: file.type,
      fileSize: file.size,
    };
    documents.push(document);
    onUploaded(document);
  }
  return documents;
}

async function deleteUploadedDocuments(
  documents: readonly UploadedDocument[],
): Promise<void> {
  if (!documents.length) return;
  const client = cloudinaryClient();
  const results = await Promise.all(
    documents.map((document) =>
      client.uploader.destroy(document.publicId, {
        resource_type: "raw",
        type: "authenticated",
        invalidate: true,
      }),
    ),
  );
  if (
    results.some(
      (result) => result.result !== "ok" && result.result !== "not found",
    )
  ) {
    throw new Error("Cloudinary gagal menghapus dokumen yang belum tersimpan.");
  }
}

function mergePoints(
  existing: readonly ValueRow[],
  incoming: StatisticInputPayload["values"],
): StatisticPoint[] {
  const pointsByPeriod = new Map<string, StatisticPoint>();
  for (const row of existing) {
    pointsByPeriod.set(row.periodValue, {
      periodValue: row.periodValue,
      value: Number(row.actualValue),
      explanation: row.explanation,
    });
  }
  for (const row of incoming) {
    pointsByPeriod.set(row.periodValue, row);
  }
  return [...pointsByPeriod.values()];
}

export async function saveStatisticsInput(
  session: Session,
  rawPayload: unknown,
  files: readonly File[],
  database: Database = getDefaultDatabase(),
): Promise<{ readonly id: string; readonly status: "draft" | "published" }> {
  const parsed = statisticInputPayloadSchema.safeParse(rawPayload);
  if (!parsed.success) {
    throw new StatisticsInputError(
      parsed.error.issues[0]?.message ?? "Data statistik tidak valid.",
      400,
    );
  }
  const payload = parsed.data;
  const indicator = STATISTIC_INDICATORS.find(
    (item) => item.id === payload.indicatorId,
  );
  if (!indicator) {
    throw new StatisticsInputError("Indikator tidak dikenal.", 400);
  }

  await validateFiles(files);
  const uploaded: UploadedDocument[] = [];
  try {
    return await withUserContext(
      session,
      async (transaction) => {
        const assignment = await requireAssignment(
          transaction,
          session,
          payload.regionId,
          payload.sectorId,
        );
        const entry = await transaction.queryOne<EntryRow>(
          `SELECT id::text AS id, status, source_name AS "sourceName",
             methodology
           FROM statistic_entries
           WHERE tenant_id = $1 AND agency_id = $2 AND region_id = $3
             AND sector_id = $4 AND indicator_id = $5
             AND reference_year = $6
           FOR UPDATE`,
          [
            session.tenantId,
            assignment.agencyId,
            assignment.regionId,
            payload.sectorId,
            payload.indicatorId,
            payload.referenceYear,
          ],
        );
        if (entry?.status === "published") {
          throw new StatisticsInputError(
            "Data yang telah dipublikasikan terkunci. Ajukan revisi melalui alur verifikasi.",
            409,
          );
        }
        const now = new Date();
        const entryResult = await transaction.queryOne<Row & { id: string }>(
          `INSERT INTO statistic_entries (
             tenant_id, agency_id, region_id, region_name, sector_id,
             indicator_id, reference_year, source_name, methodology, status,
             created_by, updated_by, published_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::varchar, $11, $11,
             CASE WHEN $10::varchar = 'published' THEN $12 ELSE NULL END, $12)
           ON CONFLICT (tenant_id, agency_id, region_id, sector_id, indicator_id, reference_year)
           DO UPDATE SET region_name = EXCLUDED.region_name,
             source_name = EXCLUDED.source_name,
             methodology = EXCLUDED.methodology, status = EXCLUDED.status,
             updated_by = EXCLUDED.updated_by, updated_at = EXCLUDED.updated_at,
             published_at = CASE WHEN EXCLUDED.status = 'published'
               THEN COALESCE(statistic_entries.published_at, EXCLUDED.published_at)
               ELSE NULL END
           WHERE statistic_entries.status <> 'published'
           RETURNING id::text AS id`,
          [
            session.tenantId,
            assignment.agencyId,
            assignment.regionId,
            assignment.regionName,
            payload.sectorId,
            payload.indicatorId,
            payload.referenceYear,
            payload.sourceName,
            payload.methodology,
            payload.status,
            session.userId,
            now,
          ],
        );
        if (!entryResult) {
          throw new StatisticsInputError(
            "Data yang telah dipublikasikan terkunci. Ajukan revisi melalui alur verifikasi.",
            409,
          );
        }
        const entryId = entryResult.id;
        if (payload.status === "published") {
          await transaction.query(
            `INSERT INTO audit_events (
               id, actor_id, action, target_table, target_id, metadata
             ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb)`,
            [
              session.userId,
              "statistic_entry.published",
              "statistic_entries",
              entryId,
              JSON.stringify({
                regionId: assignment.regionId,
                sectorId: payload.sectorId,
                indicatorId: payload.indicatorId,
                referenceYear: payload.referenceYear,
              }),
            ],
          );
        }

        const documentCount = await transaction.queryOne<
          Row & { count: number | string }
        >(
          `SELECT COUNT(*)::int AS count
           FROM statistic_entry_documents
           WHERE tenant_id = $1 AND entry_id = $2`,
          [session.tenantId, entryId],
        );
        if (Number(documentCount?.count ?? 0) + files.length > MAX_FILES) {
          throw new StatisticsInputError(
            `Maksimal ${MAX_FILES} dokumen pendukung untuk satu entri.`,
            400,
          );
        }

        const existingValues = await transaction.query<ValueRow>(
          `SELECT id::text AS id, period_value AS "periodValue",
             actual_value AS "actualValue", explanation
           FROM statistic_values
           WHERE tenant_id = $1 AND entry_id = $2
           ORDER BY period_value`,
          [session.tenantId, entryId],
        );
        const anomalies = detectStatisticAnomalies(
          payload.periodType,
          mergePoints(existingValues, payload.values),
        );
        if (anomalies.length) {
          const periods = anomalies.map((item) => item.periodValue).join(", ");
          throw new StatisticsInputError(
            `Perubahan lebih dari 50% pada periode ${periods} memerlukan catatan penjelasan.`,
            400,
          );
        }

        for (const value of payload.values) {
          const prior = existingValues.find(
            (row) => row.periodValue === value.periodValue,
          );
          const valueRow = await transaction.queryOne<
            Row & { id: string; actualValue: number | string }
          >(
            `INSERT INTO statistic_values (
               tenant_id, entry_id, agency_id, region_id, sector_id,
               indicator_id, reference_year, period_type, period_value,
               actual_value, explanation, updated_by, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (entry_id, period_type, period_value)
             DO UPDATE SET actual_value = EXCLUDED.actual_value,
               explanation = EXCLUDED.explanation, updated_by = EXCLUDED.updated_by,
               updated_at = EXCLUDED.updated_at
             RETURNING id::text AS id, actual_value AS "actualValue"`,
            [
              session.tenantId,
              entryId,
              assignment.agencyId,
              assignment.regionId,
              payload.sectorId,
              payload.indicatorId,
              payload.referenceYear,
              payload.periodType,
              value.periodValue,
              value.value,
              value.explanation,
              session.userId,
              now,
            ],
          );
          if (!valueRow) {
            throw new Error("Nilai periode statistik gagal disimpan.");
          }
          const previousValue =
            prior === undefined ? null : Number(prior.actualValue);
          if (previousValue !== value.value) {
            await transaction.query(
              `INSERT INTO statistic_value_audit (
                 tenant_id, entry_id, value_id, period_value,
                 previous_value, new_value, actor_id
               ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                session.tenantId,
                entryId,
                valueRow.id,
                value.periodValue,
                previousValue,
                value.value,
                session.userId,
              ],
            );
            await transaction.query(
              `INSERT INTO audit_events (
                 id, actor_id, action, target_table, target_id, metadata
               ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5::jsonb)`,
              [
                session.userId,
                "statistic_value.changed",
                "statistic_values",
                valueRow.id,
                JSON.stringify({
                  tenantId: session.tenantId,
                  actorRole: session.roles.join(","),
                  result: "success",
                  status: payload.status,
                  periodValue: value.periodValue,
                  previousValue,
                  newValue: value.value,
                  entryId,
                }),
              ],
            );
          }
        }

        const newDocuments = await uploadDocuments(
          files,
          session,
          payload,
          (document) => uploaded.push(document),
        );
        for (const document of newDocuments) {
          await transaction.query(
            `INSERT INTO statistic_entry_documents (
               tenant_id, entry_id, cloudinary_public_id, cloudinary_asset_id,
               original_name, media_type, file_size, uploaded_by
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              session.tenantId,
              entryId,
              document.publicId,
              document.assetId,
              document.originalName,
              document.mediaType,
              document.fileSize,
              session.userId,
            ],
          );
        }
        return { id: entryId, status: payload.status };
      },
      database,
    );
  } catch (error) {
    if (uploaded.length) {
      try {
        await deleteUploadedDocuments(uploaded);
      } catch (cleanupError) {
        logger.error("statistics_input.upload_cleanup_failed", {
          errorType:
            cleanupError instanceof Error ? cleanupError.name : "UnknownError",
        });
        throw cleanupError;
      }
    }

    throw error;
  }
}
