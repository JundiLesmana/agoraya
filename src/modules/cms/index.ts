export * from "./types";
export * from "./schema";
export { CmsService } from "./service";
export type { CmsServiceOptions } from "./service";
export {
  InMemoryCmsRepository,
  createDrizzleCmsRepository,
} from "./repository";
export type { CmsRepository } from "./repository";
export { createRbacCmsAuthorizer } from "./rbac";
export {
  assertContentTransition,
  isAllowedContentTransition,
  InvalidContentTransitionError,
} from "./state-machine/domain";
export {
  approvalsRequired,
  canPublishFromReviews,
  riskLevelForScore,
} from "./risk-review/domain";
import { CmsService } from "./service";
import type { CmsServiceOptions } from "./service";
export function createCmsModule(options: CmsServiceOptions): {
  readonly content: CmsService;
} {
  return { content: new CmsService(options) };
}
