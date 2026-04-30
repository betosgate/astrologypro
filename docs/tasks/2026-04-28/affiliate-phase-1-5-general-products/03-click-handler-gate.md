# Task 03 — `/r/<code>` Click Handler — Disabled-Program Gate

- Status: Code complete 2026-04-30 in working tree (uncommitted). Two files: `src/app/r/[code]/route.ts` (gate + click-log coercion for general type), `src/lib/campaign-destination-resolver.ts` (extended for null `diviner_id` → `/readings/<slug>`). Implementation uses the existing 307→`/link-not-active` pattern instead of a literal HTTP 410 to match the codebase's existing revoked-assignment behavior.
- Priority: P0
- Depends on: 01
- Blocks: 08
- Spec: §5 Flow D step 3 (existing) + §10 Phase 1.5 decision #3

## Goal

Make `/r/<code>` return **410** for share URLs that point at a campaign
whose underlying general template has been disabled by admin
(`service_templates.affiliate_program_enabled=false`). Mirrors the
existing Flow D step 3 behavior for revoked assignments — disabled
templates are the general-program equivalent of a revoked partnership.

## Code change

**File:** `src/app/r/[code]/route.ts`

Add a new gate AFTER the campaign lookup, BEFORE click logging:

```ts
// Existing v2 gate (Flow D step 3): if linked campaign's source
// assignment is revoked, return 410.
if (campaign.source_assignment_id) {
  const assignment = await fetchAssignment(campaign.source_assignment_id);
  if (!assignment?.is_active) {
    return renderLinkInactivePage();  // 410
  }
}

// NEW Flow D step 3b (general-program): if linked campaign's destination
// template has the program disabled, return 410.
if (campaign.owner_affiliate_type === 'general') {
  const template = await fetchServiceTemplate(campaign.destination_service_template_id);
  if (!template?.affiliate_program_enabled) {
    return renderLinkInactivePage();  // 410
  }
}
```

**No click is logged** when the gate fires. Match the existing
revoked-assignment behavior.

## Why this gate matters

Without it, the resolveStampForBooking gate from Task 02 would still
catch the disabled program at booking time — but the customer would
have already clicked through to the reading page and started the
checkout flow. Returning 410 at the redirect step is more honest:
"this link is no longer active".

## Default-rate edge case

When `affiliate_program_enabled=true` AND `commission_value IS NULL`,
the system applies the 10% default (Task 02). The click handler should
**NOT** 410 in this case — only the explicit-disabled flag should
trigger the gate.

So the order is:
- `affiliate_program_enabled=true` + any `commission_value` (NULL or set) → click logged, redirect
- `affiliate_program_enabled=false` → 410, no click logged

## Acceptance

- [ ] Hitting `/r/<code>` for an enabled general program → 307
      redirect, click row inserted.
- [ ] Hitting `/r/<code>` for a disabled program → 410, branded
      "link no longer active" page, no click row inserted.
- [ ] Default-rate (program enabled + NULL value) → still redirects
      and logs the click; the 10% default is applied later at booking
      stamp time.
- [ ] Per-diviner revoked-assignment path is unchanged (regression
      test).

## Suggested file

- `src/app/r/[code]/route.ts` (extended)
