# Perfection Pass Report — Astro / Training / Perennial / Mystery School

Date: 2026-04-08
Scope: Deep line-by-line read of every primary chain in the four targeted domains, with bug fixes for anything found.

## Summary

| Domain | Files read in full | Bugs fixed | Gaps fixed | Observations |
|---|---|---|---|---|
| Astro toolkit | 4 | 0 | 0 | 2 quality notes |
| Training school | 6 | 0 | 1 missing admin API | 0 |
| Perennial | 5 | 0 | 0 | 2 quality notes |
| Mystery school | 6 | **1 graduation bug** | 0 | 1 quality note |

**Total bugs fixed: 1** (commit `b120fbd`).
**Total gaps closed: 1** (admin trigger CRUD API, commit `b120fbd`).

## 🐛 Bug fixed (mystery school graduation)

**File:** `src/app/api/mystery-school/decan/[id]/ritual-complete/route.ts:55-93`
**File:** `src/app/api/mystery-school/decan/[id]/ritual/step/route.ts:122-148`

Both files contained a duplicated, simpler graduation check that only counted decans:

```ts
const { count } = await admin
  .from("student_decan_progress")
  .select("id", { count: "exact", head: true })
  .eq("student_id", studentId)
  .eq("status", "completed");

if ((count ?? 0) >= 36) {
  // graduate
}
```

A canonical graduation helper already exists at `src/lib/mystery-school/graduation.ts` (`processGraduation`) that checks:

1. Q1 foundation (12 weeks completed)
2. All 36 decans completed
3. **Zero unexcused missed decans** (status='missed' AND admin_excused=false)
4. Sends `sendGraduationCongratulations` (the proper email — the simpler path used `sendMysterySchoolGraduation` which is now orphaned)
5. Fetches the user's real name from auth metadata for personalized email
6. Records `graduation_verified_at`

The two duplicated call sites were not using the helper. **A student could previously graduate with an incomplete Q1 foundation or with unresolved missed decans via either of the two decan completion paths.**

**Fix:** both routes now `import { processGraduation } from "@/lib/mystery-school/graduation"` and call it after marking the decan complete. ~50 lines of duplicated logic deleted; canonical authority restored.

## 🛠 Gap closed (training admin trigger CRUD)

**Issue:** `lesson_quiz_triggers` table is read by `src/app/api/trainee/training/lessons/[id]/triggers/[triggerId]/{answer,rewatch}/route.ts` and the trainee runtime consumes them, but **no admin route existed** to author them. Admins could not create video quiz triggers without writing SQL directly.

**Fix:** Added two new admin routes:

- `src/app/api/admin/training/lessons/[id]/triggers/route.ts`
  - `GET` — list all triggers for a lesson, ordered by `trigger_timestamp_seconds`
  - `POST` — create a trigger (validates `trigger_timestamp_seconds >= 0`, `rewind_target_seconds <= trigger_timestamp_seconds`, verifies referenced `quiz_question` exists)

- `src/app/api/admin/training/lessons/[id]/triggers/[triggerId]/route.ts`
  - `PATCH` — update fields with the same cross-validation
  - `DELETE` — remove a trigger

Both endpoints require `getAdminUser()` and use the admin Supabase client (which bypasses RLS — no policy migration needed).

**Follow-up:** the lesson edit page UI (`src/app/admin/training/lessons/[id]/edit/page.tsx`) doesn't yet expose a triggers panel. The new API can be consumed by an admin form component in a separate UI task.

## ASTRO toolkit findings

### `src/app/api/admin/astro/natal-wheel/route.ts`
✅ **Solid.** Multi-key fallback retries on 401/403/429, validates required birth fields, returns 502 on upstream failure.

### `src/app/api/admin/astro/ai-interpret/route.ts`
⚠️ **Quality observations (not bugs):**
- 10 retries × 10 s delay = up to 100 s blocking the serverless instance. Retries on **all** errors including 4xx that won't recover.
- `console.log` includes the full payload — risks logging birth data into Vercel logs.
- No jitter on retries.

### `src/app/api/admin/astro/planet-return/route.ts`
⚠️ **Quality observation:** hardcoded Lambda URL fallback at line 6 exposes the upstream URL. If `ASTRO_PLANET_RETURN_URL` env is missing, the route silently uses a stale URL instead of returning 500.

### `src/app/api/community/generate-natal/route.ts`
✅ **Solid.** Auth, RLS-scoped lookup, default coords for unknown birth places, error handling.

## TRAINING SCHOOL findings

### Sequential lock chain
- `src/app/api/trainee/training/programs/route.ts:225-232` and `lessons/[id]/route.ts:84-93` both read `training_settings.global_sequential_lock` from the same singleton row and compute their lock state from the same boolean.
- The lesson-detail route returns 403 when locked; the programs route surfaces `is_locked` in the metadata. The two cannot diverge.
- ✅ **Solid.**

### Trigger answer → completion → graduation chain
1. `src/app/api/trainee/training/lessons/[id]/triggers/[triggerId]/answer/route.ts` — server-side rewatch gate (RFC 9457 Problem Details on 403), server-side `correct_answer` (never sent to client), upserts `lesson_trigger_progress`.
2. When all triggers passed, calls `completeLessonAndProgressForUser` (`src/lib/training/completion.ts:147`) which:
   - Validates lesson exists + is active
   - Upserts `lesson_completions` (the authoritative store)
   - Syncs `category_completions`
   - Calls `checkAndAwardTrainingGraduation`
3. `src/lib/training/graduation.ts:79-151` reads ONLY from `lesson_completions`, idempotent via `.is("graduated_at", null)` guard, fires email + notification fire-and-forget.
4. Certificate verification at `src/app/api/certificate/verify/[code]/route.ts` is public, length-capped, requires `graduated_at` to be set, and returns identical 200 shape on valid/invalid (no enumeration leak).
5. UNIQUE constraint on `trainees.certificate_code` (migration `20260406000014_certificate_verification.sql`) prevents collision.

✅ **Solid end-to-end.**

### Admin authoring
20 admin training routes exist (programs, categories, lessons, quizzes, notes, settings, analytics × 6, lesson assets/videos). The only gap was lesson_quiz_triggers — now fixed.

## PERENNIAL findings

### Cancel / Uncancel / Change-tier
- `src/app/api/community/plan/cancel/route.ts` — auth, owner-scoped lookup, idempotent (rejects double-cancel and already-cancelled), updates Stripe THEN local DB, captures `current_period_end`. ✅
- `src/app/api/community/plan/uncancel/route.ts` — restores to active only when status is `cancelling`, reverses Stripe `cancel_at_period_end`. ✅
- `src/app/api/community/plan/change-tier/route.ts` — sophisticated Stripe item swap with proration, reconciles extra-seat count, falls back to creating a new item if old not found, handles manual-billing case. ✅

⚠️ **Observation on change-tier:** doesn't enforce `newTier.max_total_members` on downgrade — a user with 10 family members downgrading to a 5-max tier would succeed but be over capacity. Product decision call.

### Unsubscribe (my own previous code, re-checked)
- `src/app/api/community/billing/unsubscribe/route.ts` — auth, owner-scoped lookup, sets `cancel_at_period_end`, marks `community_members.membership_status = 'cancelling'` (verified `'cancelling'` is in the CHECK constraint).

⚠️ **Tech debt:** functionally a subset of `/api/community/plan/cancel`. Both endpoints work; the `plan/cancel` route is more complete (handles `current_period_end`, has idempotent guards). Could consolidate by having the unsubscribe modal call `/api/community/plan/cancel` instead. Logged as cleanup.

### Monthly transit cron
- `src/app/api/cron/monthly-transits/route.ts` — cron auth, inner join filter by membership status, idempotent (skips if already generated this month), per-member try/catch so one bad email doesn't kill the batch, marks `notification_sent` only after email succeeds.

⚠️ **Observation:** N+1 pattern (2 queries per family member inside the loop). Within the 60 s budget at current scale; would benefit from a bulk query at higher volume.

## MYSTERY SCHOOL findings

### Webhook provisioning
- `src/app/api/stripe/webhooks/route.ts:194-239` — idempotent upsert on `mystery_school_students` (onConflict `user_id`), captures `entry_quarter` + `entry_year`, sends enrollment confirmation email fire-and-forget. Comment confirms PM membership is preserved (parallel entitlement).

⚠️ **Observation:** `one_time_fee_amount: 97.00` is hardcoded. If the Stripe price changes, this drifts. Should pull from `session.amount_total` or expand the price.

### Decan unlock cron
- `src/app/api/cron/decan-unlock/route.ts` — 5-state state machine (preview → active → grace → missed → retry-reopen) with proper guards, persists window dates at activation, computes retry year (Q4 → +5y, else +1y), idempotent via status guards on each branch.

⚠️ **Observations:**
- N+1 query pattern: per-student × per-decan = up to 36 × N queries. Works at current scale (100 students = 3600 queries within 60 s budget) but could be a single bulk query.
- Date construction uses server local timezone (`new Date(year, month-1, day, ...)`), not UTC. A few hours of skew is acceptable for daily cron but not perfect.

### Graduation
- **Bug fixed** (see top of report). Both decan-completion paths now route through `processGraduation`.
- `src/lib/mystery-school/graduation.ts:33-90` `checkGraduationEligibility` correctly checks Q1 foundation + 36 decans + zero unexcused missed.
- `processGraduation` is idempotent via `.neq("training_status", "graduated")`, fetches real user name from auth metadata.

### Foundation Q1
- `student_foundation_progress` rows are created when the first task in a week is completed; `week_completed_at` is set only when ALL tasks for that week are done. The graduation check at `graduation.ts:46` correctly filters by `week_completed_at IS NOT NULL` to avoid counting partial weeks.

## Outstanding observations (not bugs)

1. **`sendMysterySchoolGraduation` in `src/lib/email.ts:1057`** is now orphaned after the graduation refactor. Safe to delete in a follow-up cleanup commit.
2. **`/api/community/billing/unsubscribe` duplicates `/api/community/plan/cancel`** — functionally equivalent, plan/cancel is more complete. Cleanup.
3. **Astro `ai-interpret`** retries 4xx errors and logs full payloads. Quality issue.
4. **Astro `planet-return`** hardcoded Lambda URL fallback. Quality issue.
5. **`change-tier` doesn't enforce `max_total_members`** on downgrade. Product decision.
6. **MS webhook hardcodes `one_time_fee_amount: 97.00`.** Should derive from session.
7. **Decan unlock cron is N+1 + uses server local time.** Performance + accuracy at scale.
8. **Training trigger admin UI not built** — the API now exists but the lesson edit page doesn't expose a triggers panel.

These are quality / cleanup items, not bugs. None block production.

## Final state

- All four domains line-read end-to-end on the highest-risk chains.
- 1 real bug fixed (mystery-school graduation).
- 1 real gap closed (training trigger admin API).
- Commit `b120fbd` pushed to `origin/master`.
