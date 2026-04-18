# Task VF-07 - Align Campaign Share URL Status Behavior

- Status: Not Started
- Priority: P1
- Owner: Full Stack
- Area: Campaign destination tracking
- Source: Manual checklist verification rerun on 2026-04-18
- Created: 2026-04-18

## Files

- `src/app/api/dashboard/campaigns/route.ts`
- `src/app/api/dashboard/campaigns/[id]/activate/route.ts`
- `src/app/r/[code]/route.ts`
- `src/app/dashboard/campaigns/page.tsx`
- `src/components/dashboard/campaign-url-display.tsx`

## Problem

The manual checklist says a campaign created with a service destination should provide a share URL that redirects to the selected service destination.

Observed behavior:

1. Creating a service-destination campaign returns a share URL:

```text
http://localhost:3000/r/cmp_BC8MTVot
```

2. The new campaign status is `draft`.
3. Opening the share URL while the campaign is still draft redirects to the diviner profile:

```text
/test-diviner-1?ref=cmp_BC8MTVot
```

4. After activating the campaign with `/api/dashboard/campaigns/[id]/activate`, the same share URL redirects correctly:

```text
/test-diviner-1/services/nativity-birth-chart?ref=cmp_BC8MTVot
```

This may be intentional, but the UI/checklist currently implies the copied URL is ready to use immediately after creation.

## Implementation Options

Choose one behavior and make it consistent across API, UI, and docs.

### Option A - Draft Links Are Inactive

1. Keep `/r/[code]` from sending draft campaigns to service destinations.
2. Make the dashboard UI clearly label draft campaign URLs as inactive until activation.
3. Disable or hide copy/share controls until the campaign is active.
4. Update checklist/docs to say draft URLs should not be shared.

### Option B - Draft Links Preview Destination

1. Allow draft campaign links to resolve to the selected destination for the owning diviner/admin preview only.
2. Keep public visitors blocked or redirected until active.
3. Clearly separate preview URL from public share URL.

### Option C - Service-Destination Campaigns Activate on Create

1. If product wants immediate shareability, create service-destination campaigns as active when valid.
2. Ensure activation checks still enforce destination and enabled-service rules.

## Acceptance Criteria

- Campaign creation UI and `/r/[code]` redirect behavior agree.
- Users are not shown a share/copy URL that appears ready but redirects to the wrong destination.
- Active service-destination campaign URLs redirect to the selected service page.
- Inactive/draft behavior is explicit in UI and documentation.
- Analytics/click logging behavior remains correct for active campaign links.

## Verification

Use:

```text
diviner1@test.astrologypro.com
TestUser123!
```

Manual checks:

1. Create a campaign with destination type `SERVICE`.
2. Confirm whether the campaign is draft or active.
3. Copy/open the generated `/r/cmp_...` URL in a logged-out browser.
4. Confirm redirect behavior matches the chosen product behavior.
5. Activate the campaign if needed.
6. Confirm active URL redirects to:

```text
/test-diviner-1/services/nativity-birth-chart
```

7. Confirm a disabled service cannot be used as destination.
