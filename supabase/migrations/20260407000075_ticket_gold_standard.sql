-- ─── Ticket queues (operational ownership) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_queues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  team_type TEXT NOT NULL DEFAULT 'support',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO ticket_queues (name, team_type) VALUES
  ('General Support', 'support'),
  ('Billing & Payments', 'finance'),
  ('Refunds', 'finance'),
  ('Orders & Fulfillment', 'ops'),
  ('Booking & Session Support', 'support'),
  ('Diviner Support', 'support'),
  ('Affiliate Support', 'support'),
  ('Payout Operations', 'finance'),
  ('Moderation & Safety', 'moderation'),
  ('Technical Investigation', 'tech'),
  ('Content Operations', 'content'),
  ('Admin Review', 'admin')
ON CONFLICT (name) DO NOTHING;

-- ─── Additive columns on support_tickets ─────────────────────────────────────
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES ticket_queues(id);
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS reopened_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS first_response_due_at TIMESTAMPTZ;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS resolution_due_at TIMESTAMPTZ;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS requester_type TEXT DEFAULT 'customer'; -- customer/diviner/affiliate/staff
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS related_session_id UUID;
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS related_payout_id UUID;

-- ─── Ticket watchers (CC list) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_watchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  watch_type TEXT NOT NULL DEFAULT 'manual', -- manual / auto
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(ticket_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_ticket_watchers_user ON ticket_watchers(user_id);

-- ─── Ticket checklists (for job tickets) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assignee_user_id UUID,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','done','blocked')),
  due_at TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_tasks_ticket ON ticket_tasks(ticket_id, sort_order);

-- ─── CSAT surveys ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_csat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE UNIQUE,
  requester_user_id UUID,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── SLA policies (configurable) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ticket_sla_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  priority TEXT NOT NULL,
  first_response_minutes INTEGER NOT NULL DEFAULT 240,
  resolution_minutes INTEGER NOT NULL DEFAULT 4320,
  escalation_minutes INTEGER NOT NULL DEFAULT 480,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO ticket_sla_policies (name, priority, first_response_minutes, resolution_minutes, escalation_minutes) VALUES
  ('P1 Critical SLA', 'critical', 15, 240, 30),
  ('P2 High SLA', 'urgent', 60, 480, 240),
  ('P3 Medium SLA', 'high', 240, 4320, 480),
  ('P4 Low SLA', 'normal', 480, 14400, 1440),
  ('P5 Low SLA', 'low', 1440, 43200, 4320)
ON CONFLICT DO NOTHING;

-- ─── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE ticket_queues ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ticket_queues' AND policyname='queues_readable') THEN
    CREATE POLICY "queues_readable" ON ticket_queues FOR SELECT USING (TRUE);
  END IF;
END $$;

ALTER TABLE ticket_watchers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ticket_watchers' AND policyname='own_watches') THEN
    CREATE POLICY "own_watches" ON ticket_watchers FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

ALTER TABLE ticket_tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ticket_tasks' AND policyname='tasks_readable') THEN
    CREATE POLICY "tasks_readable" ON ticket_tasks FOR ALL USING (TRUE);
  END IF;
END $$;

ALTER TABLE ticket_csat ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ticket_csat' AND policyname='own_csat') THEN
    CREATE POLICY "own_csat" ON ticket_csat FOR ALL USING (requester_user_id = auth.uid());
  END IF;
END $$;

ALTER TABLE ticket_sla_policies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ticket_sla_policies' AND policyname='sla_readable') THEN
    CREATE POLICY "sla_readable" ON ticket_sla_policies FOR SELECT USING (TRUE);
  END IF;
END $$;
