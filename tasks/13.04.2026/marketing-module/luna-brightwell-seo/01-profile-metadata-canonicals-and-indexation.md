# Task 01: Profile Metadata, Canonicals, and Indexation

- **Status: DONE — 2026-04-13**
- Implemented in: `src/lib/seo/diviner-profile.ts`, `src/app/[username]/page.tsx`

### What was implemented
- Created `src/lib/seo/diviner-profile.ts` — centralised SEO composition helper with:
  - `buildProfileTitle()` — seo_title_override → display_name + specialty → fallback
  - `buildProfileDescription()` — seo_description_override → tagline → bio excerpt + geo suffix
  - `buildProfileCanonical()` — always `APP_URL/{username}`, strips all query params
  - `buildProfileRobots()` — noindex when inactive, publish-blocked, or SEO score < 50
  - `buildProfileOgImage()` — seo_og_image_url → cover → avatar, with correct dimensions
  - `calcSeoCompletenessScore()` — 6-point check; profiles below 50 get noindex
- Updated `generateMetadata` in `src/app/[username]/page.tsx` to use all helpers
- Added `alternates.canonical` and `robots` directive to profile metadata

---

## Goal

Make the profile page at `/{username}` a high-quality canonical ranking surface with explicit metadata rules instead of relying on partial defaults.

## Why This Is Needed

`src/app/[username]/page.tsx` already builds title, description, Open Graph, and Twitter metadata, but it does not currently establish a full canonical policy. That weakens consistency for:

- query-param variants such as referral traffic
- shared links
- future tracking parameters
- possible duplicate routing variants over time

For a page like `https://astrologypro.com/luna-brightwell-qa`, the profile must become the primary canonical identity page for branded searches.

## Required Architecture

### 1. Canonical URL policy

Add `alternates.canonical` to profile metadata and ensure it always resolves to:

- `https://astrologypro.com/{username}`

Do not allow `ref`, campaign parameters, or temporary UI tabs to influence the canonical.

### 2. Metadata composition rules

Refactor profile metadata into a dedicated SEO composition helper so title and description are built from controlled DB fields, not ad hoc fallbacks only.

Required title composition order:

- primary: `{display_name} | {primary specialty phrase} | AstrologyPro`
- fallback: `{display_name} - Book a Reading`

Required description inputs:

- tagline
- short bio excerpt
- core specialties
- remote availability signal if true
- geography signal if configured and validated

### 3. Indexation policy

The profile page should be indexable only when:

- diviner exists
- diviner is active
- public publish controls do not block hero/services discovery
- profile has minimum SEO completeness score

Define a profile SEO completeness rule so thin or half-configured public pages can be marked `noindex` before they create poor search inventory.

### 4. Social metadata quality

Keep Open Graph and Twitter cards, but enforce:

- preferred cover image ratio
- fallback order for hero image
- clean branded alt text
- stable URL regardless of query params

### 5. Profile-level metadata fields

Expose new DB-backed optional fields for better titles and descriptions:

- `seo_title_override`
- `seo_description_override`
- `seo_h1_override`
- `seo_primary_keyword`
- `seo_secondary_keywords`

These should be optional overrides, not a replacement for core profile data.

## Files In Scope

- `src/app/[username]/page.tsx`
- likely new helper such as `src/lib/seo/diviner-profile.ts`
- admin profile management surfaces that will own these fields

## Acceptance Criteria

- profile page always outputs a canonical URL
- profile metadata is stable across tracked URLs
- thin or incomplete public profiles can be intentionally marked `noindex`
- metadata logic is reusable and not duplicated across page files
- the profile page is clearly positioned as the canonical branded landing page
