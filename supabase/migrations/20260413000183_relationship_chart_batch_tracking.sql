-- ============================================================
-- Task 03: Relationship Chart Batch Tracking
-- Adds invalidation tracking so charts can be automatically
-- regenerated only when the underlying natal data changes,
-- rather than on arbitrary user request.
-- build: 2026-04-13
-- ============================================================

ALTER TABLE relationship_charts
  -- When a natal chart for either party changes materially, set this timestamp.
  -- A NULL value means the chart is current.
  ADD COLUMN IF NOT EXISTS invalidated_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invalidation_reason   TEXT,         -- e.g. 'natal_chart_updated:person_a'
  ADD COLUMN IF NOT EXISTS updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- ─── Index ────────────────────────────────────────────────────────────────────
-- Batch generation: quickly find all charts that need to be regenerated
CREATE INDEX IF NOT EXISTS idx_rc_needs_regen
  ON relationship_charts(invalidated_at)
  WHERE invalidated_at IS NOT NULL;

-- ─── Trigger: mark relationship charts invalid when natal chart changes ───────
-- When a family member's natal chart is regenerated, all relationship charts
-- involving that person should be marked as needing regeneration.
CREATE OR REPLACE FUNCTION fn_invalidate_relationship_charts_on_natal_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only invalidate if natal_chart column actually changed
  IF OLD.natal_chart IS DISTINCT FROM NEW.natal_chart AND NEW.natal_chart IS NOT NULL THEN
    UPDATE relationship_charts
    SET
      invalidated_at      = NOW(),
      invalidation_reason = 'natal_chart_updated:' || NEW.id::TEXT,
      updated_at          = NOW()
    WHERE (person_a_id = NEW.id OR person_b_id = NEW.id)
      AND invalidated_at IS NULL;  -- don't reset already-invalidated charts
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invalidate_rc_on_natal_change ON community_family_members;
CREATE TRIGGER trg_invalidate_rc_on_natal_change
  AFTER UPDATE OF natal_chart ON community_family_members
  FOR EACH ROW
  EXECUTE FUNCTION fn_invalidate_relationship_charts_on_natal_change();
