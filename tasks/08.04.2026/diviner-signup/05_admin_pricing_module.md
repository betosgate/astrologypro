# Admin Dashboard: Global Pricing Management Module

- Status: Completed (2026-04-08)
- Completion Notes: Implemented end-to-end. Migration: supabase/migrations/20260408000112_global_pricing.sql (registered in /admin/db/migrations runner) creates global_pricing keyed on item_key with one seeded row (professional_divination_course = 25969 INR). Admin API: GET/POST /api/admin/pricing and PATCH/DELETE /api/admin/pricing/[id]. Public read API: GET /api/pricing/[itemKey] (RLS allows public SELECT for is_active=true). Admin UI: src/app/admin/pricing/page.tsx with a select-an-item dropdown + price/currency/name/description editors. Sidebar entry "Pricing Management" added under Config in admin-sidebar.tsx.

## Overview
Implement a new "Pricing Management" module in the Admin Dashboard. This will serve as a centralized hub to manage prices for various purchasable items across the project, starting with the **Professional Divination Course**.

## Technical Specification

### 1. Database Update
- **Options:** 
  - *Option A:* Create a new table `global_pricing` (fields: `id`, `item_key`, `item_name`, `price`, `currency`).
  - *Option B:* Store as a JSON mapping or individual keys alongside existing `platform_settings` or `astro_system_settings`.
- **Action:** Create a migration to initialize the pricing system, inserting the primary record: 
  - `item_key`: `professional_divination_course`
  - `item_name`: `Professional Divination Course` (Primary Focus)
  - `price`: `25969.00`

### 2. Admin UI Integration
- **Route:** `src/app/admin/pricing/page.tsx`
- **Action:** 
  - Create a page with a Dropdown (Select) component.
  - **Initial Item:** Hardcode `Professional Divination Course` in the dropdown options list for now to ensure focus.
  - When selected, the UI fetches the price from `/api/admin/pricing` for this specific key.
  - Add a "Save Price" button to update the record.

### 3. API Exposure
- **Endpoint:** `GET /api/pricing/professional_divination_course`
- **Logic:** The Diviner Signup page **must never** have a hardcoded price. It should call this endpoint on mount and use the returned `price` value for the Order Summary and Stripe payment.

## Task Summary
1. Create a database migration for the global pricing storage.
2. Build the `/admin/pricing` route with a dropdown selector for project items.
3. Wire the Admin UI save logic to update the price in the database.
4. Expose the dynamic prices via a public or authenticated API endpoint for the checkout pages to consume.
