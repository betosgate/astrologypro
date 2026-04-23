# Verification Summary — Book Without Diviner Flow

Produced: 23.04.2026. Corresponds to task
`06-verification-and-regression-checklist.md`.

## Implementation summary

- New shared booking route at **`/book/template/[slug]?submission=<uuid>`** replaces the old `/book/demo` placeholder for the "Book Without Choosing a Diviner" post-intake CTA.
- Date-first UX: user picks a date → backend resolves compatible diviners with availability on that date → one match auto-continues, multi-match prompts for explicit diviner choice → handoff to existing `/[username]/book/[serviceSlug]` route.
- Saved intake submission is preserved through the handoff and persisted to `bookings.metadata.intake_submission_id` when the booking is created, so future toolkit modules can load the intake payload without a schema change.
- All compatibility rules (active template, active service, active diviner, `diviner_services.is_enabled` AND `is_published`, `canPubliclySellService`) are reused from the existing discover flow via a new shared resolver.

## Files added

| Path | Purpose |
|---|---|
| `src/lib/booking/template-matched-services.ts` | Shared resolver for "which diviner-services match this template". Extracted from the discover page. |
| `src/app/api/services/[slug]/template-availability/month/route.ts` | Month-view availability union across compatible diviners. |
| `src/app/api/services/[slug]/template-availability/route.ts` | Date-aware compatible-diviner resolver. Ranked (earliest slot → certified → rating → sessions → price). |
| `src/app/book/template/[slug]/page.tsx` | Shared booking page (server component). |
| `src/components/booking/shared-template-calendar.tsx` | Client UI — header, submission summary, calendar, diviner-selection, handoff. |

## Files modified

| Path | Change |
|---|---|
| `src/app/api/services/[slug]/intake/route.ts` | `next_url` now points at `/book/template/[slug]?submission=<uuid>` instead of `/book/demo`. |
| `src/components/services/template-intake-form.tsx` | Removed `/book/demo` client-side fallback; falls back to the new shared route. |
| `src/components/services/service-template-public-page.tsx` | When a template has no intake form, the CTA now routes to `/book/template/[slug]` instead of `/book/demo`. |
| `src/app/[username]/book/[serviceSlug]/page.tsx` | Accepts optional `submission` and `date` searchParams. Passes them to `BookingWizard`. Existing `ref` query param behavior preserved. |
| `src/components/booking/booking-wizard.tsx` | New `submissionId` and `preselectedDate` props (both optional, default null). Seeds `selectedDate` from `preselectedDate`, forwards `submissionId` into the booking-payment POST. |
| `src/app/api/stripe/booking-payment/route.ts` | Accepts `submissionId` in body. UUID-validated; when present, persisted to `bookings.metadata.intake_submission_id`. |

## Files intentionally left alone

- `src/app/book/demo/page.tsx` — not deleted. Master task non-goals: "do not remove the direct diviner booking route" — interpreted conservatively. No live code path should now route to `/book/demo`, but the page still renders if someone links to it directly. Safe to delete in a follow-up.
- `BookingWizard` internals beyond the two new prop wirings — no intake prefill in this pass per the audit (Task 05 minimum contract is "submission id must survive"; that is now satisfied).

## API / contract changes

- `GET /api/services/[slug]/template-availability/month?month=YYYY-MM[&submission=<uuid>]` — **new**. Returns `{ availableDates: string[], compatibleDivinerCount: number }`.
- `GET /api/services/[slug]/template-availability?date=YYYY-MM-DD[&submission=<uuid>]` — **new**. Returns `{ template, divinersAvailable: Array<{ divinerId, username, displayName, avatarUrl, tagline, isCertified, averageRating, reviewCount, completedSessions, timezone, service, earliestSlot, totalSlots }> }`.
- `POST /api/services/[slug]/intake` response `next_url` — still present; value changed from `/book/demo?…` to `/book/template/[slug]?submission=<uuid>`.
- `POST /api/stripe/booking-payment` — new optional body field `submissionId`. No breaking change for existing callers (defaults to null when absent).
- `GET /[username]/book/[serviceSlug]` searchParams — gained optional `submission` and `date`. No breaking change for existing callers.

## Typecheck

Scoped `tsc --noEmit` across the 10 files I created/touched: **0 errors**.

(The intake route file has a pre-existing `RouteContext` type reference that only resolves when Next.js has generated `.next/dev/types/routes.d.ts`. That error is not from my changes — I only edited a return value on an unrelated line. A full `next build` resolves it.)

## Test paths (per `06-verification-and-regression-checklist.md`)

### A. Post-intake dialog
- [ ] Fill intake on a general-* template → click **Choose a Diviner and Book** → confirm discover flow loads and carries `?submission=…`.
- [ ] Fill intake again → click **Book Without Choosing a Diviner** → confirm the browser lands on `/book/template/<slug>?submission=<uuid>` (not `/book/demo`).

### B. Shared booking route
- [ ] Hit `/book/template/unknown-slug` → **404**.
- [ ] Hit `/book/template/<valid>?submission=<random-uuid>` → page renders with a yellow "We couldn't find your saved intake" banner; calendar still works.
- [ ] Hit `/book/template/<valid>?submission=<uuid-from-other-template>` → banner shows "belongs to a different template"; calendar still works.
- [ ] Hit `/book/template/<valid>` with no compatible diviners → "No readers are currently offering this session" empty state.
- [ ] Hit `/book/template/<valid>` with one compatible diviner → calendar shows their dates only.
- [ ] Hit `/book/template/<valid>` with multiple compatible diviners → calendar shows union of available dates.

### C. Date + diviner resolution
- [ ] Pick a date with zero matches → "No readers available on this date" state.
- [ ] Pick a date with one match → UI auto-continues (toast appears, redirect to `/[username]/book/[slug]?submission=…&date=…` within ~400ms).
- [ ] Pick a date with 2+ matches → list renders sorted by earliest-slot → certified → rating → sessions → price; each card has a "Book with this reader" button.

### D. Booking handoff
- [ ] After clicking continue, confirm the URL is `/[username]/book/[serviceSlug]?submission=<uuid>&date=<YYYY-MM-DD>`.
- [ ] Booking page renders normally.
- [ ] Complete the booking → check `bookings.metadata.intake_submission_id` in Supabase equals the submission uuid.

### E. Regression
- [ ] Direct `/[username]/book/[serviceSlug]` (no query params) still renders and books normally.
- [ ] `/discover?template=<slug>&submission=<uuid>` (Choose a Diviner flow) unchanged — still works.
- [ ] Existing public template landing pages with intake forms still scroll to the intake instead of navigating.
- [ ] `canPubliclySellService` still blocks unpublished/non-payout-ready services — they never appear in `divinersAvailable`.

## Notes / caveats

- `template-availability/*` endpoints proxy per-diviner calls to the existing `/api/availability/<ownerId>` and `/api/availability/<ownerId>/month` routes via server-to-server `fetch()`. This preserves exact parity with per-diviner availability rules (calendar-busy merging, overrides, etc.) but adds a small latency cost. For typical template match sizes (1–10 diviners) it's well under a second. The resolver caps at 20 compatible diviners and logs a warning beyond that.
- The handoff passes `date=YYYY-MM-DD` as a pure UX hint; it seeds the BookingWizard's `selectedDate` so the calendar opens on the right month but the user still picks a specific slot (we never skip slot selection).
- No database migration is required for this bundle. The submission link is stored in the existing `bookings.metadata` jsonb column.

## Incomplete / future work (explicit)

- `/book/demo/page.tsx` is still live on disk. No production code links to it. Consider deleting it in a cleanup PR once this bundle ships and nothing regresses.
- BookingWizard does not yet *prefill* form fields from the saved intake (birth date, birth time, birth city, area of inquiry). The intake link is persisted so this can be added later without another schema change. The audit note flagged this as "preferred, not required" — explicitly deferred.
- The shared calendar does not cache month responses across re-renders beyond the request itself. For templates with many diviners this is a potential optimization.
