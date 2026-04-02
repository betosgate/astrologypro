-- Mundane astrology event log — one row per unique event (deduplication table)
-- event_key is unique: e.g. "mars-capricorn", "mercury-retrograde", "jupiter-sextile-mercury-2026-04"
CREATE TABLE IF NOT EXISTS mundane_event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('ingress','retrograde','direct','aspect')),
  event_label TEXT NOT NULL,            -- "Mars enters Capricorn"
  image_filename TEXT NOT NULL,         -- "mars-in-capricorn.jpg"
  image_storage_url TEXT,               -- Supabase Storage public URL (set after upload)
  content_short TEXT,                   -- Claude-generated 2-3 sentence description
  hashtags TEXT,                        -- "#MundaneAstrology #MarsInCapricorn ..."
  active BOOLEAN DEFAULT true,          -- false once event ends
  event_start_date DATE NOT NULL,
  sent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mundane_event_log_key ON mundane_event_log(event_key);
CREATE INDEX IF NOT EXISTS idx_mundane_event_log_active ON mundane_event_log(active, event_start_date);

-- Extend share_batches for mundane shares and affiliate targeting
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS share_number INTEGER DEFAULT 1;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS share_date DATE;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS is_mundane BOOLEAN DEFAULT false;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS mundane_event_id UUID REFERENCES mundane_event_log(id);
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS affiliate_id UUID REFERENCES affiliates(id);
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS recipient_email TEXT;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS recipient_name TEXT;
ALTER TABLE share_batches ADD COLUMN IF NOT EXISTS diviner_username TEXT;
