# Task 02 - Data Model And Migrations

- Status: Planned
- Owner: Backend
- Depends On: `01-product-decisions-and-existing-system-map.md`

## Purpose

Add durable storage for trainee appointment requirement state, current appointment summary, history, config, and audit details.

## Recommended Tables And Fields

### 1. Extend `trainees`

Add summary fields on `trainees` so admin and dashboard queries stay cheap:

1. `tabbie_appointment_required boolean not null default false`
2. `tabbie_appointment_status text not null default 'not_required'`
3. `tabbie_appointment_completed boolean not null default false`
4. `tabbie_appointment_completed_at timestamptz null`
5. `current_tabbie_appointment_id uuid null`
6. `tabbie_appointment_sync_status text null`
7. `tabbie_appointment_last_synced_at timestamptz null`

Optional if the table already tolerates metadata fields:

1. `tabbie_appointment_completion_source text null`
2. `tabbie_appointment_completion_notes text null`

### 2. Create `trainee_tabbie_appointments`

Suggested fields:

1. `id uuid pk`
2. `trainee_id uuid not null`
3. `user_id uuid not null`
4. `external_booking_id text null`
5. `external_event_id text null`
6. `appointment_type text null`
7. `host_name text null default 'Tabbie'`
8. `scheduled_start_at timestamptz null`
9. `scheduled_end_at timestamptz null`
10. `timezone text null`
11. `status text not null`
12. `booking_source text not null default 'trainee_dashboard_block'`
13. `booking_link_used text null`
14. `rescheduled_from_appointment_id uuid null`
15. `cancelled_at timestamptz null`
16. `completed_at timestamptz null`
17. `no_show_at timestamptz null`
18. `raw_payload jsonb null`
19. `notes text null`
20. `created_at timestamptz not null default now()`
21. `updated_at timestamptz not null default now()`

### 3. Create `trainee_tabbie_appointment_history`

Suggested fields:

1. `id uuid pk`
2. `appointment_id uuid not null`
3. `trainee_id uuid not null`
4. `action_type text not null`
5. `old_status text null`
6. `new_status text null`
7. `changed_by_type text not null`
8. `changed_by_id text null`
9. `change_reason text null`
10. `payload_snapshot jsonb null`
11. `created_at timestamptz not null default now()`

### 4. Create `admin_tabbie_appointment_config`

This should be a focused config table, not a generic content item row.

Suggested fields:

1. `id uuid pk`
2. `feature_key text unique not null`
3. `is_enabled boolean not null default false`
4. `block_title text not null`
5. `block_body text not null`
6. `button_label text not null`
7. `booking_link text not null`
8. `open_mode text not null default 'same_tab'`
9. `highlight_variant text not null default 'info'`
10. `helper_text text null`
11. `success_message text null`
12. `cancelled_message text null`
13. `post_booking_message text null`
14. `display_priority integer not null default 0`
15. `updated_by text null`
16. `updated_at timestamptz not null default now()`
17. `version integer not null default 1`

## Constraints And Indexes

1. Add an index on `trainee_tabbie_appointments(trainee_id, created_at desc)`.
2. Add an index on `trainee_tabbie_appointments(external_booking_id)`.
3. Add an index on `trainee_tabbie_appointments(status)`.
4. Add an index on `trainee_tabbie_appointment_history(appointment_id, created_at desc)`.
5. Add a foreign key from `trainees.current_tabbie_appointment_id` to `trainee_tabbie_appointments.id`.

## Migration Notes

1. Mirror the existing migration style used in `src/data/migrations/`.
2. Keep enum-like status fields as text plus application-level validation unless the repo already uses shared DB enums for similar flows.
3. Backfill existing trainees to:
   - `required = false`
   - `status = not_required`
   - `completed = false`
4. Seed a single default config row for `feature_key = 'trainee_tabbie_post_training_booking'`.

## Audit Integration

If the repo standard is to use `admin_activity_log`, keep using it for:

1. config create/update
2. manual override actions
3. emergency sync or reset actions

## Deliverables

1. migration file(s)
2. typed status constants in app code
3. table access helpers in a shared lib module
4. initial config seed or safe lazy bootstrap behavior
