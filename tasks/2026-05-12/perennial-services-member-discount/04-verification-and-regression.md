# Task PSMD-04 - Verification and Regression

- Status: Completed
- Priority: P1
- Owner: QA / Full Stack
- Area: Perennial services discount flow
- Source: Product request to preserve existing booking behavior
- Created: 2026-05-12
- Commit: `863df042` - `Wire Perennial reading CTAs to services with member discount`

## Verification

```bash
./node_modules/.bin/eslint \
  src/components/community/perennial-reading-cta.tsx \
  src/app/community/page.tsx \
  src/app/community/transits/BookReadingButton.tsx \
  src/app/community/transits/TransitCardExpander.tsx \
  src/app/community/library/page.tsx \
  src/app/services/page.tsx \
  src/app/services/[slug]/page.tsx \
  src/components/services/service-template-public-page.tsx \
  src/components/services/template-intake-form.tsx \
  src/app/book/template/[slug]/page.tsx \
  src/components/booking/shared-template-calendar.tsx \
  src/app/[username]/book/[serviceSlug]/page.tsx \
  src/components/booking/booking-wizard.tsx \
  src/app/discover/discover-filters.tsx
```

## Manual QA

- Active community member clicks dashboard `Get a Reading`.
- Active community member clicks Quick Actions `Book a Reading`.
- Active community member clicks transits `Book a Reading (5% member discount)`.
- Confirm redirect shape is `/services?discount_token=...`.
- Select a service and confirm token remains in the URL.
- Complete intake path and confirm token reaches booking.
- Complete direct no-intake path and confirm token reaches booking.
- Use choose-diviner path and confirm token reaches booking.
- Confirm final payment request includes `discount_token`.
- Repeat as unauthenticated/non-member and confirm flow falls back to `/services`.

## Regression Checks

- Existing affiliate `ref` behavior is unchanged.
- Existing intake `submission` behavior is unchanged.
- Existing selected `date` and `time` behavior is unchanged.
- Existing `template` query behavior is unchanged.
- Normal `/services` browsing works without `discount_token`.

## Known Notes

- Full `tsc --noEmit` was blocked by pre-existing unrelated TypeScript errors
  elsewhere in the repo.
- Targeted ESLint completed with no errors; existing unused eslint-disable
  warnings remain in `src/app/community/library/page.tsx`.
