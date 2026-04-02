-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Diviners (practitioners)
CREATE TABLE diviners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,
  tagline VARCHAR(200),
  specialties TEXT[] DEFAULT '{}',
  stripe_account_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(20) DEFAULT 'trialing',
  google_calendar_token JSONB,
  youtube_channel_id VARCHAR(30),
  facebook_live_url TEXT,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  platform_fee_percent DECIMAL(5,2) DEFAULT 10.00,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  onboarding_step INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_diviners_user_id ON diviners(user_id);
CREATE UNIQUE INDEX idx_diviners_username ON diviners(username);

-- Services offered by each diviner
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('astrology', 'tarot')),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  overage_rate DECIMAL(10,2) DEFAULT 0.50,
  is_primary BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  requires_birth_data BOOLEAN DEFAULT TRUE,
  trigger_event VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_services_diviner_id ON services(diviner_id);

-- Clients (people getting readings)
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  phone VARCHAR(20),
  birth_date DATE,
  birth_time TIME,
  birth_city VARCHAR(100),
  birth_lat DECIMAL(10,7),
  birth_lng DECIMAL(10,7),
  birth_timezone VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_clients_user_id ON clients(user_id);

-- Client-Diviner relationship
CREATE TABLE client_diviners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  first_session_at TIMESTAMPTZ,
  total_sessions INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, diviner_id)
);

-- Availability (source of truth for scheduling)
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_availability_diviner ON availability_slots(diviner_id);

-- Availability overrides (days off, special hours)
CREATE TABLE availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT FALSE,
  start_time TIME,
  end_time TIME
);

CREATE INDEX idx_overrides_diviner_date ON availability_overrides(diviner_id, date);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'canceled', 'no_show')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  actual_duration_minutes INTEGER,
  base_price DECIMAL(10,2) NOT NULL,
  overage_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(255),
  stripe_payment_status VARCHAR(20),
  daily_room_name VARCHAR(255),
  daily_room_url TEXT,
  recording_url TEXT,
  recording_share_id VARCHAR(50) UNIQUE,
  questionnaire_responses JSONB,
  session_notes TEXT,
  affiliate_id UUID,
  google_calendar_event_id VARCHAR(255),
  canceled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_diviner ON bookings(diviner_id);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_scheduled ON bookings(scheduled_at);

-- Affiliates
CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  commission_percent DECIMAL(5,2) NOT NULL,
  total_referrals INTEGER DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_paid DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_diviner ON affiliates(diviner_id);

-- Affiliate referrals
CREATE TABLE affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID REFERENCES affiliates(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id),
  booking_id UUID REFERENCES bookings(id),
  commission_amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'earned', 'paid')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id),
  client_name VARCHAR(100),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  service_type VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_diviner ON testimonials(diviner_id);

-- Intake questionnaire templates
CREATE TABLE intake_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id),
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracking links
CREATE TABLE tracking_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  source VARCHAR(50),
  campaign VARCHAR(100),
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service templates (default service catalog)
CREATE TABLE service_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  overage_rate DECIMAL(10,2) DEFAULT 0.50,
  is_primary BOOLEAN DEFAULT TRUE,
  requires_birth_data BOOLEAN DEFAULT TRUE,
  trigger_event VARCHAR(50),
  sort_order INTEGER DEFAULT 0
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER diviners_updated_at BEFORE UPDATE ON diviners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
