CREATE TABLE gift_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diviner_id UUID REFERENCES diviners(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  purchaser_name VARCHAR(100) NOT NULL,
  purchaser_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(100),
  recipient_email VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  remaining_amount DECIMAL(10,2) NOT NULL,
  message TEXT,
  stripe_payment_intent_id VARCHAR(255),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 year'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gift_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gc_diviner" ON gift_certificates FOR ALL USING (
  diviner_id IN (SELECT id FROM diviners WHERE user_id = auth.uid())
);
CREATE POLICY "gc_public_read" ON gift_certificates FOR SELECT USING (TRUE);
