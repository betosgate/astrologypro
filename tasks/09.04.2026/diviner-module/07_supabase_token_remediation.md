# Database Remediation: Direct SQL Bypass

- Status: Completed (2026-04-09)
- Completion Notes:
  - A fresh `SUPABASE_ACCESS_TOKEN` was supplied mid-session and used to
    run three pending migrations directly against the project database
    via the Supabase Management API (`POST https://api.supabase.com/
    v1/projects/wyluvclvtvwptsvvtgkv/database/query`):
      - `20260408000112_global_pricing` — HTTP 201
      - `20260408000116_training_notes_allow_quiz` — HTTP 201
      - `20260409000117_calendar_provider_credentials` — HTTP 201
  - Post-run verification confirmed:
      - `global_pricing`, `google_api_keys`, `microsoft_api_keys`
        tables all exist in `public`.
      - `training_notes_entity_type_check` constraint now admits
        `program | category | lesson | quiz`.
      - `global_pricing` is seeded with
        `professional_divination_course = 25969.00 INR`.
  - The manual SQL-Editor bypass documented below is no longer needed —
    it is preserved as a reference for any future case where the admin
    runner is unavailable and a direct-console fallback is required.
  - The token used for this run was flagged for rotation immediately
    because it passed through a chat transcript.

## Overview
Because the `SUPABASE_ACCESS_TOKEN` is expired—preventing the automated API from running the migration—the fastest way to resolve the "public.global_pricing table not found" error is to run the migration script manually in the Supabase Dashboard. 

## Technical Specification

### 1. The Issue
- **Error Triggered:** Application throws `PGRST205: Could not find the table 'public.global_pricing' in the schema cache`.
- **Root Cause:** The SQL migration was created in the repository but has not been executed on the production database, and the automated migration runner is failing due to an expired access token (401 Unauthorized).

### 2. Manual Remediation Steps (Direct Bypass)

**Step A: Open the Supabase SQL Editor**
1. Log in to the [Supabase Dashboard](https://supabase.com).
2. Open your project (`wyluvclvtvwptsvvtgkv`).
3. Click on **SQL Editor** in the left sidebar, button or directly visit the [New Query](https://supabase.com/dashboard/project/wyluvclvtvwptsvvtgkv/sql/new) page.

**Step B: Execute the AI-Generated Migration Code**
Copy the following complete SQL script and paste it into the editor, then click **Run**:

```sql
-- Create the global_pricing table
CREATE TABLE IF NOT EXISTS global_pricing (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  item_key    TEXT          NOT NULL UNIQUE,
  item_name   TEXT          NOT NULL,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency    TEXT          NOT NULL DEFAULT 'INR',
  description TEXT,
  is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
  CONSTRAINT global_pricing_currency_check CHECK (currency IN ('USD', 'INR'))
);

-- Optimize with an index
CREATE INDEX IF NOT EXISTS idx_global_pricing_active ON global_pricing (is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE global_pricing ENABLE ROW LEVEL SECURITY;

-- Allow public read access (necessary for signup pages without auth)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'global_pricing' AND policyname = 'global_pricing_public_read'
    ) THEN
        CREATE POLICY global_pricing_public_read ON global_pricing FOR SELECT USING (is_active = TRUE);
    END IF;
END $$;

-- Seed the initial course pricing data
INSERT INTO global_pricing (item_key, item_name, price, currency, description)
VALUES (
  'professional_divination_course',
  'Professional Divination Course',
  25969.00,
  'INR',
  'Full Professional Divination Course — 100+ hours of training, live readings, and recordings.'
)
ON CONFLICT (item_key) DO NOTHING;
```

### 3. Verification
- **App Check:** Refresh the `GET /api/pricing/professional_divination_course` endpoint or the Diviner Signup page.
- **Expected Outcome:** The API responds with the pricing JSON successfully, proving the schema cache now recognizes the table.

## Task Summary
1. Navigate to the Supabase SQL Editor.
2. Paste and run the provided SQL script to manually create the missing table and bypass the token issue.
3. Verify that the application error is resolved.
