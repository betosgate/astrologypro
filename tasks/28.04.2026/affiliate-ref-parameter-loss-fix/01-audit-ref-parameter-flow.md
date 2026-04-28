# 01 Audit Ref Parameter Flow - 2026-04-28

- Depends on: None
- Task File: `tasks/28.04.2026/affiliate-ref-parameter-loss-fix/01-audit-ref-parameter-flow.md`

## Problem

The `ref` parameter is not being carried from affiliate links to booking URLs. Need to identify exactly where it's being lost.

## Current Flow Analysis

1. **Affiliate Link Generation** (`/src/components/affiliate/marketing-kit.tsx`)
   - Links: `https://astrologypro.com/readings/{slug}?ref={campaignCode}`
   - ✅ Ref parameter present

2. **Reading Landing Page** (`/src/app/readings/{slug}/page.tsx`)
   - Receives `?ref=` in URL
   - ✅ Ref available in searchParams

3. **Reading Page Template** (`/src/components/marketing/reading-page-template.tsx`)
   - `DivinerCard` component generates links to `/{username}/book/{serviceSlug}` or `/{username}`
   - ❌ **BUG**: No ref parameter included in links

4. **Diviner Profile Page** (`/src/app/{username}/page.tsx`)
   - Receives ref from URL (if carried over)
   - `ServiceCard` includes refParam in links: `/{username}/book/{serviceSlug}{refParam}`
   - ✅ Would work if ref reaches here

5. **Booking Page** (`/src/app/{username}/book/{serviceSlug}/page.tsx`)
   - Receives ref in searchParams
   - Passes to `BookingWizard`
   - ✅ BookingWizard extracts ref from URL and sends as `affiliateCode` to API

6. **Booking API** (`/src/app/api/stripe/booking-payment/route.ts`)
   - Receives `affiliateCode` but expects `refCode` for stamping
   - ❌ **BUG**: Field name mismatch (`affiliateCode` vs `refCode`)

## Root Cause

Two issues:

1. **ReadingPageTemplate doesn't propagate ref**: Links from reading pages to diviner profiles lose the ref parameter.

2. **API field mismatch**: BookingWizard sends `affiliateCode` but API uses `refCode` for stamping.

## Required Changes

1. Modify `ReadingPageTemplate` to accept `ref?: string` prop and include it in `DivinerCard` links.

2. Update reading page components to pass ref from searchParams to `ReadingPageTemplate`.

3. Either rename `affiliateCode` to `refCode` in BookingWizard, or modify API to use `affiliateCode` for stamping.

## Files to Modify

- `src/components/marketing/reading-page-template.tsx`
- `src/app/readings/*/page.tsx` (multiple files)
- `src/components/booking/booking-wizard.tsx` (rename field)
- `src/app/api/stripe/booking-payment/route.ts` (use affiliateCode for refCode)

## Next Steps

After audit, implement fixes in order 02-03.