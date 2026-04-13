ALTER TABLE services
  ADD COLUMN IF NOT EXISTS platform_fee_percent NUMERIC(5,2) DEFAULT NULL;

COMMENT ON COLUMN services.platform_fee_percent IS
  'Override platform fee % for this service. NULL = use global default (20%).';
