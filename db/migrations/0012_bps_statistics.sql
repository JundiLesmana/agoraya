-- Migration: 0012_bps_statistics
-- Description: Strict, normalized BPS statistics snapshot table for upsert-based sync.
-- Created: 2026-11-05
--
-- Replaces jsonb payload storage with a narrow, typed row to reduce storage on
-- Neon Free Tier. Enforces uniqueness on (indicator_code, region_code, year)
-- so the table supports Upsert semantics.

CREATE TABLE bps_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_code VARCHAR(100) NOT NULL,
  region_code VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  value NUMERIC(20, 6) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  source_label VARCHAR(100) NOT NULL,
  last_synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT bps_statistics_indicator_region_year_unique UNIQUE (indicator_code, region_code, year),
  CONSTRAINT bps_statistics_year_check CHECK (year BETWEEN 2000 AND 2100),
  CONSTRAINT bps_statistics_value_check CHECK (value >= 0)
);

CREATE INDEX bps_statistics_region_code_idx ON bps_statistics(region_code);
CREATE INDEX bps_statistics_indicator_code_idx ON bps_statistics(indicator_code);
