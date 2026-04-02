CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  path VARCHAR(255) NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  ip_hash VARCHAR(64),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_page_views_diviner ON page_views(diviner_id);
CREATE INDEX idx_page_views_created ON page_views(created_at);
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pv_diviner" ON page_views FOR SELECT USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
-- Allow public insert (tracking)
CREATE POLICY "pv_insert" ON page_views FOR INSERT WITH CHECK (TRUE);
