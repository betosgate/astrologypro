# 03 Ensure Booking Wizard Sends RefCode - 2026-04-28

- Depends on: `02-fix-reading-page-template-ref-propagation.md`
- Task File: `tasks/28.04.2026/affiliate-ref-parameter-loss-fix/03-ensure-booking-wizard-sends-refcode.md`

## Problem

`BookingWizard` sends `affiliateCode` to the API, but the API expects `refCode` for commission stamping.

## Current Code Analysis

In `src/components/booking/booking-wizard.tsx`:

```typescript
const urlParams = new URLSearchParams(window.location.search);
const affiliateCode = urlParams.get("ref") || undefined;

// ... in fetch call
body: JSON.stringify({
  // ...
  affiliateCode,
  // ...
}),
```

In `src/app/api/stripe/booking-payment/route.ts`:

```typescript
const {
  affiliateCode,
  refCode: rawRefCode,
  // ...
} = body;

const refCode = sanitizeRefCode(rawRefCode); // rawRefCode is undefined
```

## Required Change

Rename `affiliateCode` to `refCode` in the BookingWizard fetch call.

```typescript
body: JSON.stringify({
  // ...
  refCode: affiliateCode, // rename from affiliateCode
  // ...
}),
```

## Why This Works

- `affiliateCode` variable contains the raw ref parameter from URL
- API expects `refCode` field for stamping
- `sanitizeRefCode` will validate the format
- `affiliateCode` is still stored in booking metadata for audit purposes

## Files to Modify

- `src/components/booking/booking-wizard.tsx`

## Testing

After change, verify that:
- BookingWizard sends `refCode` field to API
- API receives and sanitizes the ref code
- Commission stamping works when ref is present