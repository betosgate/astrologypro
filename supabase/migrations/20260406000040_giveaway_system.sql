-- ─────────────────────────────────────────────────────────────────────────────
-- Giveaway System
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE giveaways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  prize_description text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','ended','cancelled')),
  entry_fields jsonb NOT NULL DEFAULT '["name","email"]'::jsonb,
  max_entries integer,
  starts_at timestamptz,
  ends_at timestamptz,
  winner_count integer NOT NULL DEFAULT 1,
  winner_selection text NOT NULL DEFAULT 'random' CHECK (winner_selection IN ('random','manual')),
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX giveaways_diviner_id_idx ON giveaways(diviner_id);
CREATE INDEX giveaways_status_idx ON giveaways(status);

ALTER TABLE giveaways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diviners_manage_own_giveaways"
  ON giveaways FOR ALL
  USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()));

CREATE POLICY "public_read_active_giveaways"
  ON giveaways FOR SELECT
  USING (status = 'active' AND is_public = true);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE giveaway_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  extra_fields jsonb DEFAULT '{}'::jsonb,
  ip_address inet,
  is_winner boolean NOT NULL DEFAULT false,
  entered_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX giveaway_entries_unique_email ON giveaway_entries(giveaway_id, email);
CREATE INDEX giveaway_entries_giveaway_id_idx ON giveaway_entries(giveaway_id, entered_at DESC);

ALTER TABLE giveaway_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diviners_read_own_giveaway_entries"
  ON giveaway_entries FOR SELECT
  USING (giveaway_id IN (
    SELECT id FROM giveaways WHERE diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "public_insert_giveaway_entries"
  ON giveaway_entries FOR INSERT
  WITH CHECK (
    giveaway_id IN (
      SELECT id FROM giveaways WHERE status = 'active' AND is_public = true
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE giveaway_winners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  giveaway_id uuid NOT NULL REFERENCES giveaways(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES giveaway_entries(id) ON DELETE CASCADE,
  selected_at timestamptz NOT NULL DEFAULT now(),
  notified_at timestamptz,
  notes text,
  UNIQUE(giveaway_id, entry_id)
);

ALTER TABLE giveaway_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diviners_manage_own_winners"
  ON giveaway_winners FOR ALL
  USING (giveaway_id IN (
    SELECT id FROM giveaways WHERE diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  ));
