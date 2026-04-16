-- ============================================================================
-- Simultaneous Ring support
--
-- When a client calls, we can ring the diviner's personal phone AND show
-- the dashboard widget at the same time. We need to track:
--   - The outbound call transaction ID (to cancel if diviner answers from dashboard)
--   - The Chime phone number used (to set as caller ID on outbound call)
-- ============================================================================

-- Track the outbound call to diviner's phone so we can cancel it
ALTER TABLE phone_sessions
  ADD COLUMN IF NOT EXISTS chime_outbound_transaction_id VARCHAR(255);

-- Push subscriptions table for Web Push notifications
-- (created in 20260416000002_push_subscriptions.sql)
