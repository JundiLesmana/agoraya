export type ContentStatus = "draft" | "in_review" | "published" | "archived";
export type RiskLevel = "low" | "medium" | "high";
export type RiskDecision = "approved" | "rejected";
export type ContentAction =
  | "create"
  | "read"
  | "update"
  | "submit_review"
  | "approve"
  | "archive"
  | "restore"
  | "rollback";

export interface CmsContent {
  readonly id: string;
  readonly tenantId: string;
  readonly slug: string;
  readonly title: string;
  readonly body: Record<string, unknown>;
  readonly status: ContentStatus;
  readonly version: number;
  readonly createdBy: string;
  readonly publishedAt: Date | null;
  readonly archivedAt: Date | null;
  readonly deletedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ContentVersion {
  readonly id: string;
  readonly contentId: string;
  readonly tenantId: string;
  readonly version: number;
  readonly title: string;
  readonly body: Record<string, unknown>;
  readonly status: ContentStatus;
  readonly changedBy: string;
  readonly changeReason: string | null;
  readonly createdAt: Date;
}

export interface RiskReview {
  readonly id: string;
  readonly contentId: string;
  readonly tenantId: string;
  readonly reviewerId: string;
  readonly score: number;
  readonly level: RiskLevel;
  readonly decision: RiskDecision;
  readonly rationale: string;
  readonly createdAt: Date;
}

export interface ContentPage {
  readonly items: readonly CmsContent[];
  readonly total: number;
  readonly limit: number;
  readonly offset: number;
}

export interface CmsAuthorizer {
  assertAllowed(input: {
    readonly actorId: string;
    readonly tenantId: string;
    readonly contentId?: string;
    readonly action: ContentAction;
  }): Promise<void>;
}
