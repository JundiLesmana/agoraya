import { getDefaultDatabase } from "@/lib/db/client";
import type { Database, Row } from "@/lib/db/types";
import {
  datasetCatalogResponseSchema,
  datasetMetadataRecordSchema,
  type DatasetCatalogQuery,
  type DatasetCatalogResponse,
  type DatasetMetadataRecord,
} from "./contract";

const PAGE_SIZE = 12;
const CATEGORY_ALIASES: Readonly<Record<string, readonly string[]>> = {
  Anggaran: ["Ekonomi"],
  Proyek: ["Pembangunan"],
};

type DatasetRow = Row & {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  sourceOrganization: string;
  sourceLabel: "BPS_API" | "SIMULATED" | "CITIZEN_UNVERIFIED";
  tags: string[];
  lastUpdatedAt: Date | string;
  downloadsCount: number;
  resources: unknown;
};

type MetadataRow = DatasetRow & {
  description: string;
  sourceUrl: string | null;
  licenseName: string;
  licenseUrl: string | null;
  dataDictionary: unknown;
};

type FacetRow = Row & { value: string };
type CountRow = Row & { total: number | string };

function isoDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Dataset has an invalid last-updated date.");
  }
  return date.toISOString();
}

function placeholders(params: unknown[], value: unknown): string {
  params.push(value);
  return `$${params.length}`;
}

function mapMetadataRow(row: MetadataRow): DatasetMetadataRecord {
  return datasetMetadataRecordSchema.parse({
    ...row,
    lastUpdatedAt: isoDate(row.lastUpdatedAt),
  });
}

export function buildDatasetCatalogWhere(query: DatasetCatalogQuery): {
  whereSql: string;
  params: unknown[];
  searchPlaceholder: string | undefined;
} {
  const params: unknown[] = [];
  const where = ["d.is_published = TRUE"];
  let searchPlaceholder: string | undefined;

  if (query.search) {
    searchPlaceholder = placeholders(params, query.search);
    where.push(
      `d.search_vector @@ websearch_to_tsquery('simple', ${searchPlaceholder})`,
    );
  }
  if (query.category) {
    const aliases = CATEGORY_ALIASES[query.category];
    if (aliases) {
      const categories = [query.category, ...aliases].map((category) =>
        placeholders(params, category),
      );
      where.push(`d.category IN (${categories.join(", ")})`);
    } else {
      where.push(`d.category = ${placeholders(params, query.category)}`);
    }
  }
  if (query.agency) {
    where.push(`d.source_organization = ${placeholders(params, query.agency)}`);
  }
  if (query.format) {
    const formatPlaceholder = placeholders(params, query.format);
    where.push(
      `EXISTS (
        SELECT 1 FROM dataset_resources filtered_resource
        WHERE filtered_resource.dataset_id = d.id
          AND filtered_resource.format = ${formatPlaceholder}
      )`,
    );
  }

  return {
    whereSql: where.join(" AND "),
    params,
    searchPlaceholder,
  };
}

export interface DatasetCatalogRepository {
  list(query: DatasetCatalogQuery): Promise<DatasetCatalogResponse>;
  getBySlug(slug: string): Promise<DatasetMetadataRecord | null>;
}

export function createDatasetCatalogRepository(
  db: Database = getDefaultDatabase(),
): DatasetCatalogRepository {
  return {
    async list(query) {
      const { whereSql, params, searchPlaceholder } =
        buildDatasetCatalogWhere(query);
      const orderSql =
        query.sort === "downloads"
          ? "d.downloads_count DESC, d.last_updated_at DESC"
          : query.sort === "recent"
            ? "d.last_updated_at DESC"
            : searchPlaceholder
              ? `ts_rank_cd(d.search_vector, websearch_to_tsquery('simple', ${searchPlaceholder})) DESC, d.last_updated_at DESC`
              : "d.last_updated_at DESC";
      const limitPlaceholder = placeholders(params, PAGE_SIZE);
      const offsetPlaceholder = placeholders(
        params,
        (query.page - 1) * PAGE_SIZE,
      );
      const pageParams = [...params];
      const countParams = params.slice(0, -2);

      const [rows, countRows, categoryRows, agencyRows] = await Promise.all([
        db.query<DatasetRow>(
          `SELECT
            d.id::text AS id,
            d.slug,
            d.title,
            d.summary,
            d.category,
            d.source_organization AS "sourceOrganization",
            d.source_label AS "sourceLabel",
            d.tags,
            d.last_updated_at AS "lastUpdatedAt",
            d.downloads_count AS "downloadsCount",
            COALESCE(
              json_agg(json_build_object(
                'id', r.id::text,
                'title', r.title,
                'format', r.format,
                'url', r.url
              ) ORDER BY r.format) FILTER (WHERE r.id IS NOT NULL),
              '[]'::json
            ) AS resources
          FROM datasets d
          LEFT JOIN dataset_resources r ON r.dataset_id = d.id
          WHERE ${whereSql}
          GROUP BY d.id
          ORDER BY ${orderSql}, d.id
          LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
          pageParams,
        ),
        db.query<CountRow>(
          `SELECT COUNT(*) AS total FROM datasets d WHERE ${whereSql}`,
          countParams,
        ),
        db.query<FacetRow>(
          `SELECT DISTINCT category AS value
           FROM datasets WHERE is_published = TRUE ORDER BY category`,
        ),
        db.query<FacetRow>(
          `SELECT DISTINCT source_organization AS value
           FROM datasets WHERE is_published = TRUE
           ORDER BY source_organization`,
        ),
      ]);

      const total = Number(countRows[0]?.total ?? 0);
      return datasetCatalogResponseSchema.parse({
        data: rows.map((row) => ({
          ...row,
          lastUpdatedAt: isoDate(row.lastUpdatedAt),
        })),
        total,
        page: query.page,
        pageSize: PAGE_SIZE,
        totalPages: Math.ceil(total / PAGE_SIZE),
        filters: {
          categories: categoryRows.map((row) => row.value),
          agencies: agencyRows.map((row) => row.value),
        },
      });
    },

    async getBySlug(slug) {
      const row = await db.queryOne<MetadataRow>(
        `SELECT
          d.id::text AS id,
          d.slug,
          d.title,
          d.summary,
          d.description,
          d.category,
          d.source_organization AS "sourceOrganization",
          d.source_url AS "sourceUrl",
          d.source_label AS "sourceLabel",
          d.license_name AS "licenseName",
          d.license_url AS "licenseUrl",
          d.tags,
          d.data_dictionary AS "dataDictionary",
          d.last_updated_at AS "lastUpdatedAt",
          d.downloads_count AS "downloadsCount",
          COALESCE(
            json_agg(json_build_object(
              'id', r.id::text,
              'title', r.title,
              'format', r.format,
              'url', r.url
            ) ORDER BY r.format) FILTER (WHERE r.id IS NOT NULL),
            '[]'::json
          ) AS resources
        FROM datasets d
        LEFT JOIN dataset_resources r ON r.dataset_id = d.id
        WHERE d.slug = $1 AND d.is_published = TRUE
        GROUP BY d.id`,
        [slug],
      );

      return row ? mapMetadataRow(row) : null;
    },
  };
}
