CREATE TABLE discount_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('session_count', 'package')),
  min_sessions INTEGER, -- for session_count type
  discount_percent DECIMAL(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE discount_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dr_diviner" ON discount_rules FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "dr_public_read" ON discount_rules FOR SELECT USING (is_active = TRUE);
