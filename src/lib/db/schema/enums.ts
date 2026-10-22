import { pgEnum } from "drizzle-orm/pg-core";

export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "suspended"]);
export const kycStatusEnum = pgEnum("kyc_status", ["pending", "partially_approved", "verified", "rejected", "expired"]);
export const kycApprovalDecisionEnum = pgEnum("kyc_approval_decision", ["approved", "rejected"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["draft", "submitted", "verified", "in_progress", "resolved", "rejected", "closed"]);
export const bpsSourceEnum = pgEnum("bps_source", ["BPS_API", "SIMULATED", "CITIZEN_UNVERIFIED"]);
export const cmsContentStatusEnum = pgEnum("cms_content_status", ["draft", "in_review", "published", "archived"]);
export const cmsRiskDecisionEnum = pgEnum("cms_risk_decision", ["approved", "rejected"]);
export const cmsRiskLevelEnum = pgEnum("cms_risk_level", ["low", "medium", "high"]);
