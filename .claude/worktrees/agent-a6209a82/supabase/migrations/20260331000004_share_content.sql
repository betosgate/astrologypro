-- Marketing content templates (needed for share batches)
CREATE TABLE IF NOT EXISTS marketing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  caption_template TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  platforms TEXT[] DEFAULT '{}',
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Share content batches (weekly content packages sent to diviners)
CREATE TABLE share_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES marketing_content(id),
  token VARCHAR(40) UNIQUE NOT NULL,
  caption TEXT NOT NULL,
  image_url TEXT,
  tracking_url TEXT NOT NULL,
  sent_via_email BOOLEAN DEFAULT FALSE,
  sent_via_sms BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  shares JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_share_batches_token ON share_batches(token);
CREATE INDEX idx_share_batches_diviner ON share_batches(diviner_id);

ALTER TABLE share_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "share_batches_diviner" ON share_batches FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "share_batches_public_read" ON share_batches FOR SELECT USING (TRUE);

-- Add sms notification fields to diviners if not exists
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS share_notifications_enabled BOOLEAN DEFAULT TRUE;
