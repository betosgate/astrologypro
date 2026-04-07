-- ─── Seed: Support Tickets + Affiliate Commission samples ──────────────────────
-- Note: Uses NULL for requester_user_id (no auth.users FK required).
--       author_user_id on ticket_messages uses a deterministic fake UUID
--       that maps to no real user — safe because there is no FK on that column.
-- ─────────────────────────────────────────────────────────────────────────────

-- We use a sentinel system actor UUID for seeded messages (no FK constraint).
-- This value is intentionally fictional.
DO $$
DECLARE
  -- Ticket IDs
  t_open_id   UUID := '11111111-aaaa-4000-8000-000000000001';
  t_prog_id   UUID := '11111111-aaaa-4000-8000-000000000002';
  t_reso_id   UUID := '11111111-aaaa-4000-8000-000000000003';
  -- Fake system actor for messages
  system_actor UUID := '00000000-0000-4000-8000-000000000000';
BEGIN
  -- ── Ticket 1: Open billing issue ───────────────────────────────────────────
  INSERT INTO support_tickets (
    id, ticket_number, type, category, subcategory,
    subject, description, status, priority,
    requester_user_id, requester_email, requester_name, requester_role,
    sla_due_at
  )
  VALUES (
    t_open_id,
    'TKT-SEED-0001',
    'support',
    'Payment',
    'Payment Failure',
    'Payment failed twice on my last order',
    'I tried to pay for Order #ORD-2026-5541 twice and both attempts failed but my card was charged. Please help.',
    'open',
    'high',
    NULL,
    'demo.customer@example.com',
    'Demo Customer',
    'customer',
    NOW() + INTERVAL '4 hours'
  )
  ON CONFLICT (ticket_number) DO NOTHING;

  -- ── Ticket 2: In Progress — booking reschedule ────────────────────────────
  INSERT INTO support_tickets (
    id, ticket_number, type, category, subcategory,
    subject, description, status, priority,
    requester_user_id, requester_email, requester_name, requester_role,
    assigned_team, sla_due_at
  )
  VALUES (
    t_prog_id,
    'TKT-SEED-0002',
    'support',
    'Booking',
    'Reschedule',
    'Need to reschedule my live reading session',
    'I booked a 60-minute live reading for April 10 at 3pm EST but I have a conflict. Can I move it to April 12?',
    'in_progress',
    'normal',
    NULL,
    'demo.diviner@example.com',
    'Demo Diviner Fan',
    'customer',
    'support',
    NOW() + INTERVAL '24 hours'
  )
  ON CONFLICT (ticket_number) DO NOTHING;

  -- ── Ticket 3: Resolved — course access issue ──────────────────────────────
  INSERT INTO support_tickets (
    id, ticket_number, type, category, subcategory,
    subject, description, status, priority,
    requester_user_id, requester_email, requester_name, requester_role,
    assigned_team, resolution, resolved_at
  )
  VALUES (
    t_reso_id,
    'TKT-SEED-0003',
    'support',
    'Course',
    'Access Issue',
    'Cannot access Module 3 of Astrology Foundations course',
    'I purchased the Astrology Foundations course last week but Module 3 shows as locked even though I completed Module 2.',
    'resolved',
    'normal',
    NULL,
    'demo.student@example.com',
    'Demo Student',
    'customer',
    'support',
    'The course unlock trigger has been re-run for your account. Module 3 should now be accessible. Please clear your browser cache and try again.',
    NOW() - INTERVAL '2 hours'
  )
  ON CONFLICT (ticket_number) DO NOTHING;

  -- ── Messages for Ticket 1 ─────────────────────────────────────────────────
  INSERT INTO ticket_messages (ticket_id, author_user_id, author_name, author_role, body, is_internal)
  VALUES
    (
      t_open_id,
      system_actor,
      'Demo Customer',
      'customer',
      'I tried to pay for Order #ORD-2026-5541 twice and both attempts failed but my card was charged. Please help.',
      FALSE
    ),
    (
      t_open_id,
      system_actor,
      'Support Team',
      'staff',
      'Hi! Thank you for reaching out. We can see both payment attempts in our system and are investigating. We will have an update for you within 4 hours.',
      FALSE
    ),
    (
      t_open_id,
      system_actor,
      'Support Team',
      'staff',
      'Internal note: Checked Stripe dashboard — one charge succeeded, one is pending. Finance team notified for reversal.',
      TRUE
    )
  ON CONFLICT DO NOTHING;

END $$;
