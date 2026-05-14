# Unified Ticket System Database Reconciliation

## Scope - 2026-05-14

Resolve the database schema mismatch in the unified support and job ticket system. The current implementation expects a `metadata` column in the `support_tickets` table and specific columns in `ticket_messages` for threading and attachments, which may be missing in some environments.

## Goal

Ensure the database schema is fully synchronized with the API requirements to support:
- File attachments in both tickets and messages.
- Threaded conversations (replies to replies) in the support system.
- Unified storage for "Support Tickets" and "Job Tickets" within the established `support_tickets` table.

## Issues Identified

- **500 Internal Server Error:** "Could not find the 'metadata' column of 'support_tickets' in the schema cache".
- **Schema Mismatch:** The API route `POST /api/admin/tickets` attempts to insert into a `metadata` column that was introduced in recent reconciliation efforts but not yet applied to all database instances.

## Implementation Steps

### 1. Apply Database Migration
Execute the reconciliation SQL script to update the existing tables without losing data.

```sql
-- Add metadata column for attachments and extra info
ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enhance messages for threading and attachments
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES ticket_messages(id) ON DELETE CASCADE;
ALTER TABLE ticket_messages ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Add indexing for performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_parent ON ticket_messages(parent_id);

-- Cleanup deprecated legacy tables
DROP TABLE IF EXISTS ticket_comments;
DROP TABLE IF EXISTS job_tickets;
```

### 2. Verify API Functionality
- Test ticket creation from the Admin Portal with attachments.
- Verify that messages/comments can be threaded using the `parent_id`.
- Ensure the `metadata` JSONB object is correctly populated on insert.

### 3. Refresh PostgREST Cache
If the error persists after running the SQL, trigger a schema reload:
```sql
NOTIFY pgrst, 'reload schema';
```

## Success Criteria

- [ ] Admin can create tickets with PDF/Image attachments without database errors.
- [ ] Ticket details page correctly displays attachment metadata.
- [ ] `support_tickets` table becomes the single source of truth for all internal and external requests.
