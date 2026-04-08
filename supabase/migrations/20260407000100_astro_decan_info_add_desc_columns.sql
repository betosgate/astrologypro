-- Add cached AI description columns and decan_img to astro_decan_info
-- These store AI-generated interpretations so they are not re-generated on every modal open.

ALTER TABLE astro_decan_info
  ADD COLUMN IF NOT EXISTS planet_sign_short_desc TEXT,
  ADD COLUMN IF NOT EXISTS planet_sign_long_desc  TEXT,
  ADD COLUMN IF NOT EXISTS daemon_short_desc      TEXT,
  ADD COLUMN IF NOT EXISTS daemon_long_desc       TEXT,
  ADD COLUMN IF NOT EXISTS tarot_short_desc       TEXT,
  ADD COLUMN IF NOT EXISTS tarot_long_desc        TEXT,
  ADD COLUMN IF NOT EXISTS decan_img              TEXT;
