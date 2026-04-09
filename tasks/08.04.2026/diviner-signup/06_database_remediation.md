# Database Remediation: Pricing Schema Application

- Status: In Progress
- Completion Notes:

## Overview
Resolve the "Could not find the table 'public.global_pricing' in the schema cache" error by applying the missing database migration.

## Technical Specification

### 1. Identify Missing Schema
- **Error:** PostgREST / Supabase cannot find the `global_pricing` table.
- **Root Cause:** The migration file `supabase/migrations/20260408000112_global_pricing.sql` exists in the repository but has not been executed on the hosted database.

### 2. Execution Steps (via Admin UI)
- **Route:** `/admin/db/migrations`
- **Target Migration:** `20260408000112_global_pricing`
- **Action:** 
  - Ensure `SUPABASE_ACCESS_TOKEN` is configured in the environment.
  - Navigate to the DB Migrations dashboard.
  - Locate the specific pricing migration.
  - Click **"Run migration"** to execute the SQL DDL/DML.

### 3. Verification
- **API Test:** Call `GET /api/pricing/professional_divination_course` and verify it returns the seeded price (25969 INR).
- **UI Test:** Refresh `/admin/pricing` and ensure the error banner is gone and the "Select an item" dropdown works.

## Task Summary
1. Locate the missing migration in the Admin DB runner.
2. Apply the migration logic.
3. Confirm table visibility in the schema cache by refreshing the Pricing Management module.
