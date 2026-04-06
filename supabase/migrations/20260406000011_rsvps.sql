-- Broadcast RSVPs
CREATE TABLE IF NOT EXISTS broadcast_rsvps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id   UUID NOT NULL,   -- references broadcasting table (no FK — avoid tight coupling)
  user_id        UUID NOT NULL,
  rsvp_status    TEXT NOT NULL DEFAULT 'going' CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
  attended       BOOLEAN,         -- set to true after broadcast ends if user watched
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(broadcast_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_broadcast_rsvps_broadcast ON broadcast_rsvps(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_rsvps_user      ON broadcast_rsvps(user_id);

-- Event RSVPs
CREATE TABLE IF NOT EXISTS event_rsvps (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     UUID NOT NULL,     -- references calendar_events table
  user_id      UUID NOT NULL,
  rsvp_status  TEXT NOT NULL DEFAULT 'going' CHECK (rsvp_status IN ('going', 'maybe', 'not_going')),
  attended     BOOLEAN,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_event ON event_rsvps(event_id);
CREATE INDEX IF NOT EXISTS idx_event_rsvps_user  ON event_rsvps(user_id);

-- RLS: users own their RSVPs; service_role full access
ALTER TABLE broadcast_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_broadcast_rsvps" ON broadcast_rsvps FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_broadcast_rsvps" ON broadcast_rsvps FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "own_event_rsvps" ON event_rsvps FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "service_event_rsvps" ON event_rsvps FOR ALL TO service_role USING (true) WITH CHECK (true);
