import type { Database } from "@/lib/db";

export const REFRESH_ANALYTICS_MATERIALIZED_VIEW_SQL =
  "REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_ticket_aggregates";

export async function refreshAnalyticsMaterializedView(
  database: Database,
): Promise<void> {
  await database.query(REFRESH_ANALYTICS_MATERIALIZED_VIEW_SQL);
}
