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
import { MIGRATION_SQL as MIG_20260423000002 } from "@/data/migrations/20260423000002_backfill_plan_type_from_pm_tier";
import { MIGRATION_SQL as MIG_20260423000003 } from "@/data/migrations/20260423000003_admin_bookings_status_completed";
import { MIGRATION_SQL as MIG_20260424000001_STCIM } from "@/data/migrations/20260424000001_service_template_content_image_matrix";
import { MIGRATION_SQL as MIG_20260428000100 } from "@/data/migrations/20260428000100_fix_diviner_fields_length";
import { MIGRATION_SQL as MIG_20260423000001_AIR } from "@/data/migrations/20260423000001_affiliate_identity_refactor";
import { MIGRATION_SQL as MIG_20260423000002_RLS } from "@/data/migrations/20260423000002_fix_diviner_affiliates_rls";
import { MIGRATION_SQL as MIG_20260423000003_INV } from "@/data/migrations/20260423000003_affiliate_invite_rpc";
import { MIGRATION_SQL as MIG_20260423000004_FIX } from "@/data/migrations/20260423000004_fix_invite_rpc_ambiguity";
import { MIGRATION_SQL as MIG_20260423000005_ACC } from "@/data/migrations/20260423000005_accept_rpc";
import { MIGRATION_SQL as MIG_20260424000001_ODC } from "@/data/migrations/20260424000001_phone_sessions_outbound_diviner_call";
import { MIGRATION_SQL as MIG_20260424000002_AAR } from "@/data/migrations/20260424000002_astro_ai_responses";
import { MIGRATION_SQL as MIG_20260427000001_SRL } from "@/data/migrations/20260427000001_saved_report_linkage";
import { MIGRATION_SQL as MIG_20260427000002_RAC } from "@/data/migrations/20260427000002_ritual_admin_config";
import { MIGRATION_SQL as MIG_20260424000010_ACV2A } from "@/data/migrations/20260424000010_affiliate_commission_v2_additive";
import { MIGRATION_SQL as MIG_20260424009001_ACV2D } from "@/data/migrations/20260424009001_affiliate_commission_v2_destructive";
import { MIGRATION_SQL as MIG_20260427000002_ARV2A } from "@/data/migrations/20260427000002_affiliate_rls_v2_alignment";
import { MIGRATION_SQL as MIG_20260427000003_AJSP } from "@/data/migrations/20260427000003_affiliate_junction_select_policy";
import { MIGRATION_SQL as MIG_20260427000004_ARSD } from "@/data/migrations/20260427000004_affiliate_rls_security_definer";
import { MIGRATION_SQL as MIG_20260430000001_SAUE } from "@/data/migrations/20260430000001_search_auth_users_by_email_fn";
import { MIGRATION_SQL as MIG_20260430000002_AP15G } from "@/data/migrations/20260430000002_affiliate_phase_1_5_general";
import { MIGRATION_SQL as MIG_20260428000003_RGS } from "@/data/migrations/20260428000003_ritual_global_settings";
import { MIGRATION_SQL as MIG_20260430000002_RSTL } from "@/data/migrations/20260430000002_repair_service_template_links";
import { MIGRATION_SQL as MIG_20260413000184_MTL } from "@/data/migrations/20260413000184_monthly_transit_lifecycle";
import { MIGRATION_SQL as MIG_20260504000001_TLAU } from "@/data/migrations/20260504000001_training_lessons_audio_url";
import { MIGRATION_SQL as MIG_20260504000002_MSFS } from "@/data/migrations/20260504000002_mystery_school_foundation_seed";
import { MIGRATION_SQL as MIG_20260505000001_ACCMK } from "@/data/migrations/20260505000001_affiliate_campaigns_channel_marketing_kit";
import { MIGRATION_SQL as MIG_20260505000002_BACC } from "@/data/migrations/20260505000002_booking_affiliate_commission_cents";
import { MIGRATION_SQL as MIG_20260505000003_AP2 } from "@/data/migrations/20260505000003_affiliate_payouts_phase_2";
import { MIGRATION_SQL as MIG_20260505000004_AP3 } from "@/data/migrations/20260505000004_affiliate_phase_3_analytics";
import { MIGRATION_SQL as MIG_20260506000001_CSCR } from "@/data/migrations/20260506000001_community_self_canonical_repair";
import { MIGRATION_SQL as MIG_20260506000002_MSFC } from "@/data/migrations/20260506000002_mystery_school_foundation_completed_at";
import { MIGRATION_SQL as MIG_20260506000003_MSDA } from "@/data/migrations/20260506000003_mystery_school_decan_admin_content";

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
  "20260423000002_backfill_plan_type_from_pm_tier": {
    id: "20260423000002_backfill_plan_type_from_pm_tier",
    title: "Backfill legacy plan_type from canonical pm_tier_id",
    description:
      "Task 04 of the community-pm-entitlement-state-sync bundle. Updates community_members.plan_type to match the canonical pm_plan_tiers.name mapping (Family → 'family', everything else → 'individual') ONLY for rows where pm_tier_id is set and the stored plan_type disagrees. Rows with NULL pm_tier_id or an unresolved tier id are skipped and logged via RAISE NOTICE. Idempotent — safe to re-run after every deploy. Does not delete or schema-alter any columns.",
    sortKey: "20260423000002",
    sql: MIG_20260423000002,
  },
  "20260423000003_admin_bookings_status_completed": {
    id: "20260423000003_admin_bookings_status_completed",
    title: "Extend admin_bookings.status to completed / no_show / in_progress",
    description:
      "Drops and re-adds the admin_bookings_status_check CHECK constraint to allow 'completed', 'no_show', and 'in_progress' alongside the original 'confirmed' / 'canceled'. Required so /api/chime/admin-bookings/end can flip status to 'completed' after a Chime session ends — without this the status stayed at 'confirmed' forever and the trainee/admin UI showed the wrong badge. Additive, idempotent, safe to re-run.",
    sortKey: "20260423000003",
    sql: MIG_20260423000003,
  },
  "20260424000001_service_template_content_image_matrix": {
    id: "20260424000001_service_template_content_image_matrix",
    title: "Service template content + image matrix",
    description:
      "Seeds standardized descriptions, long descriptions, included bullets, audience bullets, FAQ entries, SEO metadata, and shared image_url values for all 19 canonical service templates plus their 19 general variants. Safe to re-run because every row is updated by stable slug.",
    sortKey: "20260424000001",
    sql: MIG_20260424000001_STCIM,
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
  "20260428000100_fix_diviner_fields_length": {
    id: "20260428000100_fix_diviner_fields_length",
    title: "Fix diviners field length (plan_id, status, phone)",
    description:
      "Increases the length of plan_id, subscription_status, phone, and username columns in the diviners table to TEXT or VARCHAR(50). Resolves 'value too long for type character varying(20)' errors during trainee-to-diviner upgrade.",
    sortKey: "20260428000100",
    sql: MIG_20260428000100,
  },
  "20260430000002_repair_service_template_links": {
    id: "20260430000002_repair_service_template_links",
    title: "Repair service template links",
    description:
      "Backfills services.template_id from matching service_templates.slug, creates missing diviner_services assignments for active linked services, and installs a trigger so older insert paths that provide a canonical slug automatically attach the matching template_id.",
    sortKey: "20260430000002",
    sql: MIG_20260430000002_RSTL,
  },
  "20260430000001_search_auth_users_by_email_fn": {
    id: "20260430000001_search_auth_users_by_email_fn",
    title: "Search auth users by email RPC",
    description:
      "Creates service-role-only SECURITY DEFINER RPC search_auth_user_ids_by_email(email_query, max_rows). Required by /admin/diviners so the search field can match diviners by auth.users.email even though the diviners table only stores user_id.",
    sortKey: "20260430000001",
    sql: MIG_20260430000001_SAUE,
  },
  "20260423000005_accept_rpc": {
    id: "20260423000005_accept_rpc",
    title: "Affiliate accept RPC + user_id trigger guard — Task 03",
    description:
      "Adds consume_invite_and_activate_junction RPC (atomic: claim invite via UPDATE...RETURNING, activate junction, link canonical account to auth user) plus guard_affiliate_account_user_link trigger on affiliate_accounts. The trigger rejects any UPDATE OF user_id unless the transaction has set the GUC app.allow_affiliate_account_user_link='true'. The RPC is the only code path that sets that GUC via SET LOCAL, so affiliate_accounts.user_id can only be changed via an explicit invite-accept — enforcing D5 (no silent linking by email match alone) at the DB layer. Error codes: P0003 invite_not_claimable (expired/revoked/consumed/unknown), P0004 account_already_linked_to_different_user, P0005 external write attempt to user_id. Must run AFTER 20260423000001. SECURITY DEFINER. Idempotent via CREATE OR REPLACE + DROP TRIGGER IF EXISTS.",
    sortKey: "20260423000005",
    sql: MIG_20260423000005_ACC,
  },
  "20260424000001_phone_sessions_outbound_diviner_call": {
    id: "20260424000001_phone_sessions_outbound_diviner_call",
    title: "Phone sessions: direction flag + outbound_diviner_call session_type",
    description:
      "Additive. Adds phone_sessions.direction VARCHAR(12) NOT NULL DEFAULT 'inbound' with CHECK ('inbound','outbound'); relaxes phone_sessions.session_type CHECK to additionally allow 'outbound_diviner_call' alongside existing 'scheduled_dialin'/'standalone'; adds a composite index on (diviner_id, direction, status). Required by POST /api/chime/voice/call-client and the new Call-client row action on /dashboard/bookings so diviner-originated PSTN legs are distinguishable from client-originated inbound calls. Rollback: DROP COLUMN direction (CHECK extension is safe to leave in place).",
    sortKey: "20260424000001",
    sql: MIG_20260424000001_ODC,
  },
  "20260424000002_astro_ai_responses": {
    id: "20260424000002_astro_ai_responses",
    title: "Astro AI responses persistence (replaces legacy NestJS save endpoint)",
    description:
      "Additive. Creates public.astro_ai_responses table for persisting AI-generated astrological reports (toolname, ai_response JSONB, formData, astro_api_data, natal_chart, summary, multiple chart-image URLs, share URL, timestamps). Adds a nullable user_id FK to auth.users so rows can be attributed to a creator without breaking the legacy spec-shape. Enables RLS with: service_role full; authenticated SELECT-by-id (the UUID acts as the share key, matching the spec's 'password-protected shared links via _id' design); INSERT/UPDATE/DELETE scoped to user_id = auth.uid(). Adds a BEFORE UPDATE trigger that bumps updated_at, an index on (user_id, created_at DESC) for 'my recent reports' lookups, and a partial index on toolname. Required by POST /api/astro-ai/save-astro-ai-response and POST /api/astro-ai/fetch-save-astro-ai-response. Rollback: DROP TRIGGER, DROP FUNCTION, DROP TABLE.",
    sortKey: "20260424000002",
    sql: MIG_20260424000002_AAR,
  },
  "20260427000001_saved_report_linkage": {
    id: "20260427000001_saved_report_linkage",
    title: "Saved report linkage (community domain ↔ astro_ai_responses)",
    description:
      "Additive. Adds natal_report_id/natal_report_generated_at/natal_report_status to community_family_members; full_report_id/full_report_generated_at/full_report_status to monthly_transits; report_id/report_type/report_generated_at/report_status to relationship_charts. CHECK-constrained statuses (missing|generating|generated|failed|stale|locked_for_review) and report_type (friendship|romantic|partnership). Creates community_relationship_reports child table so a single pair can have multiple report types simultaneously, with unique (person_a_id, person_b_id, report_type) and a person_a_id < person_b_id sort guard. Indexed for 'find report by id' and 'list by member+status' patterns. RLS: service_role full; authenticated members see only their own household rows. Existing chart_data / natal_chart / transit_data columns are untouched so legacy rows remain viewable during rollout. Rollback: DROP COLUMN ... and DROP TABLE community_relationship_reports.",
    sortKey: "20260427000001",
    sql: MIG_20260427000001_SRL,
  },
  "20260427000002_ritual_admin_config": {
    id: "20260427000002_ritual_admin_config",
    title: "Ritual admin configuration (definitions + media assets + tag mappings) with seeds",
    description:
      "Additive. Creates three tables to move ritual presentation/asset mapping out of hardcoded constants and into admin-managed records: ritual_definitions (metadata + playback_policy_json + final_override link + label overrides), ritual_media_assets (upload OR external_url with mutually-exclusive CHECK), and ritual_asset_mappings ((tag_key | step_role) → asset_id, scoped 'global' or 'ritual_definition' with partial unique indexes per scope). Triggers bump updated_at, RLS allows service_role full + authenticated read of published/active rows so the runtime resolver works under user sessions. Seeds the four current ritual definitions (3 static + 1 dynamic, all final_override DISABLED so existing playlist behaviour is preserved), seeds 37 ritual_media_assets pointing at the existing S3 URLs from src/lib/community/ritual-video-map.ts, and seeds matching global tag_key → asset_id mappings so the runtime resolver can read DB-only for known tags. Rollback: DROP each table.",
    sortKey: "20260427000002",
    sql: MIG_20260427000002_RAC,
  },
  "20260427000002_affiliate_rls_v2_alignment": {
    id: "20260427000002_affiliate_rls_v2_alignment",
    title: "Affiliate RLS v2 alignment (commission v2 sprint)",
    description:
      "Aligns affiliate-side SELECT policies with the v2 junction model. Pre-v2 policies assumed *.affiliate_id = auth.users.id; v2 changed affiliate_id to point at diviner_affiliates.id (the junction). Replaces the broken diviner_service_affiliates_select_affiliate policy and adds 5 missing policies: affiliate_sees_own_campaigns + affiliate_inserts_own_campaigns + affiliate_updates_own_campaigns on affiliate_campaigns; affiliate_sees_own_clicks on campaign_clicks; affiliate_sees_own_conversions on campaign_conversions. All resolve auth.uid() → affiliate_accounts.user_id → diviner_affiliates.id. The API was always service-role (RLS bypass) so no production regression — but spec §8 promised affiliates can read their slice via auth client and that promise was unfulfilled. Caught by Task 08 RLS test suite. Idempotent + sanity-checked.",
    sortKey: "20260427000002",
    sql: MIG_20260427000002_ARV2A,
  },
  "20260427000003_affiliate_junction_select_policy": {
    id: "20260427000003_affiliate_junction_select_policy",
    title: "Affiliate junction SELECT policy (RLS chain fix)",
    description:
      "Follow-up to 20260427000002. The child-table policies it added all resolve through `diviner_affiliates → affiliate_accounts → user_id`, but `diviner_affiliates` itself only has a diviner-side SELECT policy. With no affiliate-side policy, the IN-subquery returned 0 rows under RLS for the authed affiliate session, making every child policy match nothing. Adds `affiliate_sees_own_junctions` on `diviner_affiliates` resolving `affiliate_account_id → user_id`. Idempotent + sanity-checked. Run AFTER 20260427000002.",
    sortKey: "20260427000003",
    sql: MIG_20260427000003_AJSP,
  },
  "20260427000004_affiliate_rls_security_definer": {
    id: "20260427000004_affiliate_rls_security_definer",
    title: "Affiliate RLS — break policy cycle with SECURITY DEFINER helpers",
    description:
      "Hot-fix for 20260427000003. After that migration, every authed query on the affiliate child tables raised 'infinite recursion detected in policy for relation diviner_affiliates' — `affiliate_accounts.diviner_sees_linked_accounts` queries diviner_affiliates, and the new `affiliate_sees_own_junctions` queries affiliate_accounts. Cycle. Introduces two SECURITY DEFINER helpers — `current_affiliate_junction_ids()` (SETOF UUID) and `current_affiliate_account_id()` (UUID) — that resolve auth.uid() → junction set / account id while bypassing inner RLS. Rewrites all 6 affiliate-side policies from 20260427000002 + 20260427000003 to call these helpers instead of inlined subqueries. Run AFTER 20260427000003.",
    sortKey: "20260427000004",
    sql: MIG_20260427000004_ARSD,
  },
  "20260430000002_affiliate_phase_1_5_general": {
    id: "20260430000002_affiliate_phase_1_5_general",
    title: "Affiliate Phase 1.5 — general-product commissions schema",
    description:
      "Single additive migration enabling general-product affiliate commissions per spec §10 Phase 1.5. Adds `service_templates.is_general` (backfilled from `slug LIKE 'general-%'`), `service_templates.affiliate_program_enabled` toggle, `service_templates.commission_type` (CHECK in 'percent','flat' — corrected from spec wording 'percentage' to match the v2 stamp pipeline; deviation noted in migration header) + `commission_value`. Adds `affiliate_campaigns.owner_affiliate_account_id` for account-direct ownership of general campaigns; extends `owner_affiliate_type` CHECK to allow 'general'; tightens `affiliate_campaigns_owner_consistency` CHECK so general campaigns require account_id + destination_service_template_id and forbid junction/source_assignment. Adds `bookings.commission_source_template_id` parallel to `commission_source_assignment_id`. Adds `campaign_conversions.affiliate_account_id` (always populated for new rows; backfills existing per-diviner rows by resolving junction → account). Extends affiliate-side RLS on `affiliate_campaigns` (SELECT/INSERT/UPDATE) and `campaign_conversions` (SELECT) to recognize general ownership via `current_affiliate_account_id()`. Idempotent + sanity-checked. Run AFTER 20260427000004. (Bumped from ...0001 to ...0002 to avoid collision with 20260430000001_search_auth_users_by_email_fn.sql.)",
    sortKey: "20260430000002",
    sql: MIG_20260430000002_AP15G,
  },
  "20260423000004_fix_invite_rpc_ambiguity": {
    id: "20260423000004_fix_invite_rpc_ambiguity",
    title: "Fix column/variable ambiguity in invite RPCs (Task 02 follow-up)",
    description:
      "Recreates the four invite RPCs (create/resend/resend-by-junction/revoke) with `#variable_conflict use_column` pragma. Their RETURNS TABLE columns share names with real table columns (invite_id, junction_id, affiliate_account_id, email) — without the pragma any unqualified reference inside the function body throws PG 42702 'column reference is ambiguous'. Signatures unchanged so Task 02 API routes work as shipped. Must run AFTER 20260423000003. CREATE OR REPLACE — idempotent.",
    sortKey: "20260423000004",
    sql: MIG_20260423000004_FIX,
  },
  "20260423000003_affiliate_invite_rpc": {
    id: "20260423000003_affiliate_invite_rpc",
    title: "Affiliate invite RPCs (create/resend/resend-by-junction/revoke) — Task 02",
    description:
      "Adds four SECURITY DEFINER functions backing the invite flow: create_affiliate_invite (upsert canonical account + insert pending junction + issue hashed token), resend_affiliate_invite (revoke prior + issue new, bump resent_count), resend_affiliate_invite_by_junction (first-invite for legacy-pending junctions predating the 2026-04-23 flow), revoke_affiliate_invite (mark revoked + delete junction if zero commissions else suspend). All enforce caller ownership (diviner_id = caller) and raise specific SQLSTATE codes: P0001 (blocked or missing required field), P0002 (junction_exists), P0003 (not_found_or_not_owned), P0004 (already_consumed), P0006 (legacy-pending-invalid). Dual-writes legacy diviner_affiliates.{name,email,phone} for pre-Task-06 readers. Runs AFTER 20260423000001 + 20260423000002. Idempotent via CREATE OR REPLACE.",
    sortKey: "20260423000003",
    sql: MIG_20260423000003_INV,
  },
  "20260423000002_fix_diviner_affiliates_rls": {
    id: "20260423000002_fix_diviner_affiliates_rls",
    title: "Fix buggy diviner_own_affiliates RLS policy (2026-04-23 follow-up)",
    description:
      "Rewrites the pre-existing diviner_own_affiliates SELECT policy on diviner_affiliates. Original condition auth.uid() = diviner_id is wrong — diviner_id is a diviners.id, not an auth.users.id, so it never matches and authed diviner sessions saw 0 junction rows via RLS. Previously harmless (all server reads use service_role), but the 2026-04-23 diviner_sees_linked_accounts policy on affiliate_accounts has an EXISTS subquery through diviner_affiliates that runs under caller RLS — the bug made it return empty. Fix: route through diviners.user_id = auth.uid(). Must run AFTER 20260423000001. Idempotent.",
    sortKey: "20260423000002",
    sql: MIG_20260423000002_RLS,
  },
  "20260423000001_affiliate_identity_refactor": {
    id: "20260423000001_affiliate_identity_refactor",
    title: "Affiliate Identity Refactor — canonical affiliate_accounts + invites + junction reshape",
    description:
      "Introduces canonical affiliate_accounts identity table (email CITEXT UNIQUE, user_id UUID UNIQUE, platform-wide status, profile + payout fields). Adds affiliate_invites (hashed SHA-256 tokens, 14d expiry). Reshapes diviner_affiliates into a junction via additive ALTER (affiliate_account_id FK + invited_at + accepted_at). Backfills the 14 existing diviner_affiliates rows into the new model: one canonical account per unique email, auth.users link attempted by email match, decisions logged in _affiliate_backfill_audit. RLS on both new tables (service_role all + self-select/update + diviner-linked). Reuses aff_updated_at() trigger. Strictly additive — no DROPs, no FK rewiring; all downstream FKs on diviner_affiliates.id remain untouched. End-of-migration assertion fails loudly if any junction row is left without affiliate_account_id. Idempotent: IF NOT EXISTS guards + WHERE affiliate_account_id IS NULL on the backfill UPDATEs. Sprint plan: docs/tasks/2026-04-23/affiliate-identity-refactor/. Task 02 adds create_affiliate_invite RPC, Task 03 adds consume_invite_and_activate_junction RPC + user-link trigger guard.",
    sortKey: "20260423000001",
    sql: MIG_20260423000001_AIR,
  },
  "20260424000010_affiliate_commission_v2_additive": {
    id: "20260424000010_affiliate_commission_v2_additive",
    title: "Affiliate Commission v2 — additive (rate history, booking stamp, admin action log)",
    description:
      "Task 01a of the Affiliate Commission v2 sprint. Strictly additive. Creates diviner_service_affiliate_rate_history (full rate-edit audit keyed on assignment_id) and admin_action_log (force-revoke / force-archive / reverse events). Adds three stamp columns to bookings (commission_source_assignment_id, commission_rate_type_stamp, commission_rate_value_stamp) so the rate that pays out on a conversion is captured at booking creation time, not resolved live at webhook (spec §3.8). Adds rate_type_used + rate_value_used on campaign_conversions for permanent webhook-time audit. Extends affiliate_campaigns.status CHECK to allow 'archived'. Hardens campaign_conversions.campaign_id FK from ON DELETE CASCADE to ON DELETE RESTRICT so hard-delete of a campaign with conversions errors rather than cascade-wiping history. RLS: service_role ALL on both new tables, plus diviner/affiliate scoped SELECT on rate history and admin-only SELECT on action log. Idempotent: IF NOT EXISTS guards, DO blocks on policy + constraint work, end-of-migration sanity check raises if any of the four required additions didn't land. Spec: docs/specs/affiliate-commission-system.md (v1.2).",
    sortKey: "20260424000010",
    sql: MIG_20260424000010_ACV2A,
  },
  "20260424009001_affiliate_commission_v2_destructive": {
    id: "20260424009001_affiliate_commission_v2_destructive",
    title: "Affiliate Commission v2 — destructive (drop System A tables, trim status enums)",
    description:
      "Task 01b of the Affiliate Commission v2 sprint. **DESTRUCTIVE** — drops 6 System A tables (affiliate_commission_history, affiliate_commissions, affiliate_payouts, affiliate_payout_items, affiliate_clicks, affiliate_referral_links) with CASCADE. Defensive backfill collapses any 'suspended' affiliate_accounts.status values to 'blocked' before trimming the enum to (unclaimed | active | blocked). Trims affiliate_campaigns.status to (active | paused | archived | expired); pre-existing 'draft' rows become 'active', 'completed' becomes 'archived'. Relaxes affiliate_campaigns_owner_consistency CHECK so the snapshot columns are no longer required (rate now lives on the booking stamp per spec v1.2). The snapshot columns themselves are NOT dropped — the advocate service still writes them, and dropping them is deferred to a future cross-service cleanup. Run AFTER 01a additive + Tasks 02 + 04 + 07-Phase-A have shipped. Idempotent (DROP IF EXISTS, status updates are no-ops on already-clean data, CHECK swap uses IF EXISTS). End-of-migration sanity check raises if anything didn't drop or any out-of-range status survived.",
    sortKey: "20260424009001",
    sql: MIG_20260424009001_ACV2D,
  },
  "20260428000003_ritual_global_settings": {
    id: "20260428000003_ritual_global_settings",
    title: "Ritual global playback settings (singleton table)",
    description:
      "Creates the ritual_global_settings singleton table for platform-wide video player behaviors (autoplay, loop, controls, muted) and seeds default values. Safe to re-run.",
    sortKey: "20260428000003",
    sql: MIG_20260428000003_RGS,
  },
  "20260413000184_monthly_transit_lifecycle": {
    id: "20260413000184_monthly_transit_lifecycle",
    title: "Monthly Transit Lifecycle States (generation_status, failure tracking)",
    description:
      "Extends monthly_transits with full lifecycle tracking: generation_status (pending|generated|notified|failed|suppressed), failure_reason, retry_count, last_attempted_at, notified_at, notification_sent. Backfills existing rows to generation_status=generated (or notified when notification_sent=true). Adds indexes for status filtering and family_member_id+month lookups. Required by the ensure-monthly-transits service and the /community/transits page. Strictly additive — IF NOT EXISTS on all columns. Idempotent.",
    sortKey: "20260413000184",
    sql: MIG_20260413000184_MTL,
  },
  "20260504000001_training_lessons_audio_url": {
    id: "20260504000001_training_lessons_audio_url",
    title: "Training lessons — audio_url (Mystery School Foundation, Phase 2)",
    description:
      "Adds nullable audio_url TEXT to training_lessons so admins can attach a dedicated audio asset (meditation, weekly intro, guided practice) to a lesson without overloading video_url or pasting URLs into freeform content. Powers the new Audio section in the admin lesson editor and the inline audio player in the trainee lesson view. Strictly additive — IF NOT EXISTS, nullable, no constraints/indexes/RLS changes. Backward-safe: every existing read/write path that does not mention audio_url continues to work unchanged. Spec: docs/specs/mystery-school-training-unification.md.",
    sortKey: "20260504000001",
    sql: MIG_20260504000001_TLAU,
  },
  "20260504000002_mystery_school_foundation_seed": {
    id: "20260504000002_mystery_school_foundation_seed",
    title: "Mystery School Foundation — seed program + 12 week-categories (Phase 3)",
    description:
      "Seeds the canonical 'Mystery School Foundation' training program (allowed_roles=['is_mystery_school'], is_sequential=true, is_active=true) plus 12 empty week-categories (Week 1..Week 12, priorities 1..12, is_sequential=true). Lessons are NOT seeded — admins populate them through /admin/training/lessons/new. Idempotent: program guarded by NOT EXISTS on name, categories guarded by (training_id, priority). Re-running is a no-op. After running, the new /mystery-school/training adapter route returns the 12 (empty) weeks; the legacy fallback continues to render until weeks have at least one lesson. Spec: docs/specs/mystery-school-training-unification.md.",
    sortKey: "20260504000002",
    sql: MIG_20260504000002_MSFS,
  },
  "20260505000001_affiliate_campaigns_channel_marketing_kit": {
    id: "20260505000001_affiliate_campaigns_channel_marketing_kit",
    title: "Affiliate Phase 1.5 follow-up — allow channel='marketing_kit'",
    description:
      "Extends the affiliate_campaigns.channel CHECK allowlist to include 'marketing_kit'. The original allowlist (from 20260417000010) predated Phase 1.5 and only allowed social/email/direct/other. The Marketing Kit lazy-create in fetchMarketingKitItems tags every spawned general campaign with channel='marketing_kit' so analytics can attribute conversions to that surface — without this fix the insert fails with affiliate_campaigns_channel_check violation and the Marketing Kit on /affiliate/dashboard renders empty. Idempotent: DROP CONSTRAINT IF EXISTS + re-ADD with the extended list. NULL is preserved (the old constraint allowed it implicitly via three-valued logic; the new one allows it explicitly). Run AFTER 20260417000010. Spec: docs/specs/affiliate-commission-system.md §10.",
    sortKey: "20260505000001",
    sql: MIG_20260505000001_ACCMK,
  },
  "20260505000002_booking_affiliate_commission_cents": {
    id: "20260505000002_booking_affiliate_commission_cents",
    title: "Booking affiliate commission cents — carve-out persistence",
    description:
      "Adds bookings.affiliate_commission_amount_cents (nullable INTEGER, CHECK ≥ 0). Persists the cents value carved out from the diviner's destination transfer at Stripe PaymentIntent creation, so the three credit paths (confirm-payment, webhook, sync-booking) and the revenue_ledger_entries write all read the same source of truth — no off-by-one rounding against what was actually retained on platform balance. Pre-existing bookings stay NULL; credit code falls back to recomputing via computeCommissionCents for them. Idempotent + sanity-checked. Sprint plan: docs/tasks/2026-05-05/affiliate-carve-out-at-booking-creation/.",
    sortKey: "20260505000002",
    sql: MIG_20260505000002_BACC,
  },
  "20260505000003_affiliate_payouts_phase_2": {
    id: "20260505000003_affiliate_payouts_phase_2",
    title: "Affiliate Payouts Phase 2 — Stripe Connect identity, payouts tables, kill-switch",
    description:
      "Phase 2 schema: adds Stripe Express identity columns + balance_offset_cents to affiliate_accounts; payout_id / paid_at / paid_amount_cents / payout_status to campaign_conversions; creates affiliate_payouts + affiliate_payout_items; adds platform_settings.affiliate_payouts_enabled kill-switch (defaults FALSE); extends admin_action_log.action_kind CHECK with 4 Phase-2 kinds. Bundles Task 10 instrumentation: first_conversion_at + first_payout_at + affiliate_onboarding_rejections. Hard-fails if Phase 1.5 carve-out (bookings.affiliate_commission_amount_cents) hasn't shipped. Idempotent + RLS + sanity-checked. Sprint plan: docs/tasks/2026-05-05/affiliate-payouts-phase-2/.",
    sortKey: "20260505000003",
    sql: MIG_20260505000003_AP2,
  },
  "20260505000004_affiliate_phase_3_analytics": {
    id: "20260505000004_affiliate_phase_3_analytics",
    title: "Affiliate Analytics Phase 3 — read-only helper functions",
    description:
      "Phase 3 dashboards + aggregations layer. Adds 7 SECURITY-INVOKER PostgreSQL helper functions used by admin/affiliate analytics API routes: affiliate_daily_earnings, affiliate_own_cohort_retention, affiliate_median_time_to_payout_days, affiliate_payout_velocity_histogram, affiliate_campaign_roi, affiliate_referred_client_retention, affiliate_1099_ytd_totals (timezone America/New_York for IRS compliance). No table changes — pure additive read layer. Hard-fails if Phase 2 schema (affiliate_payouts, campaign_conversions.payout_status, affiliate_accounts.first_payout_at) hasn't shipped. Idempotent (CREATE OR REPLACE FUNCTION). Sprint plan: docs/tasks/2026-05-05/affiliate-analytics-phase-3/.",
    sortKey: "20260505000004",
    sql: MIG_20260505000004_AP3,
  },
  "20260506000001_community_self_canonical_repair": {
    id: "20260506000001_community_self_canonical_repair",
    title: "Community: canonical self-row repair + uniqueness guard",
    description:
      "Repairs duplicate `relationship='self'` rows in community_family_members per member_id by picking the canonical row by score (valid lat/lng + linked user_id + has natal_report_id + latest update), re-pointing CASCADE FK references (monthly_transits, relationship_charts, community_relationship_reports, return_event_reminders, natal_regeneration_audit) onto the canonical row, then deleting the losing rows. Adds a partial UNIQUE index `ux_family_members_one_self_per_member` preventing future duplicates per member_id where LOWER(relationship)='self'. Preserves astro_ai_responses (no FK to family_member_id, verified). Idempotent + sanity-checked. Sprint plan: tasks/06.05.2026/community-transits-profile-and-display-fixes/.",
    sortKey: "20260506000001",
    sql: MIG_20260506000001_CSCR,
  },
  "20260506000002_mystery_school_foundation_completed_at": {
    id: "20260506000002_mystery_school_foundation_completed_at",
    title: "Mystery School: foundation_completed_at milestone column",
    description:
      "Adds nullable TIMESTAMPTZ column mystery_school_students.foundation_completed_at + partial index. Records the moment a student finished Admin Training-backed Foundation and was advanced to training_status='decans'. Best-effort backfill from started_at/enrolled_at for students already in 'decans' or 'graduated'. Idempotent + sanity-checked. Sprint plan: docs/tasks/2026-05-06/mystery-school-foundation-decan-access-flow.md.",
    sortKey: "20260506000002",
    sql: MIG_20260506000002_MSFC,
  },
  "20260506000003_mystery_school_decan_admin_content": {
    id: "20260506000003_mystery_school_decan_admin_content",
    title: "Mystery School: Decan admin content (rich content + journals + resources)",
    description:
      "Adds admin-managed content columns to decans (intro_video_url, intro_audio_url, ritual_video_url, tarot_explanation, learning_objectives, practice_focus_*, related_audio_url, content_active, content_updated_at). Creates 3 new tables: decan_instructor_journals (Beto/admin per-Decan logs with text/audio/video entries), decan_resources (per-Decan PDFs/videos/audio/links/images), and decan_student_journal_entries (optional student journals with admin review/feedback/rating; complements required scry_journals + mundane_journals which are NOT touched). Includes RLS (service-role full access; authenticated read of published content; self-read/write/update of own draft+revision_requested entries) + updated_at triggers + sanity checks. Idempotent. Sprint plan: docs/tasks/2026-05-06/mystery-school-decan-admin-content-upgrade.md.",
    sortKey: "20260506000003",
    sql: MIG_20260506000003_MSDA,
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
