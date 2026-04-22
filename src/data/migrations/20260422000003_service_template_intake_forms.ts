export const MIGRATION_SQL = `
ALTER TABLE public.service_templates
  ADD COLUMN IF NOT EXISTS form_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS form_config jsonb;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'service_templates_form_config_object_check'
  ) THEN
    ALTER TABLE public.service_templates
      ADD CONSTRAINT service_templates_form_config_object_check
      CHECK (form_config IS NULL OR jsonb_typeof(form_config) = 'object');
  END IF;
END $$;

UPDATE public.service_templates
SET form_enabled = true
WHERE form_enabled IS DISTINCT FROM true;

WITH astrology_presets AS (
  SELECT
    id,
    CASE
      WHEN replace(slug, 'general-', '') = 'nativity-birth-chart' THEN
        jsonb_build_object(
          'version', 1,
          'kind', 'astrology_intake',
          'mode', 'single',
          'fields', jsonb_build_object(
            'areaOfInquiry', true,
            'question', false,
            'futureWeek', false,
            'futureMonth', false
          )
        )
      WHEN replace(slug, 'general-', '') = 'solar-return' THEN
        jsonb_build_object(
          'version', 1,
          'kind', 'astrology_intake',
          'mode', 'single',
          'fields', jsonb_build_object(
            'areaOfInquiry', true,
            'question', false,
            'futureWeek', false,
            'futureMonth', false
          )
        )
      WHEN replace(slug, 'general-', '') = 'weekly-transits' THEN
        jsonb_build_object(
          'version', 1,
          'kind', 'astrology_intake',
          'mode', 'single',
          'fields', jsonb_build_object(
            'areaOfInquiry', true,
            'question', false,
            'futureWeek', true,
            'futureMonth', false
          )
        )
      WHEN replace(slug, 'general-', '') = 'monthly-transits-lunar-return' THEN
        jsonb_build_object(
          'version', 1,
          'kind', 'astrology_intake',
          'mode', 'single',
          'fields', jsonb_build_object(
            'areaOfInquiry', true,
            'question', false,
            'futureWeek', false,
            'futureMonth', true
          )
        )
      WHEN replace(slug, 'general-', '') IN (
        'romantic-relationships',
        'friendship-relationships',
        'business-relationship'
      ) THEN
        jsonb_build_object(
          'version', 1,
          'kind', 'astrology_intake',
          'mode', 'couple',
          'fields', jsonb_build_object(
            'areaOfInquiry', true,
            'question', false,
            'futureWeek', false,
            'futureMonth', false
          )
        )
      WHEN replace(slug, 'general-', '') = 'predictive-event-horary' THEN
        jsonb_build_object(
          'version', 1,
          'kind', 'astrology_intake',
          'mode', 'single',
          'fields', jsonb_build_object(
            'areaOfInquiry', false,
            'question', true,
            'futureWeek', false,
            'futureMonth', false
          )
        )
      WHEN replace(slug, 'general-', '') IN (
        'jupiter-return',
        'saturn-return',
        'mars-return',
        'uranus-opposition'
      ) THEN
        jsonb_build_object(
          'version', 1,
          'kind', 'astrology_intake',
          'mode', 'single',
          'fields', jsonb_build_object(
            'areaOfInquiry', true,
            'question', false,
            'futureWeek', false,
            'futureMonth', false
          )
        )
      ELSE NULL
    END AS config
  FROM public.service_templates
  WHERE category = 'astrology'
)
UPDATE public.service_templates st
SET form_config = presets.config
FROM astrology_presets presets
WHERE st.id = presets.id
  AND presets.config IS NOT NULL
  AND st.form_config IS NULL;
`;
