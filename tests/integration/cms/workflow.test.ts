import { beforeEach, describe, expect, it } from "vitest";
import { CmsService, InMemoryCmsRepository } from "@/modules/cms";
import type { CmsAuthorizer } from "@/modules/cms";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";

const tenantId = "00000000-0000-0000-0000-000000000001";
const authorId = "00000000-0000-0000-0000-000000000010";
const reviewerOne = "00000000-0000-0000-0000-000000000020";
const reviewerTwo = "00000000-0000-0000-0000-000000000021";
const allow: CmsAuthorizer = { async assertAllowed() {} };

describe("CMS workflow", () => {
  let repository: InMemoryCmsRepository;
  let cms: CmsService;
  beforeEach(() => {
    repository = new InMemoryCmsRepository();
    cms = new CmsService({
      repository,
      authorizer: allow,
      clock: () => new Date("2026-10-21T00:00:00.000Z"),
    });
  });
  async function create() {
    return cms.create({
      tenantId,
      actorId: authorId,
      slug: "roadworks-update",
      title: "Roadworks",
      body: { blocks: [] },
    });
  }

  it("creates draft content, submits it, and publishes it after a low-risk approval", async () => {
    const item = await create();
    expect(item.status).toBe("draft");
    const reviewed = await cms.submitForReview({
      tenantId,
      contentId: item.id,
      actorId: authorId,
    });
    expect(reviewed.status).toBe("in_review");
    await cms.reviewRisk({
      tenantId,
      contentId: item.id,
      reviewerId: reviewerOne,
      score: 2,
      decision: "approved",
      rationale: "Routine update",
    });
    expect(
      (
        await cms.publish({
          tenantId,
          contentId: item.id,
          actorId: reviewerOne,
        })
      ).status,
    ).toBe("published");
  });

  it("requires a second independent approval for high-risk content", async () => {
    const item = await create();
    await cms.submitForReview({
      tenantId,
      contentId: item.id,
      actorId: authorId,
    });
    await cms.reviewRisk({
      tenantId,
      contentId: item.id,
      reviewerId: reviewerOne,
      score: 9,
      decision: "approved",
      rationale: "Sensitive policy impact",
    });
    await expect(
      cms.publish({ tenantId, contentId: item.id, actorId: reviewerOne }),
    ).rejects.toThrow(ValidationError);
    await cms.reviewRisk({
      tenantId,
      contentId: item.id,
      reviewerId: reviewerTwo,
      score: 9,
      decision: "approved",
      rationale: "Second review completed",
    });
    expect(
      (
        await cms.publish({
          tenantId,
          contentId: item.id,
          actorId: reviewerTwo,
        })
      ).status,
    ).toBe("published");
  });

  it("creates a version on update and atomically restores a prior version", async () => {
    const item = await create();
    await cms.update({
      tenantId,
      contentId: item.id,
      actorId: authorId,
      title: "Updated roadworks",
      reason: "Correct title",
    });
    const versions = await cms.versions(tenantId, item.id, authorId);
    expect(versions.map((version) => version.version)).toEqual([1, 2]);
    const rolledBack = await cms.rollback({
      tenantId,
      contentId: item.id,
      actorId: authorId,
      version: 1,
      reason: "Restore original",
    });
    expect(rolledBack.title).toBe("Roadworks");
    expect(rolledBack.version).toBe(3);
    expect(
      (await cms.versions(tenantId, item.id, authorId)).map(
        (version) => version.version,
      ),
    ).toEqual([1, 2, 3]);
  });

  it("soft-deletes archived content so normal access returns 404", async () => {
    const item = await create();
    await cms.archive({
      tenantId,
      contentId: item.id,
      actorId: authorId,
      reason: "Retired",
    });
    await expect(cms.get(tenantId, item.id, authorId)).rejects.toThrow(
      NotFoundError,
    );
    expect(
      (
        await cms.restore({
          tenantId,
          contentId: item.id,
          actorId: authorId,
          reason: "Restore by editor",
        })
      ).status,
    ).toBe("draft");
  });

  it("rejects creator self-approval and cross-tenant reads", async () => {
    const item = await create();
    await cms.submitForReview({
      tenantId,
      contentId: item.id,
      actorId: authorId,
    });
    await expect(
      cms.reviewRisk({
        tenantId,
        contentId: item.id,
        reviewerId: authorId,
        score: 1,
        decision: "approved",
        rationale: "Self review",
      }),
    ).rejects.toThrow(ForbiddenError);
    await expect(
      cms.get("00000000-0000-0000-0000-000000000099", item.id, authorId),
    ).rejects.toThrow(NotFoundError);
  });

  it("does not permit CMS mutation when the injected RBAC authorizer denies it", async () => {
    const denied = new CmsService({
      repository,
      authorizer: {
        async assertAllowed() {
          throw new ForbiddenError("CMS action is not permitted");
        },
      },
    });
    await expect(
      denied.create({
        tenantId,
        actorId: authorId,
        slug: "restricted",
        title: "Restricted",
        body: {},
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
