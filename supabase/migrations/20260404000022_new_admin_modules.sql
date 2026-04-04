-- Video management
CREATE TABLE IF NOT EXISTS video_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  videos jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE video_management ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access video_management" ON video_management FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX video_management_status_idx ON video_management(status);
CREATE INDEX video_management_updated_at_idx ON video_management(updated_at);

-- Orders (bookings with payment)
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES bookings(id) ON DELETE SET NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  diviner_id uuid REFERENCES diviners(id) ON DELETE SET NULL,
  service_type text,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending','completed','refunded','cancelled')),
  stripe_payment_intent_id text,
  invoice_email_sent boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access orders" ON orders FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX orders_status_idx ON orders(status);
CREATE INDEX orders_created_at_idx ON orders(created_at);
CREATE INDEX orders_client_id_idx ON orders(client_id);
CREATE INDEX orders_diviner_id_idx ON orders(diviner_id);

-- Reports (user-submitted reports)
CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reported_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','resolved','dismissed')),
  ip_address text,
  user_agent text,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access reports" ON reports FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX reports_status_idx ON reports(status);
CREATE INDEX reports_created_at_idx ON reports(created_at);

-- Quarters (content quarters / seasons)
CREATE TABLE IF NOT EXISTS quarters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quarter_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE quarters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access quarters" ON quarters FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX quarters_status_idx ON quarters(status);
CREATE INDEX quarters_created_at_idx ON quarters(created_at);

-- Class configuration (live class sessions)
CREATE TABLE IF NOT EXISTS class_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_name text NOT NULL,
  description text,
  session_type text NOT NULL DEFAULT 'live' CHECK (session_type IN ('live','recorded','hybrid')),
  max_participants integer NOT NULL DEFAULT 50,
  duration_minutes integer NOT NULL DEFAULT 60,
  quarter_id uuid REFERENCES quarters(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE class_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access class_configurations" ON class_configurations FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX class_configurations_status_idx ON class_configurations(status);
CREATE INDEX class_configurations_created_at_idx ON class_configurations(created_at);

-- General content (sign-based content)
CREATE TABLE IF NOT EXISTS general_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','image','video','pdf','youtube')),
  sign text,
  description text,
  image_url text,
  video_url text,
  pdf_url text,
  youtube_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE general_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access general_content" ON general_content FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE INDEX general_content_status_idx ON general_content(status);
CREATE INDEX general_content_sign_idx ON general_content(sign);
CREATE INDEX general_content_created_at_idx ON general_content(created_at);

-- Perennial dashboard content
CREATE TABLE IF NOT EXISTS perennial_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'text' CHECK (content_type IN ('text','image','video','pdf','youtube','live_stream','announcement')),
  description text,
  image_url text,
  video_url text,
  pdf_url text,
  youtube_url text,
  live_stream_url text,
  display_start_at timestamptz,
  display_end_at timestamptz,
  available_for_all boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE perennial_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access perennial_content" ON perennial_content FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "active members read perennial content" ON perennial_content FOR SELECT USING (
  status = 'active' AND EXISTS (
    SELECT 1 FROM community_members
    WHERE user_id = auth.uid()
    AND membership_status = 'active'
  )
);
CREATE INDEX perennial_content_status_idx ON perennial_content(status);
CREATE INDEX perennial_content_type_idx ON perennial_content(content_type);
CREATE INDEX perennial_content_created_at_idx ON perennial_content(created_at);
