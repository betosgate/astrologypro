# Luna Brightwell QA SEO Architecture Pack

## Objective

Raise the SEO standard of `https://astrologypro.com/luna-brightwell-qa` and its service funnel to a top-tier level for both:

- local intent: users searching for an astrologer or tarot reader tied to a city, region, country, or timezone
- global intent: users searching for branded, service-led, and problem-led readings across markets

This pack is architecture only. It does not implement code or migrate data.

## Current State Confirmed In Repo

### Public surfaces already present

- profile page: `src/app/[username]/page.tsx`
- services index: `src/app/[username]/services/page.tsx`
- service detail page: `src/app/[username]/services/[slug]/page.tsx`
- booking page: `src/app/[username]/book/[serviceSlug]/page.tsx`

### Existing SEO strengths

- dynamic metadata already exists on profile, services index, service detail, and booking entry pages
- profile page already emits JSON-LD with `LocalBusiness` and `Service`
- service detail page already emits `Service` schema
- FAQ structured data component exists: `src/components/seo/faq-section.tsx`
- breadcrumb structured data component exists: `src/components/seo/breadcrumbs.tsx`
- robots and sitemap routes exist: `src/app/robots.ts`, `src/app/sitemap.ts`

### Major gaps discovered

- `src/app/sitemap.ts` does not include dynamic diviner profile pages, service pages, or other diviner public URLs at all
- profile, services index, and service detail metadata do not consistently declare canonical URLs through `alternates.canonical`
- booking pages are presently indexable even though they are transactional utility pages with thin SEO value
- profile page uses a generic `LocalBusiness` model without enough database-backed locality fields to justify strong local SEO
- no clear DB-backed system exists for diviner SEO location, service area, languages, awards, social proof, or external identity references
- public SEO copy is mostly generic and not clearly separated into:
  - brand intent
  - service intent
  - local intent
  - global remote-reading intent
- internal linking is present but not organized into a stronger crawl hierarchy across profile -> services -> service pages -> booking intent pages

## Architectural Goal

Turn each diviner profile into a proper SEO entity graph with four controlled search surfaces:

1. Profile authority page
2. Service hub page
3. Service detail landing pages
4. Controlled booking conversion pages that support conversion without diluting search quality

The page should rank on:

- brand searches for the diviner
- service searches such as natal chart, tarot reading, compatibility reading
- geo-qualified searches where appropriate
- global remote-reading searches where locality is not the primary modifier

## Workstreams

1. `01-profile-metadata-canonicals-and-indexation.md`
2. `02-structured-data-entity-graph-local-and-global-authority.md`
3. `03-service-and-booking-indexation-strategy.md`
4. `04-diviner-seo-database-fields-and-admin-governance.md`
5. `05-sitemap-discovery-and-internal-linking-architecture.md`
6. `06-content-authority-local-and-global-landing-strategy.md`
7. `07-seo-measurement-governance-and-rollout.md`

## Delivery Order

1. Fix indexation and canonical rules first
2. Add missing DB-backed SEO fields so metadata and schema stop relying on generic text only
3. Expand sitemap and internal linking so profile and service URLs become discoverable
4. Improve content architecture for local and global intent
5. Add measurement, QA, and governance rules

## Acceptance Standard

This SEO program should not be considered complete until:

- every public diviner URL has an intentional indexation rule
- every indexable URL has a canonical
- dynamic profile and service URLs are emitted in the sitemap
- structured data reflects a coherent entity graph
- booking URLs are controlled as conversion utilities, not accidental ranking pages
- local SEO claims are backed by actual DB fields and visible page content
- global remote-service intent is explicitly represented in copy and schema
- admin users can manage SEO-critical profile fields without code changes
