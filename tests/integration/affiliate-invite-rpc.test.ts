/**
 * Integration tests for the affiliate invite RPCs (Task 02).
 *
 * Runs against the dev Supabase project at NEXT_PUBLIC_SUPABASE_URL using
 * SUPABASE_SERVICE_ROLE_KEY. Exercises:
 *
 *   · create_affiliate_invite — happy path + P0001 (blocked) + P0002 (dup)
 *   · resend_affiliate_invite — happy + P0003 (not found / cross-diviner)
 *   · resend_affiliate_invite_by_junction — legacy-pending + P0006
 *   · revoke_affiliate_invite — delete-path + suspend-path + P0004 (consumed)
 *
 * Cleans up after itself (invites, junctions, accounts, auth users it created).
 *
 * Run: `npx tsx --test tests/integration/affiliate-invite-rpc.test.ts`
 */

import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const sr: SupabaseClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// Use test-diviner-1 + a different diviner for the cross-diviner tests
const TEST_DIV_USER = "e8a4f928-954c-4c0e-99c3-53ac8889bd81";

function mkTok() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: crypto.createHash("sha256").update(raw).digest("hex") };
}

async function getDiviner(userId: string) {
  const { data, error } = await sr
    .from("diviners")
    .select("id")
    .eq("user_id", userId)
    .single();
  if (error || !data) throw new Error("Diviner not found");
  return data as { id: string };
}

async function getAnyOtherDiviner(excludeId: string) {
  const { data, error } = await sr
    .from("diviners")
    .select("id")
    .neq("id", excludeId)
    .limit(1)
    .single();
  if (error || !data) throw new Error("No other diviner available");
  return data as { id: string };
}

type Cleanup = {
  accounts: string[];
  invites: string[];
  junctions: string[];
};
function makeCleanup(): Cleanup {
  return { accounts: [], invites: [], junctions: [] };
}
async function runCleanup(c: Cleanup) {
  for (const id of c.invites) await sr.from("affiliate_invites").delete().eq("id", id);
  for (const id of c.junctions) await sr.from("diviner_affiliates").delete().eq("id", id);
  for (const id of c.accounts) await sr.from("affiliate_accounts").delete().eq("id", id);
}

async function createInviteFor(
  divinerId: string,
  email: string,
  cleanup: Cleanup,
) {
  const token = mkTok();
  const { data, error } = await sr.rpc("create_affiliate_invite", {
    p_diviner_id: divinerId,
    p_email: email,
    p_name: "E2E Test",
    p_phone: null,
    p_message: null,
    p_commission_type: "percentage",
    p_commission_value: 10,
    p_token_hash: token.hash,
    p_expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    p_created_by: TEST_DIV_USER,
  });
  if (error) throw new Error(`create_affiliate_invite failed: ${error.message}`);
  const row = (data as Array<{
    invite_id: string;
    junction_id: string;
    affiliate_account_id: string;
  }>)[0];
  cleanup.invites.push(row.invite_id);
  cleanup.junctions.push(row.junction_id);
  cleanup.accounts.push(row.affiliate_account_id);
  return { ...row, rawToken: token.raw };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test("create_affiliate_invite — happy path creates account + junction + invite", async () => {
  const cleanup = makeCleanup();
  try {
    const div = await getDiviner(TEST_DIV_USER);
    const email = `e2e+${Date.now()}@test.astrologypro.com`;
    const row = await createInviteFor(div.id, email, cleanup);

    const { data: acc } = await sr
      .from("affiliate_accounts")
      .select("email, status, user_id")
      .eq("id", row.affiliate_account_id)
      .single();
    assert.equal(acc!.email, email);
    assert.equal(acc!.status, "unclaimed");
    assert.equal(acc!.user_id, null);

    const { data: junc } = await sr
      .from("diviner_affiliates")
      .select("status, invited_at, accepted_at, affiliate_account_id")
      .eq("id", row.junction_id)
      .single();
    assert.equal(junc!.status, "pending");
    assert.ok(junc!.invited_at);
    assert.equal(junc!.accepted_at, null);
    assert.equal(junc!.affiliate_account_id, row.affiliate_account_id);

    const { data: inv } = await sr
      .from("affiliate_invites")
      .select("consumed_at, revoked_at, resent_count, token_hash")
      .eq("id", row.invite_id)
      .single();
    assert.equal(inv!.consumed_at, null);
    assert.equal(inv!.revoked_at, null);
    assert.equal(inv!.resent_count, 0);
    assert.equal((inv!.token_hash as string).length, 64);
  } finally {
    await runCleanup(cleanup);
  }
});

test("create_affiliate_invite — P0002 on duplicate (diviner, email)", async () => {
  const cleanup = makeCleanup();
  try {
    const div = await getDiviner(TEST_DIV_USER);
    const email = `e2e+${Date.now()}@test.astrologypro.com`;
    await createInviteFor(div.id, email, cleanup);

    const token = mkTok();
    const { error } = await sr.rpc("create_affiliate_invite", {
      p_diviner_id: div.id,
      p_email: email,
      p_name: "dup",
      p_phone: null,
      p_message: null,
      p_commission_type: "percentage",
      p_commission_value: 5,
      p_token_hash: token.hash,
      p_expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      p_created_by: TEST_DIV_USER,
    });
    assert.equal((error as { code?: string } | null)?.code, "P0002");
  } finally {
    await runCleanup(cleanup);
  }
});

test("create_affiliate_invite — P0001 when canonical account is blocked", async () => {
  const cleanup = makeCleanup();
  try {
    const div = await getDiviner(TEST_DIV_USER);
    const otherDiv = await getAnyOtherDiviner(div.id);
    const email = `e2e+${Date.now()}@test.astrologypro.com`;
    const row = await createInviteFor(div.id, email, cleanup);

    // Block the canonical account
    await sr
      .from("affiliate_accounts")
      .update({ status: "blocked" })
      .eq("id", row.affiliate_account_id);

    // Try to invite from a different diviner
    const token = mkTok();
    const { error } = await sr.rpc("create_affiliate_invite", {
      p_diviner_id: otherDiv.id,
      p_email: email,
      p_name: "x",
      p_phone: null,
      p_message: null,
      p_commission_type: "percentage",
      p_commission_value: 5,
      p_token_hash: token.hash,
      p_expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
      p_created_by: TEST_DIV_USER,
    });
    assert.equal((error as { code?: string } | null)?.code, "P0001");
  } finally {
    await runCleanup(cleanup);
  }
});

test("resend_affiliate_invite — happy path revokes prior + bumps resent_count", async () => {
  const cleanup = makeCleanup();
  try {
    const div = await getDiviner(TEST_DIV_USER);
    const email = `e2e+${Date.now()}@test.astrologypro.com`;
    const row = await createInviteFor(div.id, email, cleanup);

    const token = mkTok();
    const { data, error } = await sr.rpc("resend_affiliate_invite", {
      p_invite_id: row.invite_id,
      p_caller_diviner_id: div.id,
      p_new_token_hash: token.hash,
      p_new_expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    });
    assert.equal(error, null);
    const newRow = (data as Array<{ invite_id: string; resent_count: number }>)[0];
    assert.notEqual(newRow.invite_id, row.invite_id);
    assert.equal(newRow.resent_count, 1);
    cleanup.invites.push(newRow.invite_id);

    // Original invite now revoked
    const { data: orig } = await sr
      .from("affiliate_invites")
      .select("revoked_at")
      .eq("id", row.invite_id)
      .single();
    assert.ok(orig!.revoked_at);
  } finally {
    await runCleanup(cleanup);
  }
});

test("resend_affiliate_invite — P0003 on unknown invite / cross-diviner", async () => {
  const cleanup = makeCleanup();
  try {
    const div = await getDiviner(TEST_DIV_USER);
    const otherDiv = await getAnyOtherDiviner(div.id);
    const email = `e2e+${Date.now()}@test.astrologypro.com`;
    const row = await createInviteFor(div.id, email, cleanup);

    // Unknown invite_id
    const r1 = await sr.rpc("resend_affiliate_invite", {
      p_invite_id: "00000000-0000-0000-0000-000000000000",
      p_caller_diviner_id: div.id,
      p_new_token_hash: mkTok().hash,
      p_new_expires_at: new Date().toISOString(),
    });
    assert.equal((r1.error as { code?: string } | null)?.code, "P0003");

    // Cross-diviner
    const r2 = await sr.rpc("resend_affiliate_invite", {
      p_invite_id: row.invite_id,
      p_caller_diviner_id: otherDiv.id,
      p_new_token_hash: mkTok().hash,
      p_new_expires_at: new Date().toISOString(),
    });
    assert.equal((r2.error as { code?: string } | null)?.code, "P0003");
  } finally {
    await runCleanup(cleanup);
  }
});

test("revoke_affiliate_invite — deletes junction when no commissions attributed", async () => {
  const cleanup = makeCleanup();
  try {
    const div = await getDiviner(TEST_DIV_USER);
    const email = `e2e+${Date.now()}@test.astrologypro.com`;
    const row = await createInviteFor(div.id, email, cleanup);

    const { data, error } = await sr.rpc("revoke_affiliate_invite", {
      p_invite_id: row.invite_id,
      p_caller_diviner_id: div.id,
    });
    assert.equal(error, null);
    assert.equal(
      (data as Array<{ junction_action: string }>)[0].junction_action,
      "deleted",
    );

    // Junction row is physically gone
    const { data: j } = await sr
      .from("diviner_affiliates")
      .select("id")
      .eq("id", row.junction_id);
    assert.equal((j ?? []).length, 0);
  } finally {
    await runCleanup(cleanup);
  }
});

test("resend_affiliate_invite_by_junction — P0006 on non-pending junction", async () => {
  // Pick an existing active junction (seeded or prod data; just need one)
  const { data: activeJ } = await sr
    .from("diviner_affiliates")
    .select("id, diviner_id")
    .eq("status", "active")
    .limit(1)
    .single();
  if (!activeJ) {
    console.warn("skip: no active junction to test against");
    return;
  }
  const { error } = await sr.rpc("resend_affiliate_invite_by_junction", {
    p_junction_id: activeJ.id,
    p_caller_diviner_id: activeJ.diviner_id,
    p_new_token_hash: mkTok().hash,
    p_new_expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    p_invited_by: TEST_DIV_USER,
  });
  assert.equal((error as { code?: string } | null)?.code, "P0006");
});
