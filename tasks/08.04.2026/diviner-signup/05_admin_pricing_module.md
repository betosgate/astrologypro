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
- **Action:** Create a migration to initialize the pricing system, inserting a default record: 
  - `item_key`: `professional_divination_course`
  - `item_name`: `Professional Divination Course`
  - `price`: `25969.00`

### 2. Admin UI Integration
- **Route:** `src/app/admin/pricing/page.tsx` (New Admin Menu Item "Pricing Management")
- **Action:** 
  - Create a page with a Dropdown (Select) component listing all purchasable products (e.g. "Professional Divination Course").
  - When the Admin selects an item from the Dropdown, input fields appear to view and update the `Price`.
  - Add a "Save Price" button that updates the value in the backend.

### 3. API Exposure
- **Endpoint Update:** Modify `src/app/api/community/settings/route.ts` (or create a dedicated `/api/pricing/route.ts`) to return the dynamically stored prices.
- **Action:** Expose the `professional_divination_course` price so the Diviner Signup page can fetch and display it dynamically.

## Task Summary
1. Create a database migration for the global pricing storage.
2. Build the `/admin/pricing` route with a dropdown selector for project items.
3. Wire the Admin UI save logic to update the price in the database.
4. Expose the dynamic prices via a public or authenticated API endpoint for the checkout pages to consume.
