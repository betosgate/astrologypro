# Task AD-01 - Affiliate Dashboard Client Component Marker

- Status: Completed
- Priority: P2
- Owner: Frontend
- Area: Affiliate dashboard
- Source: Small local update
- Created: 2026-05-12
- Commit: `d519d02c` - `changes:update`

## Files

- `src/app/dashboard/affiliates/page.tsx`

## Problem

The affiliate dashboard page imports and uses client-only React and Next
navigation hooks, including:

- `useEffect`
- `useState`
- `useCallback`
- `useTransition`
- `useRouter`
- `usePathname`
- `useSearchParams`

The file needed to be explicitly marked as a client component.

## Implementation

1. Add `"use client";` at the top of the affiliate dashboard page.
2. Keep existing imports and behavior unchanged.

## Acceptance Criteria

- Affiliate dashboard can use React hooks without server-component errors.
- No UI or API behavior changes.

## Verification

Manual QA:

- Open `/dashboard/affiliates`.
- Confirm the page renders and interactive controls still work.
