-- Repair and harden service -> service_template linkage.
--
-- Context:
-- Some dashboard-created services copied the template slug/name but left
-- services.template_id NULL. That made public template matching inconsistent:
-- template_id-based flows missed those services while slug-based availability
-- still worked.

-- 1. Backfill canonical template links for existing services.
UPDATE services s
SET template_id = st.id
FROM service_templates st
WHERE s.template_id IS NULL
  AND s.slug = st.slug;

-- 2. Ensure matching diviner_services assignments exist for active linked
-- services. These rows were already publicly visible as freestyle services
-- before template_id was backfilled, so keep them published to avoid hiding
-- existing offerings.
INSERT INTO diviner_services (
  diviner_id,
  template_id,
  price,
  is_enabled,
  is_published,
  enabled_at,
  enabled_by
)
SELECT DISTINCT
  s.diviner_id,
  s.template_id,
  COALESCE(s.base_price, st.base_price, 0),
  TRUE,
  TRUE,
  COALESCE(s.created_at, now()),
  d.user_id
FROM services s
JOIN service_templates st ON st.id = s.template_id
JOIN diviners d ON d.id = s.diviner_id
WHERE s.template_id IS NOT NULL
  AND s.is_active = TRUE
  AND NOT EXISTS (
    SELECT 1
    FROM diviner_services ds
    WHERE ds.diviner_id = s.diviner_id
      AND ds.template_id = s.template_id
  )
ON CONFLICT (diviner_id, template_id) DO NOTHING;

-- 3. Safety net for older insert paths: if a service row is created with a
-- canonical service_templates.slug but no template_id, attach it automatically.
CREATE OR REPLACE FUNCTION attach_service_template_id_from_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.template_id IS NULL AND NEW.slug IS NOT NULL THEN
    SELECT st.id
      INTO NEW.template_id
    FROM service_templates st
    WHERE st.slug = NEW.slug
    ORDER BY st.is_active DESC, st.created_at DESC
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_services_attach_template_id_from_slug ON services;
CREATE TRIGGER trg_services_attach_template_id_from_slug
  BEFORE INSERT OR UPDATE OF slug, template_id ON services
  FOR EACH ROW
  EXECUTE FUNCTION attach_service_template_id_from_slug();
