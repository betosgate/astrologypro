-- Enable RLS on all tables
ALTER TABLE diviners ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_diviners ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_templates ENABLE ROW LEVEL SECURITY;

-- SERVICE_TEMPLATES: public read
CREATE POLICY "service_templates_public_read" ON service_templates FOR SELECT USING (TRUE);

-- DIVINERS: own data + public read for active
CREATE POLICY "diviners_select_own" ON diviners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "diviners_public_read" ON diviners FOR SELECT USING (is_active = TRUE);
CREATE POLICY "diviners_update_own" ON diviners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "diviners_insert_own" ON diviners FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SERVICES: diviner manages own + public read for active
CREATE POLICY "services_diviner_all" ON services FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "services_public_read" ON services FOR SELECT USING (
  is_active = TRUE AND diviner_id IN (SELECT id FROM diviners WHERE is_active = TRUE)
);

-- CLIENTS: own data only
CREATE POLICY "clients_select_own" ON clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "clients_update_own" ON clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "clients_insert_own" ON clients FOR INSERT WITH CHECK (auth.uid() = user_id);

-- CLIENT_DIVINERS: both sides can read
CREATE POLICY "cd_diviner_all" ON client_diviners FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "cd_client_read" ON client_diviners FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- AVAILABILITY: diviner manages own + public read
CREATE POLICY "avail_diviner_all" ON availability_slots FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "avail_public_read" ON availability_slots FOR SELECT USING (is_active = TRUE);

CREATE POLICY "overrides_diviner_all" ON availability_overrides FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "overrides_public_read" ON availability_overrides FOR SELECT USING (TRUE);

-- BOOKINGS: diviner sees theirs, client sees theirs
CREATE POLICY "bookings_diviner_all" ON bookings FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "bookings_client_read" ON bookings FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);
CREATE POLICY "bookings_client_insert" ON bookings FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- AFFILIATES: diviner manages own
CREATE POLICY "affiliates_diviner_all" ON affiliates FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);

-- AFFILIATE REFERRALS: diviner manages through affiliates
CREATE POLICY "referrals_diviner_all" ON affiliate_referrals FOR ALL USING (
  affiliate_id IN (
    SELECT id FROM affiliates WHERE diviner_id IN (
      SELECT id FROM diviners WHERE user_id = auth.uid()
    )
  )
);

-- TESTIMONIALS: diviner manages own + public read approved + client can insert
CREATE POLICY "testimonials_diviner_all" ON testimonials FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "testimonials_public_read" ON testimonials FOR SELECT USING (status = 'approved');
CREATE POLICY "testimonials_client_insert" ON testimonials FOR INSERT WITH CHECK (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- INTAKE FORMS: diviner manages own + public read
CREATE POLICY "intake_diviner_all" ON intake_forms FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "intake_public_read" ON intake_forms FOR SELECT USING (TRUE);

-- TRACKING LINKS: diviner manages own + public read for redirect
CREATE POLICY "tracking_diviner_all" ON tracking_links FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "tracking_public_read" ON tracking_links FOR SELECT USING (TRUE);
