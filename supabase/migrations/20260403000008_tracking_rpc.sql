-- Atomic increment for tracking_links.clicks
-- Called by /r/[code] redirect route to avoid read-then-write race conditions

CREATE OR REPLACE FUNCTION increment_tracking_link_clicks(link_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE tracking_links
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = link_id;
$$;
