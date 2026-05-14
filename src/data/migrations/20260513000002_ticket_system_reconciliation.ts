export const MIGRATION_SQL = `
-- Reconciliation Migration: Upgrading existing Support/Job Ticket system
-- Replaces redundant 'job_tickets' and 'ticket_comments' with enhancements to the established system.

-- 1. Add threading and attachments to the existing ticket_messages table
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES ticket_messages(id) ON DELETE CASCADE;
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- 2. Add metadata to support_tickets if not already present
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- 3. Cleanup: Remove the redundant tables I created earlier
-- WARNING: This assumes no critical data has been saved to these tables yet.
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS job_tickets;

-- 4. Ensure admin_users has the role column (keep this part of the new requirements)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'support_staff'));

-- 5. Add indexes for threading
CREATE INDEX IF NOT EXISTS idx_ticket_messages_parent ON ticket_messages(parent_id);
`;
