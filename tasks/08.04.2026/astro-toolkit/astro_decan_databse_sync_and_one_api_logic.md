# Astro Decan New Infos Table Creation & API Task

- Status: Completed (2026-04-08)
- Completion Notes:
  - Migration: `supabase/migrations/20260408000106_astro_decan_new_infos.sql` — additive only. Creates `astro_decan_new_infos` with `id UUID PK`, `mongo_id TEXT UNIQUE` (so we can re-import idempotently), all 13 content fields as `TEXT`, `created_at`/`updated_at` timestamps, and a `moddatetime` trigger when the extension is available.
  - Indexes: `idx_astro_decan_new_infos_planet`, `idx_astro_decan_new_infos_signs`, `idx_astro_decan_new_infos_planet_sign` (covers the most common UI lookup patterns: list-by-planet, filter-by-sign, and the joint planet+sign query).
  - RLS enabled with two policies: public SELECT (reference content, like decans) + service_role full access.
  - Seed: 36 records embedded as `INSERT … ON CONFLICT (mongo_id) DO NOTHING` directly in the migration, so the table is populated on first apply and re-runs are safe.
  - API: see `astro_decan_info_api_logic.md`.

## Overview
This task involves migrating Astro Decan data from the previous project's MongoDB backup JSON file into a relational database table. The table will store planetary decan information, tarot card details, Greek daemon information, and descriptive texts related to planetary sign combinations.

After creating the table and inserting the data, an API endpoint must also be implemented to fetch planet-sign combinations.

---

## Source Data

The source data is available in the JSON backup file from the previous project.

**File Path**

tasks/08.04.2026/astro-toolkit/divine_infinity.astro_decan_new_infos.json

This file contains all the Astro Decan records that were previously stored in MongoDB.

---

## Database Table Creation

Create a new table with the following name:

astro_decan_new_infos

### Required Fields

The table should contain the following columns:

- _id : string
- planet: string  
- signs: string  
- tarot_name: string  
- tarot_card_big_image: string (URL or Path)  
- tarot_card_thumb_image: string (URL or Path)  
- greek_daemon: string  
- planet_sign_short_desc: string  
- planet_sign_long_desc: string  
- tarot_short_desc: string  
- tarot_long_desc: string  
- daemon_short_desc: string  
- daemon_long_desc: string  
- decan_img: string

Ensure the database column types support long text fields where necessary.

---

## Data Migration

After creating the table, the data from the JSON backup file must be inserted into the database.

Steps:

1. Read the JSON file from the provided path.
2. Parse the JSON records.
3. Map the MongoDB fields to the corresponding table columns.
4. Insert all records into the table `astro_decan_new_infos`.

Make sure:

- All records are successfully inserted.
- Image paths remain unchanged.
- Long descriptions are stored correctly.

---

## API Creation

After completing the table creation and data migration, create an API endpoint with the following route:

api/astro-decan/fetch-planet-signs

### API Purpose

This API will fetch the planet and sign data from the `astro_decan_new_infos` table.

### API Logic

The detailed logic for implementing this API has already been documented in the following file:

tasks/08.04.2026/astro-toolkit/astro_decan_info_api_logic.md

The implementation should follow the logic described in that file.

---

## Expected Outcome

After completing this task:

- The table `astro_decan_new_infos` is successfully created in the database.
- All records from the MongoDB backup JSON file are inserted into the table.
- The API `api/astro-decan/fetch-planet-signs` is implemented.
- The API fetches data from the `astro_decan_new_infos` table using the documented logic.

---

## Task Summary

1. Create the table `astro_decan_new_infos`.
2. Import data from  
   `tasks/08.04.2026/astro-toolkit/divine_infinity.astro_decan_new_infos.json`.
3. Verify that all records are inserted correctly.
4. Implement the API `api/astro-decan/fetch-planet-signs`.
5. Follow the API logic from  
   `tasks/08.04.2026/astro-toolkit/astro_decan_info_api_logic.md`.