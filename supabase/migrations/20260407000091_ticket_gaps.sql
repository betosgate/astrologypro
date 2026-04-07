-- ─── Ticket gaps migration ──────────────────────────────────────────────────
-- Additive only — no destructive changes.

-- Generic entity linking fields for support_tickets
-- (complements the existing typed UUID columns: related_order_id, related_booking_id, etc.)
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS related_entity_type TEXT;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS related_entity_id TEXT;

-- Full-text search index on subject + description for ticket list search
CREATE INDEX IF NOT EXISTS idx_support_tickets_fts
  ON support_tickets USING GIN (
    to_tsvector('english', coalesce(subject, '') || ' ' || coalesce(description, '') || ' ' || coalesce(requester_name, '') || ' ' || coalesce(requester_email, ''))
  );

-- Index for queue + status queries (for tab views)
CREATE INDEX IF NOT EXISTS idx_support_tickets_queue_status
  ON support_tickets (queue_id, status, priority, created_at DESC);

-- Index for unassigned query
CREATE INDEX IF NOT EXISTS idx_support_tickets_unassigned
  ON support_tickets (assigned_to, status, created_at DESC)
  WHERE assigned_to IS NULL;
