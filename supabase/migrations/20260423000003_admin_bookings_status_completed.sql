-- Extend `admin_bookings.status` to include `completed`, `no_show`,
-- `in_progress` alongside the original `confirmed` / `canceled`.
--
-- Context: tasks/23.04.2026/training/recording-and-redirect-fixes.md
-- After an admin↔trainee Chime session ends (`/api/chime/admin-bookings/end`),
-- the row needs to transition from `confirmed` → `completed`. The prior
-- migration's CHECK constraint rejected that value, so the end route left
-- the status as `confirmed` and logged a TODO. This fixes the CHECK.
--
-- Additive, idempotent. Safe to re-run.

ALTER TABLE public.admin_bookings
  DROP CONSTRAINT IF EXISTS admin_bookings_status_check;

ALTER TABLE public.admin_bookings
  ADD CONSTRAINT admin_bookings_status_check
  CHECK (status IN (
    'confirmed',
    'canceled',
    'completed',
    'no_show',
    'in_progress'
  ));
