# Task 03: Service and Booking Indexation Strategy

## Goal

Promote the right service pages for ranking and prevent booking utility pages from competing with or diluting them.

## Why This Is Needed

The current public funnel includes:

- `/{username}/services`
- `/{username}/services/{slug}`
- `/{username}/book/{serviceSlug}`

The service pages are content-bearing landing pages. The booking page is a conversion utility. Today the booking page has standard metadata and appears indexable, which is usually the wrong search posture for this architecture.

## Required Architecture

### 1. Define ranking roles by URL type

Profile page:

- branded ranking page

Services index:

- hub ranking page for service discovery

Service detail:

- primary ranking page for service-specific intent

Booking page:

- conversion page
- default `noindex,follow`

### 2. Booking page policy

Update `src/app/[username]/book/[serviceSlug]/page.tsx` so booking URLs:

- are canonicalized away from themselves if needed, or explicitly self-canonical with `noindex`
- include robots policy that keeps them out of the index
- preserve crawl-follow behavior to maintain internal graph flow

Reason:

- booking pages are thinner than service detail pages
- they are more transactional
- they risk duplicate intent competition against service detail URLs

### 3. Services index optimization

Strengthen `src/app/[username]/services/page.tsx` as a category hub:

- canonical URL
- stronger intro copy
- service category grouping
- FAQ or decision-support content only if unique
- breadcrumbs back to profile

### 4. Service detail page optimization

Each service detail page should become the main SEO target for queries like:

- natal chart reading
- tarot reading
- compatibility reading
- astrology consultation online

Required improvements:

- canonical URL
- better service-specific title rules
- stronger problem-solution copy blocks
- structured internal links back to profile and service hub
- review snippets where policy allows
- better content around outcomes, preparation, ideal client, and delivery format

### 5. Referral parameter handling

The app preserves `ref` parameters across services and booking URLs. This is good for attribution, but the SEO policy must guarantee:

- canonical URLs ignore referral params
- metadata URLs ignore referral params
- schema offer URLs use clean canonical URLs

## Files In Scope

- `src/app/[username]/services/page.tsx`
- `src/app/[username]/services/[slug]/page.tsx`
- `src/app/[username]/book/[serviceSlug]/page.tsx`
- potentially `src/app/[username]/book/page.tsx`

## Acceptance Criteria

- booking pages no longer compete in search against service pages
- service detail pages become the primary organic destination for purchase intent
- all service-related pages have an explicit canonical and indexation rule
