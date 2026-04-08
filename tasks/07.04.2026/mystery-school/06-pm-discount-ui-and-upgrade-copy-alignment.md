# Task 06: PM Discount UI And Upgrade Copy Alignment

- Status: Mostly Complete (2026-04-08, re-audited)
- Completion Notes: The canonical enrollment flow now lives in src/components/mystery-school/enrollment-flow.tsx, reads the live admin discount toggle, and no longer uses the old “Upgrading adds just +$17.03/month net” wording. Remaining gap: the PM dashboard CTA in src/app/community/page.tsx still uses old-style +$17.03 wording when the discount is ON.
Date: 2026-04-07
Category: Mystery School Module

## Status

- Mostly implemented
- Canonical enroll flow is discount-aware and replacement-tier copy is removed there
- One PM dashboard CTA still needs wording cleanup for full parity
- Audit remaining PM-facing copy before marking this fully done

## Objective
Make PM-facing Mystery School pricing UI and enrollment copy match the real business rules and the current admin discount toggle state.

## Problem

The pricing toggle for PM-user Mystery School discount currently affects server-side checkout
logic, but parts of the UI still show hardcoded discount messaging even when the admin toggle is OFF.

There is also outdated copy from the old replacement-tier model that says:

- PM membership will be replaced by Mystery School
- the user will not be double-charged
- upgrading adds just `+$17.03/month` net

That is no longer correct under the parallel-membership model.

## Wrong Current Behavior

Examples of incorrect PM-facing messaging:

- PM dashboard Mystery School upsell still says:
  - `From $97 one-time + $27/month — or +$17.03/month upgrade for PM members`
- `/community/upgrade` overview still says:
  - `Upgrading adds just +$17.03/month net`
- `/community/upgrade` review/payment steps still show:
  - PM subscription credit
  - net monthly cost `17.03`
  - replacement / not double-charged messaging

These must not appear when the admin discount toggle is OFF.

They also must not describe the PM + Mystery School purchase as a replacement flow at all.

## Required Behavior

- UI pricing copy must respect the live admin discount toggle
- If PM discount is OFF:
  - PM-facing Mystery School UI should show full pricing:
    - `97.00 USD` one-time
    - `27.00 USD/month`
  - no `+$17.03/month` messaging should appear
  - no PM credit line should appear
- If PM discount is ON:
  - PM-facing Mystery School UI may show the discounted monthly amount
  - only if the discount is truly active in system state

- Enrollment copy must follow the parallel-membership model:
  - PM remains active
  - Mystery School is added separately
  - no replacement wording
  - no “you will not be double-charged because PM is replaced” wording

## Requirements

- Remove hardcoded PM discount display text from PM dashboard upsell and upgrade flow
- Read the admin discount state from a real server/API source
- Align pricing display in:
  - PM dashboard Mystery School CTA block
  - `/community/upgrade` overview step
  - `/community/upgrade` review step
  - `/community/upgrade` payment step
- Remove or rewrite old replacement-tier copy so it matches the new parallel-membership business rule
- Ensure any “credit” or “net monthly cost” UI only appears when discount is actually enabled

## Files Likely Affected

- `src/app/community/page.tsx`
- `src/app/community/upgrade/page.tsx`
- `src/app/api/admin/platform-settings/route.ts`
- any shared pricing helper introduced for Mystery School PM messaging

## Test Cases

1. Admin discount OFF
   - PM dashboard shows full Mystery School pricing only
   - `/community/upgrade` shows full `$97 + $27/month`
   - no `+$17.03/month`, no PM credit line, no replacement wording

2. Admin discount ON
   - PM-facing Mystery School UI may show discounted PM messaging
   - review/payment screens match actual pricing logic

3. Copy validation
   - no PM -> MS replacement copy remains
   - no “PM will be replaced” or “you will not be double-charged because of replacement” text remains

## Success Criteria

- PM-facing Mystery School pricing text matches actual system behavior
- Admin discount toggle affects both checkout behavior and user-visible pricing copy
- Upgrade/enrollment copy reflects parallel memberships, not replacement-tier semantics
