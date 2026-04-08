# Perennial Signup Page Shell And Route

- Completion Notes: Implemented at src/app/perennial-signup/page.tsx as a dedicated full-page route (NOT under /community/plan or /join/community). Hero, plan selection, member forms, optional questionnaire (collapsed by default), sticky order summary, and CTA. Mobile stacks via grid responsive classes.
- Status: Partial (2026-04-08)
- Date: 2026-04-08
- Category: Perennial Signup
- Owner: Frontend
- Priority: P0
- Task File: `tasks/08.04.2026/perennial/01-page-shell-and-route.md`

## Goal

Create the dedicated Perennial signup route and page shell for a premium multi-member household signup flow.

## User-Visible Requirement

This must be a real full-page experience, not:

- a dialog
- a drawer
- a tiny section under `/join/community`
- a recycled current `/community/plan` add-member page

## Required Route Behavior

1. The implementation must expose a dedicated Perennial signup route.
2. The route must be clearly Perennial-specific and not mixed with Mystery School.
3. The page should be discoverable as the canonical Perennial purchase/signup surface.
4. Route naming must avoid ambiguity with post-login PM dashboard routes.

## Required Page Structure

The page should include these top-level sections in order:

1. hero/header section
2. plan selection section
3. household member forms section
4. optional questionnaire areas within each member form
5. persistent order summary/payment summary area
6. final action area for continue/review/payment

## Layout Requirements

1. Desktop layout must comfortably support long forms without feeling cramped.
2. Mobile layout must stack cleanly and keep CTA visibility reasonable.
3. The pricing summary should remain easy to reference while editing forms.
4. Section headings must be explicit so the user understands:
   - who is the main account holder
   - which forms belong to additional members
   - what plan they selected
   - how many members are allowed

## Visual Direction

The page must feel intentional and premium, not like admin CRUD.

It must also remain visually consistent with the current AstrologyPro site theme and shared component language.

Requirements:

1. strong page title and plan framing
2. visible selected-plan state
3. readable section grouping
4. polished empty/add-member states
5. visible validation and error affordances
6. pricing summary that feels transactional and trustworthy
7. styling that clearly belongs to the current site rather than a separate branded experience

## Required Labels / Conceptual Copy

The page should clearly communicate:

1. `Primary Member`
2. `Additional Member`
3. `Single`, `Couple`, `Family`
4. current member count
5. maximum allowed members for the selected plan
6. billing owner is the primary purchaser
7. login credentials will be generated and emailed after successful payment

## Acceptance Criteria

1. the route is dedicated to Perennial signup
2. the page is full-screen and clearly product-facing
3. the shell has clear sections for plan, members, and pricing
4. the page supports long-form completion without layout collapse
5. the page feels like a purpose-built signup journey
6. the page visually matches the current AstrologyPro theme and shared design system
