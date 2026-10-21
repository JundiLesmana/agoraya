import { randomUUID } from "node:crypto";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "@/lib/db/schema";
import {
  cmsAuditLogs,
  cmsContentVersions,
  cmsContents,
  cmsRiskReviews,
} from "@/lib/db/schema";
import type {
  CmsContent,
  ContentPage,
  ContentStatus,
  ContentVersion,
  RiskReview,
} from "./types";

export interface NewContent {
  readonly id: string;
  readonly tenantId: string;
  readonly slug: string;
  readonly title: string;
  readonly body: Record<string, unknown>;
  readonly createdBy: string;
  readonly now: Date;
}
export interface ContentPatch {
  readonly contentId: string;
  readonly title: string;
  readonly body: Record<string, unknown>;
  readonly status: ContentStatus;
  readonly version: number;
  readonly publishedAt: Date | null;
  readonly archivedAt: Date | null;
  readonly deletedAt: Date | null;
  readonly now: Date;
}
export interface AuditInput {
  readonly contentId: string;
  readonly tenantId: string;
  readonly actorId: string;
  readonly action: string;
  readonly previousStatus: ContentStatus | null;
  readonly nextStatus: ContentStatus | null;
  readonly metadata?: Record<string, unknown>;
  readonly now: Date;
}
export interface NewVersion {
  readonly contentId: string;
  readonly tenantId: string;
  readonly version: number;
  readonly title: string;
  readonly body: Record<string, unknown>;
  readonly status: ContentStatus;
  readonly changedBy: string;
  readonly reason: string | null;
  readonly now: Date;
}
export interface NewRiskReview {
  readonly contentId: string;
  readonly tenantId: string;
  readonly reviewerId: string;
  readonly score: number;
  readonly level: RiskReview["level"];
  readonly decision: RiskReview["decision"];
  readonly rationale: string;
  readonly now: Date;
}

export interface CmsRepository {
  transaction<T>(fn: (repository: CmsRepository) => Promise<T>): Promise<T>;
  findContent(
    id: string,
    tenantId: string,
    includeArchived?: boolean,
  ): Promise<CmsContent | null>;
  listContent(
    tenantId: string,
    limit: number,
    offset: number,
    status?: ContentStatus,
  ): Promise<ContentPage>;
  insertContent(input: NewContent): Promise<CmsContent>;
  updateContent(input: ContentPatch): Promise<CmsContent | null>;
  insertVersion(input: NewVersion): Promise<ContentVersion>;
  findVersion(
    contentId: string,
    tenantId: string,
    version: number,
  ): Promise<ContentVersion | null>;
  listVersions(contentId: string, tenantId: string): Promise<ContentVersion[]>;
  insertRiskReview(input: NewRiskReview): Promise<RiskReview>;
  listRiskReviews(contentId: string, tenantId: string): Promise<RiskReview[]>;
  insertAudit(input: AuditInput): Promise<void>;
}

const copy = <T>(value: T): T => structuredClone(value);
export class InMemoryCmsRepository implements CmsRepository {
  #contents = new Map<string, CmsContent>();
  #versions = new Map<string, ContentVersion>();
  #reviews = new Map<string, RiskReview>();
  readonly audits: AuditInput[] = [];
  async transaction<T>(
    fn: (repository: CmsRepository) => Promise<T>,
  ): Promise<T> {
    const snapshot = copy({
      contents: [...this.#contents],
      versions: [...this.#versions],
      reviews: [...this.#reviews],
      audits: this.audits,
    });
    try {
      return await fn(this);
    } catch (error) {
      this.#contents = new Map(snapshot.contents);
      this.#versions = new Map(snapshot.versions);
      this.#reviews = new Map(snapshot.reviews);
      this.audits.splice(0, this.audits.length, ...snapshot.audits);
      throw error;
    }
  }
  async findContent(
    id: string,
    tenantId: string,
    includeArchived = false,
  ): Promise<CmsContent | null> {
    const item = this.#contents.get(id);
    return item &&
      item.tenantId === tenantId &&
      (includeArchived || item.deletedAt === null)
      ? copy(item)
      : null;
  }
  async listContent(
    tenantId: string,
    limit: number,
    offset: number,
    status?: ContentStatus,
  ): Promise<ContentPage> {
    const all = [...this.#contents.values()]
      .filter(
        (item) =>
          item.tenantId === tenantId &&
          item.deletedAt === null &&
          (status === undefined || item.status === status),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    return {
      items: copy(all.slice(offset, offset + limit)),
      total: all.length,
      limit,
      offset,
    };
  }
  async insertContent(input: NewContent): Promise<CmsContent> {
    const item: CmsContent = {
      ...input,
      status: "draft",
      version: 1,
      publishedAt: null,
      archivedAt: null,
      deletedAt: null,
      createdAt: input.now,
      updatedAt: input.now,
    };
    this.#contents.set(item.id, item);
    return copy(item);
  }
  async updateContent(input: ContentPatch): Promise<CmsContent | null> {
    const old = this.#contents.get(input.contentId);
    if (!old) return null;
    const item = {
      ...old,
      ...input,
      id: old.id,
      tenantId: old.tenantId,
      slug: old.slug,
      createdBy: old.createdBy,
      createdAt: old.createdAt,
      updatedAt: input.now,
    };
    this.#contents.set(item.id, item);
    return copy(item);
  }
  async insertVersion(input: NewVersion): Promise<ContentVersion> {
    const item: ContentVersion = {
      id: randomUUID(),
      contentId: input.contentId,
      tenantId: input.tenantId,
      version: input.version,
      title: input.title,
      body: copy(input.body),
      status: input.status,
      changedBy: input.changedBy,
      changeReason: input.reason,
      createdAt: input.now,
    };
    this.#versions.set(item.id, item);
    return copy(item);
  }
  async findVersion(
    contentId: string,
    tenantId: string,
    version: number,
  ): Promise<ContentVersion | null> {
    return copy(
      [...this.#versions.values()].find(
        (item) =>
          item.contentId === contentId &&
          item.tenantId === tenantId &&
          item.version === version,
      ) ?? null,
    );
  }
  async listVersions(
    contentId: string,
    tenantId: string,
  ): Promise<ContentVersion[]> {
    return copy(
      [...this.#versions.values()]
        .filter(
          (item) => item.contentId === contentId && item.tenantId === tenantId,
        )
        .sort((a, b) => a.version - b.version),
    );
  }
  async insertRiskReview(input: NewRiskReview): Promise<RiskReview> {
    const item: RiskReview = {
      id: randomUUID(),
      ...input,
      createdAt: input.now,
    };
    this.#reviews.set(item.id, item);
    return copy(item);
  }
  async listRiskReviews(
    contentId: string,
    tenantId: string,
  ): Promise<RiskReview[]> {
    return copy(
      [...this.#reviews.values()].filter(
        (item) => item.contentId === contentId && item.tenantId === tenantId,
      ),
    );
  }
  async insertAudit(input: AuditInput): Promise<void> {
    this.audits.push(copy(input));
  }
}

function content(row: typeof cmsContents.$inferSelect): CmsContent {
  return {
    ...row,
    body: row.body as Record<string, unknown>,
    publishedAt: row.publishedAt ?? null,
    archivedAt: row.archivedAt ?? null,
    deletedAt: row.deletedAt ?? null,
  };
}
function version(row: typeof cmsContentVersions.$inferSelect): ContentVersion {
  return {
    ...row,
    body: row.body as Record<string, unknown>,
    changeReason: row.changeReason ?? null,
  };
}
function review(row: typeof cmsRiskReviews.$inferSelect): RiskReview {
  return row;
}
function drizzleRepository(
  db: PostgresJsDatabase<typeof schema>,
): CmsRepository {
  return {
    transaction: async (fn) =>
      db.transaction((tx) => fn(drizzleRepository(tx))),
    async findContent(id, tenantId, includeArchived = false) {
      const conditions = [
        eq(cmsContents.id, id),
        eq(cmsContents.tenantId, tenantId),
      ];
      if (!includeArchived) conditions.push(isNull(cmsContents.deletedAt));
      const rows = await db
        .select()
        .from(cmsContents)
        .where(and(...conditions))
        .limit(1);
      return rows[0] ? content(rows[0]) : null;
    },
    async listContent(tenantId, limit, offset, status) {
      const conditions = [
        eq(cmsContents.tenantId, tenantId),
        isNull(cmsContents.deletedAt),
      ];
      if (status) conditions.push(eq(cmsContents.status, status));
      const where = and(...conditions);
      const [items, totals] = await Promise.all([
        db
          .select()
          .from(cmsContents)
          .where(where)
          .orderBy(asc(cmsContents.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ total: count() }).from(cmsContents).where(where),
      ]);
      return {
        items: items.map(content),
        total: Number(totals[0]?.total ?? 0),
        limit,
        offset,
      };
    },
    async insertContent(input) {
      const rows = await db
        .insert(cmsContents)
        .values({
          ...input,
          status: "draft",
          version: 1,
          createdAt: input.now,
          updatedAt: input.now,
        })
        .returning();
      if (!rows[0]) throw new Error("CMS insert returned no row");
      return content(rows[0]);
    },
    async updateContent(input) {
      const rows = await db
        .update(cmsContents)
        .set({
          title: input.title,
          body: input.body,
          status: input.status,
          version: input.version,
          publishedAt: input.publishedAt,
          archivedAt: input.archivedAt,
          deletedAt: input.deletedAt,
          updatedAt: input.now,
        })
        .where(eq(cmsContents.id, input.contentId))
        .returning();
      return rows[0] ? content(rows[0]) : null;
    },
    async insertVersion(input) {
      const rows = await db
        .insert(cmsContentVersions)
        .values({
          id: randomUUID(),
          contentId: input.contentId,
          tenantId: input.tenantId,
          version: input.version,
          title: input.title,
          body: input.body,
          status: input.status,
          changedBy: input.changedBy,
          changeReason: input.reason,
          createdAt: input.now,
        })
        .returning();
      if (!rows[0]) throw new Error("CMS version insert returned no row");
      return version(rows[0]);
    },
    async findVersion(contentId, tenantId, versionNumber) {
      const rows = await db
        .select()
        .from(cmsContentVersions)
        .where(
          and(
            eq(cmsContentVersions.contentId, contentId),
            eq(cmsContentVersions.tenantId, tenantId),
            eq(cmsContentVersions.version, versionNumber),
          ),
        )
        .limit(1);
      return rows[0] ? version(rows[0]) : null;
    },
    async listVersions(contentId, tenantId) {
      return (
        await db
          .select()
          .from(cmsContentVersions)
          .where(
            and(
              eq(cmsContentVersions.contentId, contentId),
              eq(cmsContentVersions.tenantId, tenantId),
            ),
          )
          .orderBy(asc(cmsContentVersions.version))
      ).map(version);
    },
    async insertRiskReview(input) {
      const rows = await db
        .insert(cmsRiskReviews)
        .values({ id: randomUUID(), ...input, createdAt: input.now })
        .returning();
      if (!rows[0]) throw new Error("CMS risk review insert returned no row");
      return review(rows[0]);
    },
    async listRiskReviews(contentId, tenantId) {
      return (
        await db
          .select()
          .from(cmsRiskReviews)
          .where(
            and(
              eq(cmsRiskReviews.contentId, contentId),
              eq(cmsRiskReviews.tenantId, tenantId),
            ),
          )
      ).map(review);
    },
    async insertAudit(input) {
      await db.insert(cmsAuditLogs).values({
        id: randomUUID(),
        contentId: input.contentId,
        tenantId: input.tenantId,
        actorId: input.actorId,
        action: input.action,
        previousStatus: input.previousStatus,
        nextStatus: input.nextStatus,
        metadata: input.metadata,
        createdAt: input.now,
      });
    },
  };
}
export function createDrizzleCmsRepository(
  db: PostgresJsDatabase<typeof schema>,
): CmsRepository {
  return drizzleRepository(db);
}
