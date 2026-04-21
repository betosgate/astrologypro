-- Clone the 19 canonical diviner-specific service templates into a parallel
-- general catalog. Keep all source fields identical except for name and slug.

WITH template_clone_map AS (
  SELECT *
  FROM (
    VALUES
      ('nativity-birth-chart', 'General Nativity Birth Chart', 'general-nativity-birth-chart'),
      ('solar-return', 'General Solar Return', 'general-solar-return'),
      ('weekly-transits', 'General Weekly Transits', 'general-weekly-transits'),
      ('monthly-transits-lunar-return', 'General Monthly Transits + Lunar Return', 'general-monthly-transits-lunar-return'),
      ('romantic-relationships', 'General Romantic Relationships', 'general-romantic-relationships'),
      ('friendship-relationships', 'General Friendship Relationships', 'general-friendship-relationships'),
      ('business-relationship', 'General Business Relationship', 'general-business-relationship'),
      ('predictive-event-horary', 'General Predictive Event (Horary)', 'general-predictive-event-horary'),
      ('jupiter-return', 'General Jupiter Return', 'general-jupiter-return'),
      ('saturn-return', 'General Saturn Return', 'general-saturn-return'),
      ('mars-return', 'General Mars Return', 'general-mars-return'),
      ('uranus-opposition', 'General Uranus Opposition', 'general-uranus-opposition'),
      ('3-card-basic-question-spread', 'General 3 Card Basic Question Spread', 'general-3-card-basic-question-spread'),
      ('5-card-complex-question-spread', 'General 5 Card Complex Question Spread', 'general-5-card-complex-question-spread'),
      ('7-card-6-month-forward-review', 'General 7 Card 6 Month Forward Review', 'general-7-card-6-month-forward-review'),
      ('7-card-horseshoe-spread-major-read', 'General 7 Card Horseshoe Spread (Major Read)', 'general-7-card-horseshoe-spread-major-read'),
      ('10-card-relationship-spread', 'General 10 Card Relationship Spread', 'general-10-card-relationship-spread'),
      ('10-card-celtic-cross-major-read', 'General 10 Card Celtic Cross (Major Read)', 'general-10-card-celtic-cross-major-read'),
      ('12-card-astrological-spread-major-read', 'General 12 Card Astrological Spread (Major Read)', 'general-12-card-astrological-spread-major-read')
  ) AS clone_map(source_slug, cloned_name, cloned_slug)
)
INSERT INTO service_templates (
  category,
  name,
  slug,
  description,
  duration_minutes,
  base_price,
  min_price,
  max_price,
  overage_rate,
  is_primary,
  requires_birth_data,
  trigger_event,
  sort_order,
  is_active,
  display_order,
  icon_name,
  color,
  long_description,
  whats_included,
  who_its_for,
  faq,
  seo_title,
  seo_description,
  created_by,
  updated_by
)
SELECT
  st.category,
  m.cloned_name,
  m.cloned_slug,
  st.description,
  st.duration_minutes,
  st.base_price,
  st.min_price,
  st.max_price,
  st.overage_rate,
  st.is_primary,
  st.requires_birth_data,
  st.trigger_event,
  st.sort_order,
  st.is_active,
  st.display_order,
  st.icon_name,
  st.color,
  st.long_description,
  st.whats_included,
  st.who_its_for,
  st.faq,
  st.seo_title,
  st.seo_description,
  st.created_by,
  st.updated_by
FROM service_templates st
JOIN template_clone_map m
  ON m.source_slug = st.slug
WHERE NOT EXISTS (
  SELECT 1
  FROM service_templates existing
  WHERE existing.slug = m.cloned_slug
);
