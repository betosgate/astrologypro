# Task 05: Sitemap, Discovery, and Internal Linking Architecture

## Goal

Fix crawl discovery so diviner profile and service pages can actually be found, refreshed, and prioritized by search engines.

## Why This Is Needed

`src/app/sitemap.ts` currently emits marketing pages, blog pages, learning pages, and guides, but it does not emit:

- `/{username}`
- `/{username}/services`
- `/{username}/services/{slug}`

That is a major structural SEO gap. A page cannot compete well if the platform’s own sitemap ignores it.

## Required Architecture

### 1. Add dynamic diviner URLs to the sitemap

Include:

- profile page
- services hub page
- all active public service detail pages
- only other public pages that are explicitly intended for indexation

Do not include:

- booking utility pages
- blocked or unpublished profiles
- fallback manual services
- low-value duplicate URLs

### 2. Last-modified strategy

Do not assign the same generic timestamp to every dynamic URL if the DB can provide better signals.

Prefer:

- diviner `updated_at`
- service `updated_at` or `created_at`
- latest approved testimonial date when materially relevant

### 3. Internal linking hierarchy

Strengthen the crawl path:

- homepage and discovery hubs -> diviner profiles
- profile -> services hub
- services hub -> individual services
- service pages -> profile and related services
- guide pages -> relevant service pages where intent fits

### 4. Breadcrumb coverage

Use `Breadcrumbs` consistently on service pages and any additional SEO landing pages to reinforce hierarchy.

### 5. XML hygiene

Set sensible priorities and change frequencies based on business value:

- profile: high
- services hub: medium-high
- service details: high
- booking pages: excluded

## Files In Scope

- `src/app/sitemap.ts`
- public page components that need stronger internal linking
- discovery hubs if they surface diviner profiles

## Acceptance Criteria

- every intended public diviner profile and service page is present in the sitemap
- non-indexable utility pages are excluded
- internal link structure reflects ranking priorities, not only UX navigation
