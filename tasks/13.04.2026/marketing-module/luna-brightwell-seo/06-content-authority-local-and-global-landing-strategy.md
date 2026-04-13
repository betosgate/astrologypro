# Task 06: Content Authority Strategy for Local and Global Search

- **Status: DONE — 2026-04-13**
- Implemented in:
  - `src/app/[username]/page.tsx`
  - `src/app/[username]/services/[slug]/page.tsx`

### What was implemented
- Added profile-level authority modules using real SEO geography, specialties, language, experience, ratings, and session-volume signals.
- Added service-detail content blocks covering:
  - who the service is for
  - why to book with the specific diviner
  - local versus remote delivery posture
- Replaced generic-only conversion framing with intent-oriented content that is stronger for both local and global remote search.

## Goal

Turn the profile and service pages into strong landing pages for both geo-qualified and globally remote reading intent.

## Why This Is Needed

The current page copy is functional, but much of it is generic and not clearly mapped to search intent layers. High-standard SEO requires intentional content blocks that answer:

- who this diviner is
- what problems they solve
- who the service is for
- how sessions are delivered
- what makes them trustworthy
- where they serve clients

## Required Content Architecture

### 1. Profile page content modules

Profile page should support configurable sections such as:

- expert introduction
- specialties and modalities
- ideal client and reading style
- local area statement when relevant
- global remote-reading statement
- proof block using testimonials, completed sessions, or credentials

### 2. Service detail landing content

Each service page should include structured sections like:

- who this service is for
- what questions it helps answer
- what happens in the session
- what the client receives afterward
- preparation requirements
- why book this service with this diviner specifically

### 3. Local SEO content rules

Only add geo-targeted copy when backed by configured fields. Examples:

- “serving clients in London and worldwide online”
- “available for remote astrology readings across the US, UK, Canada, and Australia”

Do not stuff city names into titles or body copy without operational truth.

### 4. Global SEO content rules

For worldwide service intent, emphasize:

- online video readings
- timezone flexibility
- English-language or multilingual delivery
- remote booking convenience
- recording or follow-up deliverables if supported

### 5. Review and proof content

The repo already has testimonial infrastructure. Use it more intentionally:

- review excerpt modules on profile and service pages
- category-specific proof if enough approved testimonials exist
- moderation thresholds before public SEO use

### 6. Support content beyond the profile

Define supporting editorial links from:

- astrology guides
- tarot guides
- problem-led educational pages

These should funnel relevant intent to the diviner’s high-conversion service pages rather than only to generic site hubs.

## Acceptance Criteria

- profile and service pages each have clear search-intent roles
- local and global copy rules are separated and governable
- proof, trust, and service clarity are materially stronger than today’s generic baseline
