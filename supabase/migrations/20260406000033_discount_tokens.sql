-- Member discount tokens for community cross-sell (5% platform-cut discount)
CREATE TABLE IF NOT EXISTS member_discount_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  discount_percent numeric(5,2) NOT NULL DEFAULT 5.00,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  used_at timestamptz,
  booking_id uuid REFERENCES bookings(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ON member_discount_tokens(user_id);
CREATE INDEX ON member_discount_tokens(token);

ALTER TABLE member_discount_tokens ENABLE ROW LEVEL SECURITY;

-- Users can read and manage their own tokens
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'member_discount_tokens'
      AND policyname = 'Users own their tokens'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Users own their tokens"
        ON member_discount_tokens FOR ALL
        USING (auth.uid() = user_id)
    $p$;
  END IF;
END $$;

-- Service role has unrestricted access (needed by booking-payment route)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'member_discount_tokens'
      AND policyname = 'Service role full access'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Service role full access"
        ON member_discount_tokens
        USING (true)
        WITH CHECK (true)
    $p$;
  END IF;
END $$;
