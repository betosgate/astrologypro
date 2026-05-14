export const MIGRATION_SQL = `
-- Phase I: Job Ticket Module Implementation

-- 1. Update admin_users to support different staff roles
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'support_staff'));

-- 2. Create Job Tickets Table
CREATE TABLE IF NOT EXISTS job_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT UNIQUE NOT NULL,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'critical')),
  category TEXT NOT NULL,
  related_entity_id UUID, -- For auto-linking (e.g., booking_id, diviner_id)
  metadata JSONB DEFAULT '{}',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for ticket number (reusing pattern from support_tickets)
CREATE OR REPLACE FUNCTION generate_job_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  seq_num INT;
  date_part TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  SELECT COUNT(*) + 1 INTO seq_num
    FROM job_tickets
    WHERE ticket_number LIKE 'JOB-' || date_part || '-%';
  NEW.ticket_number := 'JOB-' || date_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_ticket_number ON job_tickets;
CREATE TRIGGER trg_job_ticket_number
  BEFORE INSERT ON job_tickets
  FOR EACH ROW WHEN (NEW.ticket_number IS NULL OR NEW.ticket_number = '')
  EXECUTE FUNCTION generate_job_ticket_number();

-- 3. Comments Table with threaded support and attachments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES job_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  parent_id UUID REFERENCES ticket_comments(id) ON DELETE CASCADE, -- Threaded discussion support
  body TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- File attachment capability (PDF/Images)
  is_internal BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Policies
ALTER TABLE job_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;

-- Admin/Staff Access (Global oversight)
CREATE POLICY "admin_staff_all_job_tickets" ON job_tickets
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

CREATE POLICY "admin_staff_all_comments" ON ticket_comments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- Creator Access (Self-service)
CREATE POLICY "creator_select_job_tickets" ON job_tickets
  FOR SELECT TO authenticated
  USING (creator_id = auth.uid());

CREATE POLICY "creator_insert_job_tickets" ON job_tickets
  FOR INSERT TO authenticated
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "creator_select_comments" ON ticket_comments
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM job_tickets WHERE id = ticket_id AND creator_id = auth.uid()));

CREATE POLICY "creator_insert_comments" ON ticket_comments
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM job_tickets WHERE id = ticket_id AND creator_id = auth.uid()));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_job_tickets_creator ON job_tickets(creator_id);
CREATE INDEX IF NOT EXISTS idx_job_tickets_assigned ON job_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_job_tickets_status ON job_tickets(status);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_parent ON ticket_comments(parent_id);
\
`
  ;