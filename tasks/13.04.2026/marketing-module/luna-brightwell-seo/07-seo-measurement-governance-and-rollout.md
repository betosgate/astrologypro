# Task 07: SEO Measurement, Governance, and Rollout

## Goal

Ship SEO improvements safely, measure whether they work, and prevent future profile pages from regressing into thin or inconsistent search surfaces.

## Why This Is Needed

SEO quality on this repo is currently page-by-page and partially manual. Without governance, dynamic profile pages will drift:

- some pages will be indexable but incomplete
- some pages will lack canonical tags
- some pages will never reach the sitemap
- some pages will make local claims without supporting data

## Required Architecture

### 1. SEO readiness scoring

Introduce a readiness model for public diviner pages using criteria such as:

- profile completeness
- hero image quality
- title and description availability
- service inventory count
- testimonials threshold
- location or global-service configuration validity

This score can drive:

- `index` vs `noindex`
- admin warnings
- launch readiness

### 2. Search Console and analytics readiness

Define implementation tasks for:

- URL inspection workflow
- sitemap submission validation
- branded query monitoring
- service-query monitoring
- CTR and landing-page performance reporting

### 3. SEO QA checklist

For each profile rollout, validate:

- canonical
- robots
- Open Graph
- schema graph
- breadcrumb graph
- sitemap inclusion
- internal links
- thin-page risk

### 4. Governance rules

Document clear rules for future diviner public pages:

- booking pages default to `noindex`
- only approved public services enter the sitemap
- local modifiers require real configured geography
- schema should be emitted from shared builders only

### 5. Rollout strategy

Apply this work first to the Luna Brightwell QA profile as the pilot, then generalize into reusable rules for all diviner public pages.

## Acceptance Criteria

- the SEO system becomes repeatable across diviners
- admins can see when a page is not SEO-ready
- platform-level regressions are caught before they affect public search inventory
