-- Newsletter diviner attribution
-- Platform v2 req: newsletter signups attributed to the specific diviner
-- whose profile page triggered the subscription.
-- Additive only — does not touch existing rows.

ALTER TABLE blog_subscribers
  ADD COLUMN IF NOT EXISTS diviner_id UUID REFERENCES diviners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attributed_username TEXT; -- denormalised for display in admin, no FK needed

CREATE INDEX IF NOT EXISTS blog_subscribers_diviner_id_idx ON blog_subscribers(diviner_id)
  WHERE diviner_id IS NOT NULL;

-- Update the source enum comment (documentation only, no constraint change needed)
COMMENT ON COLUMN blog_subscribers.source IS
  'Origin of subscription: blog | footer | popup | marketing | diviner_profile';
