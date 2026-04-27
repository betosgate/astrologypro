# Master — Affiliate Commission v2 (2026-04-24)

- Status: Not Started
- Priority: P0
- Sprint window: open
- Spec: `docs/specs/affiliate-commission-system.md`

## Purpose

Implement Phase 1 of the affiliate commission system per the living spec.

## Non-goals (explicit)

- Stripe Connect auto-split at charge time (Phase 2).
- `social_advocates` integration.
- Admin approval state machine (pending → approved → paid human gate).
- Commission snapshot on campaign as authoritative payout source.

## Deliverables

- **Schema:** rate-history table; three stamp columns on `bookings`;
  admin action log table; FK hardening; drop `suspended` from
  `affiliate_accounts.status` enum; trim campaign status enum to
  `active|paused|archived|expired`; drop `commission_*_snapshot`
  columns; retire System A tables; RLS policies.
- **Backend:** booking creation stamps rate onto booking row; webhook
  reads stamp + re-checks account status at credit time; affiliate
  self-serve campaign create; PATCH assignment with rate-history +
  affiliate notification trigger; admin emergency override endpoints
  (force-revoke, force-archive, reverse) with audit log + dual
  notifications; retire System A; rewrite money-split reader off
  `campaign_conversions`.
- **Frontend:** affiliate campaign-create form; affiliate notification
  preferences page; diviner assignment edit form + per-affiliate report;
  admin reports + click log + conversion log + rate audit + override
  buttons; "link no longer active" static page.
- **Notifications:** 7 kinds (assigned, rate_changed, revoked,
  conversion, reversal, admin.override.assignment_revoked,
  admin.override.campaign_archived) × 2 channels (in-app + email) + per-
  kind per-channel user preferences.
- **Tests:** unit, integration, E2E. Wired into `package.json`.

## Ground rules

See `README.md` → "Hard rules". Non-negotiable.

## Acceptance criteria

- Every child task 01–08 marked completed with its own criteria met.
- `git grep -i "affiliate_commissions\|affiliate_referral_links\|affiliate_clicks\b\|affiliate_payouts\|affiliate_commission_history\|recordAffiliateCommission\|recordSignupAffiliateCommission"` returns zero hits in `src/` after the sprint.
- Spec doc Changelog has entries dated during this sprint.
- Full test suite: `npm run test:affiliate-commission` passes.
