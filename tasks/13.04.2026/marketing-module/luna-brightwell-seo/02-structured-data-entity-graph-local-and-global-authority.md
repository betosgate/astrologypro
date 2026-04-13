# Task 02: Structured Data Entity Graph for Local and Global Authority

## Goal

Replace the current generic schema setup with a richer entity graph that supports both local trust signals and global remote-service intent.

## Why This Is Needed

`src/app/[username]/page.tsx` currently emits a `LocalBusiness` object plus a list of `Service` nodes. That is directionally useful but incomplete:

- it lacks enough verified locality detail to be strong local SEO
- it does not clearly express remote consultation and service area
- it does not connect reviews, offers, profile identity, and service pages into one graph

## Required Architecture

### 1. Separate entity roles correctly

The schema graph should distinguish:

- the practitioner: `Person`
- the practice or professional service presence: `ProfessionalService` or another better-fit business/service entity
- service offerings: `Service`
- offer data: `Offer`
- reviews and rating summaries where available

Do not rely on a single generic `LocalBusiness` node for everything.

### 2. Add DB-backed locality and identity fields

Schema should only claim local relevance when the DB explicitly stores it.

Needed fields:

- city
- state or region
- country
- service area text or structured list
- business address visibility mode
- spoken languages
- online-only or hybrid consultation mode
- sameAs URLs for YouTube, Instagram, TikTok, LinkedIn, website

### 3. Support global remote-reading intent

For diviners serving clients worldwide, schema should express:

- online delivery mode
- remote consultation availability
- multi-country or global service area
- supported languages
- booking URL

### 4. Review and rating integration

The profile page already fetches testimonials and computes rating signals. Convert those into a controlled aggregate review layer when policy allows:

- aggregate rating only when thresholds are met
- optional review nodes from approved testimonials
- no schema spam from low-count or unmoderated content

### 5. Service-page schema improvements

The service detail page at `src/app/[username]/services/[slug]/page.tsx` should move from a simple `Service` object to a fuller graph:

- `Service`
- `Offer`
- provider `Person`
- `FAQPage` only when content is unique and policy-compliant
- `BreadcrumbList`

### 6. Utility components

Create shared structured-data builders so schema is validated centrally instead of assembled inline in page files.

## Files In Scope

- `src/app/[username]/page.tsx`
- `src/app/[username]/services/[slug]/page.tsx`
- `src/components/seo/faq-section.tsx`
- `src/components/seo/breadcrumbs.tsx`
- new shared schema utilities under `src/lib/seo/` or `src/components/seo/`

## Acceptance Criteria

- schema expresses practitioner identity, service offerings, and booking intent as a coherent graph
- local schema is emitted only when locality fields are actually configured
- global remote-service capability is visible in structured data
- service pages and profile pages no longer use oversimplified schema only
