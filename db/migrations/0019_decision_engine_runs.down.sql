-- Rollback: 0019_decision_engine_runs
-- Drops decision_run_items then decision_runs (child table first due to FK).

DROP TABLE IF EXISTS decision_run_items;
DROP TABLE IF EXISTS decision_runs;
