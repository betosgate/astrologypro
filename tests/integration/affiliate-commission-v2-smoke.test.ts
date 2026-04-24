/**
 * Smoke test for Affiliate Commission v2 (Tasks 03 + 04 + 05 + 06).
 *
 * Exercises the critical library-layer paths against dev Supabase without
 * requiring a browser, HTTP round-trip, or live Stripe. Proves:
 *   1. Schema additions from Task 01a are applied.
 *   2. `resolveStampForBooking` returns correct stamps under the 5
 *      §3.8 conditions (valid campaign vs blocked account vs revoked
 *      assignment vs destination mismatch).
 *   3. `creditAffiliateConversion` honors the booking stamp and writes
 *      `rate_type_used` / `rate_value_used` to `campaign_conversions`.
 *   4. A rate edit after the stamp was captured does NOT change
 *      commission — the stamp is authoritative at webhook time.
 *   5. Blocking an affiliate account at webhook time blocks the
 *      conversion credit even if the stamp is set (fraud enforcement).
 *
 * Run: `npm run test:affiliate-commission-v2-smoke`
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  resolveStampForBooking,
} from "../../src/lib/affiliate-stamp";
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

type Fixtures = {
  divinerId: string;
  accountId: string;
  junctionId: string;
  serviceId: string;
  templateId: string;
  assignmentId: string;
  campaignId: string;
  campaignCode: string;
  cleanupUserId: string | null;
  clientId: string;
};

async function setup(): Promise<Fixtures> {
  // 1. Diviner
  const { data: diviner } = await sr
    .from("diviners")
    .select("id")
    .eq("user_id", TEST_DIV_USER)
    .single();
  const divinerId = (diviner as { id: string }).id;

  // 2. Auth user + affiliate_account (canonical identity)
  const email = `v2-smoke+${Date.now()}@test.astrologypro.com`;
  const { data: authCreated } = await sr.auth.admin.createUser({
    email,
    password: "TempSmoke12345!",
    email_confirm: true,
  });
  const authUserId = authCreated.user!.id;

  const { data: account } = await sr
    .from("affiliate_accounts")
    .insert({
      user_id: authUserId,
      email,
      name: "V2 Smoke Tester",
      status: "active",
    })
    .select("id")
    .single();
  const accountId = (account as { id: string }).id;

  // 3. Junction
  const { data: junction } = await sr
    .from("diviner_affiliates")
    .insert({
      diviner_id: divinerId,
      affiliate_account_id: accountId,
      name: "V2 Smoke",
      email,
      status: "active",
      default_commission_type: "percentage",
      default_commission_value: 15,
    })
    .select("id")
    .single();
  const junctionId = (junction as { id: string }).id;

  // 4. Service + template
  const { data: templateRow } = await sr
    .from("service_templates")
    .insert({
      category: "astrology",
      name: `V2 Smoke Template ${Date.now()}`,
      slug: `v2-smoke-${Date.now()}`,
      duration_minutes: 30,
      base_price: 100,
    })
    .select("id")
    .single();
  const templateId = (templateRow as { id: string }).id;

  const { data: svc } = await sr
    .from("services")
    .insert({
      diviner_id: divinerId,
      category: "astrology",
      name: "V2 Smoke Service",
      slug: `v2-smoke-svc-${Date.now()}`,
      duration_minutes: 30,
      base_price: 100,
      template_id: templateId,
    })
    .select("id")
    .single();
  const serviceId = (svc as { id: string }).id;

  // 5. Assignment @ 15% percent
  const { data: asgn, error: asgnErr } = await sr
    .from("diviner_service_affiliates")
    .insert({
      diviner_id: divinerId,
      affiliate_id: junctionId,
      affiliate_type: "diviner_affiliate",
      destination_type: "SERVICE",
      destination_id: templateId,
      commission_type: "percent",
      commission_value: 15,
      is_active: true,
      assigned_by: TEST_DIV_USER,
    })
    .select("id")
    .single();
  if (asgnErr) throw new Error(`assignment insert failed: ${asgnErr.message}`);
  const assignmentId = (asgn as { id: string }).id;

  // 6. Affiliate-owned campaign. campaign_code is varchar(12) — match the
  // shared generator's `cmp_` + 8 chars format.
  const unamb = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let suffix = "";
  for (let i = 0; i < 8; i++) {
    suffix += unamb[Math.floor(Math.random() * unamb.length)];
  }
  const campaignCode = `cmp_${suffix}`;
  const { data: cmp, error: cmpErr } = await sr
    .from("affiliate_campaigns")
    .insert({
      diviner_id: divinerId,
      name: "V2 Smoke Campaign",
      status: "active",
      commission_type: "percentage",
      commission_value: 15,
      owner_type: "affiliate",
      owner_affiliate_id: junctionId,
      owner_affiliate_type: "diviner_affiliate",
      commission_value_snapshot: 15,
      commission_type_snapshot: "percent",
      source_assignment_id: assignmentId,
      destination_type: "SERVICE",
      destination_service_template_id: templateId,
      campaign_code: campaignCode,
      share_url: `https://astrologypro.com/r/${campaignCode}`,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (cmpErr) throw new Error(`campaign insert failed: ${cmpErr.message}`);
  const campaignId = (cmp as { id: string }).id;

  // 7. Minimal test client. bookings.client_id FK requires clients.id, and
  // clients.user_id FK requires auth.users — we reuse the fixture diviner's
  // auth user id since that's the only auth user we know exists here.
  const { data: client, error: clientErr } = await sr
    .from("clients")
    .insert({
      user_id: authUserId,
      email,
      full_name: "V2 Smoke Client",
    })
    .select("id")
    .single();
  if (clientErr) throw new Error(`client insert failed: ${clientErr.message}`);
  const clientId = (client as { id: string }).id;

  return {
    divinerId,
    accountId,
    junctionId,
    serviceId,
    templateId,
    assignmentId,
    campaignId,
    campaignCode,
    cleanupUserId: authUserId,
    clientId,
  };
}

async function insertStampedBooking(
  ctx: Fixtures,
  stamp: { type: "percent" | "flat"; value: number },
): Promise<string> {
  const { data: booking, error } = await sr
    .from("bookings")
    .insert({
      diviner_id: ctx.divinerId,
      client_id: ctx.clientId,
      service_id: ctx.serviceId,
      status: "pending",
      scheduled_at: new Date(Date.now() + 86400000).toISOString(),
      duration_minutes: 30,
      base_price: 100,
      ref_code: ctx.campaignCode,
      commission_source_assignment_id: ctx.assignmentId,
      commission_rate_type_stamp: stamp.type,
      commission_rate_value_stamp: stamp.value,
    })
    .select("id")
    .single();
  if (error) throw new Error(`booking insert failed: ${error.message}`);
  return (booking as { id: string }).id;
}

async function teardown(ctx: Fixtures) {
  // Order matters: children first.
  await sr.from("campaign_conversions").delete().eq("campaign_id", ctx.campaignId);
  await sr.from("campaign_clicks").delete().eq("campaign_id", ctx.campaignId);
  await sr.from("bookings").delete().eq("client_id", ctx.clientId);
  await sr.from("affiliate_campaigns").delete().eq("id", ctx.campaignId);
  await sr
    .from("diviner_service_affiliate_rate_history")
    .delete()
    .eq("assignment_id", ctx.assignmentId);
  await sr.from("diviner_service_affiliates").delete().eq("id", ctx.assignmentId);
  await sr.from("services").delete().eq("id", ctx.serviceId);
  await sr.from("service_templates").delete().eq("id", ctx.templateId);
  await sr.from("clients").delete().eq("id", ctx.clientId);
  await sr.from("diviner_affiliates").delete().eq("id", ctx.junctionId);
  await sr.from("affiliate_accounts").delete().eq("id", ctx.accountId);
  if (ctx.cleanupUserId) {
    await sr.auth.admin.deleteUser(ctx.cleanupUserId).catch(() => {});
  }
}

// ── Tests ──────────────────────────────────────────────────────────────

test("Schema: booking stamp columns exist on bookings", async () => {
  // Trivial sanity — if 01a didn't apply, the SELECT errors.
  const { error } = await sr
    .from("bookings")
    .select(
      "commission_source_assignment_id, commission_rate_type_stamp, commission_rate_value_stamp",
    )
    .limit(1);
  assert.equal(error, null, `bookings stamp columns missing: ${error?.message}`);
});

test("Schema: rate history + admin action log tables exist", async () => {
  const r1 = await sr
    .from("diviner_service_affiliate_rate_history")
    .select("id")
    .limit(1);
  assert.equal(
    r1.error,
    null,
    `rate_history table missing: ${r1.error?.message}`,
  );
  const r2 = await sr.from("admin_action_log").select("id").limit(1);
  assert.equal(
    r2.error,
    null,
    `admin_action_log table missing: ${r2.error?.message}`,
  );
});

test("resolveStampForBooking: happy path returns stamp @ 15% percent", async () => {
  const ctx = await setup();
  try {
    const stamp = await resolveStampForBooking(sr, {
      refCode: ctx.campaignCode,
      divinerId: ctx.divinerId,
      serviceId: ctx.serviceId,
    });
    assert.equal(stamp.reason, "stamped");
    assert.equal(stamp.source_assignment_id, ctx.assignmentId);
    assert.equal(stamp.rate_type_stamp, "percent");
    assert.equal(stamp.rate_value_stamp, 15);
  } finally {
    await teardown(ctx);
  }
});

test("resolveStampForBooking: missing ref returns no_ref", async () => {
  const ctx = await setup();
  try {
    const stamp = await resolveStampForBooking(sr, {
      refCode: null,
      divinerId: ctx.divinerId,
      serviceId: ctx.serviceId,
    });
    assert.equal(stamp.reason, "no_ref");
    assert.equal(stamp.source_assignment_id, null);
  } finally {
    await teardown(ctx);
  }
});

test("resolveStampForBooking: destination mismatch returns null stamp", async () => {
  const ctx = await setup();
  try {
    // Campaign destination is templateId; pass a different serviceId
    // backed by no template → service lookup finds template_id=null →
    // destination_mismatch for the SERVICE-scoped campaign.
    const { data: otherSvc } = await sr
      .from("services")
      .insert({
        diviner_id: ctx.divinerId,
        category: "astrology",
        name: "Unrelated service",
        slug: `other-svc-${Date.now()}`,
        duration_minutes: 30,
        base_price: 50,
      })
      .select("id")
      .single();

    const stamp = await resolveStampForBooking(sr, {
      refCode: ctx.campaignCode,
      divinerId: ctx.divinerId,
      serviceId: (otherSvc as { id: string }).id,
    });
    assert.equal(stamp.reason, "destination_mismatch");
    assert.equal(stamp.source_assignment_id, null);

    await sr.from("services").delete().eq("id", (otherSvc as { id: string }).id);
  } finally {
    await teardown(ctx);
  }
});

test("resolveStampForBooking: revoked assignment → stamp blocked (trigger auto-pauses campaign first)", async () => {
  const ctx = await setup();
  try {
    await sr
      .from("diviner_service_affiliates")
      .update({ is_active: false, revoked_at: new Date().toISOString() })
      .eq("id", ctx.assignmentId);

    const stamp = await resolveStampForBooking(sr, {
      refCode: ctx.campaignCode,
      divinerId: ctx.divinerId,
      serviceId: ctx.serviceId,
    });
    // The auto_pause_affiliate_campaigns_on_revoke trigger flips the
    // campaign status to 'paused' when the assignment is revoked, so
    // the campaign-status gate fires before the assignment-status
    // gate. Either reason is "no stamp, diviner keeps 100%" which is
    // the spec's required outcome.
    assert.ok(
      stamp.reason === "campaign_inactive" ||
        stamp.reason === "assignment_inactive",
      `expected campaign_inactive or assignment_inactive, got ${stamp.reason}`,
    );
    assert.equal(stamp.source_assignment_id, null);
  } finally {
    await teardown(ctx);
  }
});

test("resolveStampForBooking: blocked account returns account_not_active", async () => {
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
  } finally {
    await teardown(ctx);
  }
});

test("creditAffiliateConversion: honors stamp, writes rate_type_used + rate_value_used", async () => {
  const ctx = await setup();
  try {
    const bookingId = await insertStampedBooking(ctx, { type: "percent", value: 15 });
    const result = await creditAffiliateConversion(sr, {
      bookingId,
      orderAmountCents: 10000,
      refCode: ctx.campaignCode,
      stampedAssignmentId: ctx.assignmentId,
      stampedRateType: "percent",
      stampedRateValue: 15,
    });
    assert.notEqual(result, null, "expected a credit result");
    assert.equal(result!.commissionCents, 1500);

    const { data: row } = await sr
      .from("campaign_conversions")
      .select("rate_type_used, rate_value_used, commission_amount_cents")
      .eq("booking_id", bookingId)
      .single();
    assert.equal(row!.rate_type_used, "percent");
    assert.equal(Number(row!.rate_value_used), 15);
    assert.equal(row!.commission_amount_cents, 1500);
  } finally {
    await teardown(ctx);
  }
});

test("creditAffiliateConversion: rate edit after stamp does NOT change prior commission", async () => {
  const ctx = await setup();
  try {
    // Booking 1 is stamped at 15% (the assignment's original rate).
    const firstBookingId = await insertStampedBooking(ctx, {
      type: "percent",
      value: 15,
    });
    const r1 = await creditAffiliateConversion(sr, {
      bookingId: firstBookingId,
      orderAmountCents: 10000,
      refCode: ctx.campaignCode,
      stampedAssignmentId: ctx.assignmentId,
      stampedRateType: "percent",
      stampedRateValue: 15,
    });
    assert.equal(r1!.commissionCents, 1500);

    // Diviner "edits" the assignment to 10%.
    await sr
      .from("diviner_service_affiliates")
      .update({ commission_value: 10 })
      .eq("id", ctx.assignmentId);

    // Booking 2 is created AFTER the edit and stamps at the new 10%.
    const secondBookingId = await insertStampedBooking(ctx, {
      type: "percent",
      value: 10,
    });
    const r2 = await creditAffiliateConversion(sr, {
      bookingId: secondBookingId,
      orderAmountCents: 10000,
      refCode: ctx.campaignCode,
      stampedAssignmentId: ctx.assignmentId,
      stampedRateType: "percent",
      stampedRateValue: 10,
    });
    assert.equal(r2!.commissionCents, 1000);

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

test("creditAffiliateConversion: blocked account at credit time returns null", async () => {
  const ctx = await setup();
  try {
    const bookingId = await insertStampedBooking(ctx, { type: "percent", value: 15 });
    // Block the account AFTER the stamp was captured on the booking.
    await sr
      .from("affiliate_accounts")
      .update({ status: "blocked" })
      .eq("id", ctx.accountId);

    const result = await creditAffiliateConversion(sr, {
      bookingId,
      orderAmountCents: 10000,
      refCode: ctx.campaignCode,
      stampedAssignmentId: ctx.assignmentId,
      stampedRateType: "percent",
      stampedRateValue: 15,
    });
    assert.equal(
      result,
      null,
      "expected no credit when account is blocked at webhook time",
    );

    const { data: rows } = await sr
      .from("campaign_conversions")
      .select("id")
      .eq("booking_id", bookingId);
    assert.equal(
      (rows ?? []).length,
      0,
      "expected no conversion row when blocked",
    );
  } finally {
    await teardown(ctx);
  }
});
