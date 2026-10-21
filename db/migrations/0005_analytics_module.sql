-- Batch analytics for non-draft civic reports. Only aggregate dimensions are
-- materialized; ticket identifiers, citizen identifiers, descriptions, and
-- locations are not included.
CREATE MATERIALIZED VIEW analytics_ticket_aggregates AS
SELECT
  tenant_id,
  category,
  status,
  COUNT(*) AS ticket_count,
  COUNT(*) FILTER (WHERE resolved_at IS NOT NULL) AS resolved_count,
  COALESCE(
    SUM(EXTRACT(EPOCH FROM (resolved_at - submitted_at)))
      FILTER (WHERE resolved_at IS NOT NULL),
    0
  ) AS resolution_seconds_sum,
  AVG(EXTRACT(EPOCH FROM (resolved_at - submitted_at)))
    FILTER (WHERE resolved_at IS NOT NULL) AS average_resolution_seconds
FROM tickets
WHERE status <> 'draft'
  AND submitted_at IS NOT NULL
GROUP BY tenant_id, category, status
WITH DATA;

CREATE UNIQUE INDEX analytics_ticket_aggregates_unique_idx
  ON analytics_ticket_aggregates (tenant_id, category, status);
