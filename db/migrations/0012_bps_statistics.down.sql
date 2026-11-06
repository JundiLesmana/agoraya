-- Migration: 0012_bps_statistics
-- Description: Rollback bps_statistics table.
-- Created: 2026-11-05
--

DROP INDEX IF EXISTS bps_statistics_indicator_code_idx;
DROP INDEX IF EXISTS bps_statistics_region_code_idx;
DROP TABLE IF EXISTS bps_statistics;
