import { MIGRATION_SQL as MIG_20260408000106 } from "@/data/migrations/20260408000106_astro_decan_new_infos";
import { MIGRATION_SQL as MIG_20260408000107 } from "@/data/migrations/20260408000107_astro_system_settings";
import { MIGRATION_SQL as MIG_20260408000108 } from "@/data/migrations/20260408000108_owner_id_additive";
import { MIGRATION_SQL as MIG_20260408000109 } from "@/data/migrations/20260408000109_calendar_connections";
import { MIGRATION_SQL as MIG_20260408000110 } from "@/data/migrations/20260408000110_backfill_calendar_connections";
import { MIGRATION_SQL as MIG_20260408000111 } from "@/data/migrations/20260408000111_quiz_question_remediation";
import { MIGRATION_SQL as MIG_20260408000112 } from "@/data/migrations/20260408000112_global_pricing";
import { MIGRATION_SQL as MIG_20260408000113 } from "@/data/migrations/20260408000113_trainees_payment_fields";
import { MIGRATION_SQL as MIG_20260408000114 } from "@/data/migrations/20260408000114_drop_unique_astro_system_settings";
import { MIGRATION_SQL as MIG_20260408000115 } from "@/data/migrations/20260408000115_pending_perennial_signups";
import { MIGRATION_SQL as MIG_20260408000116 } from "@/data/migrations/20260408000116_training_notes_allow_quiz";
import { MIGRATION_SQL as MIG_20260409000117 } from "@/data/migrations/20260409000117_availability_template_service_scope";
import { MIGRATION_SQL as MIG_20260409000118 } from "@/data/migrations/20260409000118_calendar_provider_credentials";
import { MIGRATION_SQL as MIG_20260409000119 } from "@/data/migrations/20260409000119_pricing_plans";
import { MIGRATION_SQL as MIG_20260409000120 } from "@/data/migrations/20260409000120_pricing_plan_custom_fields";
import { MIGRATION_SQL as MIG_20260409000121 } from "@/data/migrations/20260409000121_seed_pricing_plans";
import { MIGRATION_SQL as MIG_20260409000122 } from "@/data/migrations/20260409000122_drop_item_price_currency";
import { MIGRATION_SQL as MIG_20260409000123 } from "@/data/migrations/20260409000123_stripe_product_price_fields";
import { MIGRATION_SQL as MIG_20260410000001 } from "@/data/migrations/20260410000001_increase_training_video_storage_limit";
import { MIGRATION_SQL as MIG_20260410000124 } from "@/data/migrations/20260410000124_pricing_onetime_recurring_html";
import { MIGRATION_SQL as MIG_20260410000125 } from "@/data/migrations/20260410000125_pricing_recurring_interval";
import { MIGRATION_SQL as MIG_20260413000012 } from "@/data/migrations/20260413000012_community_onboarding_completed";
import { MIGRATION_SQL as MIG_20260413000006 } from "@/data/migrations/20260413000006_services_pricing_item_key";
import { MIGRATION_SQL as MIG_20260413000008 } from "@/data/migrations/20260413000008_services_platform_fee_percent";
import { MIGRATION_SQL as MIG_20260413000140 } from "@/data/migrations/20260413000140_media_albums";
import { MIGRATION_SQL as MIG_20260413000126 } from "@/data/migrations/20260413000126_training_quiz_question_progress";
import { MIGRATION_SQL as MIG_20260414000002 } from "@/data/migrations/20260414000002_booking_session_started_at";
import { MIGRATION_SQL as MIG_20260414000026 } from "@/data/migrations/20260414000026_chime_sip_rule_id";
import { MIGRATION_SQL as MIG_20260415000001 } from "@/data/migrations/20260415000001_chime_pipeline_id";
import { MIGRATION_SQL as MIG_20260416000001 } from "@/data/migrations/20260416000001_phone_call_notifications";
import { MIGRATION_SQL as MIG_20260416000002 } from "@/data/migrations/20260416000002_phone_sessions_status_expand";
import { MIGRATION_SQL as MIG_20260416000003 } from "@/data/migrations/20260416000003_add_chat_transcript";
import { MIGRATION_SQL as MIG_20260416000004 } from "@/data/migrations/20260416000004_push_subscriptions";
import { MIGRATION_SQL as MIG_20260416000005 } from "@/data/migrations/20260416000005_simultaneous_ring";

/**
 * Allowlisted migrations that the admin migration runner can execute.
 *
 * Each migration is a TypeScript module under `src/data/migrations/` that
 * exports a `MIGRATION_SQL` template literal mirroring a real
 * `supabase/migrations/*.sql` file. The runner endpoint
 * `POST /api/admin/db/migrate` only accepts `migration_id` values that
 * exist in this map — the request body cannot supply arbitrary SQL.
 *
 * To add a new migration:
 *   1. Create `supabase/migrations/<id>.sql` (the canonical source).
 *   2. Mirror it as `src/data/migrations/<id>.ts` exporting `MIGRATION_SQL`.
 *   3. Add an entry to `MIGRATIONS` below.
 *   4. Apply locally via the admin UI at `/admin/db/migrations`.
 */
export interface MigrationDescriptor {
  id: string;
  title: string;
  description: string;
  /** SHA-style sortable id from the canonical .sql filename */
  sortKey: string;
  sql: string;
}

export const MIGRATIONS: Record<string, MigrationDescriptor> = {
  "20260408000106_astro_decan_new_infos": {
    id: "20260408000106_astro_decan_new_infos",
    title: "Astro Decan New Infos",
    description:
      "Creates astro_decan_new_infos table (planet/sign/decan reference content with tarot + Greek daemon mapping) and seeds 36 records ported from the legacy MongoDB collection. Idempotent: ON CONFLICT (mongo_id) DO NOTHING on every insert.",
    sortKey: "20260408000106",
    sql: MIG_20260408000106,
  },
  "20260408000107_astro_system_settings": {
    id: "20260408000107_astro_system_settings",
    title: "Astro System Settings (centralised credentials + URLs)",
    description:
      "Creates astro_system_settings table with three types: ASTROLOGY_API (key+secret pairs), FREEASTROLOGY_API (key only), SYSTEM_CONFIG (named URLs/values like ASTRO_AI_API_URL). Backfills existing astrology_api_keys rows as ASTROLOGY_API entries. Additive — does not drop the old table. Idempotent via UNIQUE (type, key_name).",
    sortKey: "20260408000107",
    sql: MIG_20260408000107,
  },
  "20260408000108_owner_id_additive": {
    id: "20260408000108_owner_id_additive",
    title: "diviner_id → owner_id additive (STAGE 1 of 3)",
    description:
      "Stage 1 of the additive rename. Adds owner_id UUID column to bookings, services, availability_slots, availability_overrides, availability_templates, booking_holds, client_diviners (IF NOT EXISTS), backfills from diviner_id, indexes the new column, and attaches a BEFORE INSERT OR UPDATE trigger that keeps both columns in sync. Adds a parallel UNIQUE (client_id, owner_id) on client_diviners. SAFE: nothing is dropped — every existing query that reads or writes diviner_id keeps working. Stage 2 (code rename PR) and stage 3 (drop diviner_id) are separate, NOT in this migration.",
    sortKey: "20260408000108",
    sql: MIG_20260408000108,
  },
  "20260408000109_calendar_connections": {
    id: "20260408000109_calendar_connections",
    title: "calendar_connections (normalized OAuth token store)",
    description:
      "Creates calendar_connections table — normalized OAuth calendar token store keyed on (user_id, provider), with owner_id alongside for the diviner_id → owner_id rename. Replaces diviners.google_calendar_token / outlook_calendar_token JSONB columns. Hardened beyond the original spec: RLS enabled with service_role + own-row policies (no cross-user token reads possible), updated_at trigger, indexes on user_id and owner_id, CHECK constraint on provider. Additive — does not touch the existing diviners columns. Should run after 20260408000108 (owner_id additive).",
    sortKey: "20260408000109",
    sql: MIG_20260408000109,
  },
  "20260408000110_backfill_calendar_connections": {
    id: "20260408000110_backfill_calendar_connections",
    title: "Backfill calendar_connections from diviners JSONB",
    description:
      "One-shot backfill. Reads every existing diviners.google_calendar_token (extracted from JSONB scalar string) and diviners.outlook_calendar_token (parsed as JSONB object) and inserts a normalized row into calendar_connections. owner_id ← diviners.id; user_id ← diviners.user_id. Idempotent via ON CONFLICT (user_id, provider) DO NOTHING — re-running is safe. Source columns are NOT touched. Run AFTER 20260408000109.",
    sortKey: "20260408000110",
    sql: MIG_20260408000110,
  },
  "20260408000111_quiz_question_remediation": {
    id: "20260408000111_quiz_question_remediation",
    title: "Quiz question remediation metadata (Module 04)",
    description:
      "Adds remediation_video_id, remediation_video_index, remediation_start_seconds, remediation_replay_until_seconds, remediation_message columns to quiz_questions. Drives the new per-question stepwise remediation flow (Module 05) — wrong answer sends the learner back to a specific video timestamp and required replay window. CHECK constraint guarantees replay_until > start when both are set. Partial index on lesson_id WHERE remediation_start_seconds IS NOT NULL. All columns nullable for backward compatibility — existing questions without remediation are treated as inline-retry by the runtime.",
    sortKey: "20260408000111",
    sql: MIG_20260408000111,
  },
  "20260408000112_global_pricing": {
    id: "20260408000112_global_pricing",
    title: "Global pricing (admin-managed prices for purchasable items)",
    description:
      "Creates global_pricing table with one row per purchasable item, keyed on item_key. Public SELECT (signup pages need it; the values are not secrets). Seeds the professional_divination_course at 25969 INR. Edited via the new /admin/pricing UI. Read by the diviner-signup page at runtime.",
    sortKey: "20260408000112",
    sql: MIG_20260408000112,
  },
  "20260408000113_trainees_payment_fields": {
    id: "20260408000113_trainees_payment_fields",
    title: "Trainees payment fields (diviner-signup webhook)",
    description:
      "Adds payment_intent_id, paid_at, affiliate_id columns to trainees so the diviner-signup Stripe webhook (handleDivinerSignupPaymentSucceeded) can persist payment confirmation state. All columns nullable + additive only. Re-running is safe via ADD COLUMN IF NOT EXISTS.",
    sortKey: "20260408000113",
    sql: MIG_20260408000113,
  },
  "20260408000114_drop_unique_astro_system_settings": {
    id: "20260408000114_drop_unique_astro_system_settings",
    title: "Allow duplicate astro_system_settings rows (drop UNIQUE)",
    description:
      "Drops the (type, key_name) UNIQUE constraint on astro_system_settings so admins can store rotation pools (e.g. multiple ASTROLOGY_API keys with the same key_name label) without 409 conflicts. Reads still pick the first active row by created_at via getActiveAstroSetting. Idempotent — DROP CONSTRAINT IF EXISTS plus a defensive loop that drops any other UNIQUE on the same column pair.",
    sortKey: "20260408000114",
    sql: MIG_20260408000114,
  },
  "20260408000115_pending_perennial_signups": {
    id: "20260408000115_pending_perennial_signups",
    title: "Pending Perennial signups (Stripe checkout intermediate state)",
    description:
      "Creates pending_perennial_signups table — temporary storage for in-flight household signups between Stripe Checkout creation and webhook receipt. Holds the full household JSONB payload (1-5 members) keyed on stripe_session_id. Service-role-only RLS because the payload contains personal data. Status enum (pending/processing/completed/failed) drives the webhook handler that provisions Supabase auth users + community_members rows after payment.",
    sortKey: "20260408000115",
    sql: MIG_20260408000115,
  },
  "20260408000116_training_notes_allow_quiz": {
    id: "20260408000116_training_notes_allow_quiz",
    title: "Training notes allow quiz entity type",
    description:
      "Extends the training_notes.entity_type CHECK constraint to allow 'quiz' in addition to program/category/lesson. Required by the admin Training Management standardization task so the entity detail sheet can host notes for quiz rows as well. Additive and idempotent — drops and recreates the named check constraint with the wider value list.",
    sortKey: "20260408000116",
    sql: MIG_20260408000116,
  },
  "20260409000117_availability_template_service_scope": {
    id: "20260409000117_availability_template_service_scope",
    title: "Availability template service scope",
    description:
      "Adds nullable service_id to availability_templates so a schedule can target one specific service. NULL keeps the schedule generic for all services. Indexed and additive-only.",
    sortKey: "20260409000117",
    sql: MIG_20260409000117,
  },
  "20260409000118_calendar_provider_credentials": {
    id: "20260409000118_calendar_provider_credentials",
    title: "Calendar provider credentials (Google + Microsoft)",
    description:
      "Creates google_api_keys and microsoft_api_keys tables — admin-managed key-value storage for per-provider OAuth client credentials (client_id / client_secret / redirect_uri / tenant_id). Service-role only RLS; reads go through the admin Supabase client. Separate from calendar_connections (per-user tokens). Runtime read path in src/lib/calendar/provider-credentials.ts falls back to the existing env vars if no row is set, so deploy-time behavior does not change until an admin populates the tables via /admin/calendar-config.",
    sortKey: "20260409000118",
    sql: MIG_20260409000118,
  },
  "20260409000119_pricing_plans": {
    id: "20260409000119_pricing_plans",
    title: "Pricing plans (multiple plans per item)",
    description:
      "Creates pricing_plans table — multiple purchasable plans per global_pricing item, each with display_name, amount, MRP, stripe_price_id, currency, description, and is_active toggle. Seeds the existing professional_divination_course row as a default plan. Also improves global_pricing index: replaces single-column boolean index with composite (is_active, item_key) matching the public lookup pattern.",
    sortKey: "20260409000119",
    sql: MIG_20260409000119,
  },
  "20260409000120_pricing_plan_custom_fields": {
    id: "20260409000120_pricing_plan_custom_fields",
    title: "Pricing plan custom fields (JSONB metadata array)",
    description:
      "Adds custom_fields JSONB column to pricing_plans — array of {label, value, slug} objects for flexible plan metadata displayed on signup pages (e.g. duration, sessions, support level). CHECK constraint ensures the value is always a JSON array.",
    sortKey: "20260409000120",
    sql: MIG_20260409000120,
  },
  "20260409000121_seed_pricing_plans": {
    id: "20260409000121_seed_pricing_plans",
    title: "Seed Perennial Mandalism & Mystery School pricing plans",
    description:
      "Seeds global_pricing items (perennial_mandalism_community, mystery_school) and 6 pricing_plans with Stripe Price IDs and custom_fields: PM Individual/Couple/Family, Mystery Enrollment/Monthly/Monthly PM Discount. Idempotent via ON CONFLICT DO NOTHING.",
    sortKey: "20260409000121",
    sql: MIG_20260409000121,
  },
  "20260409000122_drop_item_price_currency": {
    id: "20260409000122_drop_item_price_currency",
    title: "Drop price/currency from global_pricing (moved to plans)",
    description:
      "Drops price and currency columns from global_pricing. All pricing now lives exclusively on pricing_plans. Run AFTER 000121 (seed). Destructive — columns are permanently removed.",
    sortKey: "20260409000122",
    sql: MIG_20260409000122,
  },
  "20260409000123_stripe_product_price_fields": {
    id: "20260409000123_stripe_product_price_fields",
    title: "Stripe product/price fields on items and plans",
    description:
      "Adds stripe_product_id and stripe_product_name to global_pricing (one Stripe product per item), and stripe_price_name to pricing_plans. Index on stripe_product_id.",
    sortKey: "20260409000123",
    sql: MIG_20260409000123,
  },
  "20260410000001_increase_training_video_storage_limit": {
    id: "20260410000001_increase_training_video_storage_limit",
    title: "Increase training-videos bucket to 500 MB",
    description:
      "Updates the training-videos storage bucket file_size_limit from the default to 524288000 bytes (500 MB). The UI and server upload route both advertise a 500 MB limit, but the bucket's internal cap was lower, causing ~300 MB uploads to fail with 'exceeded max size'.",
    sortKey: "20260410000001",
    sql: MIG_20260410000001,
  },
  "20260410000124_pricing_onetime_recurring_html": {
    id: "20260410000124_pricing_onetime_recurring_html",
    title: "Split pricing into one-time + recurring, add HTML descriptions",
    description:
      "Adds onetime_amount/onetime_currency and recurring_amount/recurring_currency to pricing_plans (replaces single amount/currency). Adds html_description to both global_pricing and pricing_plans. Migrates existing data. Stage 1 — old columns kept until code is updated.",
    sortKey: "20260410000124",
    sql: MIG_20260410000124,
  },
  "20260410000125_pricing_recurring_interval": {
    id: "20260410000125_pricing_recurring_interval",
    title: "Add recurring_interval to pricing_plans",
    description:
      "Adds recurring_interval (month/year) column to pricing_plans for subscription billing interval.",
    sortKey: "20260410000125",
    sql: MIG_20260410000125,
  },
  "20260413000012_community_onboarding_completed": {
    id: "20260413000012_community_onboarding_completed",
    title: "Community onboarding completion flag",
    description:
      "Adds community_members.onboarding_completed with a safe back-fill for existing members who already completed profile intake data. Supports explicit onboarding gating instead of inferring completion from first_name.",
    sortKey: "20260413000012",
    sql: MIG_20260413000012,
  },
  "20260413000006_services_pricing_item_key": {
    id: "20260413000006_services_pricing_item_key",
    title: "Add pricing_item_key to services",
    description:
      "Stores the global_pricing item_key selected when creating/editing a service so the admin UI can re-populate the Pricing Item dropdown on edit. Nullable TEXT column — additive only.",
    sortKey: "20260413000006",
    sql: MIG_20260413000006,
  },
  "20260413000008_services_platform_fee_percent": {
    id: "20260413000008_services_platform_fee_percent",
    title: "Add platform_fee_percent to services",
    description: "Stores a per-service platform fee override (%). NULL means use the global 20% default.",
    sortKey: "20260413000008",
    sql: MIG_20260413000008,
  },
  "20260413000126_training_quiz_question_progress": {
    id: "20260413000126_training_quiz_question_progress",
    title: "Training quiz question progress",
    description:
      "Creates quiz_question_progress to persist per-question correct answers for in-progress lesson quizzes. Lets learners leave after Q1/Q2 and resume at the first unanswered question instead of re-answering already-correct questions. Additive and RLS-protected.",
    sortKey: "20260413000126",
    sql: MIG_20260413000126,
  },
  "20260413000140_media_albums": {
    id: "20260413000140_media_albums",
    title: "Media image albums",
    description:
      "Adds album_name to media_items plus an index for image album grouping. Supports grouped image galleries and dashboard album management without affecting existing non-image media items.",
    sortKey: "20260413000140",
    sql: MIG_20260413000140,
  },
  "20260414000002_booking_session_started_at": {
    id: "20260414000002_booking_session_started_at",
    title: "Booking session_started_at (video timer persistence)",
    description:
      "Adds session_started_at timestamptz to bookings. Set on first participant join and never overwritten — allows the video session timer to survive page reloads instead of restarting from zero.",
    sortKey: "20260414000002",
    sql: MIG_20260414000002,
  },
  "20260414000026_chime_sip_rule_id": {
    id: "20260414000026_chime_sip_rule_id",
    title: "Chime SIP Rule ID on diviners",
    description:
      "Adds chime_sip_rule_id TEXT column to diviners. Stores the SIP Rule ID created when a Chime PSTN phone number is provisioned — needed to delete the rule on number release. Additive only, IF NOT EXISTS.",
    sortKey: "20260414000026",
    sql: MIG_20260414000026,
  },
  "20260415000001_chime_pipeline_id": {
    id: "20260415000001_chime_pipeline_id",
    title: "Chime pipeline ID (recording concatenation)",
    description:
      "Adds chime_pipeline_id text column to bookings. Stores the Media Capture Pipeline ARN created when a Chime session starts. Required to trigger the concatenation pipeline on session end, which merges all segment files into a single named MP4 under recordings/{bookingId}/final/{meetingId}.mp4.",
    sortKey: "20260415000001",
    sql: MIG_20260415000001,
  },
  "20260416000001_phone_call_notifications": {
    id: "20260416000001_phone_call_notifications",
    title: "Phone call notifications table",
    description:
      "Creates phone_call_notifications table — stores inbound call notifications from the SMA Lambda. The diviner's browser widget polls this table to show incoming calls. Rows transition: ringing → accepted | declined | expired. RLS enabled with diviner-select, diviner-update, and service-role-all policies.",
    sortKey: "20260416000001",
    sql: MIG_20260416000001,
  },
  "20260416000002_phone_sessions_status_expand": {
    id: "20260416000002_phone_sessions_status_expand",
    title: "Expand phone_sessions status constraint",
    description:
      "Adds 'accepted' and 'declined' to the phone_sessions.status CHECK constraint. Required by the Chime accept/decline routes which set these values when a diviner answers or rejects an inbound call.",
    sortKey: "20260416000002",
    sql: MIG_20260416000002,
  },
  "20260416000003_add_chat_transcript": {
    id: "20260416000003_add_chat_transcript",
    title: "Add chat_transcript to bookings",
    description:
      "Adds chat_transcript JSONB column to bookings. Stores the full array of chat messages exchanged during a video session. Each entry: {from, text, time}. Populated by end-meeting and end-session APIs when the diviner ends the call.",
    sortKey: "20260416000003",
    sql: MIG_20260416000003,
  },
  "20260416000004_push_subscriptions": {
    id: "20260416000004_push_subscriptions",
    title: "Push subscriptions (Web Push for call notifications)",
    description:
      "Creates push_subscriptions table for storing Web Push subscriptions per diviner. Supports multiple subscriptions per diviner (phone + desktop browsers). Cleaned up automatically when expired. RLS enabled with diviner-managed own-row policies and service-role-all for server-side push sending.",
    sortKey: "20260416000004",
    sql: MIG_20260416000004,
  },
  "20260416000005_simultaneous_ring": {
    id: "20260416000005_simultaneous_ring",
    title: "Simultaneous Ring (outbound transaction tracking)",
    description:
      "Adds chime_outbound_transaction_id to phone_sessions. Tracks the outbound PSTN call to the diviner's personal phone during simultaneous ring — needed to cancel the outbound call if the diviner answers from the dashboard instead.",
    sortKey: "20260416000005",
    sql: MIG_20260416000005,
  },
};

/** List the allowlist in deterministic sortKey order. */
export function listMigrations(): Array<Omit<MigrationDescriptor, "sql">> {
  return Object.values(MIGRATIONS)
    .map(({ sql, ...meta }) => ({ ...meta, sql_length: sql.length }))
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey)) as Array<
      Omit<MigrationDescriptor, "sql">
    >;
}
