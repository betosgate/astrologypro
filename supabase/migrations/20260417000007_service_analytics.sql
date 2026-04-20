-- Task 08: Service Landing Page Analytics
-- Extends diviner_activity_events with service-level tracking columns

-- 1. Add service-level tracking columns
ALTER TABLE diviner_activity_events
  ADD COLUMN IF NOT EXISTS service_template_id UUID REFERENCES service_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS service_slug VARCHAR(100),
  ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'page_view'
    CHECK (event_type IN (
      'page_view',
      'cta_click',
      'cta_secondary_click',
      'lead_form_open',
      'lead_form_submit',
      'booking_initiated',
      'booking_completed',
      'booking_cancelled',
      'link_shared',
      'page_scroll_25',
      'page_scroll_50',
      'page_scroll_75',
      'page_scroll_100',
      'time_on_page_30s',
      'time_on_page_60s',
      'time_on_page_120s'
    ));

-- 2. Indexes for service-level analytics queries
CREATE INDEX IF NOT EXISTS idx_activity_service_template
  ON diviner_activity_events(diviner_id, service_template_id, event_type, created_at DESC)
  WHERE service_template_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_date_range
  ON diviner_activity_events(diviner_id, created_at DESC, event_type);

-- 3. Materialized view for daily aggregates
--    Uses ip_hash as the unique visitor identifier (the table has ip_hash not visitor_hash)
CREATE MATERIALIZED VIEW IF NOT EXISTS service_landing_daily_stats AS
SELECT
  diviner_id,
  service_template_id,
  DATE(created_at) AS stat_date,
  event_type,
  COUNT(*) AS event_count,
  COUNT(DISTINCT ip_hash) AS unique_count
FROM diviner_activity_events
WHERE service_template_id IS NOT NULL
GROUP BY diviner_id, service_template_id, DATE(created_at), event_type;

-- 4. Unique index on materialized view for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_daily_stats_lookup
  ON service_landing_daily_stats(diviner_id, service_template_id, stat_date, event_type);
