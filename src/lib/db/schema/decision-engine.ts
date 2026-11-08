import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { infrastructureProjects } from "./project-progress";
import { tenants, users } from "./foundation";

export const decisionRuns = pgTable(
  "decision_runs",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id")
      .references(() => tenants.id, { onDelete: "cascade" })
      .notNull(),
    requestedBy: uuid("requested_by")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    fiscalYear: integer("fiscal_year").notNull(),
    criteriaVersion: varchar("criteria_version", { length: 50 }).notNull(),
    algorithmVersion: varchar("algorithm_version", { length: 50 }).notNull(),
    criteriaSnapshot: jsonb("criteria_snapshot").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idTenant: uniqueIndex("decision_runs_id_tenant_idx").on(
      table.id,
      table.tenantId,
    ),
    tenantCreatedAt: index("decision_runs_tenant_created_at_idx").on(
      table.tenantId,
      table.createdAt,
    ),
  }),
);

export const decisionRunItems = pgTable(
  "decision_run_items",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    tenantId: uuid("tenant_id").notNull(),
    runId: uuid("run_id").notNull(),
    projectId: uuid("project_id").notNull(),
    rank: integer("rank").notNull(),
    score: numeric("score", { precision: 7, scale: 4, mode: "number" })
      .notNull(),
    inputSnapshot: jsonb("input_snapshot").notNull(),
    scoreBreakdown: jsonb("score_breakdown").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    runTenantFk: foreignKey({
      columns: [table.runId, table.tenantId],
      foreignColumns: [decisionRuns.id, decisionRuns.tenantId],
      name: "decision_run_items_run_tenant_fk",
    }).onDelete("cascade"),
    projectTenantFk: foreignKey({
      columns: [table.projectId, table.tenantId],
      foreignColumns: [
        infrastructureProjects.id,
        infrastructureProjects.tenantId,
      ],
      name: "decision_run_items_project_tenant_fk",
    }).onDelete("cascade"),
    runProject: uniqueIndex("decision_run_items_run_project_idx").on(
      table.runId,
      table.projectId,
    ),
    runRank: uniqueIndex("decision_run_items_run_rank_idx").on(
      table.runId,
      table.rank,
    ),
    tenantRunRank: index("decision_run_items_tenant_run_rank_idx").on(
      table.tenantId,
      table.runId,
      table.rank,
    ),
    rankCheck: check("decision_run_items_rank_check", sql`${table.rank} > 0`),
    scoreCheck: check(
      "decision_run_items_score_check",
      sql`${table.score} >= 0 AND ${table.score} <= 100`,
    ),
  }),
);
