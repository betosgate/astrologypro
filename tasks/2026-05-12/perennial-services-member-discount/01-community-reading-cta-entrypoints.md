# Task PSMD-01 - Community Reading CTA Entrypoints

- Status: Completed
- Priority: P1
- Owner: Frontend
- Area: Perennial community CTAs
- Source: Product request to route reading CTAs to `/services`
- Created: 2026-05-12
- Commit: `863df042` - `Wire Perennial reading CTAs to services with member discount`

## Files

- `src/components/community/perennial-reading-cta.tsx`
- `src/app/community/page.tsx`
- `src/app/community/transits/BookReadingButton.tsx`
- `src/app/community/transits/TransitCardExpander.tsx`
- `src/app/community/library/page.tsx`

## Problem

Perennial reading CTAs pointed to legacy routes such as `/diviner` and
`/astrologers`. Only the transit CTA attempted to mint a member discount token,
and it did not route through the new services hub.

## Implementation

1. Add a reusable Perennial reading CTA client component.
2. On click, call `POST /api/community/discount-token`.
3. Redirect active members to `/services?discount_token=<token>`.
4. Redirect to `/services` when token creation fails or the user is not eligible.
5. Replace community dashboard, quick action, transits, transit card, and library reading CTAs with this behavior.
6. Ensure the quick-action tile shows pointer cursor on hover.

## Acceptance Criteria

- Dashboard `Get a Reading` opens `/services` with a token for active members.
- Quick Actions `Book a Reading` opens `/services` with a token for active members.
- Transits `Book a Reading (5% member discount)` uses the same behavior.
- Library and transit-card reading CTAs use the same behavior.
- Non-members and unauthenticated users fall back to `/services`.
