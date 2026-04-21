# Shared Chime Number + Per-Booking PIN — Technical Spec (v1)

| Field | Value |
|---|---|
| **Status** | Draft — requirements approved 2026-04-21 |
| **Author** | Debasis (requirements) / Claude (draft) |
| **Project** | AstrologyPro (Next.js 13 + Supabase + AWS Chime) |
| **Feature area** | Phone routing / Chime SMA |
| **Related** | Phone Number Requests feature (migration `20260421000001`) — superseded by this design for the v2 architecture |

---

## 1. Problem Statement

Today the system uses **one dedicated AWS Chime phone number per diviner**. Client calls a diviner's direct number, SMA Lambda looks up the called number in `diviners.chime_phone_number`, and places a simultaneous-ring leg to the diviner's personal phone.

This architecture does not scale:

- Every new diviner requires a new PSTN DID from Chime (~$1/month each).
- Some regions have limited/costly DID supply.
- Operationally the admin has to manage a pool and assign numbers one-at-a-time (see `phone_number_requests` feature).
- Diviner count is hard-coupled to purchased number count.

## 2. Proposed Architecture (v1)

**One shared inbound Chime number for all diviners.** Each booking gets a unique 6-digit PIN. Client calls the shared number, enters PIN, system looks up the booking, routes the call to that diviner using the existing simultaneous-ring flow.

The central number becomes a **routing front door**; the per-diviner numbers stop being the primary routing mechanism but remain operational during migration for backward compatibility.

## 3. Functional Requirements

### 3.1 Call flow (happy path)

1. Client dials the central Chime number.
2. SMA Lambda plays prompt: *"Please enter your 6-digit PIN."*
3. Client enters 6 digits. `ReceiveDigits` auto-submits on the 6th digit — no `#` terminator.
4. Lambda looks up booking by PIN.
5. Booking found and currently active → route via existing simultaneous-ring flow to the diviner's personal phone. Caller-ID shown to diviner = **client's real inbound number** (same as today).
6. Diviner answers → call proceeds normally. Session tracking, minutes, and payout remain unchanged.

### 3.2 Call flow (error paths)

| Condition | Voice message | Terminal action |
|---|---|---|
| Invalid PIN (attempt 1 or 2) | *"Incorrect PIN, please try again."* | Re-prompt |
| Invalid PIN (attempt 3) | *"Maximum attempts reached. Please check your confirmation email and call back."* | Hang up |
| PIN valid, booking in future | *"Your meeting is on [date] at [time]. Please call back at that time."* | Hang up |
| PIN valid, booking already consumed | *"This booking has already been used. Please book a new session at astrologypro.com."* | Hang up |
| PIN valid, booking cancelled | *"This booking has been cancelled. Please book a new session at astrologypro.com."* | Hang up |
| Diviner does not answer (simultaneous-ring timeout) | *"Diviner unavailable, please try again shortly."* | Hang up |

### 3.3 PIN generation

- 6 digits, numeric only, zero-padded (e.g., `003847`).
- Generated at booking creation.
- Uniqueness constraint: **unique among all bookings whose status ∈ {`scheduled`, `pending`, `confirmed`} AND whose scheduled end time is in the future.** Consumed / cancelled / past bookings may recycle PINs.
- On generation: retry with fresh random PIN on collision (DB partial unique index enforces this).
- Maximum 5 regeneration retries; if exceeded, fail the booking creation and raise an alert (should never happen in practice — 1M PIN space vs realistic concurrent active bookings).

### 3.4 PIN delivery to client

PIN must be delivered through **both** channels:

1. **System booking-confirmation email** — add PIN field to the existing confirmation template. Prominent, easy to read.
2. **Google Calendar event** — when the booking creates a Gcal invite for the client, the event description must include:
   - The central phone number to call.
   - The 6-digit PIN.
   - A one-line instruction: *"Call the number above at your booking time and enter the PIN when prompted."*

### 3.5 Admin access to PIN

Admin users must be able to view the PIN for any booking (customer-support use case: client lost their confirmation email). Surface this on the existing admin booking detail view.

### 3.6 Rollout — parallel operation

- Per-diviner numbers continue to work in parallel during migration.
- The rollout gate is data-driven: booking confirmations advertise the central number + PIN when (a) the booking has a `call_pin`, and (b) at least one row in `chime_central_numbers` has `status = 'active'`. If either condition fails, confirmations fall back to the diviner's direct number.
- To turn the shared-number path off globally, retire every row in `chime_central_numbers` (UPDATE … SET status = 'retired') or leave the table empty. No redeploy required.
- PIN generation runs on every new booking regardless, so rows are ready the moment a central number is provisioned.

## 4. Non-Goals (v1 — explicitly deferred)

- ANI-based routing / caller-number lookup.
- Time-window logic beyond the three states (past / active / future).
- Menu for multiple active bookings of the same caller (PIN disambiguates).
- Voicemail on missed calls.
- IVR in languages other than English.
- Admin block-caller / spam list.
- Outbound calling from the central number.

## 5. Data Model Changes

### 5.1 `bookings` table — add columns

| Column | Type | Notes |
|---|---|---|
| `call_pin` | `CHAR(6)` | Nullable until backfill is complete. Numeric only, zero-padded. |
| `call_pin_generated_at` | `TIMESTAMPTZ` | Audit trail. |

### 5.2 Partial unique index

```sql
CREATE UNIQUE INDEX ux_bookings_active_call_pin
  ON bookings (call_pin)
  WHERE call_pin IS NOT NULL
    AND status IN ('scheduled', 'pending', 'confirmed')
    AND scheduled_end_at > now();
```

**Caveat:** `now()` in a partial index predicate is not immutable and therefore not allowed directly in Postgres. Practical alternatives:

- Option A: drop the `scheduled_end_at > now()` check from the index and enforce "no collision with active bookings" in the PIN generator function via an explicit query.
- Option B: include only status in the partial index and rely on application-layer collision check against future/active rows.

**Recommended:** Option B — partial unique index on `status IN ('scheduled','pending','confirmed')` only; application-layer collision check extends uniqueness to the time dimension. Simpler and works.

### 5.3 Migration filename

`supabase/migrations/YYYYMMDDHHMMSS_booking_call_pin.sql` + TS mirror under `src/data/migrations/` + register in `src/lib/db/migrations.ts` (per project convention — see CLAUDE.md §7 and the pattern established by `20260421000001_phone_number_requests`).

### 5.4 PIN backfill

Run in the migration: for every future / active booking with `call_pin IS NULL`, generate and write a PIN. Use a DO block with a retry loop for collisions.

### 5.5 `chime_central_numbers` (new — optional)

A tiny config table holding the shared central number(s). One row for now:

| Column | Type |
|---|---|
| `id` | `UUID` |
| `phone_number` | `VARCHAR(20)` UNIQUE |
| `phone_arn` | `TEXT` |
| `status` | `VARCHAR(20)` — `active` \| `retired` |
| `created_at` | `TIMESTAMPTZ` |

Rationale: avoid hard-coding the central number in Lambda env vars; lets admin swap or run multiple central numbers (e.g., US + UK) from the DB.

## 6. API Changes

### 6.1 `/api/chime/voice/lookup` (existing)

This endpoint is currently called by the SMA Lambda with the **called** number. Extend it to accept a PIN and return the booking-based routing target.

**Request body (new shape):**

```json
{ "pin": "003847" }
```

**Response (200):**

```json
{
  "status": "ok",
  "booking_id": "uuid",
  "diviner_id": "uuid",
  "diviner_phone": "+15551234567",
  "from_phone_number": "+15559998888",
  "booking_state": "active",
  "message": null
}
```

**Response (business error — playable message):**

```json
{
  "status": "not_routable",
  "reason": "booking_future",
  "message": "Your meeting is on April 22 at 5 PM. Please call back at that time."
}
```

Reasons: `invalid_pin`, `booking_future`, `booking_past`, `booking_consumed`, `booking_cancelled`.

The existing lookup-by-called-number behavior stays in place (parallel operation). The Lambda picks which path based on whether it received a PIN or not.

### 6.2 `/api/bookings/:id/pin` (new, admin-only)

GET — returns `{ call_pin, generated_at }` for admin support use case. Guarded by `requireAdmin()`.

### 6.3 Booking creation endpoints (existing)

Wherever bookings are created today, add a call to the PIN generator + collision check. Must be atomic with the booking insert (same transaction or same Supabase insert, using the DB partial unique index to enforce atomicity).

## 7. AWS Chime SMA Lambda Changes

File: `infra/chime-sma-handler/lambda-quick-fix.mjs` (or its next iteration).

### 7.1 New state machine

Today the Lambda handles a single `NEW_INBOUND_CALL` → dial flow. Extend to:

| SMA event | New behavior |
|---|---|
| `NEW_INBOUND_CALL` on central number | `PlayAudioAndGetDigits` prompt — *"Please enter your 6-digit PIN"* — collect 6 digits, auto-submit. |
| `ACTION_SUCCESSFUL` for digit capture | Call `/api/chime/voice/lookup` with PIN → branch on response. |
| `NEW_INBOUND_CALL` on legacy per-diviner number | Existing flow unchanged. |

### 7.2 Action sequence

```
PlayAudioAndGetDigits (PIN prompt)
  → on success with digits:
      lookup API
        → routable: CallAndBridge (existing)
        → not_routable: PlayAudio (reason message) + Hangup
  → on failure / wrong PIN (attempt N<3): PlayAudioAndGetDigits (retry prompt)
  → on failure (attempt 3): PlayAudio (max attempts message) + Hangup
```

### 7.3 Audio assets

Pre-record and upload to S3 (or use Chime's Polly integration):

1. `prompt-enter-pin.wav` — *"Please enter your 6-digit PIN."*
2. `prompt-incorrect-try-again.wav` — *"Incorrect PIN, please try again."*
3. `prompt-max-attempts.wav` — *"Maximum attempts reached. Please check your confirmation email and call back."*
4. `prompt-booking-future.wav` — dynamic via Polly (needs to speak a date/time) OR pre-record a generic *"Your meeting is scheduled for a later time. Please check your confirmation for details."*
5. `prompt-booking-consumed.wav`
6. `prompt-booking-cancelled.wav`
7. `prompt-diviner-unavailable.wav`

**Recommendation:** use Chime's Polly integration (`SpeakAndGetDigits` / `Speak`) for the dynamic date/time prompt so we don't have to pre-record every possible booking time. Static prompts can be pre-recorded for consistency.

### 7.4 AWS SIP Rule

Create a new SIP Rule with `TriggerType: "ToPhoneNumber"` bound to the central number, targeting the same SMA ARN. Existing per-diviner SIP Rules stay in place during migration.

## 8. Google Calendar Integration

Find the existing Gcal integration point (likely `src/lib/google-calendar.ts` or similar — need to confirm). When creating the client-facing Gcal event:

- Append to the event **description** (not the title):

  ```
  ────────────────────────────
  How to join your session
  ────────────────────────────
  Call: [central phone number]
  PIN: 003847

  Dial the number above at your scheduled time
  and enter the 6-digit PIN when prompted.
  ```

- The diviner-facing Gcal event (if any) should **not** contain the PIN.

## 9. UI Changes

### 9.1 Client-facing booking confirmation page

Add a "How to join" section showing central number + PIN.

### 9.2 Client-facing booking confirmation email template

Add a styled block with central number + PIN, with a copy-to-clipboard affordance for the PIN.

### 9.3 Client-facing bookings list (diviner dashboard — no change)

Diviners do **not** need to see the PIN — they just receive the call.

### 9.4 Admin booking detail view

Add a row showing the PIN. Guard behind the admin view (already admin-scoped route). Add a "PIN lost? Resend confirmation" button that re-sends the confirmation email (optional — nice-to-have).

### 9.5 Diviner dashboard Phone tab

No functional change for v1. The `phone_number_requests` feature remains operational during migration. Once central-number routing is fully rolled out, the Phone tab can be simplified in a future task.

## 10. Rollout Plan

1. **Deploy migration** — add `call_pin` columns + partial unique index + `chime_central_numbers` table + backfill for future/active bookings. At this point PINs are being generated on every new booking but `chime_central_numbers` is empty, so confirmations still show the legacy per-diviner number. No user-visible change.
2. **Deploy API + Lambda** — API is dual-mode (handles both legacy and PIN lookups); Lambda is updated to drive the PIN IVR flow. Still no user-visible change because `chime_central_numbers` is empty.
3. **Procure one central Chime number** and insert a row into `chime_central_numbers` with `status = 'active'`. This is the data-driven on-switch: any booking created from this point whose PIN is non-null and whose confirmation email/Gcal runs will start advertising the central number.
4. **Wire SIP Rule** for the central number. (Can be done before step 3 — this is AWS-side and has no effect on app behavior.)
5. **Internal test** — admin creates a test booking, confirms PIN in email + Gcal, calls central number, enters PIN, verifies routing.
6. **Monitor** — call success rate, PIN entry success rate, abandon rate on IVR, diviner complaints.
7. **Kill switch if needed** — `UPDATE chime_central_numbers SET status = 'retired'` reverts every new confirmation to the per-diviner flow instantly, no redeploy.
8. **Cleanup (future task)** — retire per-diviner Chime numbers and the `phone_number_requests` feature once usage is zero for 30 days.

## 11. Test Plan

### 11.1 Unit

- PIN generator: numeric only, 6 digits, leading zeros preserved.
- PIN collision retry: simulate collision, verify retry with fresh PIN.
- Lookup API: each of the 5 response branches (ok, invalid_pin, booking_future, booking_past, booking_consumed, booking_cancelled).

### 11.2 Integration

- Booking creation end-to-end: booking row has PIN, PIN appears in confirmation email payload, Gcal event description contains PIN.
- Admin booking detail view: PIN visible to admin, not visible to non-admin.
- Feature flag off: confirmation still uses per-diviner number, no PIN.

### 11.3 SMA Lambda (harder — real PSTN)

Cannot be unit tested end-to-end. Test harness plan:

- Local: mock Chime SMA events via recorded JSON payloads, verify Lambda's returned action list.
- Staging: call a staging central number from a real phone, verify all 7 flows (happy path + 6 error states).
- Use a test booking with a known PIN for each run.

### 11.4 Load / concurrency

- Simulate 50 concurrent booking creations — verify no PIN collisions leak through.
- Verify partial unique index catches any race that bypasses application-layer check.

### 11.5 Accessibility / UX

- Prompt audio clarity — test on a cheap mobile phone on a bad connection.
- PIN entry timing — confirm the 6-digit auto-submit doesn't fire before a slow user finishes typing.
- Verify DTMF tolerance for phones where digit-on-hold behavior varies.

## 12. Rollback Plan

- **Feature flag off** → booking confirmations revert to per-diviner number advertising. Existing per-diviner numbers still work. Rollback is one config flip, no DB change.
- **Migration rollback** — the new columns are additive. A down migration drops `call_pin`, `call_pin_generated_at`, and the partial unique index. `chime_central_numbers` table drop. No data loss on bookings.
- **SIP Rule rollback** — delete the central-number SIP Rule; per-diviner rules remain.

## 13. Open Questions / Future Work

- Confirm the exact Gcal integration file path and event-creation flow.
- Decide: one global central number, or one per country/region (US, UK, IN)? v1 assumes one global.
- Future: ANI-based routing as a zero-friction fast path (was Option B in requirements discussion — deferred).
- Future: admin block-caller list for abuse handling.
- Future: voicemail on missed calls.
- Future: PIN resend via SMS (currently email-only).

## 14. References

- Current Chime lookup: `src/app/api/chime/voice/lookup/route.ts` (line 32-37 — the `.eq("chime_phone_number", calledNumber).single()` query that this spec supersedes for the central-number path).
- Current Chime SMA Lambda: `infra/chime-sma-handler/lambda-quick-fix.mjs`.
- SIP Rule creation: `src/lib/chime-voice.ts` lines 151-165.
- Simultaneous-ring caller-ID logic: `src/app/api/chime/voice/notify/route.ts` lines 134-162.
- Phone number request feature (being superseded): migration `20260421000001_phone_number_requests`.
- Project engineering standards: `CLAUDE.md` sections 1-32 (hard laws). Particularly relevant here: §5 (reversible migrations), §7 (additive schema), §13 (authorization data-level), §21 (CSRF / secret boundary), §24 (rate limiting on PIN attempts).
