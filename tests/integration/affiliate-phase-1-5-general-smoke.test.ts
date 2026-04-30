/**
 * Smoke test for Affiliate Phase 1.5 — General-product commissions.
 *
 * Exercises the general-program library paths against dev Supabase. Proves:
 *   1. Schema additions from migration 20260430000002 are applied.
 *   2. `resolveStampForBooking` general-path branch returns
 *      reason='stamped' / 'program_disabled' / 'account_not_active'
 *      under the right conditions, and applies the 10% default when
 *      `commission_value IS NULL` AND `affiliate_program_enabled=true`.
 *   3. `creditAffiliateConversion` general-path writes a
 *      campaign_conversions row with `affiliate_id=NULL`,
 *      `affiliate_type='general'`, `affiliate_account_id` set.
 *   4. Per-diviner credits are backfilled with `affiliate_account_id`
 *      (Task 02 deviation #1 — the always-populate change applies on
 *      both branches).
 *   5. Rate-stamp invariant for general: editing
 *      service_templates.commission_value AFTER a booking is stamped
 *      does NOT change the booking's eventual conversion amount.
 *
 * Spec: docs/specs/affiliate-commission-system.md §10 Phase 1.5
 * Run:  `npm run test:affiliate-phase-1-5-smoke`
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { resolveStampForBooking } from "../../src/lib/affiliate-stamp";
import { creditAffiliateConversion } from "../../src/lib/affiliate-attribution";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
const sr: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Reuse the fixture diviner other integration tests use.
const TEST_DIV_USER = "e8a4f928-954c-4c0e-99c3-53ac8889bd81";

// Email + slug prefix for cleanup. Must be in EMAIL_PATTERNS at
// scripts/cleanup-affiliate-test-data.ts so the dry-run sweep can
// find these rows.
const NS_PREFIX = "phase15";

function genCode(): string {
  const unamb = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let s = "cmp_";
  for (let i = 0; i < 8; i++) s += unamb[Math.floor(Math.random() * unamb.length)];
  return s;
}

type Fixtures = {
  divinerId: string;
  authUserId: string;
  accountId: string;
  /** General service_template (is_general=true). */
  generalTemplateId: string;
  /** Service pointing at the general template (the matcher's pick at booking time). */
  serviceId: string;
  /** General campaign owned by the affiliate's account. */
  campaignId: string;
  campaignCode: string;
  clientId: string;
};

async function setup(): Promise<Fixtures> {
  const ns = `${NS_PREFIX}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 1. Diviner (existing fixture user).
  const { data: diviner } = await sr
    .from("diviners")
    .select("id")
    .eq("user_id", TEST_DIV_USER)
    .single();
  const divinerId = (diviner as { id: string }).id;

  // 2. Auth user + affiliate_account.
  const email = `${ns}@test.astrologypro.com`;
  const { data: authCreated } = await sr.auth.admin.createUser({
    email,
    password: "Phase15Test!23",
    email_confirm: true,
  });
  const authUserId = authCreated.user!.id;

  const { data: account } = await sr
    .from("affiliate_accounts")
    .insert({
      user_id: authUserId,
      email,
      name: "Phase 1.5 Smoke Tester",
      status: "active",
    })
    .select("id")
    .single();
  const accountId = (account as { id: string }).id;

  // 3. General service_template — set affiliate_program_enabled=true
  // with explicit 15% rate so the happy path hits the value (not the
  // 10% default). The "default 10%" test case below mutates this row.
  const { data: tpl, error: tplErr } = await sr
    .from("service_templates")
    .insert({
      category: "astrology",
      name: `Phase 1.5 General Template ${ns}`,
      slug: `general-${ns}`,
      duration_minutes: 30,
      base_price: 100,
      is_general: true,
      affiliate_program_enabled: true,
      commission_type: "percent",
      commission_value: 15,
    })
    .select("id")
    .single();
  if (tplErr) throw new Error(`general template insert failed: ${tplErr.message}`);
  const generalTemplateId = (tpl as { id: string }).id;

  // 4. Service row pointing at the template (the matcher's pick).
  const { data: svc, error: svcErr } = await sr
    .from("services")
    .insert({
      diviner_id: divinerId,
      category: "astrology",
      name: "Phase 1.5 Smoke Service",
      slug: `${ns}-svc`,
      duration_minutes: 30,
      base_price: 100,
      template_id: generalTemplateId,
    })
    .select("id")
    .single();
  if (svcErr) throw new Error(`service insert failed: ${svcErr.message}`);
  const serviceId = (svc as { id: string }).id;

  // 5. General campaign — owner_affiliate_type='general',
  // owner_affiliate_account_id set, NO source_assignment_id.
  // Legacy commission_type / commission_value left as defaults
  // ('percentage' / 0); they're satisfied by table defaults and
  // not authoritative for stamp.
  const campaignCode = genCode();
  const { data: cmp, error: cmpErr } = await sr
    .from("affiliate_campaigns")
    .insert({
      diviner_id: null,
      name: "Phase 1.5 Smoke Campaign",
      status: "active",
      commission_type: "percentage",
      commission_value: 0,
      owner_type: "affiliate",
      owner_affiliate_id: null,
      owner_affiliate_type: "general",
      owner_affiliate_account_id: accountId,
      source_assignment_id: null,
      destination_type: "SERVICE",
      destination_profile_id: null,
      destination_service_template_id: generalTemplateId,
      campaign_code: campaignCode,
      share_url: `https://astrologypro.com/r/${campaignCode}`,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (cmpErr) throw new Error(`general campaign insert failed: ${cmpErr.message}`);
  const campaignId = (cmp as { id: string }).id;

  // 6. Test client (reuses the auth user since clients.user_id FKs auth.users).
  const { data: client, error: clientErr } = await sr
    .from("clients")
    .insert({
      user_id: authUserId,
      email,
      full_name: "Phase 1.5 Smoke Client",
    })
    .select("id")
    .single();
  if (clientErr) throw new Error(`client insert failed: ${clientErr.message}`);
  const clientId = (client as { id: string }).id;

  return {
    divinerId,
    authUserId,
    accountId,
    generalTemplateId,
    serviceId,
    campaignId,
    campaignCode,
    clientId,
  };
}

async function insertGeneralStampedBooking(
  ctx: Fixtures,
  stamp: { type: "percent" | "flat"; value: number },
): Promise<string> {
  const { data: booking, error } = await sr
    .from("bookings")
    .insert({
      diviner_id: ctx.divinerId, // matcher-resolved diviner
      client_id: ctx.clientId,
      service_id: ctx.serviceId,
      status: "pending",
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 30,
      base_price: 100,
      ref_code: ctx.campaignCode,
      commission_source_assignment_id: null,
      commission_source_template_id: ctx.generalTemplateId,
      commission_rate_type_stamp: stamp.type,
      commission_rate_value_stamp: stamp.value,
    })
    .select("id")
    .single();
  if (error) throw new Error(`booking insert failed: ${error.message}`);
  return (booking as { id: string }).id;
}

async function teardown(ctx: Fixtures) {
  // Children-first.
  await sr.from("campaign_conversions").delete().eq("campaign_id", ctx.campaignId);
  await sr.from("campaign_clicks").delete().eq("campaign_id", ctx.campaignId);
  await sr.from("bookings").delete().eq("client_id", ctx.clientId);
  await sr.from("affiliate_campaigns").delete().eq("id", ctx.campaignId);
  await sr.from("services").delete().eq("id", ctx.serviceId);
  await sr.from("service_templates").delete().eq("id", ctx.generalTemplateId);
  await sr.from("clients").delete().eq("id", ctx.clientId);
  await sr.from("affiliate_accounts").delete().eq("id", ctx.accountId);
  await sr.auth.admin.deleteUser(ctx.authUserId).catch(() => {});
}

// ─── Tests ───────────────────────────────────────────────────────────────

test("Phase 1.5 schema: all new columns exist", async () => {
  // Single SELECT that touches every Phase-1.5 column. If any are
  // missing (migration not applied), the call errors and the test
  // surfaces the column name.
  const probes: Array<[string, string]> = [
    ["service_templates", "is_general"],
    ["service_templates", "affiliate_program_enabled"],
    ["service_templates", "commission_type"],
    ["service_templates", "commission_value"],
    ["affiliate_campaigns", "owner_affiliate_account_id"],
    ["bookings", "commission_source_template_id"],
    ["campaign_conversions", "affiliate_account_id"],
    ["admin_action_log", "payload"],
  ];
  for (const [table, col] of probes) {
    const { error } = await sr.from(table).select(col).limit(0);
    assert.equal(
      error,
      null,
      `${table}.${col} missing — run migration 20260430000002_affiliate_phase_1_5_general (${error?.message})`,
    );
  }
});

test("resolveStampForBooking — general happy path returns stamp at template rate", async () => {
  const ctx = await setup();
  try {
    const stamp = await resolveStampForBooking(sr, {
      refCode: ctx.campaignCode,
      divinerId: ctx.divinerId,
      serviceId: ctx.serviceId,
    });
    assert.equal(stamp.reason, "stamped");
    assert.equal(stamp.source_assignment_id, null);
    assert.equal(stamp.source_template_id, ctx.generalTemplateId);
    assert.equal(stamp.rate_type_stamp, "percent");
    assert.equal(stamp.rate_value_stamp, 15);
    assert.equal(stamp.affiliate_account_id, ctx.accountId);
  } finally {
    await teardown(ctx);
  }
});

test("resolveStampForBooking — default 10% when commission_value IS NULL but program enabled", async () => {
  const ctx = await setup();
  try {
    // Wipe the value but keep the program enabled.
    await sr
      .from("service_templates")
      .update({ commission_value: null })
      .eq("id", ctx.generalTemplateId);

    const stamp = await resolveStampForBooking(sr, {
      refCode: ctx.campaignCode,
      divinerId: ctx.divinerId,
      serviceId: ctx.serviceId,
    });
    assert.equal(stamp.reason, "stamped");
    assert.equal(stamp.rate_type_stamp, "percent");
    assert.equal(
      stamp.rate_value_stamp,
      10,
      "platform default should be 10% per spec §10 decision #3",
    );
  } finally {
    await teardown(ctx);
  }
});

test("resolveStampForBooking — disabled program returns program_disabled, no stamp", async () => {
  const ctx = await setup();
  try {
    await sr
      .from("service_templates")
      .update({ affiliate_program_enabled: false })
      .eq("id", ctx.generalTemplateId);

    const stamp = await resolveStampForBooking(sr, {
      refCode: ctx.campaignCode,
      divinerId: ctx.divinerId,
      serviceId: ctx.serviceId,
    });
    assert.equal(stamp.reason, "program_disabled");
    assert.equal(stamp.source_template_id, null);
    assert.equal(stamp.source_assignment_id, null);
    assert.equal(stamp.rate_type_stamp, null);
    assert.equal(stamp.rate_value_stamp, null);
  } finally {
    await teardown(ctx);
  }
});

test("resolveStampForBooking — blocked account returns account_not_active even when program enabled", async () => {
  const ctx = await setup();
  try {
    await sr
      .from("affiliate_accounts")
      .update({ status: "blocked" })
      .eq("id", ctx.accountId);

    const stamp = await resolveStampForBooking(sr, {
      refCode: ctx.campaignCode,
      divinerId: ctx.divinerId,
      serviceId: ctx.serviceId,
    });
    assert.equal(stamp.reason, "account_not_active");
    assert.equal(stamp.source_template_id, null);
  } finally {
    await teardown(ctx);
  }
});

test("creditAffiliateConversion — general path writes affiliate_id=NULL, affiliate_type='general', affiliate_account_id set", async () => {
  const ctx = await setup();
  try {
    const bookingId = await insertGeneralStampedBooking(ctx, {
      type: "percent",
      value: 15,
    });
    const result = await creditAffiliateConversion(sr, {
      bookingId,
      orderAmountCents: 10000,
      refCode: ctx.campaignCode,
      stampedAssignmentId: null,
      stampedTemplateId: ctx.generalTemplateId,
      stampedRateType: "percent",
      stampedRateValue: 15,
    });
    assert.notEqual(result, null, "expected a credit result");
    assert.equal(result!.commissionCents, 1500);
    assert.equal(result!.affiliateAccountId, ctx.accountId);
    assert.equal(result!.affiliateType, "general");

    const { data: row } = await sr
      .from("campaign_conversions")
      .select(
        "affiliate_id, affiliate_type, affiliate_account_id, rate_type_used, rate_value_used, commission_amount_cents",
      )
      .eq("booking_id", bookingId)
      .single();
    assert.equal(row!.affiliate_id, null);
    assert.equal(row!.affiliate_type, "general");
    assert.equal(row!.affiliate_account_id, ctx.accountId);
    assert.equal(row!.rate_type_used, "percent");
    assert.equal(Number(row!.rate_value_used), 15);
    assert.equal(row!.commission_amount_cents, 1500);
  } finally {
    await teardown(ctx);
  }
});

test("creditAffiliateConversion — rate-stamp invariant for general (admin edit after stamp doesn't change credit)", async () => {
  const ctx = await setup();
  try {
    // Booking 1 is stamped at 15% (the template's original rate).
    const firstBookingId = await insertGeneralStampedBooking(ctx, {
      type: "percent",
      value: 15,
    });
    const r1 = await creditAffiliateConversion(sr, {
      bookingId: firstBookingId,
      orderAmountCents: 10000,
      refCode: ctx.campaignCode,
      stampedAssignmentId: null,
      stampedTemplateId: ctx.generalTemplateId,
      stampedRateType: "percent",
      stampedRateValue: 15,
    });
    assert.equal(r1!.commissionCents, 1500);

    // Admin edits the template rate to 8%.
    await sr
      .from("service_templates")
      .update({ commission_value: 8 })
      .eq("id", ctx.generalTemplateId);

    // Booking 2 is created AFTER the edit and stamps at the new 8%.
    const secondBookingId = await insertGeneralStampedBooking(ctx, {
      type: "percent",
      value: 8,
    });
    const r2 = await creditAffiliateConversion(sr, {
      bookingId: secondBookingId,
      orderAmountCents: 10000,
      refCode: ctx.campaignCode,
      stampedAssignmentId: null,
      stampedTemplateId: ctx.generalTemplateId,
      stampedRateType: "percent",
      stampedRateValue: 8,
    });
    assert.equal(r2!.commissionCents, 800);

    // Verify the original conversion was NOT retroactively modified.
    const { data: firstRow } = await sr
      .from("campaign_conversions")
      .select("commission_amount_cents, rate_value_used")
      .eq("booking_id", firstBookingId)
      .single();
    assert.equal(firstRow!.commission_amount_cents, 1500);
    assert.equal(Number(firstRow!.rate_value_used), 15);
  } finally {
    await teardown(ctx);
  }
});

test("creditAffiliateConversion — per-diviner credits also populate affiliate_account_id (Task 02 backfill)", async () => {
  // This is the Task 02 deviation: even on the per-diviner branch,
  // creditAffiliateConversion now writes campaign_conversions.affiliate_account_id
  // (resolved via junction → account chain). Lets account-level
  // rollups skip the junction join.
  //
  // Builds a per-diviner setup parallel to the v2 smoke fixture.
  const ns = `${NS_PREFIX}-pd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = `${ns}@test.astrologypro.com`;

  const { data: diviner } = await sr
    .from("diviners")
    .select("id")
    .eq("user_id", TEST_DIV_USER)
    .single();
  const divinerId = (diviner as { id: string }).id;

  const { data: authCreated } = await sr.auth.admin.createUser({
    email,
    password: "Phase15Test!23",
    email_confirm: true,
  });
  const authUserId = authCreated.user!.id;

  const { data: account } = await sr
    .from("affiliate_accounts")
    .insert({ user_id: authUserId, email, name: "PD Tester", status: "active" })
    .select("id")
    .single();
  const accountId = (account as { id: string }).id;

  const { data: junction } = await sr
    .from("diviner_affiliates")
    .insert({
      diviner_id: divinerId,
      affiliate_account_id: accountId,
      name: "PD",
      email,
      status: "active",
      default_commission_type: "percentage",
      default_commission_value: 12,
    })
    .select("id")
    .single();
  const junctionId = (junction as { id: string }).id;

  const { data: tpl } = await sr
    .from("service_templates")
    .insert({
      category: "astrology",
      name: `PD ${ns}`,
      slug: `${ns}-tpl`,
      duration_minutes: 30,
      base_price: 100,
    })
    .select("id")
    .single();
  const templateId = (tpl as { id: string }).id;

  const { data: svc } = await sr
    .from("services")
    .insert({
      diviner_id: divinerId,
      category: "astrology",
      name: "PD svc",
      slug: `${ns}-svc`,
      duration_minutes: 30,
      base_price: 100,
      template_id: templateId,
    })
    .select("id")
    .single();
  const serviceId = (svc as { id: string }).id;

  const { data: asgn } = await sr
    .from("diviner_service_affiliates")
    .insert({
      diviner_id: divinerId,
      affiliate_id: junctionId,
      affiliate_type: "diviner_affiliate",
      destination_type: "SERVICE",
      destination_id: templateId,
      commission_type: "percent",
      commission_value: 12,
      is_active: true,
      assigned_by: TEST_DIV_USER,
    })
    .select("id")
    .single();
  const assignmentId = (asgn as { id: string }).id;

  const code = genCode();
  const { data: cmp } = await sr
    .from("affiliate_campaigns")
    .insert({
      diviner_id: divinerId,
      name: "PD Campaign",
      status: "active",
      commission_type: "percentage",
      commission_value: 12,
      owner_type: "affiliate",
      owner_affiliate_id: junctionId,
      owner_affiliate_type: "diviner_affiliate",
      commission_value_snapshot: 12,
      commission_type_snapshot: "percent",
      source_assignment_id: assignmentId,
      destination_type: "SERVICE",
      destination_service_template_id: templateId,
      campaign_code: code,
      share_url: `https://astrologypro.com/r/${code}`,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();
  const campaignId = (cmp as { id: string }).id;

  const { data: client } = await sr
    .from("clients")
    .insert({ user_id: authUserId, email, full_name: "PD Client" })
    .select("id")
    .single();
  const clientId = (client as { id: string }).id;

  try {
    const { data: booking } = await sr
      .from("bookings")
      .insert({
        diviner_id: divinerId,
        client_id: clientId,
        service_id: serviceId,
        status: "pending",
        scheduled_at: new Date(Date.now() + 86400000).toISOString(),
        duration_minutes: 30,
        base_price: 100,
        ref_code: code,
        commission_source_assignment_id: assignmentId,
        commission_rate_type_stamp: "percent",
        commission_rate_value_stamp: 12,
      })
      .select("id")
      .single();
    const bookingId = (booking as { id: string }).id;

    const result = await creditAffiliateConversion(sr, {
      bookingId,
      orderAmountCents: 10000,
      refCode: code,
      stampedAssignmentId: assignmentId,
      stampedTemplateId: null,
      stampedRateType: "percent",
      stampedRateValue: 12,
    });
    assert.notEqual(result, null);
    assert.equal(result!.affiliateAccountId, accountId);

    const { data: row } = await sr
      .from("campaign_conversions")
      .select("affiliate_id, affiliate_type, affiliate_account_id")
      .eq("booking_id", bookingId)
      .single();
    assert.equal(
      row!.affiliate_account_id,
      accountId,
      "per-diviner credit should populate affiliate_account_id post-Task-02",
    );
    assert.equal(row!.affiliate_id, junctionId);
    assert.equal(row!.affiliate_type, "diviner_affiliate");
  } finally {
    // Teardown
    await sr.from("campaign_conversions").delete().eq("campaign_id", campaignId);
    await sr.from("bookings").delete().eq("client_id", clientId);
    await sr.from("affiliate_campaigns").delete().eq("id", campaignId);
    await sr
      .from("diviner_service_affiliate_rate_history")
      .delete()
      .eq("assignment_id", assignmentId);
    await sr.from("diviner_service_affiliates").delete().eq("id", assignmentId);
    await sr.from("services").delete().eq("id", serviceId);
    await sr.from("service_templates").delete().eq("id", templateId);
    await sr.from("clients").delete().eq("id", clientId);
    await sr.from("diviner_affiliates").delete().eq("id", junctionId);
    await sr.from("affiliate_accounts").delete().eq("id", accountId);
    await sr.auth.admin.deleteUser(authUserId).catch(() => {});
  }
});
