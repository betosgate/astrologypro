CREATE TABLE IF NOT EXISTS mundane_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  subtitle TEXT,
  report_type VARCHAR(30) NOT NULL DEFAULT 'monthly_digest'
    CHECK (report_type IN ('monthly_digest', 'eclipse_report', 'ingress_report', 'leader_watch', 'custom')),
  content_blocks JSONB NOT NULL DEFAULT '[]',
  entity_ids UUID[] DEFAULT '{}',
  date_range_start DATE,
  date_range_end DATE,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  share_token VARCHAR(64) UNIQUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_publications_type ON mundane_publications(report_type);
CREATE INDEX idx_publications_created_at ON mundane_publications(created_at DESC, id DESC);

ALTER TABLE mundane_publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pub_admin" ON mundane_publications FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "pub_service_role" ON mundane_publications FOR ALL TO service_role USING (true);
CREATE POLICY "pub_public_read" ON mundane_publications FOR SELECT USING (is_published = TRUE);
