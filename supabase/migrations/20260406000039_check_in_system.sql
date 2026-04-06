-- check_ins table: captures leads when diviner is live
CREATE TABLE check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  birth_date date,
  birth_city text,
  birth_time time,
  ip_address inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX check_ins_diviner_id_idx ON check_ins(diviner_id);
CREATE INDEX check_ins_email_idx ON check_ins(email);
CREATE INDEX check_ins_created_at_idx ON check_ins(diviner_id, created_at DESC);

ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;

-- Diviners can view their own check-ins
CREATE POLICY "diviners_read_own_check_ins"
  ON check_ins FOR SELECT
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

-- Anyone can insert (public check-in form)
CREATE POLICY "public_insert_check_ins"
  ON check_ins FOR INSERT
  WITH CHECK (true);

-- live_sessions table: tracks when a diviner is live
CREATE TABLE live_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook','youtube','instagram','tiktok','zoom','other')),
  platform_url text,
  title text,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  check_in_enabled boolean NOT NULL DEFAULT true,
  check_in_form_title text DEFAULT 'Get Your Free Birth Chart Reading',
  check_in_form_subtitle text DEFAULT 'Join live and get personalized insights',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX live_sessions_diviner_id_idx ON live_sessions(diviner_id);
CREATE INDEX live_sessions_status_idx ON live_sessions(diviner_id, status);

ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diviners_manage_own_live_sessions"
  ON live_sessions FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

CREATE POLICY "public_read_live_sessions"
  ON live_sessions FOR SELECT
  USING (status IN ('live','scheduled'));
