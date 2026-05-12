# Task PSMD-02 - Services Hub and Landing Token Propagation

- Status: Completed
- Priority: P1
- Owner: Full Stack
- Area: Public services pages
- Source: Product request to preserve member discount from `/services`
- Created: 2026-05-12
- Commit: `863df042` - `Wire Perennial reading CTAs to services with member discount`

## Files

- `src/app/services/page.tsx`
- `src/app/services/[slug]/page.tsx`
- `src/components/services/service-template-public-page.tsx`
- `src/components/services/template-intake-form.tsx`

## Problem

After redirecting to `/services?discount_token=...`, selecting a service or
submitting an intake could drop the token before the user reached booking.

## Implementation

1. Let `/services` read `discount_token` from `searchParams`.
2. Append `discount_token` to each `/services/[slug]` card link.
3. Let `/services/[slug]` read `discount_token` and pass it into the service landing component.
4. Preserve the token in:
   - Direct booking CTA.
   - Browse/compare services links.
   - Intake form booking URL.
   - General-template choose-diviner URL.

## Acceptance Criteria

- `/services?discount_token=abc` links to `/services/[slug]?discount_token=abc`.
- `/services/[slug]?discount_token=abc` direct booking CTA links to `/book/template/[slug]?discount_token=abc`.
- Intake submission preserves token on the next booking URL.
- No discount banner or visible pricing change is introduced.
