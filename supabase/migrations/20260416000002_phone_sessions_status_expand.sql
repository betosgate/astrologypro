-- ============================================================================
-- Expand phone_sessions.status CHECK constraint
--
-- The original constraint only allows: pending, active, completed, failed.
-- Chime accept/decline routes also set 'accepted' and 'declined'.
-- Drop and recreate the constraint with the full value list.
-- ============================================================================

ALTER TABLE phone_sessions DROP CONSTRAINT IF EXISTS phone_sessions_status_check;

ALTER TABLE phone_sessions
  ADD CONSTRAINT phone_sessions_status_check
  CHECK (status IN ('pending', 'active', 'completed', 'failed', 'accepted', 'declined'));
