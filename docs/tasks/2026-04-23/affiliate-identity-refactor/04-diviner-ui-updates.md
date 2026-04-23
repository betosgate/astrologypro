# Task 04 — Diviner UI Updates

- Status: Not Started
- Priority: P1 (High)
- Depends On: 02, 06 (Task 06 ships the API response shapes this UI consumes)
- Blocks: —

## Goal

Update the diviner-facing affiliates surface to match the new invite-only, canonical-identity model. Remove the direct-add UI. Strengthen the Invite dialog. Surface acceptance state and the canonical affiliate identity on the list, detail, assignments, and commission screens. No schema changes in this task.

## Current State

- [src/app/dashboard/affiliates/page.tsx](../../../../src/app/dashboard/affiliates/page.tsx) lines 301-383 render both an **Add Affiliate** sheet and an **Invite Affiliate** dialog. The Add sheet's submit hits `POST /api/dashboard/affiliates` which Task 02 deletes.
- List columns today: `name`, `email`, `commission`, `status`, `created`, actions. Reads `diviner_affiliates` row fields directly. Task 06 reshapes the API to join `affiliate_accounts` and return a flattened response (same top-level keys).
- Detail page: [src/app/dashboard/affiliates/[id]/page.tsx](../../../../src/app/dashboard/affiliates/[id]/page.tsx).
- Assignment screens: [src/app/dashboard/affiliates/assignments/](../../../../src/app/dashboard/affiliates/assignments/) + [src/app/dashboard/affiliates/reports/](../../../../src/app/dashboard/affiliates/reports/).
- Commission drill-down: [src/app/dashboard/affiliate-commission/[affiliateId]/](../../../../src/app/dashboard/affiliate-commission/[affiliateId]/).
- Existing affiliate agreement check: diviner has `diviners.affiliate_agreement_signed` column. Invite UI currently does **not** gate on this.

## Target Behavior

### 1. Remove Add Affiliate

In [src/app/dashboard/affiliates/page.tsx](../../../../src/app/dashboard/affiliates/page.tsx):

- Delete the `Sheet` + `SheetTrigger` + `SheetContent` block for Add Affiliate.
- Delete `handleCreate` and all related state (`formName`, `formEmail`, `formPhone`, `formCommType`, `formCommValue`, `formNotes`).
- Replace the empty-state CTA "Add Your First Affiliate" → "Invite Your First Affiliate" (opens Invite dialog).

### 2. Agreement gate (new, minor)

Before the Invite button is enabled:

- Read `diviners.affiliate_agreement_signed` directly from the diviner record already loaded by the page's Server Component parent (avoid a separate fetch). The existing `POST /api/dashboard/affiliate-agreement` endpoint at [src/app/api/dashboard/affiliate-agreement/route.ts](../../../../src/app/api/dashboard/affiliate-agreement/route.ts) is the only route in that subtree today — there is no GET status endpoint, and none needs to be created; the boolean comes from the DB field.
- If `affiliate_agreement_signed = false`: show a persistent banner — "Sign the affiliate partnership agreement to start inviting affiliates." — with a CTA that triggers the existing sign flow (`POST /api/dashboard/affiliate-agreement`).
- Invite button + Invite dialog trigger are disabled until signed.
- Task 02 enforces the same gate server-side (403 if not signed), so the UI and API agree.

This gate is lightweight — it's a UI nudge on top of existing infrastructure; do not change the agreement sign flow itself.

### 3. Enhance Invite dialog

Keep existing fields (name, email, message). Add:

- Collapsible **Commission (optional)** section:
  - `default_commission_type` select (`percentage` / `fixed`)
  - `default_commission_value` number input (min 0)
  - Helper text: "You can change this later from the affiliate's detail page."
- Submit button states: disabled `Sending…`, enabled `Send Invitation`.
- Success toast: "Invitation sent to {email}. They have 14 days to accept."
- Do NOT expose the raw accept URL in a toast (previous behavior was to display the tracking slug; raw tokens must never leak).
- 409 toast: show the server's `detail` (e.g., "This email is already invited or active under your account").
- 429 toast: parse `Retry-After` → "Too many invites recently. Try again in N minutes."
- 403 toast (blocked): "This affiliate is blocked platform-wide. Contact support to unblock."

### 4. Status badges — expand lifecycle visibility

`STATUS_COLORS` mapping:

| Status | Badge variant | Meaning |
|---|---|---|
| `pending` | outline (slate) | Invite sent, not yet accepted |
| `active` | default (green) | Accepted + earning |
| `suspended` | secondary (amber) | Diviner paused |
| `blocked` | destructive (red) | Blocked by diviner (junction status) |
| `expired` (derived) | outline (muted) | Pending + most-recent invite `expires_at < NOW()` |
| `account_blocked` (derived) | destructive + lock icon | Canonical `affiliate_accounts.status = 'blocked'` |

`expired` and `account_blocked` are computed in the page from API response fields (Task 06 adds them to the flat response).

### 5. Row actions (shadcn DropdownMenu)

Context-sensitive per status:

| Row state | Actions |
|---|---|
| `pending` | View · Resend invite · Copy accept link · Revoke |
| `pending + expired` | Resend invite (primary) · View · Revoke |
| `active` | View · Suspend · Edit commission |
| `suspended` | View · Reactivate |
| `blocked` (junction) | View |
| `account_blocked` | View only (lock badge visible) |

- **Copy accept link** issues a fresh token via `POST /invite/[inviteId]/resend`, copies the returned URL. Confirmation dialog: "This invalidates the previously-sent invite email. Continue?"
- **Revoke** → `POST /invite/[inviteId]/revoke`. Confirmation dialog.

Helpers in `src/lib/api/affiliates-client.ts` (new):

```ts
export async function resendInvite(inviteId: string): Promise<{ invite_id, accept_url }>;
export async function revokeInvite(inviteId: string): Promise<void>;
export async function reinviteWithNewToken(junctionId: string): Promise<{ accept_url }>;
```

### 6. Detail page updates

In [src/app/dashboard/affiliates/[id]/page.tsx](../../../../src/app/dashboard/affiliates/[id]/page.tsx):

- Read canonical identity (name, email, phone, avatar) from the flattened API response (Task 06 keeps the same top-level keys).
- Add an **Identity** card:
  - Avatar
  - Canonical name
  - Canonical email
  - "Unclaimed" badge if `user_id IS NULL` on the account
  - Read-only blurb: "Partners with N other diviners" (privacy — no names).
- Add an **Invitation** card (only when `status='pending'`):
  - Invited on `{date}`
  - Expires `{relative date}`
  - Resend / Revoke buttons.

### 7. Assignment & commission screens

- [src/app/dashboard/affiliates/assignments/](../../../../src/app/dashboard/affiliates/assignments/): ensure the affiliate column uses the flattened canonical name. No structural changes.
- [src/app/dashboard/affiliates/reports/](../../../../src/app/dashboard/affiliates/reports/): same — just a read-layer swap (API already joined by Task 06).
- [src/app/dashboard/affiliate-commission/[affiliateId]/](../../../../src/app/dashboard/affiliate-commission/[affiliateId]/): `[affiliateId]` URL param is still the `diviner_affiliates.id` (downstream FK target). Identity display must read canonical fields from the joined response.

### 8. Shared component

[src/components/affiliate/marketing-kit.tsx](../../../../src/components/affiliate/marketing-kit.tsx) — used on the affiliate dashboard; may read affiliate fields. Audit in Task 06; if it references `diviner_affiliates.name/email`, switch to account-joined fields.

### 9. Accessibility

- Keyboard navigation: Tab/Shift+Tab cycles; Esc closes dialogs/sheets.
- Visible focus rings via design system focus-visible utilities.
- `aria-label` on every icon-only button.
- Status badges announce their text to screen readers.
- Lighthouse Accessibility ≥ 95 on `/dashboard/affiliates`.
- axe-playwright: 0 critical/serious violations.

### 10. Loading & empty states

- Skeleton stays.
- Empty state copy: "You haven't invited any affiliates yet. Send an invitation to start tracking referrals."
- Partial failure (summary loads but list fails or vice versa): render what succeeded, inline-error the failed section with a Retry button.

## Implementation Steps

1. Delete the Add sheet + state. Adjust header layout — a single Invite Affiliate button remains.
2. Wire the resend / revoke / copy-link actions through the new helpers.
3. Add shadcn `DropdownMenu` per row, action list driven by `getAllowedActions(status, expired, accountBlocked)`.
4. Add the Invitation card on the detail page. New endpoint `GET /api/dashboard/affiliates/[id]/invitation` returning the latest non-revoked invite for the junction. Add in this task (small).
5. Add the Identity card on the detail page.
6. Add the agreement gate — `GET /api/dashboard/affiliate-agreement/status` (existing) → banner + disabled state.
7. Polish Invite dialog — optional commission section, revalidate on blur.
8. Centralize toast copy in `src/lib/toast-messages.ts`.
9. Update `[affiliateId]` pages' identity reads to use the flattened canonical fields.

## Verification Plan

### A. Interaction

- Click Invite → dialog opens → submit with name+email → toast → row appears with `pending` badge.
- Row dropdown → Resend → toast "Invitation resent."
- Row dropdown → Revoke → confirm → toast "Invitation revoked" → row leaves (or moves to revoked section if we keep one — decision: remove from list).
- Detail page shows Identity card with canonical fields + "Unclaimed"/"Claimed" state.

### B. Accessibility

`tests/e2e/affiliate-ui-a11y.spec.ts`:

```ts
import { injectAxe, checkA11y } from 'axe-playwright';
await page.goto('/dashboard/affiliates');
await injectAxe(page);
await checkA11y(page, null, { detailedReport: true });
```

Expect 0 critical/serious violations.

### C. No dead references

```bash
grep -rn "Add Affiliate" src/
grep -rn "handleCreate" src/app/dashboard/affiliates/
grep -rnE 'method:\s*["\'']POST["\''].*dashboard/affiliates["\'']' src/
```

All should return empty (or only historical references Task 06 also catches).

### D. Snapshot / regression

Visual compare `/dashboard/affiliates` before / after. Only Add sheet removal and status-badge refinements should show.

## Edge Cases

1. **Legacy `pending` row with no matching `affiliate_invites` row.** Some of the 14 grandfathered rows may have been in "pending" from the old flow. Action: show a "Legacy invite" badge; "Resend (new token)" action creates a fresh `affiliate_invites` row referencing the existing junction.
2. **Diviner has not signed the affiliate agreement.** Banner + disabled Invite button. No invite goes out until signed.
3. **Rapid double-click on Send Invitation.** Button goes `saving`; server idempotency + rate-limit cover the rest.
4. **Commission input negative.** Block in UI (`min={0}`); server validates too.
5. **Very long affiliate names (256+ chars).** Truncate with CSS; tooltip shows full on hover.
6. **Mobile width < 640px.** Table collapses to stacked cards; dropdown works on touch.
7. **Canonical account `status = 'blocked'`.** Row badge flips to "account_blocked"; all invite/suspend/reactivate actions disabled; only View remains.

## Out of Scope

- Column-set changes beyond the status badge refinements.
- Inline editing of commission from the row.
- Bulk actions (multi-select revoke).
- CSV export of the affiliate list (separate story).
- Changing the affiliate agreement flow itself.
- Any changes to `/advocate/*` UI — entirely different portal.

## Rollback Plan

- Revert the page + detail files (git revert).
- The Add button reappears, but its POST endpoint was deleted in Task 02 — so clicks fail. Rollback must bundle Tasks 02 and 04 together.
