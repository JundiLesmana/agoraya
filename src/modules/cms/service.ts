import { randomUUID } from "node:crypto";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import {
  contentActionCommandSchema,
  createContentCommandSchema,
  listContentCommandSchema,
  reviewContentCommandSchema,
  rollbackContentCommandSchema,
  updateContentCommandSchema,
} from "./schema";
import type {
  ContentActionCommand,
  CreateContentCommand,
  ListContentCommand,
  ReviewContentCommand,
  RollbackContentCommand,
  UpdateContentCommand,
} from "./schema";
import { assertContentTransition } from "./state-machine/domain";
import { canPublishFromReviews, riskLevelForScore } from "./risk-review/domain";
import type {
  CmsAuthorizer,
  CmsContent,
  ContentPage,
  ContentStatus,
  ContentVersion,
  RiskReview,
} from "./types";
import type { CmsRepository } from "./repository";

export interface CmsServiceOptions {
  readonly repository: CmsRepository;
  readonly authorizer: CmsAuthorizer;
  readonly clock?: () => Date;
}
export class CmsService {
  readonly #repository: CmsRepository;
  readonly #authorizer: CmsAuthorizer;
  readonly #clock: () => Date;
  constructor(options: CmsServiceOptions) {
    this.#repository = options.repository;
    this.#authorizer = options.authorizer;
    this.#clock = options.clock ?? (() => new Date());
  }
  async create(command: CreateContentCommand): Promise<CmsContent> {
    const value = this.#parse(
      createContentCommandSchema,
      command,
      "Invalid create-content command",
    );
    await this.#allow(value.actorId, value.tenantId, "create");
    return this.#repository.transaction(async (repository) => {
      const now = this.#clock();
      const item = await repository.insertContent({
        id: randomUUID(),
        tenantId: value.tenantId,
        slug: value.slug,
        title: value.title,
        body: value.body,
        createdBy: value.actorId,
        now,
      });
      await repository.insertVersion({
        contentId: item.id,
        tenantId: item.tenantId,
        version: 1,
        title: item.title,
        body: item.body,
        status: item.status,
        changedBy: value.actorId,
        reason: "created",
        now,
      });
      await repository.insertAudit({
        contentId: item.id,
        tenantId: item.tenantId,
        actorId: value.actorId,
        action: "cms.content.created",
        previousStatus: null,
        nextStatus: "draft",
        now,
      });
      return item;
    });
  }
  async get(
    tenantId: string,
    contentId: string,
    actorId: string,
  ): Promise<CmsContent> {
    await this.#allow(actorId, tenantId, "read", contentId);
    return this.#required(this.#repository.findContent(contentId, tenantId));
  }
  async list(command: ListContentCommand): Promise<ContentPage> {
    const value = this.#parse(
      listContentCommandSchema,
      command,
      "Invalid list-content command",
    );
    await this.#allow(value.actorId, value.tenantId, "read");
    return this.#repository.listContent(
      value.tenantId,
      value.limit,
      value.offset,
      value.status,
    );
  }
  async update(command: UpdateContentCommand): Promise<CmsContent> {
    const value = this.#parse(
      updateContentCommandSchema,
      command,
      "Invalid update-content command",
    );
    await this.#allow(value.actorId, value.tenantId, "update", value.contentId);
    return this.#repository.transaction(async (repository) => {
      const current = await this.#required(
        repository.findContent(value.contentId, value.tenantId),
      );
      if (current.status === "archived")
        throw new NotFoundError("Content not found");
      const now = this.#clock();
      const version = current.version + 1;
      const updated = await repository.updateContent({
        contentId: current.id,
        title: value.title ?? current.title,
        body: value.body ?? current.body,
        status: current.status,
        version,
        publishedAt: current.publishedAt,
        archivedAt: current.archivedAt,
        deletedAt: current.deletedAt,
        now,
      });
      if (!updated) throw new NotFoundError("Content not found");
      await repository.insertVersion({
        contentId: current.id,
        tenantId: current.tenantId,
        version,
        title: updated.title,
        body: updated.body,
        status: updated.status,
        changedBy: value.actorId,
        reason: value.reason,
        now,
      });
      await repository.insertAudit({
        contentId: current.id,
        tenantId: current.tenantId,
        actorId: value.actorId,
        action: "cms.content.updated",
        previousStatus: current.status,
        nextStatus: updated.status,
        metadata: { version },
        now,
      });
      return updated;
    });
  }
  async submitForReview(command: ContentActionCommand): Promise<CmsContent> {
    return this.#transition(
      command,
      "submit_review",
      "in_review",
      "cms.content.submitted",
    );
  }
  async archive(command: ContentActionCommand): Promise<CmsContent> {
    return this.#transition(
      command,
      "archive",
      "archived",
      "cms.content.archived",
    );
  }
  async restore(command: ContentActionCommand): Promise<CmsContent> {
    const value = this.#parse(
      contentActionCommandSchema,
      command,
      "Invalid restore-content command",
    );
    await this.#allow(
      value.actorId,
      value.tenantId,
      "restore",
      value.contentId,
    );
    return this.#repository.transaction(async (repository) => {
      const current = await this.#required(
        repository.findContent(value.contentId, value.tenantId, true),
      );
      if (current.deletedAt === null)
        throw new ValidationError("Only archived content can be restored");
      assertContentTransition(current.status, "draft");
      const now = this.#clock();
      const updated = await repository.updateContent({
        contentId: current.id,
        title: current.title,
        body: current.body,
        status: "draft",
        version: current.version,
        publishedAt: null,
        archivedAt: null,
        deletedAt: null,
        now,
      });
      if (!updated) throw new NotFoundError("Content not found");
      await repository.insertAudit({
        contentId: current.id,
        tenantId: current.tenantId,
        actorId: value.actorId,
        action: "cms.content.restored",
        previousStatus: current.status,
        nextStatus: "draft",
        metadata: value.reason ? { reason: value.reason } : undefined,
        now,
      });
      return updated;
    });
  }
  async reviewRisk(command: ReviewContentCommand): Promise<RiskReview> {
    const value = this.#parse(
      reviewContentCommandSchema,
      command,
      "Invalid risk-review command",
    );
    await this.#allow(
      value.reviewerId,
      value.tenantId,
      "approve",
      value.contentId,
    );
    return this.#repository.transaction(async (repository) => {
      const current = await this.#required(
        repository.findContent(value.contentId, value.tenantId),
      );
      if (current.status !== "in_review")
        throw new ValidationError(
          "Risk reviews are accepted only while content is in_review",
        );
      if (current.createdBy === value.reviewerId)
        throw new ForbiddenError(
          "Content creator cannot approve their own content",
        );
      const existing = await repository.listRiskReviews(
        current.id,
        current.tenantId,
      );
      if (existing.some((review) => review.reviewerId === value.reviewerId))
        throw new ConflictError("Reviewer has already assessed this content");
      const now = this.#clock();
      const item = await repository.insertRiskReview({
        ...value,
        level: riskLevelForScore(value.score),
        now,
      });
      await repository.insertAudit({
        contentId: current.id,
        tenantId: current.tenantId,
        actorId: value.reviewerId,
        action: "cms.risk_review.recorded",
        previousStatus: current.status,
        nextStatus: current.status,
        metadata: {
          score: item.score,
          level: item.level,
          decision: item.decision,
        },
        now,
      });
      return item;
    });
  }
  async publish(command: ContentActionCommand): Promise<CmsContent> {
    const value = this.#parse(
      contentActionCommandSchema,
      command,
      "Invalid publish command",
    );
    await this.#allow(
      value.actorId,
      value.tenantId,
      "approve",
      value.contentId,
    );
    return this.#repository.transaction(async (repository) => {
      const current = await this.#required(
        repository.findContent(value.contentId, value.tenantId),
      );
      assertContentTransition(current.status, "published");
      const reviews = await repository.listRiskReviews(
        current.id,
        current.tenantId,
      );
      if (!canPublishFromReviews(reviews))
        throw new ValidationError(
          "Content lacks the required approved risk reviews",
        );
      const now = this.#clock();
      const updated = await repository.updateContent({
        contentId: current.id,
        title: current.title,
        body: current.body,
        status: "published",
        version: current.version,
        publishedAt: now,
        archivedAt: null,
        deletedAt: null,
        now,
      });
      if (!updated) throw new NotFoundError("Content not found");
      await repository.insertAudit({
        contentId: current.id,
        tenantId: current.tenantId,
        actorId: value.actorId,
        action: "cms.content.published",
        previousStatus: current.status,
        nextStatus: "published",
        now,
      });
      return updated;
    });
  }
  async rollback(command: RollbackContentCommand): Promise<CmsContent> {
    const value = this.#parse(
      rollbackContentCommandSchema,
      command,
      "Invalid rollback-content command",
    );
    await this.#allow(
      value.actorId,
      value.tenantId,
      "rollback",
      value.contentId,
    );
    return this.#repository.transaction(async (repository) => {
      const current = await this.#required(
        repository.findContent(value.contentId, value.tenantId),
      );
      const historical = await repository.findVersion(
        current.id,
        current.tenantId,
        value.version,
      );
      if (!historical) throw new NotFoundError("Content version not found");
      const now = this.#clock();
      const nextVersion = current.version + 1;
      const updated = await repository.updateContent({
        contentId: current.id,
        title: historical.title,
        body: historical.body,
        status: current.status,
        version: nextVersion,
        publishedAt: current.publishedAt,
        archivedAt: current.archivedAt,
        deletedAt: current.deletedAt,
        now,
      });
      if (!updated) throw new NotFoundError("Content not found");
      await repository.insertVersion({
        contentId: current.id,
        tenantId: current.tenantId,
        version: nextVersion,
        title: updated.title,
        body: updated.body,
        status: updated.status,
        changedBy: value.actorId,
        reason: `rollback to version ${value.version}: ${value.reason}`,
        now,
      });
      await repository.insertAudit({
        contentId: current.id,
        tenantId: current.tenantId,
        actorId: value.actorId,
        action: "cms.content.rolled_back",
        previousStatus: current.status,
        nextStatus: updated.status,
        metadata: { restoredVersion: value.version, version: nextVersion },
        now,
      });
      return updated;
    });
  }
  async versions(
    tenantId: string,
    contentId: string,
    actorId: string,
  ): Promise<ContentVersion[]> {
    await this.#allow(actorId, tenantId, "read", contentId);
    await this.#required(
      this.#repository.findContent(contentId, tenantId, true),
    );
    return this.#repository.listVersions(contentId, tenantId);
  }
  async #transition(
    command: ContentActionCommand,
    action: "submit_review" | "archive",
    target: ContentStatus,
    auditAction: string,
  ): Promise<CmsContent> {
    const value = this.#parse(
      contentActionCommandSchema,
      command,
      "Invalid content action command",
    );
    await this.#allow(value.actorId, value.tenantId, action, value.contentId);
    return this.#repository.transaction(async (repository) => {
      const current = await this.#required(
        repository.findContent(value.contentId, value.tenantId),
      );
      assertContentTransition(current.status, target);
      const now = this.#clock();
      const archived = target === "archived";
      const updated = await repository.updateContent({
        contentId: current.id,
        title: current.title,
        body: current.body,
        status: target,
        version: current.version,
        publishedAt: current.publishedAt,
        archivedAt: archived ? now : null,
        deletedAt: archived ? now : null,
        now,
      });
      if (!updated) throw new NotFoundError("Content not found");
      await repository.insertAudit({
        contentId: current.id,
        tenantId: current.tenantId,
        actorId: value.actorId,
        action: auditAction,
        previousStatus: current.status,
        nextStatus: target,
        metadata: value.reason ? { reason: value.reason } : undefined,
        now,
      });
      return updated;
    });
  }
  #parse<T>(
    schema: {
      safeParse(input: unknown): {
        success: boolean;
        data?: T;
        error?: { issues: { path: PropertyKey[] }[] };
      };
    },
    input: unknown,
    message: string,
  ): T {
    const parsed = schema.safeParse(input);
    if (!parsed.success || parsed.data === undefined)
      throw new ValidationError(message, {
        details: {
          issues:
            parsed.error?.issues.map((issue) => issue.path.join(".")) ?? [],
        },
      });
    return parsed.data;
  }
  async #allow(
    actorId: string,
    tenantId: string,
    action: Parameters<CmsAuthorizer["assertAllowed"]>[0]["action"],
    contentId?: string,
  ): Promise<void> {
    await this.#authorizer.assertAllowed({
      actorId,
      tenantId,
      action,
      contentId,
    });
  }
  async #required(promise: Promise<CmsContent | null>): Promise<CmsContent> {
    const item = await promise;
    if (!item) throw new NotFoundError("Content not found");
    return item;
  }
}
