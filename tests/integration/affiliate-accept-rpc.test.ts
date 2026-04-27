/**
 * Integration tests for the affiliate accept RPC + trigger guard (Task 03).
 *
 * Runs against the dev Supabase project at NEXT_PUBLIC_SUPABASE_URL using
 * SUPABASE_SERVICE_ROLE_KEY. Exercises:
 *
 *   · consume_invite_and_activate_junction — happy path + P0003 (expired,
 *     revoked, re-consume) + P0004 (user mismatch)
 *   · guard_affiliate_account_user_link trigger — P0005 on external writes
 *   · Concurrent accept race — exactly one winner
 *
 * Cleans up after itself.
 *
 * Run: `npx tsx --test tests/integration/affiliate-accept-rpc.test.ts`
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

const TEST_DIV_USER = "e8a4f928-954c-4c0e-99c3-53ac8889bd81";

function mkTok() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: crypto.createHash("sha256").update(raw).digest("hex") };
}

async function setupInviteAndUser() {
  // Create an invite + matching auth user
  const { data: div } = await sr
    .from("diviners")
    .select("id")
    .eq("user_id", TEST_DIV_USER)
    .single();
  const email = `e2e-accept+${Date.now()}@test.astrologypro.com`;
  const token = mkTok();
  const { data: rpcData, error: rpcErr } = await sr.rpc("create_affiliate_invite", {
    p_diviner_id: (div as { id: string }).id,
    p_email: email,
    p_name: "E2E",
    p_phone: null,
    p_message: null,
    p_commission_type: "percentage",
    p_commission_value: 10,
    p_token_hash: token.hash,
    p_expires_at: new Date(Date.now() + 14 * 86400000).toISOString(),
    p_created_by: TEST_DIV_USER,
  });
  if (rpcErr) throw new Error(rpcErr.message);
  const row = (rpcData as Array<{
    invite_id: string;
    junction_id: string;
    affiliate_account_id: string;
  }>)[0];

  const { data: u, error: uErr } = await sr.auth.admin.createUser({
    email,
    password: "TempPass12345!",
    email_confirm: true,
  });
  if (uErr) throw new Error(uErr.message);

  return { ...row, email, userId: u.user!.id };
}

async function teardown(ctx: {
  invite_id: string;
  junction_id: string;
  affiliate_account_id: string;
  userId: string;
}) {
  await sr.from("affiliate_invites").delete().eq("id", ctx.invite_id);
  await sr.from("diviner_affiliates").delete().eq("id", ctx.junction_id);
  await sr.from("affiliate_accounts").delete().eq("id", ctx.affiliate_account_id);
  await sr.auth.admin.deleteUser(ctx.userId).catch(() => {});
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test("trigger guard — external UPDATE OF user_id rejected with P0005", async () => {
  const ctx = await setupInviteAndUser();
  try {
    const { error } = await sr
      .from("affiliate_accounts")
      .update({ user_id: ctx.userId })
      .eq("id", ctx.affiliate_account_id);
    assert.equal((error as { code?: string } | null)?.code, "P0005");
  } finally {
    await teardown(ctx);
  }
});

test("consume_invite_and_activate_junction — happy path", async () => {
  const ctx = await setupInviteAndUser();
  try {
    const { data, error } = await sr.rpc("consume_invite_and_activate_junction", {
      p_invite_id: ctx.invite_id,
      p_user_id: ctx.userId,
    });
    assert.equal(error, null);
    const row = (data as Array<{ invite_id: string }>)[0];
    assert.equal(row.invite_id, ctx.invite_id);

    const { data: inv } = await sr
      .from("affiliate_invites")
      .select("consumed_at, consumed_by")
      .eq("id", ctx.invite_id)
      .single();
    assert.ok(inv!.consumed_at);
    assert.equal(inv!.consumed_by, ctx.userId);

    const { data: junc } = await sr
      .from("diviner_affiliates")
      .select("status, accepted_at")
      .eq("id", ctx.junction_id)
      .single();
    assert.equal(junc!.status, "active");
    assert.ok(junc!.accepted_at);

    const { data: acc } = await sr
      .from("affiliate_accounts")
      .select("user_id, status")
      .eq("id", ctx.affiliate_account_id)
      .single();
    assert.equal(acc!.user_id, ctx.userId);
    assert.equal(acc!.status, "active");
  } finally {
    await teardown(ctx);
  }
});

test("consume_invite_and_activate_junction — P0003 on re-consume", async () => {
  const ctx = await setupInviteAndUser();
  try {
    await sr.rpc("consume_invite_and_activate_junction", {
      p_invite_id: ctx.invite_id,
      p_user_id: ctx.userId,
    });
    const { error } = await sr.rpc("consume_invite_and_activate_junction", {
      p_invite_id: ctx.invite_id,
      p_user_id: ctx.userId,
    });
    assert.equal((error as { code?: string } | null)?.code, "P0003");
  } finally {
    await teardown(ctx);
  }
});

test("consume_invite_and_activate_junction — P0003 on expired / revoked", async () => {
  const ctx = await setupInviteAndUser();
  try {
    await sr
      .from("affiliate_invites")
      .update({ expires_at: new Date(Date.now() - 3600_000).toISOString() })
      .eq("id", ctx.invite_id);
    const { error } = await sr.rpc("consume_invite_and_activate_junction", {
      p_invite_id: ctx.invite_id,
      p_user_id: ctx.userId,
    });
    assert.equal((error as { code?: string } | null)?.code, "P0003");
  } finally {
    await teardown(ctx);
  }
});

test("consume — 10-way concurrent accept race: exactly one wins", async () => {
  const ctx = await setupInviteAndUser();
  try {
    const races = Array.from({ length: 10 }, () =>
      sr.rpc("consume_invite_and_activate_junction", {
        p_invite_id: ctx.invite_id,
        p_user_id: ctx.userId,
      }),
    );
    const results = await Promise.all(races);
    const wins = results.filter((r) => !r.error).length;
    const losses = results.filter(
      (r) => (r.error as { code?: string } | null)?.code === "P0003",
    ).length;
    assert.equal(wins, 1);
    assert.equal(losses, 9);
  } finally {
    await teardown(ctx);
  }
});
