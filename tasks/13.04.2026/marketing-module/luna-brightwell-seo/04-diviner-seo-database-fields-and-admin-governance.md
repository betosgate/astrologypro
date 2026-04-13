# Task 04: Diviner SEO Database Fields and Admin Governance

- **Status: PARTIAL — 2026-04-13**
- DB migration done. Admin UI not yet implemented.

### What was implemented
- Created `supabase/migrations/20260413000180_diviner_seo_fields.sql` — adds to `diviners` table:
  - Geography: `seo_city`, `seo_region`, `seo_country`, `seo_country_code`, `seo_service_area_mode`, `seo_service_areas`, `seo_is_remote_global`
  - Authority: `seo_languages`, `seo_credentials`, `seo_awards`, `seo_years_experience`, `seo_same_as_urls`, `seo_press_mentions`
  - Metadata overrides: `seo_title_override`, `seo_description_override`, `seo_h1_override`, `seo_primary_keyword`, `seo_secondary_keywords`, `seo_og_image_url`
  - Review controls: `seo_show_aggregate_rating`, `seo_show_testimonials_in_schema`
  - Validation constraints: city requires country; local mode requires city
- TS mirror: `src/data/migrations/20260413000180_diviner_seo_fields.ts`

### Still TODO
- [ ] Admin UI section for managing SEO fields (dedicated SEO tab in diviner admin page)

---

## Goal

Create the database-backed foundation required to make local and global SEO claims credible, configurable, and maintainable from admin tools.

## Why This Is Needed

The current `diviners` table has strong baseline profile fields such as:

- `username`
- `display_name`
- `bio`
- `tagline`
- `specialties`
- `avatar_url`
- `cover_image_url`
- `timezone`

That is not enough for top-standard SEO operations. Critical fields for location, language, authority, and metadata overrides are missing.

## Required Schema Additions

### 1. Geography and service-area fields

Add fields such as:

- `seo_city`
- `seo_region`
- `seo_country`
- `seo_country_code`
- `seo_service_area_mode`
- `seo_service_areas`
- `seo_is_remote_global`

`seo_service_area_mode` should allow clear strategies like:

- exact local area
- multi-region
- worldwide remote

### 2. Authority and identity fields

Add optional fields such as:

- `seo_languages`
- `seo_credentials`
- `seo_awards`
- `seo_years_experience`
- `seo_same_as_urls`
- `seo_press_mentions`

### 3. Metadata override fields

Add optional controlled overrides:

- `seo_title_override`
- `seo_description_override`
- `seo_profile_intro_override`
- `seo_og_image_url`

### 4. Public review controls

Add rules or settings for whether aggregate rating and testimonial excerpts may be used in SEO schema and page modules.

### 5. Admin UX ownership

Expose these fields in a dedicated admin or dashboard SEO configuration section, not mixed randomly into the base profile form.

Admin should be able to manage:

- canonical local market
- global remote availability
- supported languages
- review display permissions
- SEO overrides
- social identity links

### 6. Validation rules

Prevent invalid SEO claims with validation:

- city cannot exist without country
- local business claims require location completeness
- sameAs URLs must be allowlisted domains
- title and description override length should be bounded

## Files In Scope

- Supabase migration(s)
- admin or dashboard profile configuration UIs
- API routes that persist diviner profile data

## Acceptance Criteria

- all local SEO claims can be backed by stored fields
- admin can manage SEO-critical data without code edits
- schema and metadata builders no longer need to infer locality from weak signals only
