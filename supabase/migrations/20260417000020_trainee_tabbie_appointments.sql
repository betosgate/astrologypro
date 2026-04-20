-- Task: Trainee Post-Training Tabbie Appointment Booking
-- Adds appointment requirement tracking, appointment records, history, and admin config.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extend trainees with Tabbie appointment summary fields
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE trainees
  ADD COLUMN IF NOT EXISTS tabbie_appointment_required        boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tabbie_appointment_status          text        NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS tabbie_appointment_completed       boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tabbie_appointment_completed_at    timestamptz          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS current_tabbie_appointment_id      uuid                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tabbie_appointment_sync_status     text                 DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tabbie_appointment_last_synced_at  timestamptz          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tabbie_appointment_completion_source text               DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tabbie_appointment_completion_notes  text               DEFAULT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Create trainee_tabbie_appointments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainee_tabbie_appointments (
  id                           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  trainee_id                   uuid        NOT NULL,
  user_id                      uuid        NOT NULL,
  external_booking_id          text                    DEFAULT NULL,
  external_event_id            text                    DEFAULT NULL,
  appointment_type             text                    DEFAULT NULL,
  host_name                    text        NOT NULL DEFAULT 'Tabbie',
  scheduled_start_at           timestamptz             DEFAULT NULL,
  scheduled_end_at             timestamptz             DEFAULT NULL,
  timezone                     text                    DEFAULT NULL,
  status                       text        NOT NULL,
  booking_source               text        NOT NULL DEFAULT 'trainee_dashboard_block',
  booking_link_used            text                    DEFAULT NULL,
  rescheduled_from_appointment_id uuid                 DEFAULT NULL,
  cancelled_at                 timestamptz             DEFAULT NULL,
  completed_at                 timestamptz             DEFAULT NULL,
  no_show_at                   timestamptz             DEFAULT NULL,
  raw_payload                  jsonb                   DEFAULT NULL,
  notes                        text                    DEFAULT NULL,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainee_tabbie_appts_trainee_created
  ON trainee_tabbie_appointments (trainee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trainee_tabbie_appts_external_booking
  ON trainee_tabbie_appointments (external_booking_id)
  WHERE external_booking_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trainee_tabbie_appts_status
  ON trainee_tabbie_appointments (status);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Create trainee_tabbie_appointment_history
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trainee_tabbie_appointment_history (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id    uuid        NOT NULL,
  trainee_id        uuid        NOT NULL,
  action_type       text        NOT NULL,
  old_status        text                    DEFAULT NULL,
  new_status        text                    DEFAULT NULL,
  changed_by_type   text        NOT NULL,  -- 'system' | 'webhook' | 'admin'
  changed_by_id     text                    DEFAULT NULL,
  change_reason     text                    DEFAULT NULL,
  payload_snapshot  jsonb                   DEFAULT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainee_tabbie_history_appt_created
  ON trainee_tabbie_appointment_history (appointment_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_trainee_tabbie_history_trainee
  ON trainee_tabbie_appointment_history (trainee_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Create admin_tabbie_appointment_config
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_tabbie_appointment_config (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key         text        UNIQUE NOT NULL,
  is_enabled          boolean     NOT NULL DEFAULT false,
  block_title         text        NOT NULL DEFAULT '',
  block_body          text        NOT NULL DEFAULT '',
  button_label        text        NOT NULL DEFAULT 'Book Your Appointment',
  booking_link        text        NOT NULL DEFAULT '',
  open_mode           text        NOT NULL DEFAULT 'same_tab',
  highlight_variant   text        NOT NULL DEFAULT 'info',
  helper_text         text                 DEFAULT NULL,
  success_message     text                 DEFAULT NULL,
  cancelled_message   text                 DEFAULT NULL,
  post_booking_message text                DEFAULT NULL,
  display_priority    integer     NOT NULL DEFAULT 0,
  updated_by          text                 DEFAULT NULL,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  version             integer     NOT NULL DEFAULT 1
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Seed default config row
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO admin_tabbie_appointment_config (
  feature_key,
  is_enabled,
  block_title,
  block_body,
  button_label,
  booking_link,
  open_mode,
  highlight_variant,
  helper_text,
  success_message,
  cancelled_message,
  post_booking_message,
  display_priority
) VALUES (
  'trainee_tabbie_post_training_booking',
  false,
  'Book Your Post-Training Appointment',
  'Congratulations on completing your training! The next step is to book a one-on-one appointment with Tabbie to review your progress and discuss next steps.',
  'Book Appointment with Tabbie',
  '',
  'same_tab',
  'info',
  'This appointment is required to complete your trainee journey.',
  'Your appointment is confirmed! We look forward to speaking with you.',
  'Your appointment was cancelled. Please book a new time to continue your journey.',
  'Thank you for booking! You will receive a confirmation shortly.',
  10
) ON CONFLICT (feature_key) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Add FK from trainees.current_tabbie_appointment_id (deferred to avoid FK
--    chicken-and-egg on first insert). Added as NOT VALID so existing NULLs pass.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE trainees
  ADD CONSTRAINT fk_trainees_current_tabbie_appointment
    FOREIGN KEY (current_tabbie_appointment_id)
    REFERENCES trainee_tabbie_appointments (id)
    ON DELETE SET NULL
    NOT VALID;
