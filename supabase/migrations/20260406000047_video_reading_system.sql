CREATE TABLE video_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  room_id text NOT NULL UNIQUE,
  room_name text,
  provider text NOT NULL DEFAULT 'videosdk' CHECK (provider IN ('videosdk','daily','whereby','zoom')),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created','waiting','live','ended','cancelled')),
  diviner_token text,
  client_token text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer,
  recording_url text,
  notes text,
  phone_dial_in_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vs_diviner_idx ON video_sessions(diviner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vs_booking_idx ON video_sessions(booking_id);
CREATE INDEX IF NOT EXISTS vs_status_idx ON video_sessions(diviner_id, status);

ALTER TABLE video_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_sessions' AND policyname='diviner_own_video_sessions') THEN
    EXECUTE $p$
      CREATE POLICY "diviner_own_video_sessions" ON video_sessions FOR ALL
      USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_sessions' AND policyname='client_own_video_sessions') THEN
    EXECUTE $p$
      CREATE POLICY "client_own_video_sessions" ON video_sessions FOR SELECT
      USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

CREATE TABLE video_session_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES video_sessions(id) ON DELETE CASCADE,
  participant_type text NOT NULL CHECK (participant_type IN ('diviner','client','guest')),
  user_id uuid,
  display_name text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  left_at timestamptz,
  duration_seconds integer GENERATED ALWAYS AS (
    CASE WHEN left_at IS NOT NULL THEN EXTRACT(EPOCH FROM (left_at - joined_at))::integer ELSE NULL END
  ) STORED
);

CREATE INDEX IF NOT EXISTS vsp_session_idx ON video_session_participants(session_id);

ALTER TABLE video_session_participants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='video_session_participants' AND policyname='service_role_vsp') THEN
    EXECUTE $p$
      CREATE POLICY "service_role_vsp" ON video_session_participants FOR ALL TO service_role USING (true) WITH CHECK (true)
    $p$;
  END IF;
END $$;
