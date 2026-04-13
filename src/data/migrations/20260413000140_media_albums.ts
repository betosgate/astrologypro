// AUTO-GENERATED bundled mirror of supabase/migrations/20260413000140_media_albums.sql
export const MIGRATION_SQL = `ALTER TABLE media_items
  ADD COLUMN IF NOT EXISTS album_name TEXT;

CREATE INDEX IF NOT EXISTS media_items_diviner_album_idx
  ON media_items(diviner_id, album_name, sort_order, created_at)
  WHERE type = 'image';
`;
