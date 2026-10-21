import { ForbiddenError } from "@/lib/errors";
import type { PolicyDecisionPoint } from "@/modules/rbac";
import type { CmsAuthorizer, ContentAction } from "./types";

/** Bridges CMS mutations to the RBAC PDP; routes should inject this adapter. */
export function createRbacCmsAuthorizer(
  pdp: PolicyDecisionPoint,
): CmsAuthorizer {
  return {
    async assertAllowed({ actorId, tenantId, contentId, action }) {
      const decision = await pdp.evaluate({
        subject: { userId: actorId, tenantId },
        resource: { type: "cms_content", id: contentId, tenantId },
        action: actionFor(action),
      });
      if (!decision.allowed) {
        throw new ForbiddenError("CMS action is not permitted");
      }
    },
  };
}

function actionFor(action: ContentAction): string {
  return action === "submit_review" ? "submit" : action;
}
