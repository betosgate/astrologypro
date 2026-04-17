-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260417000002_backfill_template_ids.sql
-- Feature A – Task 02: Backfill template_id in services, sync diviner_services
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Backfill template_id in services by matching slugs ────────────────────

UPDATE services s
SET template_id = st.id
FROM service_templates st
WHERE s.slug = st.slug
  AND s.template_id IS NULL;

-- ── 2. Sync diviner_services from services (fill gaps) ───────────────────────
-- For diviners who have services rows with template matches but no diviner_services row

INSERT INTO diviner_services (diviner_id, template_id, price, is_enabled, enabled_at, enabled_by)
SELECT DISTINCT
  s.diviner_id,
  s.template_id,
  COALESCE(s.base_price, 0),
  TRUE,
  s.created_at,
  (SELECT user_id FROM diviners WHERE id = s.diviner_id)
FROM services s
WHERE s.template_id IS NOT NULL
  AND s.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM diviner_services ds
    WHERE ds.diviner_id = s.diviner_id
      AND ds.template_id = s.template_id
  )
ON CONFLICT (diviner_id, template_id) DO NOTHING;

-- ── 3. Auto-publish existing active services ──────────────────────────────────
-- Existing live services should remain visible after access control enforcement

UPDATE diviner_services ds
SET
  is_published    = TRUE,
  publish_status  = 'published',
  published_at    = now()
WHERE ds.is_enabled = TRUE
  AND ds.is_published = FALSE
  AND EXISTS (
    SELECT 1 FROM services s
    WHERE s.diviner_id  = ds.diviner_id
      AND s.template_id = ds.template_id
      AND s.is_active   = TRUE
  );

-- ── 4. Backfill template_id on services from diviner_services (reverse sync) ──
-- In case diviner_services has the mapping but services.template_id is still NULL

UPDATE services s
SET template_id = ds.template_id
FROM diviner_services ds
WHERE s.diviner_id  = ds.diviner_id
  AND s.is_active   = TRUE
  AND s.template_id IS NULL
  AND ds.template_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM service_templates st
    WHERE st.id   = ds.template_id
      AND st.slug = s.slug
  );
