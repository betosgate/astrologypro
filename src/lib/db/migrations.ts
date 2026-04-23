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
import { MIGRATION_SQL as MIG_20260413000182 } from "@/data/migrations/20260413000182_natal_generation_governance";
import { MIGRATION_SQL as MIG_20260413000185 } from "@/data/migrations/20260413000185_natal_regeneration_audit";
import { MIGRATION_SQL as MIG_20260414000002 } from "@/data/migrations/20260414000002_booking_session_started_at";
import { MIGRATION_SQL as MIG_20260414000026 } from "@/data/migrations/20260414000026_chime_sip_rule_id";
import { MIGRATION_SQL as MIG_20260415000001 } from "@/data/migrations/20260415000001_chime_pipeline_id";
import { MIGRATION_SQL as MIG_20260416000001 } from "@/data/migrations/20260416000001_phone_call_notifications";
import { MIGRATION_SQL as MIG_20260416000002 } from "@/data/migrations/20260416000002_phone_sessions_status_expand";
import { MIGRATION_SQL as MIG_20260416000003 } from "@/data/migrations/20260416000003_add_chat_transcript";
import { MIGRATION_SQL as MIG_20260416000006 } from "@/data/migrations/MIG_20260416000006_push_subscriptions";
import { MIGRATION_SQL as MIG_20260416000005 } from "@/data/migrations/20260416000005_simultaneous_ring";
import { MIGRATION_SQL as MIG_20260416000004 } from "@/data/migrations/20260416000004_tarot_dynamic_system";
import { MIGRATION_SQL as MIG_20260416000007 } from "@/data/migrations/20260416000007_drop_tarot_spread_cards";
import { MIGRATION_SQL as MIG_20260417000021 } from "@/data/migrations/20260417000021_availability_templates_created_by";
import { MIGRATION_SQL as MIG_20260417000023 } from "@/data/migrations/20260417000023_availability_templates_admin_owned";
import { MIGRATION_SQL as MIG_20260418000001 } from "@/data/migrations/20260418000001_service_toolkit_session";
import { MIGRATION_SQL as MIG_20260419000001 } from "@/data/migrations/20260419000001_social_accounts";
import { MIGRATION_SQL as MIG_20260421000001 } from "@/data/migrations/20260421000001_phone_number_requests";
import { MIGRATION_SQL as MIG_20260421000002 } from "@/data/migrations/20260421000002_booking_call_pin";
import { MIGRATION_SQL as MIG_20260421000003 } from "@/data/migrations/20260421000003_seed_central_chime_number";
import { MIGRATION_SQL as MIG_20260421000004 } from "@/data/migrations/20260421000004_add_general_service_templates";
import { MIGRATION_SQL as MIG_20260421000005 } from "@/data/migrations/20260421000005_seed_general_nativity_template_content";
import { MIGRATION_SQL as MIG_20260421000010 } from "@/data/migrations/20260421000010_repair_family_birth_country";
import { MIGRATION_SQL as MIG_20260421000001_ASA } from "@/data/migrations/20260421000001_affiliate_service_assignments";
import { MIGRATION_SQL as MIG_20260421000020 } from "@/data/migrations/20260421000020_admin_booking_calendar";
import { MIGRATION_SQL as MIG_20260421000021 } from "@/data/migrations/20260421000021_admin_bookings_gcal_event_id";
import { MIGRATION_SQL as MIG_20260421000040 } from "@/data/migrations/20260421000040_repair_landing_page_publish_drift";
import { MIGRATION_SQL as MIG_20260421000050 } from "@/data/migrations/20260421000050_landing_page_slots_additive";
import { MIGRATION_SQL as MIG_20260421000030_LPS } from "@/data/migrations/20260421000030_landing_page_slots_additive";
import { MIGRATION_SQL as MIG_20260428000001_LPC } from "@/data/migrations/20260428000001_landing_page_cleanup_destructive";
import { MIGRATION_SQL as MIG_20260428000002_FK } from "@/data/migrations/20260428000002_drop_section_type_fk";
import { MIGRATION_SQL as MIG_20260422000001 } from "@/data/migrations/20260422000001_service_template_image_url";
import { MIGRATION_SQL as MIG_20260422000002 } from "@/data/migrations/20260422000002_booking_cancel_refund_audit";
import { MIGRATION_SQL as MIG_20260422000003 } from "@/data/migrations/20260422000003_service_template_intake_forms";
import { MIGRATION_SQL as MIG_20260422000004 } from "@/data/migrations/20260422000004_service_template_intake_submissions";
import { MIGRATION_SQL as MIG_20260422000005 } from "@/data/migrations/20260422000005_admin_bookings_chime_fields";
import { MIGRATION_SQL as MIG_20260422000006 } from "@/data/migrations/20260422000006_add_birth_country_to_community_members";
import { MIGRATION_SQL as MIG_20260422000007 } from "@/data/migrations/20260422000007_repair_community_members_birth_country";
import { MIGRATION_SQL as MIG_20260423000001 } from "@/data/migrations/20260423000001_chime_recording_extras";

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
  "20260417000021_availability_templates_created_by": {
    id: "20260417000021_availability_templates_created_by",
    title: "Availability Templates Created By",
    description:
      "Adds nullable created_by UUID to availability_templates so admin-created schedules can retain the auth.users identifier of the admin who created them. Indexed and additive-only.",
    sortKey: "20260417000021",
    sql: MIG_20260417000021,
  },
  "20260417000023_availability_templates_admin_owned": {
    id: "20260417000023_availability_templates_admin_owned",
    title: "Availability Templates Admin Owned",
    description:
      "Keeps admin availability in the existing availability_templates table by allowing diviner_id to be null and indexing created_by for admin-owned schedules.",
    sortKey: "20260417000023",
    sql: MIG_20260417000023,
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
  "20260413000182_natal_generation_governance": {
    id: "20260413000182_natal_generation_governance",
    title: "Natal chart generation governance (lifecycle + retry fields)",
    description:
      "Adds natal_status, natal_retry_count, natal_max_retries, natal_first_generated_at, natal_last_generated_at, natal_failure_reason, natal_lock_reason to community_family_members. POST /api/community/generate-natal selects these columns — without this migration the route's .select() fails and the API incorrectly returns 'Family member not found' (404). Backfills rows that already have natal_chart to natal_status='generated'. Strictly additive — every column uses ADD COLUMN IF NOT EXISTS. Run BEFORE 20260413000185.",
    sortKey: "20260413000182",
    sql: MIG_20260413000182,
  },
  "20260413000185_natal_regeneration_audit": {
    id: "20260413000185_natal_regeneration_audit",
    title: "Natal regeneration audit table",
    description:
      "Creates natal_regeneration_audit — records every user-initiated chart regeneration event (initiator, retry number, before/after birth data, outcome) for accountability and admin support review. POST /api/community/generate-natal writes to this table during regeneration; missing table causes insert failures. RLS: members read their own family's audit rows; service_role full access. Additive only. Run AFTER 20260413000182.",
    sortKey: "20260413000185",
    sql: MIG_20260413000185,
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
  "MIG_20260416000006_push_subscriptions": {
    id: "MIG_20260416000006_push_subscriptions",
    title: "Push subscriptions (Web Push for call notifications)",
    description:
      "Creates push_subscriptions table for storing Web Push subscriptions per diviner. Supports multiple subscriptions per diviner (phone + desktop browsers). Cleaned up automatically when expired. RLS enabled with diviner-managed own-row policies and service-role-all for server-side push sending.",
    sortKey: "MIG_20260416000006",
    sql: MIG_20260416000006,
  },
  "20260416000005_simultaneous_ring": {
    id: "20260416000005_simultaneous_ring",
    title: "Simultaneous Ring (outbound transaction tracking)",
    description:
      "Adds chime_outbound_transaction_id to phone_sessions. Tracks the outbound PSTN call to the diviner's personal phone during simultaneous ring — needed to cancel the outbound call if the diviner answers from the dashboard instead.",
    sortKey: "20260416000005",
    sql: MIG_20260416000005,
  },
  "20260416000004_tarot_dynamic_system": {
    id: "20260416000004_tarot_dynamic_system",
    title: "Tarot dynamic system (columns + junction table)",
    description:
      "Adds description, priority, card_image_url, related_spread_ids columns to tarot_cards. Adds image_url to tarot_spreads. Creates tarot_spread_cards junction table for many-to-many card-to-spread linking with RLS policies.",
    sortKey: "20260416000004",
    sql: MIG_20260416000004,
  },
  "20260416000007_drop_tarot_spread_cards": {
    id: "20260416000007_drop_tarot_spread_cards",
    title: "Drop unused tarot_spread_cards junction table",
    description:
      "Drops the tarot_spread_cards junction table. Card-to-spread relationship now uses the related_spread_ids UUID[] array column on tarot_cards instead.",
    sortKey: "20260416000007",
    sql: MIG_20260416000007,
  },
  "20260418000001_service_toolkit_session": {
    id: "20260418000001_service_toolkit_session",
    title: "Service toolkit session (Open Service feature)",
    description:
      "Additive migration for the 'Open Service' feature. Adds two nullable columns to bookings: partner_birth_data (JSONB — optional partner birth info for the 3 two-person astrology services) and toolkit_session_opened_at (TIMESTAMPTZ — first-open telemetry). Also adds a partial B-tree index on (partner_birth_data IS NOT NULL) for 'how many two-person bookings have partner data?' reporting. No backfill, no RLS changes, no drops. Rollback = drop both columns.",
    sortKey: "20260418000001",
    sql: MIG_20260418000001,
  },
  "20260419000001_social_accounts": {
    id: "20260419000001_social_accounts",
    title: "Social accounts + OAuth state (native social posting, replaces Ayrshare)",
    description:
      "Creates social_accounts (per-owner OAuth connections to Twitter/Facebook/Instagram/LinkedIn/TikTok/YouTube — tokens AES-256-GCM encrypted at rest, key in SOCIAL_TOKEN_ENCRYPTION_KEY env var) and social_oauth_states (short-lived CSRF + PKCE verifier store for the OAuth redirect loop). One active connection per (owner_type, owner_id, platform) enforced by partial unique index. RLS enabled on both tables — no public/authenticated policies, all access goes through server routes with service-role client. Only Twitter is enabled in lib/social/platform-registry.ts at launch; other platforms scaffolded but return 'platform not yet enabled'. Additive only — no drops, no backfill. Rollback = drop both tables.",
    sortKey: "20260419000001",
    sql: MIG_20260419000001,
  },
  "20260421000001_phone_number_requests": {
    id: "20260421000001_phone_number_requests",
    title: "Phone number requests (diviner-initiated) + Chime pool",
    description:
      "Creates chime_phone_numbers (pool of AWS Chime numbers with status available|assigned) and phone_number_requests (diviner-initiated requests with status pending|assigned|rejected). Backfills the pool from every existing diviners.chime_phone_number as 'assigned' so the pool is the single source of truth. Partial unique index guarantees one pending request per diviner at the DB level; another guarantees one pool row per diviner. RLS: admin full access, diviner can read own rows + insert a 'pending' request for themselves (all status transitions are admin-only). Drives the new diviner Phone tab 'Request Phone Number' button and the admin 'Phone Requests' list under People. Strictly additive — no drops.",
    sortKey: "20260421000001",
    sql: MIG_20260421000001,
  },
  "20260421000002_booking_call_pin": {
    id: "20260421000002_booking_call_pin",
    title: "Booking call PIN + chime_phone_numbers 'central' status",
    description:
      "Adds bookings.call_pin (CHAR(6)) and bookings.call_pin_generated_at to support shared-central-number + PIN routing for inbound Chime calls. Partial unique index ux_bookings_active_call_pin guarantees no two concurrently-usable PINs across pending/confirmed/in_progress bookings; PINs recycle once a booking moves to a terminal state. Extends the existing chime_phone_numbers table (created in 20260421000001) by widening the status CHECK to include 'central' and relaxing the assignment-consistency CHECK so central rows carry no diviner assignment. Adds an RLS policy so authenticated users can read central rows (needed by the booking confirmation UI). Backfills PINs for every future/active booking with call_pin IS NULL via a retry-on-collision loop. Strictly additive — existing per-diviner chime flow (available/assigned pool rows + diviners.chime_phone_number) continues to work in parallel. Rollout gate is data-driven: a status='central' row in chime_phone_numbers turns the shared-number + PIN path on.",
    sortKey: "20260421000002",
    sql: MIG_20260421000002,
  },
  "20260421000003_seed_central_chime_number": {
    id: "20260421000003_seed_central_chime_number",
    title: "Seed: promote +12162206209 to 'central'",
    description:
      "Environment-specific seed. Promotes +12162206209 (originally bought for test diviner 1, already assigned to a Chime SIP Media Application) to status='central' in chime_phone_numbers, and severs the per-diviner binding by clearing chime_phone_number / chime_sma_phone_arn / chime_sip_rule_id on the diviners row. The number becomes the shared PSTN entry point for PIN routing. Idempotent: UPDATE flips status + INSERT ... ON CONFLICT DO NOTHING. phone_arn is NULL in the INSERT fallback (the Next.js app never reads phone_arn; if 001's backfill already seeded the ARN from diviners.chime_sma_phone_arn, step 1's UPDATE preserves it). Kill switch: UPDATE chime_phone_numbers SET status='available' WHERE phone_number='+12162206209'.",
    sortKey: "20260421000003",
    sql: MIG_20260421000003,
  },
  "20260421000002_add_general_service_templates": {
    id: "20260421000002_add_general_service_templates",
    title: "Add general service templates",
    description:
      "Clones the 19 canonical diviner-specific service_templates rows into a parallel general catalog by preserving all source fields and only changing name + slug to their general equivalents. Safe to re-run because each clone is inserted only if its target slug does not already exist.",
    sortKey: "20260421000002",
    sql: MIG_20260421000004,
  },
  "20260421000005_seed_general_nativity_template_content": {
    id: "20260421000005_seed_general_nativity_template_content",
    title: "Seed general nativity template content",
    description:
      "Populates general-nativity-birth-chart with a complete reference set of admin-editable fields including long description, included items, target audience, FAQ, SEO metadata, and explicit display/pricing values.",
    sortKey: "20260421000005",
    sql: MIG_20260421000005,
  },
  "20260421000010_repair_family_birth_country": {
    id: "20260421000010_repair_family_birth_country",
    title: "Repair existing family birth_country (parse from birth_city)",
    description:
      "One-time data repair for community_family_members rows where birth_country IS NULL and birth_city ends with a recognized country suffix (e.g. 'Miami, FL, United States of America'). Uses an allowlist of ~70 country names ordered longest-first so multi-word matches win. Never overwrites an existing birth_country; ambiguous labels are skipped, not guessed. Safe to re-run — a 2nd pass updates zero rows. NON-destructive: no schema changes, no deletes.",
    sortKey: "20260421000010",
    sql: MIG_20260421000010,
  },
  "20260421000001_affiliate_service_assignments": {
    id: "20260421000001_affiliate_service_assignments",
    title: "Affiliate Service Assignments + URL Attribution",
    description:
      "New diviner_service_affiliates table (source of truth for affiliate assignments, PROFILE or SERVICE-scoped). Extends affiliate_campaigns with owner_type (diviner | affiliate) + owner_affiliate_id + commission_value_snapshot + source_assignment_id and a CHECK that affiliate-owned campaigns must carry the full owner context. Extends campaign_clicks with affiliate_id + ref_code + commission snapshots; campaign_conversions with booking_id + ref_code_snapshot + commission_source + reversal columns and a UNIQUE (booking_id) idempotency index; bookings with ref_code; page_views with affiliate_id + ref_code. Adds trigger auto_pause_affiliate_campaigns_on_revoke so revoking an assignment automatically pauses matching affiliate-owned campaigns. RLS: diviner and named affiliate can SELECT; only the owning diviner can write; service_role full access. Strictly additive — no DROPs.",
    sortKey: "20260421000001",
    sql: MIG_20260421000001_ASA,
  },
  "20260421000020_admin_booking_calendar": {
    id: "20260421000020_admin_booking_calendar",
    title: "Admin Booking Calendar (username + admin_bookings)",
    description:
      "Adds a nullable, case-insensitive unique `username` column to admin_users and creates the `admin_bookings` table. Powers the public /book/<username> calendar flow for admins: calendar-only, no service/diviner/Stripe coupling. admin_bookings is isolated from `bookings` on purpose — admin calendar meetings have no diviner/client/service FK targets. RLS: service_role only. Additive, idempotent.",
    sortKey: "20260421000020",
    sql: MIG_20260421000020,
  },
  "20260421000021_admin_bookings_gcal_event_id": {
    id: "20260421000021_admin_bookings_gcal_event_id",
    title: "Admin Bookings — Google Calendar event id",
    description:
      "Adds google_calendar_event_id to admin_bookings so we can track the synced Google Calendar event for later update/cancel. Additive + idempotent.",
    sortKey: "20260421000021",
    sql: MIG_20260421000021,
  },
  "20260421000040_repair_landing_page_publish_drift": {
    id: "20260421000040_repair_landing_page_publish_drift",
    title: "Repair landing-page publish drift (Deploy 0 hotfix)",
    description:
      "One-time data repair for the 2026-04-21 publish-drift incident. Resyncs diviner_services.is_published + publish_status for rows where the builder wrote service_landing_pages.status='published' but the diviner-services gate was never flipped, causing the dashboard to show 'Published' while the public URL 404'd. Scoped explicitly by diviner_services.id; WHERE clause self-excludes already-correct rows so re-running is a no-op. No schema changes.",
    sortKey: "20260421000040",
    sql: MIG_20260421000040,
  },
  "20260421000050_landing_page_slots_additive": {
    id: "20260421000050_landing_page_slots_additive",
    title: "Landing-page slots (additive Deploy 1 schema)",
    description:
      "Additive schema for the landing-page simplification. Adds nullable slot column to service_landing_page_sections with CHECK ('about_diviner' | 'extra' | NULL), backfills existing rows (hero/pricing/booking_cta → NULL; bio/about/testimonials → about_diviner; rest → extra), adds an index on (diviner_id, landing_page_id, slot, display_order) for enabled non-null-slot rows, creates the V2 read-only VIEW diviner_service_blocks (Deploy 2 rename target), and tags every column scheduled for removal with a deprecation COMMENT. No DROPs. Idempotent.",
    sortKey: "20260421000050",
    sql: MIG_20260421000050,
  },
  "20260421000030_landing_page_slots_additive": {
    id: "20260421000030_landing_page_slots_additive",
    title: "Landing page V2 — slot column + block view (additive)",
    description:
      "Adds nullable slot column (CHECK 'about_diviner' | 'extra') to service_landing_page_sections. Backfills existing rows: hero/pricing/booking_cta → NULL (system), bio/about/testimonials → 'about_diviner', everything else → 'extra'. Creates CREATE OR REPLACE VIEW diviner_service_blocks as the V2 read surface (hides deprecated columns + system sections). Adds an index aligned with the V2 query pattern. COMMENT ON COLUMN annotations mark every column scheduled for Deploy 2 DROP. Strictly additive — no DROPs. Idempotent: WHERE slot IS NULL guard on backfill, IF NOT EXISTS on column/index, CREATE OR REPLACE on view.",
    sortKey: "20260421000030",
    sql: MIG_20260421000030_LPS,
  },
  "20260422000001_service_template_image_url": {
    id: "20260422000001_service_template_image_url",
    title: "Service template image URL",
    description:
      "Adds nullable image_url to service_templates so admin-managed template pages can use uploaded hero images instead of relying only on slug-based static service art.",
    sortKey: "20260422000001",
    sql: MIG_20260422000001,
  },
  "20260422000002_booking_cancel_refund_audit": {
    id: "20260422000002_booking_cancel_refund_audit",
    title: "Booking cancel/refund audit fields",
    description:
      "Additive columns on bookings: canceled_by_user_id, canceled_by_role, stripe_refund_id, refunded_by_user_id, refunded_by_role. Lets the booking-details drawer answer 'who cancelled, who refunded, which Stripe refund was it' without joining refund_events. Role-level CHECK constraints keep values to the allowlist (admin/diviner/client/system for canceled_by; admin/diviner/system for refunded_by). No existing columns are touched.",
    sortKey: "20260422000002",
    sql: MIG_20260422000002,
  },
  "20260422000003_service_template_intake_forms": {
    id: "20260422000003_service_template_intake_forms",
    title: "Service template intake forms",
    description:
      "Adds form_enabled and form_config to service_templates, constrains form_config to JSON objects, and backfills astrology templates with structured intake presets mapped from the product slug. Supports the admin template form builder and public pre-booking intake flow.",
    sortKey: "20260422000003",
    sql: MIG_20260422000003,
  },
  "20260422000004_service_template_intake_submissions": {
    id: "20260422000004_service_template_intake_submissions",
    title: "Service template intake submissions",
    description:
      "Creates service_template_intake_submissions for product-form leads captured from public service template pages. Stores template metadata, toolkit mapping, normalized summary columns, full JSON payload, status, and submission timestamps for admin review workflows.",
    sortKey: "20260422000004",
    sql: MIG_20260422000004,
  },
  "20260422000005_admin_bookings_chime_fields": {
    id: "20260422000005_admin_bookings_chime_fields",
    title: "Admin bookings Chime video fields",
    description:
      "Additive columns on admin_bookings (chime_meeting_id, chime_external_meeting_id, video_provider) so admin-hosted sessions can run through the same Chime pipeline as diviner-hosted ones instead of being limited to a Google Calendar meet link. Safe to re-run.",
    sortKey: "20260422000005",
    sql: MIG_20260422000005,
  },
  "20260422000006_add_birth_country_to_community_members": {
    id: "20260422000006_add_birth_country_to_community_members",
    title: "Add birth_country to community_members",
    description:
      "Additive column required by the shared HoroscopeToolkitPage (/community/horoscope) and resolveUserBirthData(). Unblocks the /community/profile form from persisting Birth Country and resolves the 'missing Birth country' card after the member completes the profile. Idempotent via ADD COLUMN IF NOT EXISTS — safe to re-run. Companion migration 20260421000010_repair_family_birth_country handles the sibling community_family_members.birth_country back-fill.",
    sortKey: "20260422000006",
    sql: MIG_20260422000006,
  },
  "20260422000007_repair_community_members_birth_country": {
    id: "20260422000007_repair_community_members_birth_country",
    title: "Repair community_members birth_country",
    description:
      "One-time data repair for community_members rows where birth_country IS NULL and birth_city ends with a recognized country suffix (e.g. 'Dublin, Ireland'). Never overwrites an existing birth_country; ambiguous labels are skipped. Includes a targeted repair for the known active PM account whose city label lacks a country suffix. Safe to re-run.",
    sortKey: "20260422000007",
    sql: MIG_20260422000007,
  },
  "20260423000001_chime_recording_extras": {
    id: "20260423000001_chime_recording_extras",
    title: "Chime recording extras (admin_bookings + phone_sessions)",
    description:
      "Adds chime_pipeline_id, recording_url, recording_share_id, session_started_at, ended_at, actual_duration_minutes to admin_bookings; chime_pipeline_id + recording_share_id to phone_sessions. Required so the admin↔trainee video flow and the voice (PSTN) flow can persist the Chime Media Capture Pipeline ARN and the S3 recording URL — without these, the end-meeting concatenation has nowhere to write the pipeline ARN and the sync-recordings cron can't publish the final URL. Safe to re-run.",
    sortKey: "20260423000001",
    sql: MIG_20260423000001,
  },
  "20260428000001_landing_page_cleanup_destructive": {
    id: "20260428000001_landing_page_cleanup_destructive",
    title: "⚠️ DESTRUCTIVE — Landing page V2 cleanup (Deploy 2)",
    description:
      "DESTRUCTIVE. Run only after the paired V2 code refactor is deployed and the existing landing-page content is disposable. Drops the Deploy-1 view diviner_service_blocks, backfills service_template_id onto service_landing_page_sections from landing_page_id, drops landing_page_id + its FK, drops the service_landing_pages container table CASCADE, drops diviner_services.publish_status, purges rows violating the tighter section_type ('text'|'image'|'html') and slot NOT NULL CHECK constraints, renames service_landing_page_sections → diviner_service_blocks (physical table), drops deprecated columns (is_system, is_draft, draft_*, published_*, instance_key, subtitle, images), tightens CHECKs, and rebuilds the slot+order index. Single BEGIN/COMMIT — rolls back on any failure. NOT idempotent.",
    sortKey: "20260428000001",
    sql: MIG_20260428000001_LPC,
  },
  "20260428000002_drop_section_type_fk": {
    id: "20260428000002_drop_section_type_fk",
    title: "Drop legacy section_type FK + orphan registry table",
    description:
      "Follow-up to 20260428000001. Drops the legacy FK diviner_service_blocks.section_type → section_type_config.type (left behind by the rename — it still referenced the V1 registry seeded with hero/bio/pricing/etc, which blocked inserts of the V2 types text/image/html). Also drops the now-orphan section_type_config table (no live code references it). Idempotent.",
    sortKey: "20260428000002",
    sql: MIG_20260428000002_FK,
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
