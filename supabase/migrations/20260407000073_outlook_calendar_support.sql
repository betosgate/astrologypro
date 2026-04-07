-- Task 01 (E): Add Outlook calendar event ID column to diviners table.
-- The bookings table already has outlook_calendar_event_id (per migration 20260406000018).
-- The diviners table needs a column to store the last-synced Outlook event ID for
-- webhook/bidirectional sync purposes.
-- outlook_calendar_token and the GENERATED outlook_calendar_connected already exist
-- (migration 20260406000018_calendar_module.sql). This migration is additive-only.

ALTER TABLE diviners
  ADD COLUMN IF NOT EXISTS outlook_calendar_event_id TEXT;
