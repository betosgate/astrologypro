-- ============================================================================
-- Add AWS Chime SDK as alternative video/phone provider
--
-- Additive only — no columns removed, no existing constraints modified
-- destructively. All Daily.co and Twilio columns remain intact.
-- ============================================================================

-- -------------------------------------------------------
-- 1. Expand video_sessions.provider CHECK to include 'chime'
-- -------------------------------------------------------

ALTER TABLE video_sessions DROP CONSTRAINT IF EXISTS video_sessions_provider_check;
ALTER TABLE video_sessions ADD CONSTRAINT video_sessions_provider_check
  CHECK (provider IN ('videosdk','daily','whereby','zoom','chime'));

-- -------------------------------------------------------
-- 2. Diviner provider preferences (admin-controlled)
-- -------------------------------------------------------

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS video_provider VARCHAR(20) DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS phone_provider VARCHAR(20) DEFAULT 'twilio',
  ADD COLUMN IF NOT EXISTS chime_phone_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS chime_sma_phone_arn TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diviners_video_provider_check'
  ) THEN
    ALTER TABLE diviners ADD CONSTRAINT diviners_video_provider_check
      CHECK (video_provider IN ('daily', 'chime'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'diviners_phone_provider_check'
  ) THEN
    ALTER TABLE diviners ADD CONSTRAINT diviners_phone_provider_check
      CHECK (phone_provider IN ('twilio', 'chime'));
  END IF;
END $$;

-- -------------------------------------------------------
-- 3. Provider tracking on bookings (snapshot at booking time)
-- -------------------------------------------------------

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS video_provider VARCHAR(20) DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS chime_meeting_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS chime_external_meeting_id VARCHAR(255);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_video_provider_check'
  ) THEN
    ALTER TABLE bookings ADD CONSTRAINT bookings_video_provider_check
      CHECK (video_provider IN ('daily', 'chime'));
  END IF;
END $$;

-- -------------------------------------------------------
-- 4. Provider tracking on phone_sessions
-- -------------------------------------------------------

ALTER TABLE phone_sessions
  ADD COLUMN IF NOT EXISTS phone_provider VARCHAR(20) DEFAULT 'twilio',
  ADD COLUMN IF NOT EXISTS chime_meeting_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS chime_transaction_id VARCHAR(255);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'phone_sessions_phone_provider_check'
  ) THEN
    ALTER TABLE phone_sessions ADD CONSTRAINT phone_sessions_phone_provider_check
      CHECK (phone_provider IN ('twilio', 'chime'));
  END IF;
END $$;

-- -------------------------------------------------------
-- 5. Chime fields on video_sessions
-- -------------------------------------------------------

ALTER TABLE video_sessions
  ADD COLUMN IF NOT EXISTS chime_meeting_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS chime_external_meeting_id VARCHAR(255);

-- -------------------------------------------------------
-- 6. Index for provider lookups
-- -------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_bookings_video_provider
  ON bookings(video_provider) WHERE video_provider = 'chime';

CREATE INDEX IF NOT EXISTS idx_bookings_chime_meeting
  ON bookings(chime_meeting_id) WHERE chime_meeting_id IS NOT NULL;
