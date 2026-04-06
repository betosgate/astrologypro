-- Add content_thumbnail_url and duration_label to mandalism_content
-- Additive migration — safe to run multiple times (IF NOT EXISTS)

ALTER TABLE mandalism_content
  ADD COLUMN IF NOT EXISTS content_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_label VARCHAR(20);

COMMENT ON COLUMN mandalism_content.content_thumbnail_url IS
  'URL to a thumbnail or cover image for video and document content types';

COMMENT ON COLUMN mandalism_content.duration_label IS
  'Human-readable duration label for video content (e.g. "45 min")';
