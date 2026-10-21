import type { ContentStatus } from "../types";

const transitions: Readonly<Record<ContentStatus, readonly ContentStatus[]>> = {
  draft: ["in_review", "archived"],
  in_review: ["published", "archived"],
  published: ["archived"],
  archived: ["draft"],
};
export class InvalidContentTransitionError extends Error {
  constructor(
    readonly from: ContentStatus,
    readonly to: ContentStatus,
  ) {
    super(`Content cannot transition from ${from} to ${to}`);
    this.name = "InvalidContentTransitionError";
  }
}
export function isAllowedContentTransition(
  from: ContentStatus,
  to: ContentStatus,
): boolean {
  return transitions[from].includes(to);
}
export function assertContentTransition(
  from: ContentStatus,
  to: ContentStatus,
): void {
  if (!isAllowedContentTransition(from, to))
    throw new InvalidContentTransitionError(from, to);
}
