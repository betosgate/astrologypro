-- Missing indexes on frequently-joined foreign key columns
-- Improves query performance for joins in dashboards and cron jobs

-- affiliate_referrals
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_client_id   ON affiliate_referrals(client_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_booking_id  ON affiliate_referrals(booking_id);

-- gift_certificates
CREATE INDEX IF NOT EXISTS idx_gift_certificates_diviner_id    ON gift_certificates(diviner_id);

-- intake_forms
CREATE INDEX IF NOT EXISTS idx_intake_forms_diviner_id         ON intake_forms(diviner_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_service_id         ON intake_forms(service_id);

-- phone_sessions
CREATE INDEX IF NOT EXISTS idx_phone_sessions_client_id        ON phone_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_phone_sessions_booking_id       ON phone_sessions(booking_id);

-- scheduled_posts
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_content_id      ON scheduled_posts(content_id);

-- share_batches
CREATE INDEX IF NOT EXISTS idx_share_batches_content_id        ON share_batches(content_id);
CREATE INDEX IF NOT EXISTS idx_share_batches_diviner_date      ON share_batches(diviner_id, share_date);

-- testimonials
CREATE INDEX IF NOT EXISTS idx_testimonials_client_id          ON testimonials(client_id);

-- diviner_services
CREATE INDEX IF NOT EXISTS idx_diviner_services_template_id    ON diviner_services(template_id);
