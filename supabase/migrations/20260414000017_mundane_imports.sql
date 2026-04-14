CREATE TABLE IF NOT EXISTS mundane_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type VARCHAR(30) NOT NULL DEFAULT 'csv_events'
    CHECK (import_type IN ('csv_events','csv_entities','csv_leaders','csv_forecasts')),
  file_name VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','processing','completed','failed')),
  total_rows INTEGER DEFAULT 0,
  imported_rows INTEGER DEFAULT 0,
  error_rows INTEGER DEFAULT 0,
  error_details JSONB DEFAULT '[]',
  column_mapping JSONB DEFAULT '{}',
  raw_preview JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE mundane_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mi_admin" ON mundane_imports FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "mi_service_role" ON mundane_imports FOR ALL TO service_role USING (true);
