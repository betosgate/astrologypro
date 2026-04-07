CREATE TABLE media_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id uuid NOT NULL REFERENCES diviners(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('video','audio','article','link','image')),
  url text NOT NULL,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  category text,
  platform text,
  duration_seconds integer,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  view_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS media_items_diviner_id_idx ON media_items(diviner_id, sort_order, is_active);
CREATE INDEX IF NOT EXISTS media_items_type_idx ON media_items(diviner_id, type, is_active);

ALTER TABLE media_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'media_items'
      AND policyname = 'diviners_manage_own_media'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "diviners_manage_own_media"
        ON media_items FOR ALL
        USING (diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid()))
    $p$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'media_items'
      AND policyname = 'public_read_active_media'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "public_read_active_media"
        ON media_items FOR SELECT
        USING (is_active = true)
    $p$;
  END IF;
END $$;
