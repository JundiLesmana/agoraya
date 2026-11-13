ALTER TABLE tickets
  ADD COLUMN provenance_source VARCHAR(16) NOT NULL DEFAULT 'ACTUAL';

ALTER TABLE tickets
  ADD CONSTRAINT tickets_provenance_source_check
  CHECK (provenance_source IN ('ACTUAL', 'SIMULATED', 'BPS_API', 'AGGREGATE'));

UPDATE tickets
SET provenance_source = 'SIMULATED'
WHERE tenant_id = '00000000-0000-0000-0000-000000000001';