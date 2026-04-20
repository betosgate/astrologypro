# Trainee Post-Training Tabbie Appointment Feature

**Implemented:** 2026-04-17  
**Task spec:** `tasks/17.04.2026/trainee/`  
**Status:** Live in production (migration applied)

---

## What This Feature Does

After a trainee graduates (completes all training lessons), a mandatory appointment with Tabbie appears on their dashboard. The system tracks the full lifecycle — booked, cancelled, rescheduled, completed — and Admin can monitor and override status centrally. All config changes and overrides are audited.

---

## User-Facing Flow

1. Trainee completes all training lessons → `training_status = 'graduated'`
2. Admin enables the feature and sets a booking link (`/admin/tabbie-appointment`)
3. Trainee visits `/trainee` → sees the **Tabbie Appointment Card** above the graduation CTA
4. Trainee clicks CTA → opens the booking link (same tab or new tab, admin-configured)
5. Booking provider sends webhook → internal status updates to `booked`
6. After the appointment occurs → webhook updates status to `completed`
7. Card switches to success state; completion flag is set permanently

---

## Dashboard Card States

| Status | Visual | CTA shown |
|---|---|---|
| `eligible_to_book` | Info (blue) | Book button |
| `booked` | Neutral (gray) | Appointment date/time shown |
| `cancelled` / `no_show` | Warning (amber) | Book again button |
| `completed` / `manually_completed` | Success (green) | None |

Card is hidden when:
- Training is not yet completed
- Feature is disabled by Admin
- Config is enabled but booking link is missing or invalid

---

## Admin Pages

### Config — `/admin/tabbie-appointment`
Accessible from the **Training** section of the admin sidebar.

Fields:
- **Feature toggle** — enables/disables the block for all trainees
- **Title / Body / Helper text** — content shown on the card
- **Button label** — CTA text
- **Booking link** — full URL to the booking provider (Calendly, etc.)
- **Open mode** — same tab or new tab
- **Card style** — info / neutral / warning / success
- **State messages** — separate text for booked, cancelled, completed states

Every save is versioned and audited to `admin_activity_log`.

### Monitor — `/admin/trainee-tabbie-appointments`
Accessible from the **Training** section of the admin sidebar.

- Paginated table of all trainees with appointment status
- Filter by status, search by name/username
- **Override modal** — mark completed, reset completed, mark cancelled (mandatory reason required)
- **Retry Sync** button appears when sync status is `error`
- All overrides audited to `admin_activity_log`

---

## Database Changes

### New columns on `trainees`
```
tabbie_appointment_required        boolean   default false
tabbie_appointment_status          text      default 'not_required'
tabbie_appointment_completed       boolean   default false
tabbie_appointment_completed_at    timestamptz
current_tabbie_appointment_id      uuid (FK → trainee_tabbie_appointments)
tabbie_appointment_sync_status     text
tabbie_appointment_last_synced_at  timestamptz
tabbie_appointment_completion_source text
tabbie_appointment_completion_notes  text
```

### New tables
- **`trainee_tabbie_appointments`** — one row per booking attempt, preserves full history
- **`trainee_tabbie_appointment_history`** — audit trail for every status change
- **`admin_tabbie_appointment_config`** — single config row, feature-keyed

Migration file: `supabase/migrations/20260417000020_trainee_tabbie_appointments.sql`  
Applied via Supabase Management API on 2026-04-17.

---

## Appointment Status Values

```
not_required         — training not yet complete or feature disabled
eligible_to_book     — ready to book, no active appointment
booking_in_progress  — CTA clicked, booking flow opened
booked               — booking confirmed by provider
cancelled            — cancelled; trainee must rebook
rescheduled          — history entry; current record returns to booked
completed            — appointment completed (authoritative)
no_show              — trainee did not attend; requirement still open
failed               — sync/system error
manually_completed   — admin forced completion (with audited reason)
manually_cancelled   — admin forced cancellation (with audited reason)
```

---

## API Reference

### Trainee APIs
| Method | Route | Description |
|---|---|---|
| GET | `/api/trainee/tabbie-appointment` | Dashboard state for authenticated trainee |

### Webhook
| Method | Route | Description |
|---|---|---|
| POST | `/api/bookings/tabbie/webhook` | Booking provider event receiver |

**Supported events:**
- `invitee.created` → `booked`
- `invitee.canceled` → `cancelled`
- `provider_rescheduled` → `booked` (history records `rescheduled`)
- `provider_completed` → `completed`
- `provider_no_show` → `no_show`

**Authentication:** Set `TABBIE_WEBHOOK_SECRET` env var; webhook must send `x-tabbie-signature` header.

**Payload shape:**
```json
{
  "event": "invitee.created",
  "trainee_id": "uuid",           // or use user_email as fallback
  "user_email": "trainee@example.com",
  "external_booking_id": "abc123",
  "scheduled_start_at": "2026-05-01T14:00:00Z",
  "scheduled_end_at": "2026-05-01T15:00:00Z",
  "timezone": "America/New_York",
  "is_reschedule": false
}
```

### Admin APIs
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/tabbie-appointment-config` | Load config |
| PUT | `/api/admin/tabbie-appointment-config` | Save config |
| GET | `/api/admin/tabbie-appointments` | Monitoring list (`?status=&search=&page=&limit=`) |
| GET | `/api/admin/tabbie-appointments/[traineeId]` | Detail + appointments + history |
| POST | `/api/admin/tabbie-appointments/[traineeId]/override` | Manual override |
| POST | `/api/admin/tabbie-appointments/[traineeId]/sync` | Reset sync error |

**Override body:**
```json
{
  "action": "mark_completed",   // mark_completed | reset_completed | mark_cancelled
  "reason": "Confirmed by mentor verbally"
}
```

---

## Key Files

| File | Purpose |
|---|---|
| `src/lib/trainee-tabbie-appointments.ts` | Central service — eligibility, state, sync, overrides |
| `src/components/trainee/tabbie-appointment-card.tsx` | Dashboard card component |
| `src/app/trainee/page.tsx` | Trainee dashboard (integrated) |
| `src/app/admin/tabbie-appointment/page.tsx` | Admin config UI |
| `src/app/admin/trainee-tabbie-appointments/page.tsx` | Admin monitoring UI |
| `src/components/admin/admin-sidebar.tsx` | Nav links added under Training |
| `supabase/migrations/20260417000020_trainee_tabbie_appointments.sql` | DB migration |

---

## Go-Live Checklist

- [x] Migration applied to production Supabase
- [x] Code deployed (pushed to master → Vercel auto-deploys)
- [x] Admin nav links wired in sidebar
- [ ] Set `TABBIE_WEBHOOK_SECRET` in Vercel environment variables
- [ ] Configure booking provider webhook URL: `https://astrologypro.com/api/bookings/tabbie/webhook`
- [ ] Go to `/admin/tabbie-appointment`, paste Tabbie's booking link, enable feature
- [ ] Test: graduate a test trainee and verify card appears on `/trainee`
- [ ] Test: simulate webhook `invitee.created` and verify status → `booked`
- [ ] Test: simulate webhook `provider_completed` and verify completion flag

---

## Business Rules (Encoded in Code)

- Booking ≠ completion. Only a `completed` or `manually_completed` status sets the done flag.
- Cancelled/no-show trainees remain required to rebook.
- Admin overrides require a mandatory written reason — enforced server-side.
- Training reset by admin → `tabbie_appointment_required = false`, card hidden, history preserved.
- Multiple active bookings → newest is treated as current; duplicates flagged for admin review.
- Config missing or booking link invalid → block suppressed, no broken CTA shown.
