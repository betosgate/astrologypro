-- Phone number for diviners
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS twilio_phone_number VARCHAR(20);
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS twilio_phone_sid VARCHAR(50);
ALTER TABLE diviners ADD COLUMN IF NOT EXISTS phone_dialin_enabled BOOLEAN DEFAULT FALSE;

-- Card on file for clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS default_payment_method_id VARCHAR(255);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS card_consent_at TIMESTAMPTZ;

-- Phone sessions table
CREATE TABLE phone_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES clients(id),
  caller_phone VARCHAR(20),
  twilio_call_sid VARCHAR(50),
  daily_room_name VARCHAR(255),
  session_type VARCHAR(20) NOT NULL CHECK (session_type IN ('scheduled_dialin', 'standalone')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  platform_cost DECIMAL(10,2) DEFAULT 0,
  amount_charged DECIMAL(10,2),
  stripe_payment_intent_id VARCHAR(255),
  recording_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_phone_sessions_diviner ON phone_sessions(diviner_id);
ALTER TABLE phone_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "phone_sessions_diviner" ON phone_sessions FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "phone_sessions_client" ON phone_sessions FOR SELECT USING (
  client_id IN (SELECT id FROM clients WHERE user_id = auth.uid())
);

-- Update platform fee to 20%
UPDATE diviners SET platform_fee_percent = 20.00;

-- Add min/max price columns to service_templates
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS min_price DECIMAL(10,2);
ALTER TABLE service_templates ADD COLUMN IF NOT EXISTS max_price DECIMAL(10,2);

-- Set min = base_price, max = base_price * 2
UPDATE service_templates SET min_price = base_price, max_price = base_price * 2;

-- Add phone reading service template
INSERT INTO service_templates (category, name, slug, description, duration_minutes, base_price, min_price, max_price, overage_rate, is_primary, requires_birth_data, sort_order) VALUES
('phone', 'Phone Reading', 'phone-reading', 'Connect with your diviner by phone for a personal reading. $25 for the first 20 minutes, then $0.50 per additional minute.', 20, 25.00, 25.00, 50.00, 0.50, TRUE, FALSE, 20);

-- Refund tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS refund_reason TEXT;
