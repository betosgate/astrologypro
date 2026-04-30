/**
 * RLS verification — Affiliate Commission v2 (Task 08 Part A).
 *
 * Proves cross-tenant isolation is enforced at the DATABASE LAYER, not
 * just by API filters. The smoke test (affiliate-commission-v2-smoke.test.ts)
 * uses service_role and bypasses RLS — this file does NOT.
 *
 * Strategy:
 *   1. Service role provisions a controlled tenancy:
 *        Diviner A + Diviner B
 *        Affiliate 1 (multi-junction: partnered with A and B)
 *        Affiliate 2 (single-junction: partnered with A only)
 *      Each gets assignments, an owned campaign, click rows, conversion
 *      rows, and rate-history entries.
 *   2. For each role, sign in via the anon client + email/password to get
 *      a JWT, then issue queries through THAT authenticated client. RLS
 *      is the only gate.
 *   3. Assert each role sees only their own rows on every tested table.
 *
 * Tables covered:
 *   - diviner_service_affiliates
 *   - diviner_service_affiliate_rate_history
 *   - affiliate_campaigns (owner_type='diviner' AND 'affiliate')
 *   - campaign_clicks
 *   - campaign_conversions
 *
 * Run: `npm run test:affiliate-rls`
 *
 * Spec: docs/specs/affiliate-commission-system.md §8.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SERVICE_KEY || !ANON_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY",
  );
}

// Service-role client used ONLY for setup + teardown.
const sr: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const PASSWORD = "RlsTestPass!23";

// Each setup() call generates a fresh namespace so concurrent runs /
// repeated invocations within the same Node process don't collide on
// auth user emails or on `service_templates.slug` which has a UNIQUE
// constraint.
function freshNS(): string {
  return `rls-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface Tenancy {
  divinerA: { userId: string; divinerId: string; email: string };
  divinerB: { userId: string; divinerId: string; email: string };
  affiliate1: {
    userId: string;
    accountId: string;
    junctionAId: string;
    junctionBId: string;
    email: string;
  };
  affiliate2: {
    userId: string;
    accountId: string;
    junctionAId: string;
    email: string;
  };
  // Service templates owned by A and B.
  templateA: string;
  templateB: string;
  // Assignments
  assignmentA1: string; // Diviner A → Affiliate 1
  assignmentB1: string; // Diviner B → Affiliate 1
  assignmentA2: string; // Diviner A → Affiliate 2
  // Affiliate-owned campaigns (one per assignment)
  campaignA1: string;
  campaignB1: string;
  campaignA2: string;
  campaignA1Code: string;
  campaignB1Code: string;
  campaignA2Code: string;
  // Diviner-owned campaign (not affiliate-owned) for owner_type test
  campaignDivinerA: string;
}

// ──────────────────────────────────────────────────────────────────────
// Setup helpers
// ──────────────────────────────────────────────────────────────────────

function genCode(): string {
  const unamb = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "cmp_";
  for (let i = 0; i < 8; i++) s += unamb[Math.floor(Math.random() * unamb.length)];
  return s;
}

async function createDiviner(
  ns: string,
  label: string,
): Promise<{
  userId: string;
  divinerId: string;
  email: string;
}> {
  const email = `${ns}-${label}@test.astrologypro.com`;
  const { data: created, error: ue } = await sr.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (ue) throw new Error(`auth user create failed: ${ue.message}`);
  const userId = created.user!.id;

  const { data: div, error } = await sr
    .from("diviners")
    .insert({
      user_id: userId,
      display_name: `RLS Diviner ${label}`,
      username: `${ns}-${label}`,
    })
    .select("id")
    .single();
  if (error) throw new Error(`diviner row insert failed: ${error.message}`);
  return { userId, divinerId: (div as { id: string }).id, email };
}

async function createAffiliate(
  ns: string,
  label: string,
  diviners: Array<{ divinerId: string }>,
): Promise<{
  userId: string;
  accountId: string;
  junctionIds: string[];
  email: string;
}> {
  const email = `${ns}-${label}@test.astrologypro.com`;
  const { data: created } = await sr.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  const userId = created.user!.id;

  const { data: account, error } = await sr
    .from("affiliate_accounts")
    .insert({
      user_id: userId,
      email,
      name: `RLS Affiliate ${label}`,
      status: "active",
    })
    .select("id")
    .single();
  if (error) throw new Error(`affiliate_accounts insert: ${error.message}`);
  const accountId = (account as { id: string }).id;

  const junctionIds: string[] = [];
  for (const d of diviners) {
    const { data: j, error: je } = await sr
      .from("diviner_affiliates")
      .insert({
        diviner_id: d.divinerId,
        affiliate_account_id: accountId,
        name: `RLS ${label}`,
        email,
        status: "active",
        default_commission_type: "percentage",
        default_commission_value: 15,
      })
      .select("id")
      .single();
    if (je) throw new Error(`junction insert: ${je.message}`);
    junctionIds.push((j as { id: string }).id);
  }
  return { userId, accountId, junctionIds, email };
}

async function createServiceTemplate(
  ns: string,
  label: string,
): Promise<string> {
  const { data, error } = await sr
    .from("service_templates")
    .insert({
      category: "astrology",
      name: `RLS Template ${label}`,
      slug: `${ns}-${label}`,
      duration_minutes: 30,
      base_price: 100,
    })
    .select("id")
    .single();
  if (error) throw new Error(`template insert: ${error.message}`);
  return (data as { id: string }).id;
}

async function createAssignment(
  divinerId: string,
  junctionId: string,
  templateId: string,
  assignedBy: string,
): Promise<string> {
  const { data, error } = await sr
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
      assigned_by: assignedBy,
    })
    .select("id")
    .single();
  if (error) throw new Error(`assignment insert: ${error.message}`);
  return (data as { id: string }).id;
}

async function createAffiliateCampaign(
  divinerId: string,
  junctionId: string,
  templateId: string,
  assignmentId: string,
): Promise<{ id: string; code: string }> {
  const code = genCode();
  const { data, error } = await sr
    .from("affiliate_campaigns")
    .insert({
      diviner_id: divinerId,
      name: `RLS Campaign ${code}`,
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
      campaign_code: code,
      share_url: `https://astrologypro.com/r/${code}`,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`affiliate campaign insert: ${error.message}`);
  return { id: (data as { id: string }).id, code };
}

async function createDivinerCampaign(
  divinerId: string,
  templateId: string,
): Promise<string> {
  const code = genCode();
  const { data, error } = await sr
    .from("affiliate_campaigns")
    .insert({
      diviner_id: divinerId,
      name: `RLS Promo ${code}`,
      status: "active",
      commission_type: "percentage",
      commission_value: 0,
      owner_type: "diviner",
      destination_type: "SERVICE",
      destination_service_template_id: templateId,
      campaign_code: code,
      share_url: `https://astrologypro.com/r/${code}`,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`diviner campaign insert: ${error.message}`);
  return (data as { id: string }).id;
}

async function insertClick(
  campaignId: string,
  campaignCode: string,
  divinerId: string,
  destinationId: string,
  affiliateId: string | null,
): Promise<string> {
  const { data, error } = await sr
    .from("campaign_clicks")
    .insert({
      campaign_id: campaignId,
      campaign_code: campaignCode,
      diviner_id: divinerId,
      destination_type: "SERVICE",
      destination_id: destinationId,
      resolved_url: `https://astrologypro.com/r/${campaignCode}`,
      affiliate_id: affiliateId,
      affiliate_type: affiliateId ? "diviner_affiliate" : null,
      ip_hash: "rls-test-ip",
      country_code: "US",
      user_agent: "rls-test",
      is_bot: false,
      is_unique_click: true,
    })
    .select("id")
    .single();
  if (error) throw new Error(`click insert: ${error.message}`);
  return (data as { id: string }).id;
}

async function insertRateHistory(
  assignmentId: string,
  changedBy: string,
): Promise<string> {
  const { data, error } = await sr
    .from("diviner_service_affiliate_rate_history")
    .insert({
      assignment_id: assignmentId,
      old_commission_type: "percent",
      old_commission_value: 15,
      new_commission_type: "percent",
      new_commission_value: 20,
      changed_by: changedBy,
      reason: "RLS test rate edit",
    })
    .select("id")
    .single();
  if (error) throw new Error(`rate history insert: ${error.message}`);
  return (data as { id: string }).id;
}

// ──────────────────────────────────────────────────────────────────────
// Auth-as-user helper — returns a fresh anon client signed in as `email`.
// Subsequent queries on this client run with that user's RLS context.
// ──────────────────────────────────────────────────────────────────────

async function authAs(email: string): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD,
  });
  if (error) throw new Error(`signIn(${email}) failed: ${error.message}`);
  return client;
}

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL!, ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ──────────────────────────────────────────────────────────────────────
// Lifecycle
// ──────────────────────────────────────────────────────────────────────

async function setup(): Promise<Tenancy> {
  const ns = freshNS();
  const divinerA = await createDiviner(ns, "divA");
  const divinerB = await createDiviner(ns, "divB");
  const aff1 = await createAffiliate(ns, "aff1", [divinerA, divinerB]);
  const aff2 = await createAffiliate(ns, "aff2", [divinerA]);

  const templateA = await createServiceTemplate(ns, "tplA");
  const templateB = await createServiceTemplate(ns, "tplB");

  const assignmentA1 = await createAssignment(
    divinerA.divinerId,
    aff1.junctionIds[0]!,
    templateA,
    divinerA.userId,
  );
  const assignmentB1 = await createAssignment(
    divinerB.divinerId,
    aff1.junctionIds[1]!,
    templateB,
    divinerB.userId,
  );
  const assignmentA2 = await createAssignment(
    divinerA.divinerId,
    aff2.junctionIds[0]!,
    templateA,
    divinerA.userId,
  );

  const cmpA1 = await createAffiliateCampaign(
    divinerA.divinerId,
    aff1.junctionIds[0]!,
    templateA,
    assignmentA1,
  );
  const cmpB1 = await createAffiliateCampaign(
    divinerB.divinerId,
    aff1.junctionIds[1]!,
    templateB,
    assignmentB1,
  );
  const cmpA2 = await createAffiliateCampaign(
    divinerA.divinerId,
    aff2.junctionIds[0]!,
    templateA,
    assignmentA2,
  );
  const cmpDivA = await createDivinerCampaign(divinerA.divinerId, templateA);

  // One click + one rate-history row per assignment / campaign so each
  // table has visible rows for the owners.
  await insertClick(cmpA1.id, cmpA1.code, divinerA.divinerId, templateA, aff1.junctionIds[0]!);
  await insertClick(cmpB1.id, cmpB1.code, divinerB.divinerId, templateB, aff1.junctionIds[1]!);
  await insertClick(cmpA2.id, cmpA2.code, divinerA.divinerId, templateA, aff2.junctionIds[0]!);

  await insertRateHistory(assignmentA1, divinerA.userId);
  await insertRateHistory(assignmentB1, divinerB.userId);
  await insertRateHistory(assignmentA2, divinerA.userId);

  return {
    divinerA: {
      userId: divinerA.userId,
      divinerId: divinerA.divinerId,
      email: divinerA.email,
    },
    divinerB: {
      userId: divinerB.userId,
      divinerId: divinerB.divinerId,
      email: divinerB.email,
    },
    affiliate1: {
      userId: aff1.userId,
      accountId: aff1.accountId,
      junctionAId: aff1.junctionIds[0]!,
      junctionBId: aff1.junctionIds[1]!,
      email: aff1.email,
    },
    affiliate2: {
      userId: aff2.userId,
      accountId: aff2.accountId,
      junctionAId: aff2.junctionIds[0]!,
      email: aff2.email,
    },
    templateA,
    templateB,
    assignmentA1,
    assignmentB1,
    assignmentA2,
    campaignA1: cmpA1.id,
    campaignB1: cmpB1.id,
    campaignA2: cmpA2.id,
    campaignA1Code: cmpA1.code,
    campaignB1Code: cmpB1.code,
    campaignA2Code: cmpA2.code,
    campaignDivinerA: cmpDivA,
  };
}

async function teardown(t: Tenancy) {
  // Children first.
  await sr
    .from("diviner_service_affiliate_rate_history")
    .delete()
    .in("assignment_id", [t.assignmentA1, t.assignmentB1, t.assignmentA2]);
  await sr
    .from("campaign_clicks")
    .delete()
    .in("campaign_id", [t.campaignA1, t.campaignB1, t.campaignA2, t.campaignDivinerA]);
  await sr
    .from("campaign_conversions")
    .delete()
    .in("campaign_id", [t.campaignA1, t.campaignB1, t.campaignA2]);
  await sr
    .from("affiliate_campaigns")
    .delete()
    .in("id", [t.campaignA1, t.campaignB1, t.campaignA2, t.campaignDivinerA]);
  await sr
    .from("diviner_service_affiliates")
    .delete()
    .in("id", [t.assignmentA1, t.assignmentB1, t.assignmentA2]);
  await sr.from("service_templates").delete().in("id", [t.templateA, t.templateB]);
  await sr
    .from("diviner_affiliates")
    .delete()
    .in("id", [
      t.affiliate1.junctionAId,
      t.affiliate1.junctionBId,
      t.affiliate2.junctionAId,
    ]);
  await sr
    .from("affiliate_accounts")
    .delete()
    .in("id", [t.affiliate1.accountId, t.affiliate2.accountId]);
  await sr
    .from("diviners")
    .delete()
    .in("id", [t.divinerA.divinerId, t.divinerB.divinerId]);
  for (const uid of [
    t.divinerA.userId,
    t.divinerB.userId,
    t.affiliate1.userId,
    t.affiliate2.userId,
  ]) {
    await sr.auth.admin.deleteUser(uid).catch(() => {});
  }
}

// ──────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────

test("rls: diviner_service_affiliates — diviner sees only own rows", async () => {
  const t = await setup();
  try {
    const a = await authAs(t.divinerA.email);
    const { data, error } = await a
      .from("diviner_service_affiliates")
      .select("id, diviner_id");
    assert.equal(error, null, `unexpected error: ${error?.message}`);
    const ids = (data ?? []).map((r) => r.id as string).sort();
    assert.ok(
      ids.includes(t.assignmentA1) && ids.includes(t.assignmentA2),
      "Diviner A should see their own assignments",
    );
    assert.ok(
      !ids.includes(t.assignmentB1),
      "Diviner A must NOT see Diviner B's assignment",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: diviner_service_affiliates — affiliate sees only own junctions", async () => {
  const t = await setup();
  try {
    const a = await authAs(t.affiliate1.email);
    const { data, error } = await a
      .from("diviner_service_affiliates")
      .select("id, affiliate_id");
    assert.equal(error, null);
    const ids = (data ?? []).map((r) => r.id as string).sort();
    assert.ok(
      ids.includes(t.assignmentA1) && ids.includes(t.assignmentB1),
      "Affiliate 1 should see assignments through both junctions",
    );

    const a2 = await authAs(t.affiliate2.email);
    const r2 = await a2
      .from("diviner_service_affiliates")
      .select("id");
    const ids2 = (r2.data ?? []).map((r) => r.id as string);
    assert.ok(
      ids2.includes(t.assignmentA2),
      "Affiliate 2 should see their own assignment",
    );
    assert.ok(
      !ids2.includes(t.assignmentA1) && !ids2.includes(t.assignmentB1),
      "Affiliate 2 must NOT see other affiliates' assignments",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: diviner_service_affiliates — diviner cannot UPDATE another diviner's row", async () => {
  const t = await setup();
  try {
    const a = await authAs(t.divinerA.email);
    // Diviner A tries to revoke Diviner B's assignment to Affiliate 1.
    const { data: updated, error } = await a
      .from("diviner_service_affiliates")
      .update({ is_active: false })
      .eq("id", t.assignmentB1)
      .select("id");
    // Either the policy denies via empty result OR an explicit error.
    // Both outcomes mean: cross-tenant write was blocked.
    if (error) {
      // Policy-level reject — fine.
    } else {
      assert.equal(
        (updated ?? []).length,
        0,
        "Diviner A's UPDATE on Diviner B's assignment must affect 0 rows",
      );
    }
    // Verify via service-role that Diviner B's row is still active.
    const { data: row } = await sr
      .from("diviner_service_affiliates")
      .select("is_active")
      .eq("id", t.assignmentB1)
      .single();
    assert.equal(
      row!.is_active,
      true,
      "Diviner B's assignment must remain is_active=true",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: rate_history — diviner only sees rows for own assignments", async () => {
  const t = await setup();
  try {
    const a = await authAs(t.divinerA.email);
    const { data, error } = await a
      .from("diviner_service_affiliate_rate_history")
      .select("id, assignment_id");
    assert.equal(error, null);
    const aids = new Set((data ?? []).map((r) => r.assignment_id as string));
    assert.ok(
      aids.has(t.assignmentA1) && aids.has(t.assignmentA2),
      "Diviner A should see their own assignments' rate history",
    );
    assert.ok(
      !aids.has(t.assignmentB1),
      "Diviner A must NOT see Diviner B's rate history",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: rate_history — affiliate only sees own", async () => {
  const t = await setup();
  try {
    const a = await authAs(t.affiliate2.email);
    const { data } = await a
      .from("diviner_service_affiliate_rate_history")
      .select("assignment_id");
    const aids = new Set((data ?? []).map((r) => r.assignment_id as string));
    assert.ok(
      aids.has(t.assignmentA2),
      "Affiliate 2 should see their own rate history",
    );
    assert.ok(
      !aids.has(t.assignmentA1) && !aids.has(t.assignmentB1),
      "Affiliate 2 must NOT see other affiliates' rate history",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: affiliate_campaigns — diviner sees own (both owner_types) but not others", async () => {
  const t = await setup();
  try {
    const a = await authAs(t.divinerA.email);
    const { data, error } = await a
      .from("affiliate_campaigns")
      .select("id, diviner_id, owner_type");
    assert.equal(error, null);
    const ids = new Set((data ?? []).map((r) => r.id as string));
    assert.ok(
      ids.has(t.campaignA1) && ids.has(t.campaignA2) && ids.has(t.campaignDivinerA),
      "Diviner A should see their own affiliate-owned + diviner-owned campaigns",
    );
    assert.ok(
      !ids.has(t.campaignB1),
      "Diviner A must NOT see Diviner B's campaign",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: affiliate_campaigns — affiliate sees only their owned campaigns", async () => {
  const t = await setup();
  try {
    const a = await authAs(t.affiliate1.email);
    const { data, error } = await a
      .from("affiliate_campaigns")
      .select("id, owner_affiliate_id");
    assert.equal(error, null);
    const ids = new Set((data ?? []).map((r) => r.id as string));
    assert.ok(
      ids.has(t.campaignA1) && ids.has(t.campaignB1),
      "Affiliate 1 sees their owned campaigns through both diviners",
    );
    assert.ok(
      !ids.has(t.campaignA2) && !ids.has(t.campaignDivinerA),
      "Affiliate 1 must NOT see Affiliate 2's or any diviner-owned campaign",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: campaign_clicks — diviner sees own, affiliate sees own", async () => {
  const t = await setup();
  try {
    const dA = await authAs(t.divinerA.email);
    const { data: dRows, error: dErr } = await dA
      .from("campaign_clicks")
      .select("id, diviner_id, affiliate_id");
    assert.equal(dErr, null);
    const dDIds = new Set((dRows ?? []).map((r) => r.diviner_id as string));
    assert.ok(
      dDIds.has(t.divinerA.divinerId),
      "Diviner A sees clicks where diviner_id matches",
    );
    assert.ok(
      !dDIds.has(t.divinerB.divinerId),
      "Diviner A does NOT see Diviner B's clicks",
    );

    const aff = await authAs(t.affiliate2.email);
    const { data: aRows } = await aff
      .from("campaign_clicks")
      .select("id, affiliate_id");
    const visibleAffIds = new Set(
      (aRows ?? []).map((r) => r.affiliate_id as string | null),
    );
    assert.ok(
      visibleAffIds.has(t.affiliate2.junctionAId),
      "Affiliate 2 sees their own click",
    );
    assert.ok(
      !visibleAffIds.has(t.affiliate1.junctionAId) &&
        !visibleAffIds.has(t.affiliate1.junctionBId),
      "Affiliate 2 does NOT see Affiliate 1's clicks",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: campaign_conversions — diviner-scope and affiliate-scope isolation", async () => {
  const t = await setup();
  try {
    // Insert one conversion per affiliate-owned campaign so each tenant
    // has visible rows.
    for (const c of [
      { campaignId: t.campaignA1, junction: t.affiliate1.junctionAId },
      { campaignId: t.campaignB1, junction: t.affiliate1.junctionBId },
      { campaignId: t.campaignA2, junction: t.affiliate2.junctionAId },
    ]) {
      const { error } = await sr.from("campaign_conversions").insert({
        campaign_id: c.campaignId,
        affiliate_id: c.junction,
        affiliate_type: "diviner_affiliate",
        order_amount_cents: 10000,
        commission_amount_cents: 1500,
        rate_type_used: "percent",
        rate_value_used: 15,
      });
      if (error) throw new Error(`conversion seed: ${error.message}`);
    }

    const dA = await authAs(t.divinerA.email);
    const { data: dRows } = await dA
      .from("campaign_conversions")
      .select("campaign_id");
    const dCmpIds = new Set((dRows ?? []).map((r) => r.campaign_id as string));
    assert.ok(
      dCmpIds.has(t.campaignA1) && dCmpIds.has(t.campaignA2),
      "Diviner A sees conversions on their campaigns",
    );
    assert.ok(
      !dCmpIds.has(t.campaignB1),
      "Diviner A does NOT see Diviner B's conversions",
    );

    const aff2 = await authAs(t.affiliate2.email);
    const { data: aRows } = await aff2
      .from("campaign_conversions")
      .select("campaign_id, affiliate_id");
    const aIds = new Set((aRows ?? []).map((r) => r.campaign_id as string));
    assert.ok(
      aIds.has(t.campaignA2),
      "Affiliate 2 sees their own conversion",
    );
    assert.ok(
      !aIds.has(t.campaignA1) && !aIds.has(t.campaignB1),
      "Affiliate 2 does NOT see other affiliates' conversions",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: campaign_conversions — direct UPDATE blocked for both diviner and affiliate", async () => {
  const t = await setup();
  try {
    // Seed one conversion as Diviner A's tenant.
    const { data: conv } = await sr
      .from("campaign_conversions")
      .insert({
        campaign_id: t.campaignA1,
        affiliate_id: t.affiliate1.junctionAId,
        affiliate_type: "diviner_affiliate",
        order_amount_cents: 10000,
        commission_amount_cents: 1500,
        rate_type_used: "percent",
        rate_value_used: 15,
      })
      .select("id")
      .single();
    const conversionId = (conv as { id: string }).id;

    // Diviner A tries to direct-mark-reversed via UPDATE — must fail.
    const dA = await authAs(t.divinerA.email);
    const { data: dUpd } = await dA
      .from("campaign_conversions")
      .update({ reversed_at: new Date().toISOString() })
      .eq("id", conversionId)
      .select("id");
    assert.equal(
      (dUpd ?? []).length,
      0,
      "Diviner direct UPDATE on conversions must affect 0 rows",
    );

    // Affiliate 1 tries the same — also blocked.
    const aff = await authAs(t.affiliate1.email);
    const { data: aUpd } = await aff
      .from("campaign_conversions")
      .update({ reversed_at: new Date().toISOString() })
      .eq("id", conversionId)
      .select("id");
    assert.equal(
      (aUpd ?? []).length,
      0,
      "Affiliate direct UPDATE on conversions must affect 0 rows",
    );

    // Service-role confirms reversed_at is still NULL.
    const { data: row } = await sr
      .from("campaign_conversions")
      .select("reversed_at")
      .eq("id", conversionId)
      .single();
    assert.equal(
      row!.reversed_at,
      null,
      "reversed_at should still be NULL — direct UPDATEs must go through admin endpoint",
    );
  } finally {
    await teardown(t);
  }
});

test("rls: anonymous client gets zero rows on protected tables", async () => {
  const t = await setup();
  try {
    const anon = anonClient();
    for (const tbl of [
      "diviner_service_affiliates",
      "diviner_service_affiliate_rate_history",
      "campaign_conversions",
    ] as const) {
      const { data } = await anon.from(tbl).select("id").limit(5);
      assert.equal(
        (data ?? []).length,
        0,
        `Anon must not read ${tbl}; got ${(data ?? []).length} rows`,
      );
    }
  } finally {
    await teardown(t);
  }
});

test("rls: affiliate_campaigns — affiliate cannot INSERT for someone else's junction", async () => {
  const t = await setup();
  try {
    const aff2 = await authAs(t.affiliate2.email);
    // Affiliate 2 tries to insert a campaign claiming ownership of
    // Affiliate 1's junction. RLS write policy must block.
    const code = genCode();
    const { data, error } = await aff2
      .from("affiliate_campaigns")
      .insert({
        diviner_id: t.divinerA.divinerId,
        name: "RLS hijack attempt",
        status: "active",
        commission_type: "percentage",
        commission_value: 15,
        owner_type: "affiliate",
        owner_affiliate_id: t.affiliate1.junctionAId, // NOT theirs
        owner_affiliate_type: "diviner_affiliate",
        commission_value_snapshot: 15,
        commission_type_snapshot: "percent",
        source_assignment_id: t.assignmentA1,
        destination_type: "SERVICE",
        destination_service_template_id: t.templateA,
        campaign_code: code,
        share_url: `https://astrologypro.com/r/${code}`,
        start_date: new Date().toISOString(),
      })
      .select("id");

    if (error) {
      // Policy-level reject — fine.
    } else {
      assert.equal(
        (data ?? []).length,
        0,
        "Cross-tenant INSERT must affect 0 rows",
      );
    }

    // Sweep: confirm no row with that code exists.
    const { data: leak } = await sr
      .from("affiliate_campaigns")
      .select("id")
      .eq("campaign_code", code);
    assert.equal(
      (leak ?? []).length,
      0,
      "No campaign should exist with the hijack code",
    );
  } finally {
    await teardown(t);
  }
});

// ──────────────────────────────────────────────────────────────────────
// Phase 1.5 — general-campaign RLS isolation (Task 08, Part B)
// ──────────────────────────────────────────────────────────────────────
//
// Each test sets up its own minimal Tenancy + general campaign /
// conversion for the affiliate(s) it needs, runs queries through the
// auth-as-affiliate / auth-as-diviner client, and tears down. Tenancy
// fixture intentionally NOT extended — keeps the existing 12 cases
// untouched and avoids cleanup-order ripple.

async function insertGeneralCampaignFor(
  ownerAccountId: string,
  templateId: string,
): Promise<{ id: string; code: string }> {
  const code = genCode();
  const { data: cmp, error } = await sr
    .from("affiliate_campaigns")
    .insert({
      diviner_id: null,
      name: "RLS general campaign",
      status: "active",
      commission_type: "percentage",
      commission_value: 0,
      owner_type: "affiliate",
      owner_affiliate_id: null,
      owner_affiliate_type: "general",
      owner_affiliate_account_id: ownerAccountId,
      source_assignment_id: null,
      destination_type: "SERVICE",
      destination_service_template_id: templateId,
      campaign_code: code,
      share_url: `https://astrologypro.com/r/${code}`,
      start_date: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(`general campaign insert failed: ${error.message}`);
  return { id: (cmp as { id: string }).id, code };
}

async function insertGeneralConversionFor(
  ownerAccountId: string,
  campaignId: string,
): Promise<string> {
  // Direct INSERT through service-role bypassing RLS to seed a row;
  // tests below verify the SELECT side under affiliate auth.
  const { data: row, error } = await sr
    .from("campaign_conversions")
    .insert({
      campaign_id: campaignId,
      affiliate_id: null,
      affiliate_type: "general",
      affiliate_account_id: ownerAccountId,
      booking_id: null,
      ref_code_snapshot: null,
      order_reference: `rls-general-${Date.now()}`,
      order_amount_cents: 10000,
      commission_amount_cents: 1500,
      commission_source: "campaign_assignment",
      rate_type_used: "percent",
      rate_value_used: 15,
    })
    .select("id")
    .single();
  if (error) throw new Error(`general conversion insert failed: ${error.message}`);
  return (row as { id: string }).id;
}

test("phase 1.5 rls: affiliate sees own general campaign", async () => {
  const t = await setup();
  try {
    const { id: cmpId } = await insertGeneralCampaignFor(
      t.affiliate1.accountId,
      t.templateA,
    );

    const aff1 = await authAs(t.affiliate1.email);
    const { data, error } = await aff1
      .from("affiliate_campaigns")
      .select("id, owner_affiliate_type")
      .eq("id", cmpId);
    assert.equal(error, null);
    assert.equal((data ?? []).length, 1, "Affiliate 1 should see their own general campaign");
    assert.equal(data![0]!.owner_affiliate_type, "general");

    await sr.from("affiliate_campaigns").delete().eq("id", cmpId);
  } finally {
    await teardown(t);
  }
});

test("phase 1.5 rls: affiliate cannot see another affiliate's general campaign", async () => {
  const t = await setup();
  try {
    const { id: cmpId } = await insertGeneralCampaignFor(
      t.affiliate1.accountId,
      t.templateA,
    );

    const aff2 = await authAs(t.affiliate2.email);
    const { data, error } = await aff2
      .from("affiliate_campaigns")
      .select("id")
      .eq("id", cmpId);
    assert.equal(error, null);
    assert.equal(
      (data ?? []).length,
      0,
      "Affiliate 2 must NOT see Affiliate 1's general campaign",
    );

    await sr.from("affiliate_campaigns").delete().eq("id", cmpId);
  } finally {
    await teardown(t);
  }
});

test("phase 1.5 rls: diviner cannot see general campaigns (anti-leakage per §10 decision #5)", async () => {
  const t = await setup();
  try {
    // Affiliate 1 IS partnered with Diviner A (via junctionAId), but a
    // general campaign owned by their account must NOT appear in
    // Diviner A's view of affiliate_campaigns.
    const { id: cmpId } = await insertGeneralCampaignFor(
      t.affiliate1.accountId,
      t.templateA,
    );

    const divA = await authAs(t.divinerA.email);
    const { data, error } = await divA
      .from("affiliate_campaigns")
      .select("id, owner_affiliate_type")
      .eq("id", cmpId);
    assert.equal(error, null);
    assert.equal(
      (data ?? []).length,
      0,
      "Diviner A must NOT see Affiliate 1's general campaign",
    );

    await sr.from("affiliate_campaigns").delete().eq("id", cmpId);
  } finally {
    await teardown(t);
  }
});

test("phase 1.5 rls: affiliate INSERT general for own account works; for another's blocked", async () => {
  const t = await setup();
  try {
    const aff1 = await authAs(t.affiliate1.email);

    // Try to insert a general campaign owned by Affiliate 2 — should
    // be blocked by the WITH CHECK on affiliate_inserts_own_campaigns.
    const hijackCode = genCode();
    const { data: bad, error: badErr } = await aff1
      .from("affiliate_campaigns")
      .insert({
        diviner_id: null,
        name: "RLS hijack attempt",
        status: "active",
        commission_type: "percentage",
        commission_value: 0,
        owner_type: "affiliate",
        owner_affiliate_id: null,
        owner_affiliate_type: "general",
        owner_affiliate_account_id: t.affiliate2.accountId,
        source_assignment_id: null,
        destination_type: "SERVICE",
        destination_service_template_id: t.templateA,
        campaign_code: hijackCode,
        share_url: `https://astrologypro.com/r/${hijackCode}`,
        start_date: new Date().toISOString(),
      })
      .select("id");
    // Either the INSERT errors (RLS rejects) OR returns 0 affected
    // rows. Both outcomes prove isolation; supabase-js usually surfaces
    // the RLS rejection as an error.
    if (badErr === null) {
      assert.equal(
        (bad ?? []).length,
        0,
        "INSERT for another affiliate's account must not produce a row",
      );
    }

    // Sanity: nothing actually exists with that code.
    const { data: leak } = await sr
      .from("affiliate_campaigns")
      .select("id")
      .eq("campaign_code", hijackCode);
    assert.equal((leak ?? []).length, 0);

    // Now insert a legitimate general campaign for the caller's own
    // account — should succeed.
    const ownCode = genCode();
    const { error: okErr, data: okRow } = await aff1
      .from("affiliate_campaigns")
      .insert({
        diviner_id: null,
        name: "RLS own general",
        status: "active",
        commission_type: "percentage",
        commission_value: 0,
        owner_type: "affiliate",
        owner_affiliate_id: null,
        owner_affiliate_type: "general",
        owner_affiliate_account_id: t.affiliate1.accountId,
        source_assignment_id: null,
        destination_type: "SERVICE",
        destination_service_template_id: t.templateA,
        campaign_code: ownCode,
        share_url: `https://astrologypro.com/r/${ownCode}`,
        start_date: new Date().toISOString(),
      })
      .select("id")
      .single();
    assert.equal(okErr, null, `INSERT for own account should succeed: ${okErr?.message}`);
    assert.ok(okRow);

    await sr
      .from("affiliate_campaigns")
      .delete()
      .eq("campaign_code", ownCode);
  } finally {
    await teardown(t);
  }
});

test("phase 1.5 rls: affiliate sees own general conversion", async () => {
  const t = await setup();
  try {
    const { id: cmpId } = await insertGeneralCampaignFor(
      t.affiliate1.accountId,
      t.templateA,
    );
    const convId = await insertGeneralConversionFor(t.affiliate1.accountId, cmpId);

    const aff1 = await authAs(t.affiliate1.email);
    const { data, error } = await aff1
      .from("campaign_conversions")
      .select("id, affiliate_type")
      .eq("id", convId);
    assert.equal(error, null);
    assert.equal(
      (data ?? []).length,
      1,
      "Affiliate 1 should see their own general conversion",
    );
    assert.equal(data![0]!.affiliate_type, "general");

    await sr.from("campaign_conversions").delete().eq("id", convId);
    await sr.from("affiliate_campaigns").delete().eq("id", cmpId);
  } finally {
    await teardown(t);
  }
});

test("phase 1.5 rls: affiliate cannot see another affiliate's general conversion", async () => {
  const t = await setup();
  try {
    const { id: cmpId } = await insertGeneralCampaignFor(
      t.affiliate1.accountId,
      t.templateA,
    );
    const convId = await insertGeneralConversionFor(t.affiliate1.accountId, cmpId);

    const aff2 = await authAs(t.affiliate2.email);
    const { data, error } = await aff2
      .from("campaign_conversions")
      .select("id")
      .eq("id", convId);
    assert.equal(error, null);
    assert.equal(
      (data ?? []).length,
      0,
      "Affiliate 2 must NOT see Affiliate 1's general conversion",
    );

    await sr.from("campaign_conversions").delete().eq("id", convId);
    await sr.from("affiliate_campaigns").delete().eq("id", cmpId);
  } finally {
    await teardown(t);
  }
});
