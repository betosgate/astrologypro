-- Tickets table (unified for support + job tickets)
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL, -- e.g. TKT-20260407-0001
  type TEXT NOT NULL CHECK (type IN ('support','job','incident','escalation','complaint','refund','payout','bug','moderation')),
  category TEXT NOT NULL,
  subcategory TEXT,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','waiting_requester','waiting_internal','escalated','resolved','closed','cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent','critical')),

  -- Requester (external: customer/diviner/affiliate; or internal staff)
  requester_user_id UUID,         -- auth.users.id if logged in
  requester_email TEXT,           -- for guest submissions
  requester_name TEXT,
  requester_role TEXT,            -- customer / diviner / affiliate / staff

  -- Assignment
  assigned_to UUID,               -- staff user_id
  assigned_team TEXT,             -- support / finance / tech / ops / content / moderation

  -- Resolution
  resolution TEXT,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,

  -- SLA
  sla_due_at TIMESTAMPTZ,
  sla_breached BOOLEAN DEFAULT FALSE,
  first_response_at TIMESTAMPTZ,

  -- Related entities
  related_diviner_id UUID,
  related_order_id UUID,
  related_booking_id UUID,

  -- Metadata
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID                  -- staff who created (for job tickets)
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_requester ON support_tickets(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned ON support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_number ON support_tickets(ticket_number);

-- Ticket messages (public or internal)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,   -- customer/diviner/affiliate/staff
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT FALSE,  -- internal note vs public reply
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id, created_at);

-- Ticket status history (audit log)
CREATE TABLE IF NOT EXISTS ticket_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  actor_user_id UUID,
  event_type TEXT NOT NULL,   -- created/status_changed/assigned/message_added/resolved/closed
  old_value TEXT,
  new_value TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket ON ticket_history(ticket_id, created_at);

-- Auto-generate ticket_number trigger
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  seq_num INT;
  date_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq_num
    FROM support_tickets
    WHERE ticket_number LIKE 'TKT-' || date_part || '-%';
  NEW.ticket_number := 'TKT-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_ticket_number ON support_tickets;
CREATE TRIGGER trg_ticket_number
  BEFORE INSERT ON support_tickets
  FOR EACH ROW WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_ticket_number();

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_tickets_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS trg_tickets_updated_at ON support_tickets;
CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION update_tickets_updated_at();

-- RLS
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_history ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='support_tickets' AND policyname='users_own_tickets') THEN
    CREATE POLICY users_own_tickets ON support_tickets FOR SELECT TO authenticated
      USING (requester_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='support_tickets' AND policyname='users_create_tickets') THEN
    CREATE POLICY users_create_tickets ON support_tickets FOR INSERT TO authenticated
      WITH CHECK (requester_user_id = auth.uid());
  END IF;
END $$;
