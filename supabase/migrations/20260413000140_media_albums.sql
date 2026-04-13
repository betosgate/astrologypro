ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS album_name TEXT;

CREATE INDEX IF NOT EXISTS media_items_diviner_album_idx
  ON media_items(diviner_id, album_name, sort_order, created_at)
  WHERE type = 'image';
